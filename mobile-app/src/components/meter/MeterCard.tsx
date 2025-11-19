import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Meter } from '../../types/meter.types';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatEnergy, formatMeterNumber } from '../../utils/formatters';
import StatusChip from './StatusChip';

interface MeterCardProps {
  meter: Meter;
  onPress?: () => void;
}

const MeterCard: React.FC<MeterCardProps> = ({ meter, onPress }) => {
  const balance = meter.currentReading.totalEnergy || 0;
  const isLowBalance = balance < 100;

  const gradientColors = isLowBalance
    ? [colors.danger.main, colors.danger.dark]
    : [colors.primary.main, colors.primary.dark];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="speedometer" size={24} color={colors.text.inverse} />
            <Text style={styles.meterNumber}>{formatMeterNumber(meter.meterNumber)}</Text>
          </View>
          <StatusChip status={meter.status} variant="light" />
        </View>

        <View style={styles.content}>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>{formatEnergy(balance)}</Text>
          </View>

          {isLowBalance && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={16} color={colors.text.inverse} />
              <Text style={styles.warningText}>Low Balance - Please Recharge</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {meter.area && (
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={14} color={colors.text.inverse} />
              <Text style={styles.infoText}>{meter.area.name}</Text>
            </View>
          )}
          {meter.relayStatus && (
            <View style={styles.infoItem}>
              <Ionicons
                name={meter.relayStatus === 'connected' ? 'flash' : 'flash-off'}
                size={14}
                color={colors.text.inverse}
              />
              <Text style={styles.infoText}>
                {meter.relayStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  gradient: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meterNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.inverse,
    marginLeft: theme.spacing.sm,
  },
  content: {
    marginBottom: theme.spacing.md,
  },
  balanceContainer: {
    marginBottom: theme.spacing.sm,
  },
  balanceLabel: {
    fontSize: theme.fontSize.sm,
    color: colors.text.inverse,
    opacity: 0.9,
    marginBottom: theme.spacing.xs,
  },
  balanceValue: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.inverse,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  warningText: {
    fontSize: theme.fontSize.xs,
    color: colors.text.inverse,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.fontWeight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: theme.fontSize.xs,
    color: colors.text.inverse,
    marginLeft: theme.spacing.xs,
    opacity: 0.9,
  },
});

export default MeterCard;
