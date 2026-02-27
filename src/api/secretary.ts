import apiClient from './client';
import { ApiResponse } from './auth';

export const secretaryApi = {
  assignedDoctors: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/secretary/doctors');
    return res.data.data;
  },

  schedule: async (params?: { start_date?: string; end_date?: string }) => {
    const res = await apiClient.get<ApiResponse<any>>('/secretary/schedule', { params });
    return res.data.data;
  },

  patients: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/secretary/patients');
    return res.data.data;
  },

  createAppointment: async (data: Record<string, any>) => {
    const res = await apiClient.post<ApiResponse<any>>('/secretary/appointments', data);
    return res.data.data;
  },
};
