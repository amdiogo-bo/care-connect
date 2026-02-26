<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * 🤒 Dashboard Patient
     */
    public function patient()
    {
        $user = auth()->user();

        if (!$user->isPatient()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux patients',
                'error_code' => 'FORBIDDEN',
            ], 403);
        }

        // Prochain rendez-vous
        $nextAppointment = Appointment::where('patient_id', $user->id)
            ->where('date', '>=', now()->toDateString())
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->with(['doctor.doctor'])
            ->orderBy('date')->orderBy('start_time')
            ->first();

        // À venir (5)
        $upcomingAppointments = Appointment::where('patient_id', $user->id)
            ->where('date', '>=', now()->toDateString())
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->with(['doctor.doctor'])
            ->orderBy('date')->orderBy('start_time')
            ->limit(5)->get();

        // Historique récent (5 terminés)
        $recentHistory = Appointment::where('patient_id', $user->id)
            ->where('status', 'completed')
            ->with(['doctor.doctor'])
            ->orderBy('date', 'desc')->orderBy('start_time', 'desc')
            ->limit(5)->get();

        // Statistiques
        $totalAppointments = Appointment::where('patient_id', $user->id)->count();
        $completedCount = Appointment::where('patient_id', $user->id)->where('status', 'completed')->count();
        $upcomingCount = Appointment::where('patient_id', $user->id)
            ->where('date', '>=', now()->toDateString())
            ->whereIn('status', ['scheduled', 'confirmed'])->count();
        $cancelledCount = Appointment::where('patient_id', $user->id)->where('status', 'cancelled')->count();

        // Tendance mensuelle (6 derniers mois)
        $monthlyTrend = Appointment::where('patient_id', $user->id)
            ->where('date', '>=', now()->subMonths(6)->startOfMonth())
            ->select(
                DB::raw("to_char(date, 'YYYY-MM') as month"),
                DB::raw('count(*) as count')
            )
            ->groupBy('month')->orderBy('month')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'next_appointment' => $nextAppointment,
                'upcoming_appointments' => $upcomingAppointments,
                'recent_history' => $recentHistory,
                'statistics' => [
                    'total_appointments' => $totalAppointments,
                    'completed' => $completedCount,
                    'upcoming' => $upcomingCount,
                    'cancelled' => $cancelledCount,
                ],
                'monthly_trend' => $monthlyTrend,
            ],
        ]);
    }

    /**
     * 🩺 Dashboard Docteur
     */
    public function doctor()
    {
        $user = auth()->user();

        if (!$user->isDoctor()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux docteurs',
                'error_code' => 'FORBIDDEN',
            ], 403);
        }

        // RDV du jour
        $todayAppointments = Appointment::where('doctor_id', $user->id)
            ->whereDate('date', today())
            ->with(['patient'])
            ->orderBy('start_time')->get();

        $todayCount = $todayAppointments->count();

        // Patients uniques
        $totalPatients = Appointment::where('doctor_id', $user->id)
            ->distinct('patient_id')->count('patient_id');

        // Complétés ce mois
        $completedThisMonth = Appointment::where('doctor_id', $user->id)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->where('status', 'completed')->count();

        // En attente
        $pendingCount = Appointment::where('doctor_id', $user->id)
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->where('date', '>=', now()->toDateString())->count();

        // Taux de complétion
        $totalThisMonth = Appointment::where('doctor_id', $user->id)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)->count();
        $completionRate = $totalThisMonth > 0 ? round(($completedThisMonth / $totalThisMonth) * 100) : 0;

        // Activité de la semaine
        $weekStart = now()->startOfWeek();
        $weeklyData = [];
        $dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        for ($i = 0; $i < 7; $i++) {
            $day = $weekStart->copy()->addDays($i);
            $count = Appointment::where('doctor_id', $user->id)
                ->whereDate('date', $day)->count();
            $weeklyData[] = ['day' => $dayNames[$i], 'count' => $count];
        }

        // Liste des patients récents
        $patientsList = DB::table('appointments')
            ->join('users', 'appointments.patient_id', '=', 'users.id')
            ->where('appointments.doctor_id', $user->id)
            ->select(
                'users.id', 'users.first_name', 'users.last_name', 'users.email',
                DB::raw('count(*) as total_visits'),
                DB::raw('max(appointments.date) as last_visit')
            )
            ->groupBy('users.id', 'users.first_name', 'users.last_name', 'users.email')
            ->orderBy('last_visit', 'desc')
            ->limit(10)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'today_count' => $todayCount,
                'total_patients' => $totalPatients,
                'completed_this_month' => $completedThisMonth,
                'pending_count' => $pendingCount,
                'completion_rate' => $completionRate,
                'today_appointments' => $todayAppointments,
                'weekly_data' => $weeklyData,
                'patients_list' => $patientsList,
            ],
        ]);
    }

    /**
     * 📋 Dashboard Secrétaire
     */
    public function secretary()
    {
        $user = auth()->user();

        if (!$user->isSecretary()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux secrétaires',
                'error_code' => 'FORBIDDEN',
            ], 403);
        }

        $assignedDoctorIds = $user->secretary->assigned_doctors ?? [];

        // RDV du jour
        $todayAppointments = Appointment::whereIn('doctor_id', $assignedDoctorIds)
            ->whereDate('date', today())
            ->with(['patient', 'doctor.doctor'])
            ->orderBy('start_time')->get();

        $todayCount = $todayAppointments->count();
        $doctorsCount = count($assignedDoctorIds);

        // Total RDV
        $totalAppointments = Appointment::whereIn('doctor_id', $assignedDoctorIds)->count();

        // En attente
        $pendingCount = Appointment::whereIn('doctor_id', $assignedDoctorIds)
            ->whereIn('status', ['scheduled'])->count();

        // Répartition par statut
        $statusBreakdown = Appointment::whereIn('doctor_id', $assignedDoctorIds)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        // Résumé par docteur
        $doctorSummaries = User::whereIn('id', $assignedDoctorIds)
            ->where('role', 'doctor')
            ->with('doctor')
            ->get()
            ->map(function ($doctor) {
                $todayCount = Appointment::where('doctor_id', $doctor->id)
                    ->whereDate('date', today())->count();
                $nextApt = Appointment::where('doctor_id', $doctor->id)
                    ->whereDate('date', today())
                    ->whereIn('status', ['scheduled', 'confirmed'])
                    ->orderBy('start_time')->first();
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->first_name . ' ' . $doctor->last_name,
                    'specialization' => $doctor->doctor->specialization ?? '',
                    'today_count' => $todayCount,
                    'next_apt' => $nextApt ? ['start_time' => $nextApt->start_time] : null,
                ];
            });

        // RDV récents
        $recentAppointments = Appointment::whereIn('doctor_id', $assignedDoctorIds)
            ->with(['patient', 'doctor'])
            ->orderBy('created_at', 'desc')
            ->limit(10)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'today_count' => $todayCount,
                'doctors_count' => $doctorsCount,
                'total_appointments' => $totalAppointments,
                'pending_count' => $pendingCount,
                'today_appointments' => $todayAppointments,
                'status_breakdown' => $statusBreakdown,
                'doctor_summaries' => $doctorSummaries,
                'recent_appointments' => $recentAppointments,
            ],
        ]);
    }

    /**
     * 👑 Dashboard Admin
     */
    public function admin()
    {
        $user = auth()->user();

        if (!$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs',
                'error_code' => 'FORBIDDEN',
            ], 403);
        }

        // Stats utilisateurs
        $usersStats = [
            'total' => User::count(),
            'doctors' => User::where('role', 'doctor')->count(),
            'patients' => User::where('role', 'patient')->count(),
            'secretaries' => User::where('role', 'secretary')->count(),
            'admins' => User::where('role', 'admin')->count(),
            'active' => User::where('is_active', true)->count(),
        ];

        // Stats RDV
        $appointmentsStats = [
            'total' => Appointment::count(),
            'today' => Appointment::whereDate('date', today())->count(),
            'this_month' => Appointment::whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count(),
            'completed' => Appointment::where('status', 'completed')->count(),
            'scheduled' => Appointment::where('status', 'scheduled')->count(),
            'cancelled' => Appointment::where('status', 'cancelled')->count(),
        ];

        // Tendance mensuelle (6 mois)
        $monthlyTrend = Appointment::where('date', '>=', now()->subMonths(6)->startOfMonth())
            ->select(
                DB::raw("to_char(date, 'YYYY-MM') as month"),
                DB::raw('count(*) as count')
            )
            ->groupBy('month')->orderBy('month')->get();

        // Répartition par spécialité
        $specialtyDistribution = DB::table('doctor_profiles')
            ->select('specialization', DB::raw('count(*) as count'))
            ->groupBy('specialization')->get();

        // Derniers RDV
        $recentAppointments = Appointment::with(['patient', 'doctor.doctor'])
            ->orderBy('created_at', 'desc')
            ->limit(10)->get();

        // Top docteurs
        $topDoctors = User::where('role', 'doctor')
            ->withCount('doctorAppointments')
            ->with('doctor')
            ->orderBy('doctor_appointments_count', 'desc')
            ->limit(5)->get();

        // Derniers utilisateurs inscrits
        $recentUsers = User::orderBy('created_at', 'desc')->limit(10)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $usersStats,
                'appointments' => $appointmentsStats,
                'monthly_trend' => $monthlyTrend,
                'specialty_distribution' => $specialtyDistribution,
                'recent_appointments' => $recentAppointments,
                'top_doctors' => $topDoctors,
                'recent_users' => $recentUsers,
            ],
        ]);
    }

    /**
     * 📊 Statistiques avec filtres de dates
     */
    public function stats(Request $request)
    {
        $user = auth()->user();
        $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $query = Appointment::whereBetween('date', [$startDate, $endDate]);

        // Filtrer selon le rôle
        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isPatient()) {
            $query->where('patient_id', $user->id);
        } elseif ($user->isSecretary()) {
            $assignedDoctorIds = $user->secretary->assigned_doctors ?? [];
            $query->whereIn('doctor_id', $assignedDoctorIds);
        }

        // Par statut
        $byStatus = (clone $query)->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')->pluck('count', 'status');

        // Par type
        $byType = (clone $query)->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')->pluck('count', 'type');

        // Par jour
        $daily = (clone $query)->select(
                DB::raw("date::text as day"),
                DB::raw('count(*) as count')
            )
            ->groupBy('day')->orderBy('day')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'period' => ['start' => $startDate, 'end' => $endDate],
                'total' => (clone $query)->count(),
                'by_status' => $byStatus,
                'by_type' => $byType,
                'daily' => $daily,
            ],
        ]);
    }
}
