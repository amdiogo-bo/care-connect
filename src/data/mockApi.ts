import {
  mockAppointments,
  mockDoctors,
  mockNotifications,
  generateTimeSlots,
  addMockAppointment,
  removeMockAppointment,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/data/mockData';
import { Appointment } from '@/api/appointments';
import { Doctor } from '@/api/doctors';
import { Notification } from '@/api/notifications';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const mockDoctorsApi = {
  list: async (): Promise<Doctor[]> => {
    await delay();
    return [...mockDoctors];
  },
  get: async (id: number): Promise<Doctor> => {
    await delay();
    const doc = mockDoctors.find((d) => d.id === id);
    if (!doc) throw new Error('Médecin introuvable');
    return doc;
  },
};

export const mockAppointmentsApi = {
  list: async (userId?: number, role?: string): Promise<Appointment[]> => {
    await delay();
    if (role === 'patient') return mockAppointments.filter((a) => a.patient_id === userId);
    if (role === 'doctor') return mockAppointments.filter((a) => a.doctor_id === userId);
    return [...mockAppointments];
  },

  upcoming: async (userId: number): Promise<Appointment[]> => {
    await delay();
    const now = new Date().toISOString().split('T')[0];
    return mockAppointments.filter(
      (a) => a.patient_id === userId && a.date >= now && a.status !== 'cancelled' && a.status !== 'completed'
    );
  },

  today: async (doctorId: number): Promise<Appointment[]> => {
    await delay();
    const today = new Date().toISOString().split('T')[0];
    return mockAppointments.filter((a) => a.doctor_id === doctorId && a.date === today && a.status !== 'cancelled');
  },

  availableSlots: async (doctorId: number, date: string) => {
    await delay(300);
    return {
      date,
      doctor_id: doctorId,
      available_slots: generateTimeSlots(doctorId, date),
    };
  },

  create: async (data: {
    patient_id: number;
    doctor_id: number;
    date: string;
    start_time: string;
    end_time: string;
    type: string;
    reason?: string;
  }): Promise<Appointment> => {
    await delay(600);
    const doctor = mockDoctors.find((d) => d.id === data.doctor_id);
    const newApt = addMockAppointment({
      ...data,
      status: 'confirmed',
      type: data.type as Appointment['type'],
      patient: { id: data.patient_id, first_name: 'Ousmane', last_name: 'Thiam', email: 'patient@medical.com' },
      doctor: doctor
        ? { id: doctor.id, first_name: doctor.first_name, last_name: doctor.last_name, doctor: doctor.doctor ? { specialization: doctor.doctor.specialization } : undefined }
        : undefined,
    } as Omit<Appointment, 'id'>);
    return newApt;
  },

  cancel: async (id: number) => {
    await delay(400);
    removeMockAppointment(id);
  },
};

export const mockNotificationsApi = {
  list: async (): Promise<Notification[]> => {
    await delay(300);
    return [...mockNotifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  unreadCount: async (): Promise<number> => {
    await delay(100);
    return mockNotifications.filter((n) => !n.read).length;
  },

  markAsRead: async (id: number) => {
    await delay(200);
    markNotificationRead(id);
  },

  markAllAsRead: async () => {
    await delay(200);
    markAllNotificationsRead();
  },
};

export const mockDashboardApi = {
  patient: async (userId: number) => {
    await delay();
    const userApts = mockAppointments.filter((a) => a.patient_id === userId);
    const now = new Date().toISOString().split('T')[0];
    const upcoming = userApts.filter((a) => a.date >= now && a.status !== 'cancelled' && a.status !== 'completed');
    // Monthly breakdown for chart
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthKey = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      const count = userApts.filter((a) => a.date.startsWith(monthKey)).length;
      return { month: label, count };
    });
    return {
      total_appointments: userApts.length,
      upcoming_appointments: upcoming.length,
      completed_appointments: userApts.filter((a) => a.status === 'completed').length,
      cancelled_appointments: userApts.filter((a) => a.status === 'cancelled').length,
      next_appointment: upcoming.sort((a, b) => a.date.localeCompare(b.date))[0] || null,
      upcoming: upcoming.sort((a, b) => a.date.localeCompare(b.date)),
      recent_completed: userApts.filter((a) => a.status === 'completed').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3),
      monthly_data: monthlyData,
    };
  },

  doctor: async (doctorId: number) => {
    await delay();
    const docApts = mockAppointments.filter((a) => a.doctor_id === doctorId);
    const today = new Date().toISOString().split('T')[0];
    const todayApts = docApts.filter((a) => a.date === today && a.status !== 'cancelled');
    const uniquePatients = new Set(docApts.map((a) => a.patient_id));
    const totalCompleted = docApts.filter((a) => a.status === 'completed').length;
    const totalAll = docApts.length;
    // Weekly data for chart
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      return {
        day: label,
        count: docApts.filter((a) => a.date === key && a.status !== 'cancelled').length,
      };
    });
    // Unique patients list
    const patientsList = Array.from(uniquePatients).map((pid) => {
      const apt = docApts.find((a) => a.patient_id === pid);
      const patientApts = docApts.filter((a) => a.patient_id === pid);
      return {
        id: pid,
        first_name: apt?.patient?.first_name || 'Patient',
        last_name: apt?.patient?.last_name || '',
        email: apt?.patient?.email || '',
        total_visits: patientApts.length,
        last_visit: patientApts.sort((a, b) => b.date.localeCompare(a.date))[0]?.date,
      };
    });
    return {
      today_count: todayApts.length,
      total_patients: uniquePatients.size,
      completed_this_month: totalCompleted,
      pending_count: docApts.filter((a) => a.status === 'scheduled').length,
      completion_rate: totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0,
      today_appointments: todayApts.map((a) => ({
        id: a.id, start_time: a.start_time, end_time: a.end_time,
        patient: a.patient, type: a.type, status: a.status, reason: a.reason,
      })),
      weekly_data: weeklyData,
      patients_list: patientsList,
      upcoming_week: docApts
        .filter((a) => {
          const aDate = new Date(a.date);
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          return aDate >= new Date(today) && aDate <= nextWeek && a.status !== 'cancelled';
        })
        .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)),
    };
  },

  secretary: async () => {
    await delay();
    const today = new Date().toISOString().split('T')[0];
    const todayApts = mockAppointments.filter((a) => a.date === today && a.status !== 'cancelled');
    // Doctor summaries
    const doctorSummaries = mockDoctors.map((doc) => {
      const docTodayApts = todayApts.filter((a) => a.doctor_id === doc.id);
      return {
        id: doc.id,
        name: `Dr. ${doc.first_name} ${doc.last_name}`,
        specialization: doc.doctor?.specialization || '',
        today_count: docTodayApts.length,
        next_apt: docTodayApts.sort((a, b) => a.start_time.localeCompare(b.start_time))[0] || null,
      };
    });
    // Recent appointments
    const recentApts = [...mockAppointments]
      .sort((a, b) => b.date.localeCompare(a.date) || b.start_time.localeCompare(a.start_time))
      .slice(0, 8);
    // Status breakdown
    const statusBreakdown = {
      scheduled: mockAppointments.filter((a) => a.status === 'scheduled').length,
      confirmed: mockAppointments.filter((a) => a.status === 'confirmed').length,
      completed: mockAppointments.filter((a) => a.status === 'completed').length,
      cancelled: mockAppointments.filter((a) => a.status === 'cancelled').length,
    };
    return {
      today_count: todayApts.length,
      doctors_count: mockDoctors.length,
      total_appointments: mockAppointments.length,
      pending_count: mockAppointments.filter((a) => a.status === 'scheduled').length,
      today_appointments: todayApts.map((a) => ({
        id: a.id, start_time: a.start_time, end_time: a.end_time,
        patient: a.patient, doctor: a.doctor, type: a.type, status: a.status,
      })),
      doctor_summaries: doctorSummaries,
      recent_appointments: recentApts,
      status_breakdown: statusBreakdown,
    };
  },

  admin: async () => {
    await delay();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const uniquePatients = new Set(mockAppointments.map((a) => a.patient_id));
    // Monthly trend
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthKey = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      return {
        month: label,
        appointments: mockAppointments.filter((a) => a.date.startsWith(monthKey)).length,
      };
    });
    // Status breakdown
    const statusBreakdown = [
      { name: 'Confirmés', value: mockAppointments.filter((a) => a.status === 'confirmed').length, fill: 'hsl(var(--primary))' },
      { name: 'Planifiés', value: mockAppointments.filter((a) => a.status === 'scheduled').length, fill: 'hsl(var(--warning))' },
      { name: 'Terminés', value: mockAppointments.filter((a) => a.status === 'completed').length, fill: 'hsl(var(--success))' },
      { name: 'Annulés', value: mockAppointments.filter((a) => a.status === 'cancelled').length, fill: 'hsl(var(--destructive))' },
    ];
    // Users list
    const { mockUsers } = await import('@/data/mockData');
    const usersList = mockUsers.map((u) => ({
      id: u.id, first_name: u.first_name, last_name: u.last_name,
      email: u.email, role: u.role, phone: u.phone,
    }));
    // Recent appointments
    const recentApts = [...mockAppointments]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    // Specialization breakdown
    const specMap: Record<string, number> = {};
    mockDoctors.forEach((d) => {
      const spec = d.doctor?.specialization || 'Autre';
      specMap[spec] = (specMap[spec] || 0) + 1;
    });
    const specializations = Object.entries(specMap).map(([name, value]) => ({ name, value }));
    return {
      total_users: mockUsers.length,
      total_patients: uniquePatients.size,
      total_doctors: mockDoctors.length,
      total_appointments: mockAppointments.length,
      appointments_this_month: mockAppointments.filter((a) => a.date >= monthStart).length,
      completion_rate: mockAppointments.length > 0
        ? Math.round((mockAppointments.filter((a) => a.status === 'completed').length / mockAppointments.length) * 100)
        : 0,
      monthly_trend: monthlyTrend,
      status_breakdown: statusBreakdown,
      users_list: usersList,
      recent_appointments: recentApts,
      specializations,
    };
  },
};
