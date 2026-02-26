<?php

namespace App\Jobs;

use App\Models\Appointment;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job planifié pour envoyer les rappels de rendez-vous.
 *
 * À ajouter dans app/Console/Kernel.php :
 *   $schedule->job(new SendAppointmentReminders)->everyFifteenMinutes();
 *
 * Ou dans routes/console.php (Laravel 11) :
 *   Schedule::job(new SendAppointmentReminders)->everyFifteenMinutes();
 */
class SendAppointmentReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(NotificationService $notificationService): void
    {
        $now = now();

        // Rappels configurables
        $reminders = [
            '1h' => $now->copy()->addHour(),
            '24h' => $now->copy()->addDay(),
            '48h' => $now->copy()->addDays(2),
        ];

        foreach ($reminders as $type => $targetTime) {
            // Fenêtre de 15 min autour de l'heure cible
            $windowStart = $targetTime->copy()->subMinutes(7);
            $windowEnd = $targetTime->copy()->addMinutes(8);

            $appointments = Appointment::whereDate('date', $targetTime->toDateString())
                ->whereBetween('start_time', [
                    $windowStart->format('H:i'),
                    $windowEnd->format('H:i'),
                ])
                ->whereIn('status', ['scheduled', 'confirmed'])
                ->with(['patient', 'doctor'])
                ->get();

            foreach ($appointments as $appointment) {
                try {
                    // Vérifier les préférences de rappel du patient
                    $prefs = $appointment->patient->notificationPreferences ?? null;
                    $prefKey = 'reminder_' . str_replace('h', 'h', $type);

                    if ($prefs && !$prefs->$prefKey) {
                        continue; // Le patient a désactivé ce rappel
                    }

                    $notificationService->appointmentReminder($appointment, $type);

                    Log::info("Rappel {$type} envoyé", [
                        'appointment_id' => $appointment->id,
                        'patient_id' => $appointment->patient_id,
                    ]);
                } catch (\Exception $e) {
                    Log::error("Erreur rappel {$type}", [
                        'appointment_id' => $appointment->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }
}
