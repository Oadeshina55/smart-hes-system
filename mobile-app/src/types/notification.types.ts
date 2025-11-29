export interface Notification {
  _id: string;
  user: string;
  customer?: string;
  title: string;
  message: string;
  type: 'low_balance' | 'meter_offline' | 'token_loaded' | 'payment_due' | 'system_alert' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  data?: any;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}
