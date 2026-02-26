<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Availability;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AppointmentController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Liste des rendez-vous (filtrée par rôle)
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        $query = Appointment::with(['patient', 'doctor.doctor']);

        if ($user->isPatient()) {
            $query->where('patient_id', $user->id);
        } elseif ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isSecretary()) {
            $assignedDoctorIds = $user->secretary->assigned_doctors ?? [];
            $query->whereIn('doctor_id', $assignedDoctorIds);
        }
        // Admin : pas de filtre

        // Filtres optionnels
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('date')) {
            $query->whereDate('date', $request->date);
        }
        if ($request->has('doctor_id') && ($user->isAdmin() || $user->isSecretary())) {
            $query->where('doctor_id', $request->doctor_id);
        }

        $appointments = $query->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $appointments->items(),
            'meta' => [
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'per_page' => $appointments->perPage(),
                'total' => $appointments->total(),
            ],
        ]);
    }

    /**
     * Créer un rendez-vous
     */
    public function store(Request $request)
    {
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

        // Vérifier que le docteur est bien un docteur
        $doctor = User::where('id', $request->doctor_id)->where('role', 'doctor')->first();
        if (!$doctor) {
            return response()->json([
                'success' => false,
                'message' => 'Le docteur spécifié est introuvable',
                'error_code' => 'DOCTOR_NOT_FOUND',
            ], 404);
        }

        // Vérifier la disponibilité du créneau
        $conflict = Appointment::where('doctor_id', $request->doctor_id)
            ->where('date', $request->date)
            ->whereIn('status', ['scheduled', 'confirmed', 'in_progress'])
            ->where(function ($q) use ($request) {
                $q->where(function ($q2) use ($request) {
                    $q2->where('start_time', '<', $request->end_time)
                        ->where('end_time', '>', $request->start_time);
                });
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

        // Envoyer les notifications
        $this->notificationService->appointmentCreated($appointment);

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous créé avec succès',
            'data' => $appointment,
        ], 201);
    }

    /**
     * Détails d'un rendez-vous
     */
    public function show(int $id)
    {
        $user = auth()->user();

        $appointment = Appointment::with(['patient', 'doctor.doctor'])->find($id);

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Rendez-vous introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        // Vérifier l'accès
        if ($user->isPatient() && $appointment->patient_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès refusé', 'error_code' => 'FORBIDDEN'], 403);
        }
        if ($user->isDoctor() && $appointment->doctor_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès refusé', 'error_code' => 'FORBIDDEN'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $appointment,
        ]);
    }

    /**
     * Modifier un rendez-vous
     */
    public function update(Request $request, int $id)
    {
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Rendez-vous introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        if (in_array($appointment->status, ['completed', 'cancelled'])) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de modifier un rendez-vous terminé ou annulé',
                'error_code' => 'APPOINTMENT_CLOSED',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'date' => 'sometimes|date|after_or_equal:today',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i|after:start_time',
            'type' => 'sometimes|in:consultation,follow_up,emergency',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Vérifier conflit si date/heure changée
        $newDate = $request->get('date', $appointment->date);
        $newStart = $request->get('start_time', $appointment->start_time);
        $newEnd = $request->get('end_time', $appointment->end_time);

        $conflict = Appointment::where('doctor_id', $appointment->doctor_id)
            ->where('id', '!=', $id)
            ->where('date', $newDate)
            ->whereIn('status', ['scheduled', 'confirmed', 'in_progress'])
            ->where(function ($q) use ($newStart, $newEnd) {
                $q->where('start_time', '<', $newEnd)
                    ->where('end_time', '>', $newStart);
            })->exists();

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'Ce créneau n\'est pas disponible',
                'error_code' => 'SLOT_NOT_AVAILABLE',
            ], 409);
        }

        $appointment->update($validator->validated());
        $appointment->load(['patient', 'doctor.doctor']);

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous modifié avec succès',
            'data' => $appointment,
        ]);
    }

    /**
     * Annuler un rendez-vous
     */
    public function destroy(int $id)
    {
        $user = auth()->user();
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Rendez-vous introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        if (in_array($appointment->status, ['completed', 'cancelled'])) {
            return response()->json([
                'success' => false,
                'message' => 'Ce rendez-vous est déjà terminé ou annulé',
                'error_code' => 'APPOINTMENT_CLOSED',
            ], 422);
        }

        $appointment->update(['status' => 'cancelled']);
        $appointment->load(['patient', 'doctor.doctor']);

        $this->notificationService->appointmentCancelled($appointment);

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous annulé avec succès',
            'data' => $appointment,
        ]);
    }

    /**
     * Changer le statut d'un rendez-vous
     */
    public function updateStatus(Request $request, int $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:scheduled,confirmed,in_progress,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Statut invalide',
                'errors' => $validator->errors(),
            ], 422);
        }

        $appointment = Appointment::find($id);

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Rendez-vous introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        $oldStatus = $appointment->status;
        $appointment->update(['status' => $request->status]);
        $appointment->load(['patient', 'doctor.doctor']);

        // Notifications selon le changement de statut
        if ($request->status === 'confirmed' && $oldStatus !== 'confirmed') {
            $this->notificationService->appointmentConfirmed($appointment);
        } elseif ($request->status === 'cancelled') {
            $this->notificationService->appointmentCancelled($appointment);
        }

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour avec succès',
            'data' => $appointment,
        ]);
    }

    /**
     * Créneaux disponibles pour un docteur à une date
     */
    public function availableSlots(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'doctor_id' => 'required|exists:users,id',
            'date' => 'required|date|after_or_equal:today',
            'duration' => 'nullable|integer|min:15|max:120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $doctorId = $request->doctor_id;
        $date = $request->date;
        $duration = $request->get('duration', 30);
        $dayOfWeek = date('N', strtotime($date)); // 1=Lundi ... 7=Dimanche

        // Disponibilités du docteur pour ce jour
        $availabilities = Availability::where('doctor_id', $doctorId)
            ->where('day_of_week', $dayOfWeek)
            ->orderBy('start_time')->get();

        // RDV existants ce jour-là
        $existingAppointments = Appointment::where('doctor_id', $doctorId)
            ->where('date', $date)
            ->whereIn('status', ['scheduled', 'confirmed', 'in_progress'])
            ->orderBy('start_time')->get();

        // Générer les créneaux
        $slots = [];
        foreach ($availabilities as $avail) {
            $start = strtotime($avail->start_time);
            $end = strtotime($avail->end_time);
            $step = $duration * 60;

            for ($time = $start; $time + $step <= $end; $time += $step) {
                $slotStart = date('H:i', $time);
                $slotEnd = date('H:i', $time + $step);

                $isBooked = $existingAppointments->contains(function ($apt) use ($slotStart, $slotEnd) {
                    return $apt->start_time < $slotEnd && $apt->end_time > $slotStart;
                });

                $slots[] = [
                    'start_time' => $slotStart,
                    'end_time' => $slotEnd,
                    'available' => !$isBooked,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date,
                'doctor_id' => $doctorId,
                'duration' => $duration,
                'available_slots' => $slots,
            ],
        ]);
    }

    /**
     * RDV à venir (pour l'utilisateur connecté)
     */
    public function upcoming()
    {
        $user = auth()->user();

        $query = Appointment::with(['patient', 'doctor.doctor'])
            ->where('date', '>=', now()->toDateString())
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->orderBy('date')->orderBy('start_time');

        if ($user->isPatient()) {
            $query->where('patient_id', $user->id);
        } elseif ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->limit(10)->get(),
        ]);
    }

    /**
     * RDV du jour
     */
    public function today()
    {
        $user = auth()->user();

        $query = Appointment::with(['patient', 'doctor.doctor'])
            ->whereDate('date', today())
            ->orderBy('start_time');

        if ($user->isPatient()) {
            $query->where('patient_id', $user->id);
        } elseif ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }
}
