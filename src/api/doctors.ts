import apiClient from './client';
import { ApiResponse } from './auth';

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
  list: async (filters?: Record<string, string>): Promise<Doctor[]> => {
    const res = await apiClient.get<ApiResponse<Doctor[]>>('/doctors', { params: filters });
    return res.data.data;
  },

  get: async (id: number): Promise<Doctor> => {
    const res = await apiClient.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    return res.data.data;
  },

  availabilities: async (id: number): Promise<Availability[]> => {
    const res = await apiClient.get<ApiResponse<Availability[]>>(`/doctors/${id}/availabilities`);
    return res.data.data;
  },

  // Doctor-only endpoints (role:doctor)
  schedule: async (params?: { start_date?: string; end_date?: string }) => {
    const res = await apiClient.get<ApiResponse<any>>('/doctor/schedule', { params });
    return res.data.data;
  },

  patients: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/doctor/patients');
    return res.data.data;
  },

  stats: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/doctor/stats');
    return res.data.data;
  },

  addAvailability: async (data: Omit<Availability, 'id' | 'doctor_id'>): Promise<Availability> => {
    const res = await apiClient.post<ApiResponse<Availability>>('/doctor/availabilities', data);
    return res.data.data;
  },

  updateAvailability: async (id: number, data: Partial<Omit<Availability, 'id' | 'doctor_id'>>): Promise<Availability> => {
    const res = await apiClient.put<ApiResponse<Availability>>(`/doctor/availabilities/${id}`, data);
    return res.data.data;
  },

  deleteAvailability: async (id: number) => {
    const res = await apiClient.delete(`/doctor/availabilities/${id}`);
    return res.data;
  },
};
