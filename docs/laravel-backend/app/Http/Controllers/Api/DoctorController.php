<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Availability;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DoctorController extends Controller
{
    /**
     * Liste des docteurs (public)
     */
    public function index(Request $request)
    {
        $query = User::where('role', 'doctor')
            ->where('is_active', true)
            ->with('doctor');

        // Filtre par spécialité
        if ($request->has('specialization')) {
            $query->whereHas('doctor', function ($q) use ($request) {
                $q->where('specialization', 'ilike', '%' . $request->specialization . '%');
            });
        }

        // Recherche par nom
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'ilike', '%' . $search . '%')
                    ->orWhere('last_name', 'ilike', '%' . $search . '%');
            });
        }

        $doctors = $query->orderBy('last_name')->get()->map(function ($doc) {
            return [
                'id' => $doc->id,
                'first_name' => $doc->first_name,
                'last_name' => $doc->last_name,
                'email' => $doc->email,
                'phone' => $doc->phone,
                'doctor' => $doc->doctor ? [
                    'specialization' => $doc->doctor->specialization,
                    'office_number' => $doc->doctor->office_number,
                    'consultation_fee' => $doc->doctor->consultation_fee,
                    'bio' => $doc->doctor->bio,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $doctors,
        ]);
    }

    /**
     * Détails d'un docteur (public)
     */
    public function show(int $id)
    {
        $doctor = User::where('id', $id)
            ->where('role', 'doctor')
            ->with('doctor')
            ->first();

        if (!$doctor) {
            return response()->json([
                'success' => false,
                'message' => 'Docteur introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $doctor->id,
                'first_name' => $doctor->first_name,
                'last_name' => $doctor->last_name,
                'email' => $doctor->email,
                'phone' => $doctor->phone,
                'doctor' => $doctor->doctor,
            ],
        ]);
    }

    /**
     * Disponibilités d'un docteur (public)
     */
    public function availabilities(int $id)
    {
        $doctor = User::where('id', $id)->where('role', 'doctor')->first();

        if (!$doctor) {
            return response()->json([
                'success' => false,
                'message' => 'Docteur introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        $availabilities = Availability::where('doctor_id', $id)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $availabilities,
        ]);
    }

    /**
     * Planning du docteur connecté
     */
    public function schedule(Request $request)
    {
        $user = auth()->user();

        $startDate = $request->get('start_date', now()->startOfWeek()->toDateString());
        $endDate = $request->get('end_date', now()->endOfWeek()->toDateString());

        $appointments = Appointment::where('doctor_id', $user->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->with(['patient'])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'period' => ['start' => $startDate, 'end' => $endDate],
                'appointments' => $appointments,
            ],
        ]);
    }

    /**
     * Liste des patients du docteur
     */
    public function patients(Request $request)
    {
        $user = auth()->user();

        $patients = DB::table('appointments')
            ->join('users', 'appointments.patient_id', '=', 'users.id')
            ->where('appointments.doctor_id', $user->id)
            ->select(
                'users.id', 'users.first_name', 'users.last_name',
                'users.email', 'users.phone',
                DB::raw('count(*) as total_visits'),
                DB::raw('max(appointments.date) as last_visit')
            )
            ->groupBy('users.id', 'users.first_name', 'users.last_name', 'users.email', 'users.phone')
            ->orderBy('last_visit', 'desc');

        // Recherche
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
     * Statistiques du docteur
     */
    public function stats(Request $request)
    {
        $user = auth()->user();
        $startDate = $request->get('start_date', now()->subMonths(3)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $query = Appointment::where('doctor_id', $user->id)
            ->whereBetween('date', [$startDate, $endDate]);

        $byStatus = (clone $query)->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')->pluck('count', 'status');

        $byType = (clone $query)->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')->pluck('count', 'type');

        $monthlyTrend = (clone $query)->select(
                DB::raw("to_char(date, 'YYYY-MM') as month"),
                DB::raw('count(*) as count')
            )
            ->groupBy('month')->orderBy('month')->get();

        $totalPatients = (clone $query)->distinct('patient_id')->count('patient_id');

        $completionRate = 0;
        $total = (clone $query)->count();
        $completed = (clone $query)->where('status', 'completed')->count();
        if ($total > 0) {
            $completionRate = round(($completed / $total) * 100);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'period' => ['start' => $startDate, 'end' => $endDate],
                'total' => $total,
                'by_status' => $byStatus,
                'by_type' => $byType,
                'monthly_trend' => $monthlyTrend,
                'total_patients' => $totalPatients,
                'completion_rate' => $completionRate,
            ],
        ]);
    }

    /**
     * Ajouter une disponibilité
     */
    public function storeAvailability(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'day_of_week' => 'required|integer|min:1|max:7',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Vérifier chevauchement
        $overlap = Availability::where('doctor_id', $user->id)
            ->where('day_of_week', $request->day_of_week)
            ->where(function ($q) use ($request) {
                $q->where('start_time', '<', $request->end_time)
                    ->where('end_time', '>', $request->start_time);
            })->exists();

        if ($overlap) {
            return response()->json([
                'success' => false,
                'message' => 'Ce créneau chevauche une disponibilité existante',
                'error_code' => 'OVERLAP',
            ], 409);
        }

        $availability = Availability::create([
            'doctor_id' => $user->id,
            'day_of_week' => $request->day_of_week,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Disponibilité ajoutée avec succès',
            'data' => $availability,
        ], 201);
    }

    /**
     * Modifier une disponibilité
     */
    public function updateAvailability(Request $request, int $id)
    {
        $user = auth()->user();
        $availability = Availability::where('id', $id)->where('doctor_id', $user->id)->first();

        if (!$availability) {
            return response()->json([
                'success' => false,
                'message' => 'Disponibilité introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'day_of_week' => 'sometimes|integer|min:1|max:7',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i|after:start_time',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $availability->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Disponibilité modifiée avec succès',
            'data' => $availability,
        ]);
    }

    /**
     * Supprimer une disponibilité
     */
    public function destroyAvailability(int $id)
    {
        $user = auth()->user();
        $availability = Availability::where('id', $id)->where('doctor_id', $user->id)->first();

        if (!$availability) {
            return response()->json([
                'success' => false,
                'message' => 'Disponibilité introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        $availability->delete();

        return response()->json([
            'success' => true,
            'message' => 'Disponibilité supprimée avec succès',
        ]);
    }

    /**
     * Ajouter des notes à un rendez-vous
     */
    public function addNotes(Request $request, int $id)
    {
        $user = auth()->user();

        $appointment = Appointment::where('id', $id)
            ->where('doctor_id', $user->id)
            ->first();

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Rendez-vous introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'notes' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $appointment->update(['notes' => $request->notes]);

        return response()->json([
            'success' => true,
            'message' => 'Notes ajoutées avec succès',
            'data' => $appointment,
        ]);
    }
}
