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

class SendPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public Notification $notification
    ) {}

    public function handle(): void
    {
        $user = User::find($this->notification->user_id);

        if (!$user) {
            return;
        }

        // Récupérer le FCM token du device de l'utilisateur
        $fcmToken = $user->fcm_token ?? null;

        if (!$fcmToken) {
            Log::info("SendPushNotification: pas de FCM token", ['user_id' => $user->id]);
            return;
        }

        $credentialsPath = config('services.firebase.credentials');

        if (!$credentialsPath || !file_exists($credentialsPath)) {
            Log::warning("SendPushNotification: Firebase non configuré");
            return;
        }

        try {
            // Utiliser l'API FCM v1
            $accessToken = $this->getFirebaseAccessToken($credentialsPath);

            $projectId = json_decode(file_get_contents($credentialsPath), true)['project_id'] ?? '';

            $response = Http::withToken($accessToken)
                ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                    'message' => [
                        'token' => $fcmToken,
                        'notification' => [
                            'title' => $this->notification->title,
                            'body' => $this->notification->message,
                        ],
                        'data' => array_map('strval', $this->notification->data ?? []),
                    ],
                ]);

            if ($response->successful()) {
                Log::info("Push envoyé", ['user_id' => $user->id]);
            } else {
                Log::error("Échec push FCM", ['status' => $response->status(), 'body' => $response->body()]);
            }
        } catch (\Exception $e) {
            Log::error("Erreur push", ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Obtenir un access token Google OAuth2 pour FCM
     */
    private function getFirebaseAccessToken(string $credentialsPath): string
    {
        $credentials = json_decode(file_get_contents($credentialsPath), true);

        $now = time();
        $payload = [
            'iss' => $credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ];

        // Encoder le JWT (nécessite firebase/php-jwt ou similaire)
        $jwt = \Firebase\JWT\JWT::encode($payload, $credentials['private_key'], 'RS256');

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        return $response->json('access_token');
    }
}
