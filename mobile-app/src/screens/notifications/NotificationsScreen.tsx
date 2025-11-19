import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../../store/slices/notificationSlice';
import NotificationItem from '../../components/notifications/NotificationItem';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';

const NotificationsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications, loading, unreadCount } = useAppSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    dispatch(fetchNotifications({ limit: 50 }));
  };

  const handleNotificationPress = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      dispatch(markNotificationAsRead(notificationId));
    }
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleDelete = (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteNotification(notificationId)),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.text.light} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>
            You're all caught up! We'll notify you when something important happens.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handleNotificationPress(item._id, item.read)}
              onDelete={() => handleDelete(item._id)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadNotifications}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: 50,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.primary,
  },
  markAllButton: {
    padding: theme.spacing.xs,
  },
  markAllText: {
    fontSize: theme.fontSize.sm,
    color: colors.primary.main,
    fontWeight: theme.fontWeight.medium,
  },
  list: {
    padding: theme.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
