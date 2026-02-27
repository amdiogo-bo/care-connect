import apiClient from './client';
import { ApiResponse } from './auth';

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
  list: async (): Promise<Appointment[]> => {
    const res = await apiClient.get<ApiResponse<Appointment[]>>('/appointments');
    return res.data.data;
  },

  get: async (id: number): Promise<Appointment> => {
    const res = await apiClient.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    return res.data.data;
  },

  create: async (data: CreateAppointmentPayload): Promise<Appointment> => {
    const res = await apiClient.post<ApiResponse<Appointment>>('/appointments', data);
    return res.data.data;
  },

  update: async (id: number, data: Partial<CreateAppointmentPayload>): Promise<Appointment> => {
    const res = await apiClient.put<ApiResponse<Appointment>>(`/appointments/${id}`, data);
    return res.data.data;
  },

  cancel: async (id: number) => {
    const res = await apiClient.delete(`/appointments/${id}`);
    return res.data;
  },

  updateStatus: async (id: number, status: string) => {
    const res = await apiClient.patch(`/appointments/${id}/status`, { status });
    return res.data;
  },

  availableSlots: async (doctorId: number, date: string, duration = 30): Promise<AvailableSlotsResponse> => {
    const res = await apiClient.get<ApiResponse<AvailableSlotsResponse>>('/appointments/available-slots', {
      params: { doctor_id: doctorId, date, duration },
    });
    return res.data.data;
  },

  upcoming: async (): Promise<Appointment[]> => {
    const res = await apiClient.get<ApiResponse<Appointment[]>>('/appointments/upcoming');
    return res.data.data;
  },

  today: async (): Promise<Appointment[]> => {
    const res = await apiClient.get<ApiResponse<Appointment[]>>('/appointments/today');
    return res.data.data;
  },

  addNotes: async (id: number, notes: string) => {
    const res = await apiClient.post(`/doctor/appointments/${id}/notes`, { notes });
    return res.data;
  },
};
