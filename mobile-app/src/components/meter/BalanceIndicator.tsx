import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatEnergy } from '../../utils/formatters';

interface BalanceIndicatorProps {
  balance: number;
  size?: 'small' | 'medium' | 'large';
}

const BalanceIndicator: React.FC<BalanceIndicatorProps> = ({
  balance,
  size = 'medium',
}) => {
  const isLowBalance = balance < 100;
  const percentage = Math.min((balance / 500) * 100, 100); // Assume 500 kWh is full

  const getSize = () => {
    switch (size) {
      case 'small':
        return { container: 100, stroke: 8, fontSize: theme.fontSize.lg };
      case 'large':
        return { container: 200, stroke: 16, fontSize: theme.fontSize.xxxl };
      default:
        return { container: 150, stroke: 12, fontSize: theme.fontSize.xxl };
    }
  };

  const { container, stroke, fontSize } = getSize();
  const radius = (container - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const color = isLowBalance ? colors.danger.main : colors.success.main;

  return (
    <View style={[styles.container, { width: container, height: container }]}>
      <svg width={container} height={container}>
        {/* Background circle */}
        <circle
          cx={container / 2}
          cy={container / 2}
          r={radius}
          stroke={colors.border.light}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={container / 2}
          cy={container / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${container / 2} ${container / 2})`}
        />
      </svg>

      <View style={styles.textContainer}>
        <Text style={[styles.balanceText, { fontSize }]}>{formatEnergy(balance)}</Text>
        <Text style={styles.labelText}>Remaining</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  balanceText: {
    fontWeight: theme.fontWeight.bold,
    color: colors.text.primary,
  },
  labelText: {
    fontSize: theme.fontSize.sm,
    color: colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});

export default BalanceIndicator;
