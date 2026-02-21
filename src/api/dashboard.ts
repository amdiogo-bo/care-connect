import apiClient from './client';

export const dashboardApi = {
  patient: () => apiClient.get('/dashboard/patient'),
  doctor: () => apiClient.get('/dashboard/doctor'),
  secretary: () => apiClient.get('/dashboard/secretary'),
  admin: () => apiClient.get('/dashboard/admin'),
  stats: () => apiClient.get('/dashboard/stats'),
};
