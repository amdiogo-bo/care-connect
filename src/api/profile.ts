import apiClient from './client';

export interface Profile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  doctor?: {
    id: number;
    specialization: string;
    consultation_fee?: number;
  };
  patient?: {
    id: number;
  };
  secretory?: {
    id: number;
    assigned_doctors?: number[];
  };
}

export const profileApi = {
  get: () =>
    apiClient.get<Profile>('/profile'),

  update: (data: Partial<Profile>) =>
    apiClient.put<Profile>('/profile', data),

  updatePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) =>
    apiClient.put('/profile/password', data),
};
