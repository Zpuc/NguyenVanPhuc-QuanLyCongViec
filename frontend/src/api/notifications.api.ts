import axiosClient from './axiosClient';

export interface NotificationItem {
  id: string;
  recipientId: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  metadata?: {
    projectId?: string;
    taskId?: string;
  };
  createdAt: string;
}

export const notificationsApi = {
  getMyNotifications: (): Promise<NotificationItem[]> => {
    return axiosClient.get('/notifications');
  },

  getUnreadCount: (): Promise<{ count: number }> => {
    return axiosClient.get('/notifications/unread-count');
  },

  markAsRead: (id: string): Promise<NotificationItem> => {
    return axiosClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: (): Promise<{ success: boolean }> => {
    return axiosClient.patch('/notifications/read-all');
  },
};
