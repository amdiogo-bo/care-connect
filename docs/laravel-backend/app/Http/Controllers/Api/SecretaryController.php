<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SecretaryController extends Controller
{
    /**
     * Docteurs assignés à la secrétaire
     */
    public function assignedDoctors()
    {
        $user = auth()->user();
        $assignedDoctorIds = $user->secretary->assigned_doctors ?? [];

        $doctors = User::whereIn('id', $assignedDoctorIds)
            ->where('role', 'doctor')
            ->with('doctor')
            ->get()
            ->map(function ($doc) {
                $todayCount = Appointment::where('doctor_id', $doc->id)
                    ->whereDate('date', today())->count();
                return [
                    'id' => $doc->id,
                    'first_name' => $doc->first_name,
                    'last_name' => $doc->last_name,
                    'specialization' => $doc->doctor->specialization ?? '',
                    'today_appointments' => $todayCount,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $doctors,
        ]);
    }

    /**
     * Planning multi-docteurs
     */
    public function schedule(Request $request)
    {
        $user = auth()->user();
        $assignedDoctorIds = $user->secretary->assigned_doctors ?? [];

        $startDate = $request->get('start_date', now()->startOfWeek()->toDateString());
        $endDate = $request->get('end_date', now()->endOfWeek()->toDateString());

        $doctorId = $request->get('doctor_id');

        $query = Appointment::whereIn('doctor_id', $assignedDoctorIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->with(['patient', 'doctor.doctor'])
            ->orderBy('date')->orderBy('start_time');

        if ($doctorId && in_array($doctorId, $assignedDoctorIds)) {
            $query->where('doctor_id', $doctorId);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'period' => ['start' => $startDate, 'end' => $endDate],
                'appointments' => $query->get(),
            ],
        ]);
    }

    /**
     * Patients des docteurs assignés
     */
    public function patients(Request $request)
    {
        $user = auth()->user();
        $assignedDoctorIds = $user->secretary->assigned_doctors ?? [];

        $patients = DB::table('appointments')
            ->join('users', 'appointments.patient_id', '=', 'users.id')
            ->whereIn('appointments.doctor_id', $assignedDoctorIds)
            ->select(
                'users.id', 'users.first_name', 'users.last_name',
                'users.email', 'users.phone',
                DB::raw('count(*) as total_visits'),
                DB::raw('max(appointments.date) as last_visit')
            )
            ->groupBy('users.id', 'users.first_name', 'users.last_name', 'users.email', 'users.phone')
            ->orderBy('last_visit', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $patients->where(function ($q) use ($search) {
                $q->where('users.first_name', 'ilike', '%' . $search . '%')
                    ->orWhere('users.last_name', 'ilike', '%' . $search . '%');
            });
        }

        return response()->json([
            'success' => true,
            'data' => $patients->get(),
        ]);
    }

    /**
     * Créer un RDV pour le compte d'un patient
     */
    public function createAppointment(Request $request)
    {
        $user = auth()->user();
        $assignedDoctorIds = $user->secretary->assigned_doctors ?? [];

        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:users,id',
            'doctor_id' => 'required|exists:users,id',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'type' => 'required|in:consultation,follow_up,emergency',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Vérifier que le docteur est assigné
        if (!in_array($request->doctor_id, $assignedDoctorIds)) {
            return response()->json([
                'success' => false,
                'message' => 'Ce docteur ne vous est pas assigné',
                'error_code' => 'FORBIDDEN',
            ], 403);
        }

        // Vérifier conflit
        $conflict = Appointment::where('doctor_id', $request->doctor_id)
            ->where('date', $request->date)
            ->whereIn('status', ['scheduled', 'confirmed', 'in_progress'])
            ->where(function ($q) use ($request) {
                $q->where('start_time', '<', $request->end_time)
                    ->where('end_time', '>', $request->start_time);
            })->exists();

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'Ce créneau n\'est pas disponible',
                'error_code' => 'SLOT_NOT_AVAILABLE',
            ], 409);
        }

        $appointment = Appointment::create($validator->validated());
        $appointment->load(['patient', 'doctor.doctor']);

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous créé avec succès',
            'data' => $appointment,
        ], 201);
    }
}
