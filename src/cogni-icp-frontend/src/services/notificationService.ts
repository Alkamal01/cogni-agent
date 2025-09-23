import api from '../utils/apiClient';

export interface Notification {
  id: number;
  user_id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  content: string;
  is_read: boolean;
  source: 'tutor' | 'study_group' | 'achievement' | 'analytics';
  related_id: string | number | null;
  timestamp: string;
}

const notificationService = {
  /**
   * Get notifications for the current user
   * @param params Optional query parameters
   * @returns List of notifications and unread count
   */
  getNotifications: async (params?: {
    is_read?: boolean;
    source?: string;
    limit?: number;
  }): Promise<{ notifications: Notification[]; unread_count: number }> => {
    try {
      let url = '/api/notifications/';
      
      // Add query parameters if provided
      if (params) {
        const queryParams = new URLSearchParams();
        
        if (params.is_read !== undefined) {
          queryParams.append('is_read', params.is_read.toString());
        }
        
        if (params.source) {
          queryParams.append('source', params.source);
        }
        
        if (params.limit) {
          queryParams.append('limit', params.limit.toString());
        }
        
        const queryString = queryParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      const response = await api.get(url);
      return {
        notifications: response.data.notifications || [],
        unread_count: response.data.unread_count || 0
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], unread_count: 0 };
    }
  },
  
  /**
   * Mark a notification as read
   * @param notificationId ID of the notification to mark as read
   * @returns Updated notification
   */
  markAsRead: async (notificationId: number): Promise<Notification | null> => {
    try {
      const response = await api.put(`/api/notifications/${notificationId}/read`);
      return response.data.notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
  },
  
  /**
   * Mark all notifications as read
   * @param source Optional source filter
   * @returns Success status and message
   */
  markAllAsRead: async (source?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const url = source 
        ? `/api/notifications/read-all?source=${source}`
        : '/api/notifications/read-all';
        
      const response = await api.put(url);
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        message: 'Failed to mark notifications as read'
      };
    }
  },
  
  /**
   * Delete a specific notification
   * @param notificationId ID of the notification to delete
   * @returns Success status and message
   */
  deleteNotification: async (notificationId: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/api/notifications/${notificationId}`);
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        message: 'Failed to delete notification'
      };
    }
  },
  
  /**
   * Clear all notifications
   * @param source Optional source filter
   * @returns Success status and message
   */
  clearAllNotifications: async (source?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const url = source
        ? `/api/notifications/clear-all?source=${source}`
        : '/api/notifications/clear-all';
        
      const response = await api.delete(url);
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return {
        success: false,
        message: 'Failed to clear notifications'
      };
    }
  }
};

export default notificationService; 