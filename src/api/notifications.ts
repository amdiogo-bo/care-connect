import apiClient from './client';

export interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  appointment_reminders?: boolean;
  system_notifications?: boolean;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'appointment' | 'system' | 'reminder' | 'profile' | 'security';
  is_read: boolean;
  created_at: string;
  data?: {
    appointment_id?: number;
    patient_name?: string;
    doctor_name?: string;
  };
}

export const notificationsApi = {
  list: () =>
    apiClient.get<Notification[]>('/notifications'),

  unreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count'),

  markAsRead: (id: number) =>
    apiClient.post(`/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.post('/notifications/read-all'),

  updatePreferences: (data: NotificationPreferences) =>
    apiClient.put<NotificationPreferences>('/notifications/preferences', data),
};
