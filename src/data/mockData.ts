import { User } from '@/api/auth';
import { Appointment } from '@/api/appointments';
import { Doctor } from '@/api/doctors';
import { Notification } from '@/api/notifications';

// ============ NOTIFICATION PREFERENCES ============
export interface NotificationPreferences {
  user_id: number;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  reminder_1h: boolean;
  reminder_24h: boolean;
  reminder_48h: boolean;
}

export let mockNotificationPreferences: NotificationPreferences[] = [
  { user_id: 1, email_enabled: true, sms_enabled: true, push_enabled: true, reminder_1h: true, reminder_24h: true, reminder_48h: false },
  { user_id: 2, email_enabled: true, sms_enabled: false, push_enabled: true, reminder_1h: false, reminder_24h: true, reminder_48h: true },
  { user_id: 3, email_enabled: true, sms_enabled: true, push_enabled: false, reminder_1h: true, reminder_24h: true, reminder_48h: true },
  { user_id: 4, email_enabled: true, sms_enabled: true, push_enabled: true, reminder_1h: true, reminder_24h: true, reminder_48h: true },
  { user_id: 5, email_enabled: true, sms_enabled: false, push_enabled: false, reminder_1h: false, reminder_24h: true, reminder_48h: false },
];

export const updateNotificationPreferences = (userId: number, prefs: Partial<NotificationPreferences>) => {
  mockNotificationPreferences = mockNotificationPreferences.map((p) =>
    p.user_id === userId ? { ...p, ...prefs } : p
  );
};

// ============ USER PROFILES ============
export interface UserProfile {
  user_id: number;
  avatar?: string;
  bio?: string;
  address?: string;
  date_of_birth?: string;
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  emergency_contact?: string;
  consultation_fee?: number;
  assigned_doctors?: number[];
}

export let mockProfiles: UserProfile[] = [
  { user_id: 1, bio: '', address: 'Dakar, Sénégal', date_of_birth: '1990-05-15', blood_type: 'O+', allergies: 'Pénicilline', chronic_conditions: 'Aucune', emergency_contact: '+221 77 999 88 77' },
  { user_id: 2, bio: 'Cardiologue avec 10 ans d\'expérience.', address: 'Dakar, Sénégal', consultation_fee: 25000 },
  { user_id: 3, bio: '', address: 'Dakar, Sénégal', assigned_doctors: [2, 6, 7] },
  { user_id: 4, bio: 'Administrateur de la plateforme MediCal.', address: 'Dakar, Sénégal' },
  { user_id: 5, bio: '', address: 'Thiès, Sénégal', date_of_birth: '1985-09-22', blood_type: 'A+', allergies: 'Aucune', chronic_conditions: 'Hypertension', emergency_contact: '+221 77 111 22 33' },
];

export const updateProfile = (userId: number, data: Partial<UserProfile>) => {
  const idx = mockProfiles.findIndex((p) => p.user_id === userId);
  if (idx >= 0) {
    mockProfiles[idx] = { ...mockProfiles[idx], ...data };
  } else {
    mockProfiles.push({ user_id: userId, ...data });
  }
};

// ============ USERS ============
export let mockUsers: (User & { password: string })[] = [
  { id: 1, email: 'patient@medical.com', password: 'password', role: 'patient', first_name: 'Ousmane', last_name: 'Thiam', phone: '+221 77 123 45 67' },
  { id: 2, email: 'docteur@medical.com', password: 'password', role: 'doctor', first_name: 'Fatou', last_name: 'Diop', phone: '+221 78 234 56 78', doctor: { specialization: 'Cardiologie', office_number: 'A-201' } },
  { id: 3, email: 'secretaire@medical.com', password: 'password', role: 'secretary', first_name: 'Aminata', last_name: 'Sow', phone: '+221 76 345 67 89' },
  { id: 4, email: 'admin@medical.com', password: 'password', role: 'admin', first_name: 'Ibrahima', last_name: 'Ba', phone: '+221 70 456 78 90' },
  { id: 5, email: 'patient2@medical.com', password: 'password', role: 'patient', first_name: 'Aïcha', last_name: 'Ndiaye', phone: '+221 77 567 89 01' },
];

