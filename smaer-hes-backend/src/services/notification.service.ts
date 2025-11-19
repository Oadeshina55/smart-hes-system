import { Notification } from '../models/Notification.model';
import { User } from '../models/User.model';
import { Customer } from '../models/Customer.model';
import { Meter } from '../models/Meter.model';
import { socketIO } from '../server';
import * as cron from 'node-cron';

export class NotificationService {
  /**
   * Create a notification
   */
  static async create(data: {
    userId: string;
    customerId?: string;
    title: string;
    message: string;
    type: 'low_balance' | 'meter_offline' | 'token_loaded' | 'payment_due' | 'system_alert' | 'general';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    data?: any;
    expiresAt?: Date;
  }) {
    try {
      const notification = await Notification.create({
        user: data.userId,
        customer: data.customerId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || 'medium',
        data: data.data,
        expiresAt: data.expiresAt,
        read: false,
      });

      // Emit real-time notification via Socket.IO
      socketIO.to(`user-${data.userId}`).emit('notification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt,
      });

      // TODO: Send push notification to mobile device (FCM/APNS)
      // await this.sendPushNotification(data.userId, notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Check for low balance meters and send notifications
   */
  static async checkLowBalanceMeters() {
    try {
      const LOW_BALANCE_THRESHOLD = 100; // kWh

      // Get all meters with low balance
      const lowBalanceMeters = await Meter.find({
        'currentReading.totalEnergy': { $lt: LOW_BALANCE_THRESHOLD },
        customer: { $exists: true, $ne: null },
        status: 'online',
        isActive: true,
      }).populate('customer');

      for (const meter of lowBalanceMeters) {
        if (!meter.customer) continue;

        const customer = meter.customer as any;

        // Check if notification already sent in last 24 hours
        const recentNotification = await Notification.findOne({
          customer: customer._id,
          type: 'low_balance',
          'data.meterNumber': meter.meterNumber,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        if (recentNotification) continue;

        // Get user associated with customer
        const user = await User.findOne({ email: customer.email });
        if (!user) continue;

        // Create notification
        await this.create({
          userId: user._id.toString(),
          customerId: customer._id.toString(),
          title: 'Low Balance Alert',
          message: `Your meter ${meter.meterNumber} balance is low (${meter.currentReading.totalEnergy.toFixed(2)} kWh remaining). Please recharge soon to avoid disconnection.`,
          type: 'low_balance',
          priority: 'high',
          data: {
            meterNumber: meter.meterNumber,
            meterId: meter._id,
            balance: meter.currentReading.totalEnergy,
            threshold: LOW_BALANCE_THRESHOLD,
          },
        });

        console.log(`✓ Low balance notification sent for meter ${meter.meterNumber}`);
      }
    } catch (error) {
      console.error('Error checking low balance meters:', error);
    }
  }

  /**
   * Send meter offline notification
   */
  static async notifyMeterOffline(meterId: string, meterNumber: string) {
    try {
      const meter = await Meter.findById(meterId).populate('customer');
      if (!meter || !meter.customer) return;

      const customer = meter.customer as any;
      const user = await User.findOne({ email: customer.email });
      if (!user) return;

      await this.create({
        userId: user._id.toString(),
        customerId: customer._id.toString(),
        title: 'Meter Offline',
        message: `Your meter ${meterNumber} is offline. We are working to restore the connection.`,
        type: 'meter_offline',
        priority: 'medium',
        data: {
          meterNumber,
          meterId,
        },
      });
    } catch (error) {
      console.error('Error sending meter offline notification:', error);
    }
  }

  /**
   * Send token loaded notification
   */
  static async notifyTokenLoaded(meterId: string, amount: number) {
    try {
      const meter = await Meter.findById(meterId).populate('customer');
      if (!meter || !meter.customer) return;

      const customer = meter.customer as any;
      const user = await User.findOne({ email: customer.email });
      if (!user) return;

      await this.create({
        userId: user._id.toString(),
        customerId: customer._id.toString(),
        title: 'Token Loaded Successfully',
        message: `${amount} kWh has been loaded to your meter ${meter.meterNumber}.`,
        type: 'token_loaded',
        priority: 'low',
        data: {
          meterNumber: meter.meterNumber,
          meterId,
          amount,
        },
      });
    } catch (error) {
      console.error('Error sending token loaded notification:', error);
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, options?: {
    unreadOnly?: boolean;
    limit?: number;
    skip?: number;
  }) {
    try {
      const query: any = { user: userId };
      if (options?.unreadOnly) {
        query.read = false;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(options?.limit || 50)
        .skip(options?.skip || 0);

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({ user: userId, read: false });

      return {
        notifications,
        total,
        unreadCount,
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    try {
      const result = await Notification.updateMany(
        { user: userId, read: false },
        { read: true }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async delete(notificationId: string, userId: string) {
    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        user: userId,
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  static async cleanupOldNotifications(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.deleteMany({
        read: true,
        createdAt: { $lt: cutoffDate },
      });

      console.log(`✓ Deleted ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return 0;
    }
  }

  /**
   * Start notification monitoring service
   */
  static start() {
    // Check for low balance meters every hour
    cron.schedule('0 * * * *', async () => {
      console.log('🔔 Checking for low balance meters...');
      await this.checkLowBalanceMeters();
    });

    // Clean up old notifications daily at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('🧹 Cleaning up old notifications...');
      await this.cleanupOldNotifications();
    });

    console.log('✅ Notification service started');
  }
}
