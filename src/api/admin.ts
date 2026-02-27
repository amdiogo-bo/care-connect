import apiClient from './client';
import { ApiResponse, User } from './auth';

export interface AdminUser extends User {
  is_active: boolean;
  created_at: string;
}

export const adminApi = {
  listUsers: async (params?: Record<string, string>) => {
    const res = await apiClient.get<ApiResponse<AdminUser[]>>('/admin/users', { params });
    return res.data;
  },

  getUser: async (id: number): Promise<AdminUser> => {
    const res = await apiClient.get<ApiResponse<AdminUser>>(`/admin/users/${id}`);
    return res.data.data;
  },

  createUser: async (data: Record<string, any>): Promise<AdminUser> => {
    const res = await apiClient.post<ApiResponse<AdminUser>>('/admin/users', data);
    return res.data.data;
  },

  updateUser: async (id: number, data: Record<string, any>): Promise<AdminUser> => {
    const res = await apiClient.put<ApiResponse<AdminUser>>(`/admin/users/${id}`, data);
    return res.data.data;
  },

  deleteUser: async (id: number) => {
    const res = await apiClient.delete(`/admin/users/${id}`);
    return res.data;
  },

  toggleActive: async (id: number) => {
    const res = await apiClient.patch(`/admin/users/${id}/toggle-active`);
    return res.data.data;
  },
};