export const updateUser = (id: number, data: Partial<User & { password?: string }>) => {
  mockUsers = mockUsers.map((u) => (u.id === id ? { ...u, ...data } : u));
};

export const addUser = (data: Omit<User, 'id'> & { password: string }): User => {
  const id = Math.max(...mockUsers.map((u) => u.id)) + 1;
  const newUser = { ...data, id } as User & { password: string };
  mockUsers.push(newUser);
  mockProfiles.push({ user_id: id });
  mockNotificationPreferences.push({ user_id: id, email_enabled: true, sms_enabled: false, push_enabled: true, reminder_1h: true, reminder_24h: true, reminder_48h: false });
  return newUser;
};

export const deleteUser = (id: number) => {
  mockUsers = mockUsers.filter((u) => u.id !== id);
};

// ============ DOCTORS ============
export const mockDoctors: Doctor[] = [
  { id: 2, first_name: 'Fatou', last_name: 'Diop', email: 'fatou.diop@medical.com', phone: '+221 78 234 56 78', doctor: { specialization: 'Cardiologie', office_number: 'A-201', consultation_fee: 25000 } },
  { id: 6, first_name: 'Moussa', last_name: 'Sow', email: 'moussa.sow@medical.com', phone: '+221 78 111 22 33', doctor: { specialization: 'Pédiatrie', office_number: 'B-105', consultation_fee: 20000 } },
  { id: 7, first_name: 'Mariama', last_name: 'Fall', email: 'mariama.fall@medical.com', phone: '+221 78 222 33 44', doctor: { specialization: 'Gynécologie', office_number: 'C-302', consultation_fee: 30000 } },
  { id: 8, first_name: 'Abdoulaye', last_name: 'Niang', email: 'abdoulaye.niang@medical.com', phone: '+221 78 333 44 55', doctor: { specialization: 'Dermatologie', office_number: 'A-110', consultation_fee: 22000 } },
  { id: 9, first_name: 'Khady', last_name: 'Sy', email: 'khady.sy@medical.com', phone: '+221 78 444 55 66', doctor: { specialization: 'Ophtalmologie', office_number: 'D-401', consultation_fee: 28000 } },
  { id: 10, first_name: 'Cheikh', last_name: 'Mbaye', email: 'cheikh.mbaye@medical.com', phone: '+221 78 555 66 77', doctor: { specialization: 'Cardiologie', office_number: 'A-203', consultation_fee: 27000 } },
];

