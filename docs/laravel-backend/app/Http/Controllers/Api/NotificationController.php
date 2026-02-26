<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\NotificationPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    /**
     * Liste des notifications de l'utilisateur
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        $query = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        if ($request->has('unread_only') && $request->unread_only) {
            $query->where('read', false);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $notifications = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    /**
     * Nombre de notifications non lues
     */
    public function unreadCount()
    {
        $count = Notification::where('user_id', auth()->id())
            ->where('read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => ['count' => $count],
        ]);
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead(int $id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', auth()->id())
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        $notification->update(['read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue',
        ]);
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead()
    {
        Notification::where('user_id', auth()->id())
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications marquées comme lues',
        ]);
    }

    /**
     * Supprimer une notification
     */
    public function destroy(int $id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', auth()->id())
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée',
        ]);
    }

    /**
     * Mettre à jour les préférences de notification
     */
    public function updatePreferences(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'email_enabled' => 'sometimes|boolean',
            'sms_enabled' => 'sometimes|boolean',
            'push_enabled' => 'sometimes|boolean',
            'reminder_1h' => 'sometimes|boolean',
            'reminder_24h' => 'sometimes|boolean',
            'reminder_48h' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $preferences = NotificationPreference::updateOrCreate(
            ['user_id' => $user->id],
            $validator->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Préférences mises à jour',
            'data' => $preferences,
        ]);
    }
}
