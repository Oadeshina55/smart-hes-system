import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const isDisabled = disabled || loading;

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.container,
      ...(fullWidth && { width: '100%' }),
    };

    switch (size) {
      case 'small':
        return { ...baseStyle, height: 40, paddingHorizontal: 16 };
      case 'large':
        return { ...baseStyle, height: 56, paddingHorizontal: 32 };
      default:
        return { ...baseStyle, height: 48, paddingHorizontal: 24 };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = styles.text;

    switch (size) {
      case 'small':
        return { ...baseStyle, fontSize: theme.fontSize.sm };
      case 'large':
        return { ...baseStyle, fontSize: theme.fontSize.lg };
      default:
        return { ...baseStyle, fontSize: theme.fontSize.md };
    }
  };

  if (variant === 'primary' && !isDisabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[getContainerStyle(), style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors.primary.gradient}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={[getTextStyle(), { color: colors.text.inverse }, textStyle]}>
              {title}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const buttonStyles = [
    getContainerStyle(),
    variant === 'secondary' && styles.secondaryButton,
    variant === 'outline' && styles.outlineButton,
    variant === 'danger' && styles.dangerButton,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    getTextStyle(),
    variant === 'primary' && { color: colors.text.inverse },
    variant === 'secondary' && { color: colors.primary.main },
    variant === 'outline' && { color: colors.primary.main },
    variant === 'danger' && { color: colors.text.inverse },
    isDisabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={buttonStyles}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'secondary' ? colors.primary.main : colors.text.inverse}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.primary.light + '20',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  dangerButton: {
    backgroundColor: colors.danger.main,
  },
  disabled: {
    backgroundColor: colors.border.light,
    opacity: 0.6,
  },
  text: {
    fontWeight: theme.fontWeight.semibold,
  },
  disabledText: {
    color: colors.text.light,
  },
});

export default Button;