// ============ APPOINTMENTS ============
const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export let mockAppointments: Appointment[] = [
  { id: 1, patient_id: 1, doctor_id: 2, date: fmt(addDays(today, 2)), start_time: '14:00', end_time: '14:30', status: 'confirmed', type: 'consultation', reason: 'Consultation de routine cardiologique', patient: { id: 1, first_name: 'Ousmane', last_name: 'Thiam', email: 'patient@medical.com' }, doctor: { id: 2, first_name: 'Fatou', last_name: 'Diop', doctor: { specialization: 'Cardiologie' } } },
  { id: 2, patient_id: 1, doctor_id: 6, date: fmt(addDays(today, 5)), start_time: '10:00', end_time: '10:30', status: 'scheduled', type: 'follow_up', reason: 'Suivi vaccinations', patient: { id: 1, first_name: 'Ousmane', last_name: 'Thiam', email: 'patient@medical.com' }, doctor: { id: 6, first_name: 'Moussa', last_name: 'Sow', doctor: { specialization: 'Pédiatrie' } } },
  { id: 3, patient_id: 1, doctor_id: 7, date: fmt(addDays(today, 10)), start_time: '09:00', end_time: '09:30', status: 'scheduled', type: 'consultation', reason: 'Bilan annuel', patient: { id: 1, first_name: 'Ousmane', last_name: 'Thiam', email: 'patient@medical.com' }, doctor: { id: 7, first_name: 'Mariama', last_name: 'Fall', doctor: { specialization: 'Gynécologie' } } },
  { id: 4, patient_id: 1, doctor_id: 2, date: fmt(addDays(today, -15)), start_time: '11:00', end_time: '11:30', status: 'completed', type: 'consultation', reason: 'Douleurs thoraciques', notes: 'ECG normal. Stress recommandé de réduire.', patient: { id: 1, first_name: 'Ousmane', last_name: 'Thiam', email: 'patient@medical.com' }, doctor: { id: 2, first_name: 'Fatou', last_name: 'Diop', doctor: { specialization: 'Cardiologie' } } },
  { id: 5, patient_id: 1, doctor_id: 8, date: fmt(addDays(today, -30)), start_time: '15:00', end_time: '15:30', status: 'completed', type: 'consultation', reason: 'Éruption cutanée', patient: { id: 1, first_name: 'Ousmane', last_name: 'Thiam', email: 'patient@medical.com' }, doctor: { id: 8, first_name: 'Abdoulaye', last_name: 'Niang', doctor: { specialization: 'Dermatologie' } } },
  { id: 6, patient_id: 1, doctor_id: 9, date: fmt(addDays(today, -7)), start_time: '16:00', end_time: '16:30', status: 'cancelled', type: 'consultation', reason: 'Contrôle de la vue', patient: { id: 1, first_name: 'Ousmane', last_name: 'Thiam', email: 'patient@medical.com' }, doctor: { id: 9, first_name: 'Khady', last_name: 'Sy', doctor: { specialization: 'Ophtalmologie' } } },
  { id: 7, patient_id: 5, doctor_id: 2, date: fmt(today), start_time: '09:00', end_time: '09:30', status: 'confirmed', type: 'consultation', reason: 'Hypertension', patient: { id: 5, first_name: 'Aïcha', last_name: 'Ndiaye', email: 'patient2@medical.com' }, doctor: { id: 2, first_name: 'Fatou', last_name: 'Diop', doctor: { specialization: 'Cardiologie' } } },
  { id: 8, patient_id: 5, doctor_id: 2, date: fmt(today), start_time: '10:00', end_time: '10:30', status: 'scheduled', type: 'follow_up', reason: 'Suivi tension', patient: { id: 5, first_name: 'Aïcha', last_name: 'Ndiaye', email: 'patient2@medical.com' }, doctor: { id: 2, first_name: 'Fatou', last_name: 'Diop', doctor: { specialization: 'Cardiologie' } } },
  { id: 9, patient_id: 5, doctor_id: 2, date: fmt(today), start_time: '14:30', end_time: '15:00', status: 'scheduled', type: 'consultation', reason: 'Palpitations', patient: { id: 5, first_name: 'Aïcha', last_name: 'Ndiaye', email: 'patient2@medical.com' }, doctor: { id: 2, first_name: 'Fatou', last_name: 'Diop', doctor: { specialization: 'Cardiologie' } } },
];

let nextAppointmentId = 100;

export const addMockAppointment = (apt: Omit<Appointment, 'id'>): Appointment => {
  const newApt = { ...apt, id: nextAppointmentId++ } as Appointment;
  mockAppointments = [...mockAppointments, newApt];
  // Auto-generate notification
  addMockNotification({
    type: 'appointment_created',
    title: 'Nouveau rendez-vous',
    message: `Rendez-vous créé le ${apt.date} à ${apt.start_time} avec Dr. ${apt.doctor?.first_name || ''} ${apt.doctor?.last_name || ''}.`,
    read: false,
    created_at: new Date().toISOString(),
  });
  return newApt;
};

