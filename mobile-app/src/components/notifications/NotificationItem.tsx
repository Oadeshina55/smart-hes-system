import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '../../types/notification.types';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatRelativeTime } from '../../utils/formatters';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
  onDelete?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onDelete,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'low_balance':
        return 'warning';
      case 'meter_offline':
        return 'cloud-offline';
      case 'token_loaded':
        return 'checkmark-circle';
      case 'payment_due':
        return 'cash';
      case 'system_alert':
        return 'alert-circle';
      default:
        return 'notifications';
    }
  };

  const getIconColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return colors.danger.main;
      case 'high':
        return colors.warning.main;
      case 'medium':
        return colors.info.main;
      default:
        return colors.text.light;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, !notification.read && styles.unread]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '20' }]}>
        <Ionicons
          name={getIcon() as keyof typeof Ionicons.glyphMap}
          size={24}
          color={getIconColor()}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>

        <Text style={styles.time}>{formatRelativeTime(notification.createdAt)}</Text>
      </View>

      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={colors.text.light} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  unread: {
    backgroundColor: colors.primary.light + '10',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.main,
    marginLeft: theme.spacing.xs,
  },
  message: {
    fontSize: theme.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  time: {
    fontSize: theme.fontSize.xs,
    color: colors.text.light,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
});

export default NotificationItem;
