import apiClient from './client';

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  type: 'consultation' | 'follow_up' | 'emergency';
  reason?: string;
  notes?: string;
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  doctor?: {
    id: number;
    first_name: string;
    last_name: string;
    doctor?: {
      specialization: string;
    };
  };
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface AvailableSlotsResponse {
  date: string;
  doctor_id: number;
  available_slots: TimeSlot[];
}

export interface CreateAppointmentPayload {
  patient_id: number;
  doctor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  reason?: string;
}

export const appointmentsApi = {
  list: () =>
    apiClient.get<Appointment[]>('/appointments'),

  get: (id: number) =>
    apiClient.get<Appointment>(`/appointments/${id}`),

  create: (data: CreateAppointmentPayload) =>
    apiClient.post<Appointment>('/appointments', data),

  update: (id: number, data: Partial<CreateAppointmentPayload>) =>
    apiClient.put<Appointment>(`/appointments/${id}`, data),

  cancel: (id: number) =>
    apiClient.delete(`/appointments/${id}`),

  updateStatus: (id: number, status: string) =>
    apiClient.patch(`/appointments/${id}/status`, { status }),

  availableSlots: (doctorId: number, date: string, duration = 30) =>
    apiClient.get<AvailableSlotsResponse>('/appointments/available-slots', {
      params: { doctor_id: doctorId, date, duration },
    }),

  upcoming: () =>
    apiClient.get<Appointment[]>('/appointments/upcoming'),

  today: () =>
    apiClient.get<Appointment[]>('/appointments/today'),
};
