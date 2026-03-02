import apiClient from './client';
import { ApiResponse } from './auth';

export const patientApi = {
  appointments: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/patient/appointments');
    return res.data.data;
  },

  medicalHistory: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/patient/medical-history');
    return res.data.data;
  },

  updateProfile: async (data: Record<string, any>) => {
    const res = await apiClient.put<ApiResponse<any>>('/patient/profile', data);
    return res.data.data;
  },
};
