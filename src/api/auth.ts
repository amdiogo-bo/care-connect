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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    current_page?: number;
    total?: number;
  };
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (data: LoginPayload): Promise<LoginResponse> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/login', data);
    return res.data.data;
  },

  register: async (data: RegisterPayload): Promise<LoginResponse> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/register', data);
    return res.data.data;
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/me');
    return res.data.data;
  },

  updateProfile: async (data: Partial<{ first_name: string; last_name: string; email: string; phone: string }>): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>('/me', data);
    return res.data.data;
  },

  updatePassword: async (data: { current_password: string; password: string; password_confirmation: string }) => {
    const res = await apiClient.put<ApiResponse<null>>('/me/password', data);
    return res.data;
  },

  logout: () =>
    apiClient.post('/logout'),
};
