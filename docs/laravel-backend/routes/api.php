<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\SecretaryController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\UserController;

/*
|--------------------------------------------------------------------------
| Routes API — Care Connect
|--------------------------------------------------------------------------
*/

// ─── Auth (publiques) ───────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ─── Routes publiques ───────────────────────────────────────────────
Route::get('/doctors', [DoctorController::class, 'index']);
Route::get('/doctors/{id}', [DoctorController::class, 'show']);
Route::get('/doctors/{id}/availabilities', [DoctorController::class, 'availabilities']);

// ─── Routes protégées (Sanctum) ─────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'updatePassword']);

    // ─── Dashboard ──────────────────────────────────────────────────
    Route::prefix('dashboard')->group(function () {
        Route::get('/patient', [DashboardController::class, 'patient']);
        Route::get('/doctor', [DashboardController::class, 'doctor']);
        Route::get('/secretary', [DashboardController::class, 'secretary']);
        Route::get('/admin', [DashboardController::class, 'admin']);
        Route::get('/stats', [DashboardController::class, 'stats']);
    });

    // ─── Rendez-vous ────────────────────────────────────────────────
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/appointments/upcoming', [AppointmentController::class, 'upcoming']);
    Route::get('/appointments/today', [AppointmentController::class, 'today']);
    Route::get('/appointments/available-slots', [AppointmentController::class, 'availableSlots']);
    Route::get('/appointments/{id}', [AppointmentController::class, 'show']);
    Route::put('/appointments/{id}', [AppointmentController::class, 'update']);
    Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy']);
    Route::patch('/appointments/{id}/status', [AppointmentController::class, 'updateStatus']);

    // ─── Docteurs (authentifié) ─────────────────────────────────────
    Route::middleware('role:doctor')->prefix('doctor')->group(function () {
        Route::get('/schedule', [DoctorController::class, 'schedule']);
        Route::get('/patients', [DoctorController::class, 'patients']);
        Route::get('/stats', [DoctorController::class, 'stats']);
        Route::post('/availabilities', [DoctorController::class, 'storeAvailability']);
        Route::put('/availabilities/{id}', [DoctorController::class, 'updateAvailability']);
        Route::delete('/availabilities/{id}', [DoctorController::class, 'destroyAvailability']);
        Route::post('/appointments/{id}/notes', [DoctorController::class, 'addNotes']);
    });

    // ─── Patients ───────────────────────────────────────────────────
    Route::middleware('role:patient')->prefix('patient')->group(function () {
        Route::get('/appointments', [PatientController::class, 'appointments']);
        Route::get('/medical-history', [PatientController::class, 'medicalHistory']);
        Route::put('/profile', [PatientController::class, 'updateProfile']);
    });

    // ─── Secrétaire ─────────────────────────────────────────────────
    Route::middleware('role:secretary')->prefix('secretary')->group(function () {
        Route::get('/doctors', [SecretaryController::class, 'assignedDoctors']);
        Route::get('/schedule', [SecretaryController::class, 'schedule']);
        Route::get('/patients', [SecretaryController::class, 'patients']);
        Route::post('/appointments', [SecretaryController::class, 'createAppointment']);
    });

    // ─── Notifications ──────────────────────────────────────────────
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::put('/notifications/preferences', [NotificationController::class, 'updatePreferences']);

    // ─── Admin ──────────────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::patch('/users/{id}/toggle-active', [UserController::class, 'toggleActive']);
    });
});
