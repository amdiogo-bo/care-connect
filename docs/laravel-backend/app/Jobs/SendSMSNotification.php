<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendSMSNotification implements ShouldQueue
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

        if (!$user || !$user->phone) {
            Log::warning("SendSMSNotification: utilisateur sans téléphone", [
                'notification_id' => $this->notification->id,
            ]);
            return;
        }

        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from = config('services.twilio.from');

        if (!$sid || !$token || !$from) {
            Log::warning("SendSMSNotification: Twilio non configuré");
            return;
        }

        try {
            $response = Http::withBasicAuth($sid, $token)
                ->asForm()
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                    'From' => $from,
                    'To' => $user->phone,
                    'Body' => $this->notification->title . "\n" . $this->notification->message,
                ]);

            if ($response->successful()) {
                Log::info("SMS envoyé", [
                    'user_id' => $user->id,
                    'sid' => $response->json('sid'),
                ]);
            } else {
                Log::error("Échec SMS Twilio", [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Erreur SMS", ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
