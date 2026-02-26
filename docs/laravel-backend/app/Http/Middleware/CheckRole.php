<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    /**
     * Vérifier que l'utilisateur a le rôle requis.
     *
     * Usage dans les routes : middleware('role:admin') ou middleware('role:doctor,admin')
     */
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié',
                'error_code' => 'UNAUTHENTICATED',
            ], 401);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé. Rôle requis : ' . implode(', ', $roles),
                'error_code' => 'FORBIDDEN',
            ], 403);
        }

        return $next($request);
    }
}
