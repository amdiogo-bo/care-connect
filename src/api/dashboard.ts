import apiClient from './client';
import { ApiResponse } from './auth';

export const dashboardApi = {
  patient: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/dashboard/patient');
    return res.data.data;
  },
  doctor: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/dashboard/doctor');
    return res.data.data;
  },
  secretary: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/dashboard/secretary');
    return res.data.data;
  },
  admin: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/dashboard/admin');
    return res.data.data;
  },
  stats: async (params?: { start_date?: string; end_date?: string }) => {
    const res = await apiClient.get<ApiResponse<any>>('/dashboard/stats', { params });
    return res.data.data;
  },
};
