import apiClient from './client';
import { ApiResponse } from './auth';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  reminder_48h: boolean;
  reminder_24h: boolean;
  reminder_1h: boolean;
}

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const res = await apiClient.get<ApiResponse<Notification[]>>('/notifications');
    return res.data.data;
  },

  unreadCount: async (): Promise<number> => {
    const res = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return res.data.data.count;
  },

  markAsRead: async (id: number) => {
    const res = await apiClient.post(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await apiClient.post('/notifications/read-all');
    return res.data;
  },

  delete: async (id: number) => {
    const res = await apiClient.delete(`/notifications/${id}`);
    return res.data;
  },

  updatePreferences: async (prefs: Partial<NotificationPreferences>) => {
    const res = await apiClient.put<ApiResponse<NotificationPreferences>>('/notifications/preferences', prefs);
    return res.data.data;
  },
};
