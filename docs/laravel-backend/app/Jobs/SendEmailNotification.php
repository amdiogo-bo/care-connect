<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendEmailNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public Notification $notification
    ) {}

    public function handle(): void
    {
        $user = User::find($this->notification->user_id);

        if (!$user || !$user->email) {
            Log::warning("SendEmailNotification: utilisateur introuvable ou sans email", [
                'notification_id' => $this->notification->id,
            ]);
            return;
        }

        try {
            Mail::raw($this->notification->message, function ($mail) use ($user) {
                $mail->to($user->email)
                    ->subject($this->notification->title);
            });

            Log::info("Email envoyé", [
                'user_id' => $user->id,
                'notification_id' => $this->notification->id,
            ]);
        } catch (\Exception $e) {
            Log::error("Échec d'envoi email", [
                'error' => $e->getMessage(),
                'notification_id' => $this->notification->id,
            ]);
            throw $e; // Relancer pour retry
        }
    }
}
