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
    return {
      total_appointments: userApts.length,
      upcoming_appointments: upcoming.length,
      completed_appointments: userApts.filter((a) => a.status === 'completed').length,
      cancelled_appointments: userApts.filter((a) => a.status === 'cancelled').length,
      next_appointment: upcoming.sort((a, b) => a.date.localeCompare(b.date))[0] || null,
      upcoming: upcoming.sort((a, b) => a.date.localeCompare(b.date)),
    };
  },

  doctor: async (doctorId: number) => {
    await delay();
    const docApts = mockAppointments.filter((a) => a.doctor_id === doctorId);
    const today = new Date().toISOString().split('T')[0];
    const todayApts = docApts.filter((a) => a.date === today && a.status !== 'cancelled');
    const uniquePatients = new Set(docApts.map((a) => a.patient_id));
    return {
      today_count: todayApts.length,
      total_patients: uniquePatients.size,
      completed_this_month: docApts.filter((a) => a.status === 'completed').length,
      pending_count: docApts.filter((a) => a.status === 'scheduled').length,
      today_appointments: todayApts.map((a) => ({
        id: a.id,
        start_time: a.start_time,
        patient: a.patient,
        type: a.type,
        status: a.status,
      })),
    };
  },

  secretary: async () => {
    await delay();
    const today = new Date().toISOString().split('T')[0];
    return {
      today_count: mockAppointments.filter((a) => a.date === today && a.status !== 'cancelled').length,
      doctors_count: mockDoctors.length,
      total_appointments: mockAppointments.length,
    };
  },

  admin: async () => {
    await delay();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    return {
      total_users: 5,
      total_doctors: mockDoctors.length,
      total_appointments: mockAppointments.length,
      appointments_this_month: mockAppointments.filter((a) => a.date >= monthStart).length,
    };
  },
};
