<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Liste des utilisateurs (admin)
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Filtres
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'ilike', '%' . $search . '%')
                    ->orWhere('last_name', 'ilike', '%' . $search . '%')
                    ->orWhere('email', 'ilike', '%' . $search . '%');
            });
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Créer un utilisateur (admin)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email|max:255',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:patient,doctor,secretary,admin',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        // Créer le profil associé selon le rôle
        if ($user->role === 'doctor') {
            $user->doctor()->create([
                'specialization' => $request->get('specialization', 'Généraliste'),
                'consultation_fee' => $request->get('consultation_fee', 5000),
            ]);
        } elseif ($user->role === 'patient') {
            $user->patient()->create([]);
        } elseif ($user->role === 'secretary') {
            $user->secretary()->create([
                'assigned_doctors' => $request->get('assigned_doctors', []),
            ]);
        }

        $user->load(['doctor', 'patient', 'secretary']);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur créé avec succès',
            'data' => $user,
        ], 201);
    }

    /**
     * Détails d'un utilisateur
     */
    public function show(int $id)
    {
        $user = User::with(['doctor', 'patient', 'secretary'])->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Modifier un utilisateur
     */
    public function update(Request $request, int $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:100',
            'last_name' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|unique:users,email,' . $id . '|max:255',
            'phone' => 'nullable|string|max:20',
            'role' => 'sometimes|in:patient,doctor,secretary,admin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->update($validator->validated());

        // Mettre à jour le profil docteur si besoin
        if ($user->role === 'doctor' && ($request->has('specialization') || $request->has('consultation_fee'))) {
            $user->doctor()->updateOrCreate(
                ['user_id' => $user->id],
                array_filter([
                    'specialization' => $request->get('specialization'),
                    'consultation_fee' => $request->get('consultation_fee'),
                ])
            );
        }

        $user->load(['doctor', 'patient', 'secretary']);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur modifié avec succès',
            'data' => $user,
        ]);
    }

    /**
     * Supprimer un utilisateur
     */
    public function destroy(int $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        // Empêcher la suppression de son propre compte
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas supprimer votre propre compte',
                'error_code' => 'SELF_DELETE',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprimé avec succès',
        ]);
    }

    /**
     * Activer/Désactiver un utilisateur
     */
    public function toggleActive(int $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur introuvable',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'Utilisateur activé' : 'Utilisateur désactivé',
            'data' => $user,
        ]);
    }
}
