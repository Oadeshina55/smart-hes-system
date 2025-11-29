import apiService from './api';
import { Notification, NotificationResponse } from '../types/notification.types';
import { ApiResponse, NotificationQuery } from '../types/api.types';

class NotificationService {
  /**
   * Get user notifications
   */
  async getNotifications(params?: NotificationQuery): Promise<ApiResponse<NotificationResponse>> {
    return await apiService.get<ApiResponse<NotificationResponse>>(
      '/mobile/notifications',
      params
    );
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    return await apiService.patch<ApiResponse<Notification>>(
      `/mobile/notifications/${notificationId}/read`
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<{ modifiedCount: number }>> {
    return await apiService.patch<ApiResponse<{ modifiedCount: number }>>(
      '/mobile/notifications/read-all'
    );
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse> {
    return await apiService.delete<ApiResponse>(`/mobile/notifications/${notificationId}`);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
