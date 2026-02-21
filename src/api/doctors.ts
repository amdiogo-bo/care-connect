import apiClient from './client';

export interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  doctor?: {
    specialization: string;
    office_number?: string;
    consultation_fee?: number;
  };
}

export interface Availability {
  id: number;
  doctor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export const doctorsApi = {
  list: (filters?: Record<string, string>) =>
    apiClient.get<Doctor[]>('/doctors', { params: filters }),

  get: (id: number) =>
    apiClient.get<Doctor>(`/doctors/${id}`),

  availabilities: (id: number) =>
    apiClient.get<Availability[]>(`/doctors/${id}/availabilities`),

  addAvailability: (id: number, data: Omit<Availability, 'id' | 'doctor_id'>) =>
    apiClient.post(`/doctors/${id}/availabilities`, data),

  stats: (id: number) =>
    apiClient.get(`/doctors/${id}/stats`),
};
