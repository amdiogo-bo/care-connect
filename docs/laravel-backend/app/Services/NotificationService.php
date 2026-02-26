<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Jobs\SendEmailNotification;
use App\Jobs\SendSMSNotification;
use App\Jobs\SendPushNotification;

class NotificationService
{
    /**
     * Notification lors de la création d'un RDV
     */
    public function appointmentCreated(Appointment $appointment): void
    {
        $appointment->loadMissing(['patient', 'doctor.doctor']);

        // Notifier le patient
        $this->notify($appointment->patient_id, [
            'type' => 'appointment_created',
            'title' => 'Nouveau rendez-vous',
            'message' => sprintf(
                'Votre rendez-vous avec Dr. %s %s est prévu le %s à %s.',
                $appointment->doctor->first_name,
                $appointment->doctor->last_name,
                date('d/m/Y', strtotime($appointment->date)),
                $appointment->start_time
            ),
            'data' => ['appointment_id' => $appointment->id],
        ]);

        // Notifier le docteur
        $this->notify($appointment->doctor_id, [
            'type' => 'appointment_created',
            'title' => 'Nouveau rendez-vous',
            'message' => sprintf(
                'Nouveau RDV avec %s %s le %s à %s.',
                $appointment->patient->first_name,
                $appointment->patient->last_name,
                date('d/m/Y', strtotime($appointment->date)),
                $appointment->start_time
            ),
            'data' => ['appointment_id' => $appointment->id],
        ]);
    }

    /**
     * Notification lors de la confirmation
     */
    public function appointmentConfirmed(Appointment $appointment): void
    {
        $appointment->loadMissing(['patient', 'doctor']);

        $this->notify($appointment->patient_id, [
            'type' => 'appointment_confirmed',
            'title' => 'Rendez-vous confirmé',
            'message' => sprintf(
                'Votre rendez-vous du %s à %s avec Dr. %s a été confirmé.',
                date('d/m/Y', strtotime($appointment->date)),
                $appointment->start_time,
                $appointment->doctor->last_name
            ),
            'data' => ['appointment_id' => $appointment->id],
        ]);
    }

    /**
     * Notification lors de l'annulation
     */
    public function appointmentCancelled(Appointment $appointment): void
    {
        $appointment->loadMissing(['patient', 'doctor']);

        // Notifier le patient
        $this->notify($appointment->patient_id, [
            'type' => 'appointment_cancelled',
            'title' => 'Rendez-vous annulé',
            'message' => sprintf(
                'Votre rendez-vous du %s à %s a été annulé.',
                date('d/m/Y', strtotime($appointment->date)),
                $appointment->start_time
            ),
            'data' => ['appointment_id' => $appointment->id],
        ]);

        // Notifier le docteur
        $this->notify($appointment->doctor_id, [
            'type' => 'appointment_cancelled',
            'title' => 'Rendez-vous annulé',
            'message' => sprintf(
                'Le RDV avec %s %s du %s a été annulé.',
                $appointment->patient->first_name,
                $appointment->patient->last_name,
                date('d/m/Y', strtotime($appointment->date))
            ),
            'data' => ['appointment_id' => $appointment->id],
        ]);
    }

    /**
     * Rappel de rendez-vous
     */
    public function appointmentReminder(Appointment $appointment, string $reminderType): void
    {
        $appointment->loadMissing(['patient', 'doctor']);

        $labels = [
            '1h' => 'dans 1 heure',
            '24h' => 'demain',
            '48h' => 'dans 2 jours',
        ];

        $this->notify($appointment->patient_id, [
            'type' => 'appointment_reminder',
            'title' => 'Rappel de rendez-vous',
            'message' => sprintf(
                'Rappel : vous avez un rendez-vous %s avec Dr. %s à %s.',
                $labels[$reminderType] ?? $reminderType,
                $appointment->doctor->last_name,
                $appointment->start_time
            ),
            'data' => [
                'appointment_id' => $appointment->id,
                'reminder_type' => $reminderType,
            ],
        ]);
    }

    /**
     * Créer une notification et dispatcher les canaux
     */
    protected function notify(int $userId, array $data): void
    {
        // Sauvegarder en base (in-app)
        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $data['type'],
            'title' => $data['title'],
            'message' => $data['message'],
            'data' => $data['data'] ?? null,
            'read' => false,
        ]);

        // Récupérer les préférences
        $prefs = NotificationPreference::where('user_id', $userId)->first();

        // Dispatcher les jobs selon les préférences
        if (!$prefs || $prefs->email_enabled) {
            SendEmailNotification::dispatch($notification)->onQueue('notifications');
        }

        if ($prefs && $prefs->sms_enabled) {
            SendSMSNotification::dispatch($notification)->onQueue('notifications');
        }

        if ($prefs && $prefs->push_enabled) {
            SendPushNotification::dispatch($notification)->onQueue('notifications');
        }
    }
}
