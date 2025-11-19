import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';

interface StatusChipProps {
  status: 'online' | 'offline' | 'inactive' | 'connected' | 'disconnected';
  variant?: 'default' | 'light';
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  variant = 'default',
  size = 'medium',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: colors.success.main,
          icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
          label: 'Online',
        };
      case 'offline':
        return {
          color: colors.danger.main,
          icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
          label: 'Offline',
        };
      case 'inactive':
        return {
          color: colors.text.light,
          icon: 'pause-circle' as keyof typeof Ionicons.glyphMap,
          label: 'Inactive',
        };
      case 'connected':
        return {
          color: colors.success.main,
          icon: 'flash' as keyof typeof Ionicons.glyphMap,
          label: 'Connected',
        };
      case 'disconnected':
        return {
          color: colors.warning.main,
          icon: 'flash-off' as keyof typeof Ionicons.glyphMap,
          label: 'Disconnected',
        };
      default:
        return {
          color: colors.text.light,
          icon: 'help-circle' as keyof typeof Ionicons.glyphMap,
          label: 'Unknown',
        };
    }
  };

  const { color, icon, label } = getStatusConfig();
  const isSmall = size === 'small';
  const isLight = variant === 'light';

  return (
    <View
      style={[
        styles.container,
        isSmall && styles.containerSmall,
        {
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.2)' : color + '20',
          borderColor: isLight ? 'rgba(255, 255, 255, 0.3)' : color,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={isSmall ? 12 : 14}
        color={isLight ? colors.text.inverse : color}
      />
      <Text
        style={[
          styles.label,
          isSmall && styles.labelSmall,
          {
            color: isLight ? colors.text.inverse : color,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
  },
  containerSmall: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  labelSmall: {
    fontSize: 10,
  },
});

export default StatusChip;
