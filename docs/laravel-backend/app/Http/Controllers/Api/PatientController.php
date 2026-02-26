<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PatientController extends Controller
{
    /**
     * Rendez-vous du patient connecté
     */
    public function appointments(Request $request)
    {
        $user = auth()->user();

        $query = Appointment::where('patient_id', $user->id)
            ->with(['doctor.doctor']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
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
                'total' => $appointments->total(),
            ],
        ]);
    }

    /**
     * Historique médical du patient
     */
    public function medicalHistory()
    {
        $user = auth()->user();

        $completedAppointments = Appointment::where('patient_id', $user->id)
            ->where('status', 'completed')
            ->with(['doctor.doctor'])
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'date' => $apt->date,
                    'type' => $apt->type,
                    'doctor' => [
                        'name' => $apt->doctor->first_name . ' ' . $apt->doctor->last_name,
                        'specialization' => $apt->doctor->doctor->specialization ?? '',
                    ],
                    'reason' => $apt->reason,
                    'notes' => $apt->notes,
                ];
            });

        $profile = $user->patient;

        return response()->json([
            'success' => true,
            'data' => [
                'medical_info' => $profile ? [
                    'blood_type' => $profile->blood_type,
                    'allergies' => $profile->allergies,
                    'chronic_conditions' => $profile->chronic_conditions,
                    'emergency_contact' => $profile->emergency_contact,
                ] : null,
                'consultation_history' => $completedAppointments,
            ],
        ]);
    }

    /**
     * Mettre à jour le profil médical du patient
     */
    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'blood_type' => 'nullable|string|max:10',
            'allergies' => 'nullable|array',
            'allergies.*' => 'string|max:100',
            'chronic_conditions' => 'nullable|array',
            'chronic_conditions.*' => 'string|max:200',
            'emergency_contact' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $profile = $user->patient;
        if (!$profile) {
            $profile = $user->patient()->create($validator->validated());
        } else {
            $profile->update($validator->validated());
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil médical mis à jour',
            'data' => $profile,
        ]);
    }
}
