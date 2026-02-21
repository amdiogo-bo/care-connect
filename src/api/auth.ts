import apiClient from './client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: string;
  phone?: string;
}

export interface User {
  id: number;
  email: string;
  role: 'patient' | 'doctor' | 'secretary' | 'admin';
  first_name: string;
  last_name: string;
  phone?: string;
  doctor?: {
    specialization: string;
    office_number?: string;
  };
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post<LoginResponse>('/login', data),

  register: (data: RegisterPayload) =>
    apiClient.post<LoginResponse>('/register', data),

  me: () =>
    apiClient.get<User>('/me'),

  logout: () =>
    apiClient.post('/logout'),
};