export const updateAppointmentStatus = (id: number, status: Appointment['status'], notes?: string) => {
  const apt = mockAppointments.find((a) => a.id === id);
  mockAppointments = mockAppointments.map((a) =>
    a.id === id ? { ...a, status, ...(notes ? { notes } : {}) } : a
  );
  if (apt) {
    const typeMap: Record<string, { type: string; title: string }> = {
      confirmed: { type: 'appointment_confirmed', title: 'Rendez-vous confirmé' },
      cancelled: { type: 'appointment_cancelled', title: 'Rendez-vous annulé' },
      completed: { type: 'appointment_completed', title: 'Consultation terminée' },
      in_progress: { type: 'appointment_in_progress', title: 'Consultation en cours' },
    };
    const info = typeMap[status];
    if (info) {
      addMockNotification({
        type: info.type,
        title: info.title,
        message: `Votre rendez-vous du ${apt.date} à ${apt.start_time} a été ${status === 'confirmed' ? 'confirmé' : status === 'cancelled' ? 'annulé' : status === 'completed' ? 'marqué comme terminé' : 'mis en cours'}.`,
        read: false,
        created_at: new Date().toISOString(),
      });
    }
  }
};

export const removeMockAppointment = (id: number) => {
  updateAppointmentStatus(id, 'cancelled');
};

// ============ TIME SLOTS GENERATOR ============
export const generateTimeSlots = (doctorId: number, date: string) => {
  const morning = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const afternoon = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
  const all = [...morning, ...afternoon];
  const booked = mockAppointments
    .filter((a) => a.doctor_id === doctorId && a.date === date && a.status !== 'cancelled')
    .map((a) => a.start_time);
  return all.map((time) => {
    const [h, m] = time.split(':').map(Number);
    const endMin = m + 30;
    const endTime = `${String(h + Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
    return { start_time: time, end_time: endTime, available: !booked.includes(time) };
  });
};

// ============ NOTIFICATIONS ============
export let mockNotifications: Notification[] = [
  { id: 1, type: 'appointment_confirmed', title: 'Rendez-vous confirmé', message: `Votre rendez-vous avec Dr. Fatou Diop est confirmé pour le ${fmt(addDays(today, 2))} à 14h00.`, read: false, created_at: addDays(today, -1).toISOString(), data: { channels: ['email', 'push', 'in_app'] } },
  { id: 2, type: 'appointment_reminder', title: 'Rappel de rendez-vous', message: `Rappel : vous avez un rendez-vous avec Dr. Moussa Sow le ${fmt(addDays(today, 5))} à 10h00.`, read: false, created_at: today.toISOString(), data: { channels: ['email', 'sms', 'in_app'] } },
  { id: 3, type: 'appointment_cancelled', title: 'Rendez-vous annulé', message: 'Votre rendez-vous du ' + fmt(addDays(today, -7)) + ' avec Dr. Khady Sy a été annulé.', read: true, created_at: addDays(today, -7).toISOString(), data: { channels: ['email', 'in_app'] } },
  { id: 4, type: 'appointment_completed', title: 'Consultation terminée', message: 'Votre consultation avec Dr. Fatou Diop est terminée. N\'hésitez pas à consulter vos notes.', read: true, created_at: addDays(today, -15).toISOString(), data: { channels: ['in_app'] } },
  { id: 5, type: 'welcome', title: 'Bienvenue sur MediCal !', message: 'Votre compte a été créé avec succès. Prenez votre premier rendez-vous dès maintenant.', read: true, created_at: addDays(today, -60).toISOString(), data: { channels: ['email', 'in_app'] } },
  { id: 6, type: 'appointment_reminder', title: 'Rappel 24h', message: `Rappel : Rendez-vous demain avec Dr. Fatou Diop à 14h00.`, read: false, created_at: addDays(today, 0).toISOString(), data: { channels: ['email', 'sms', 'push'] } },
];

let nextNotifId = 100;

export const addMockNotification = (notif: Omit<Notification, 'id'>): Notification => {
  const n = { ...notif, id: nextNotifId++ };
  mockNotifications = [n, ...mockNotifications];
  return n;
};

export const markNotificationRead = (id: number) => {
  mockNotifications = mockNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));
};

export const markAllNotificationsRead = () => {
  mockNotifications = mockNotifications.map((n) => ({ ...n, read: true }));
};

export const deleteNotification = (id: number) => {
  mockNotifications = mockNotifications.filter((n) => n.id !== id);
};
