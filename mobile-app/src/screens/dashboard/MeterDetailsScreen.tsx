import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardStackScreenProps } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMeterDetails, fetchBalance } from '../../store/slices/meterSlice';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusChip from '../../components/meter/StatusChip';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatEnergy, formatMeterNumber, formatRelativeTime } from '../../utils/formatters';

type Props = DashboardStackScreenProps<'MeterDetails'>;

const MeterDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { meterId } = route.params;
  const dispatch = useAppDispatch();
  const { selectedMeter, balance, loading } = useAppSelector((state) => state.meters);

  useEffect(() => {
    dispatch(fetchMeterDetails(meterId));
    dispatch(fetchBalance(meterId));
  }, [meterId]);

  if (!selectedMeter) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meter Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>
            {formatEnergy(balance?.currentBalance || selectedMeter.currentReading.totalEnergy)}
          </Text>
          {balance?.isLowBalance && (
            <View style={styles.lowBalanceWarning}>
              <Ionicons name="warning" size={16} color={colors.danger.main} />
              <Text style={styles.lowBalanceText}>Low Balance - Please Recharge</Text>
            </View>
          )}
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Meter Information</Text>
          <InfoRow label="Meter Number" value={formatMeterNumber(selectedMeter.meterNumber)} />
          <InfoRow label="Serial Number" value={selectedMeter.serialNumber} />
          <InfoRow label="Manufacturer" value={selectedMeter.manufacturer} />
          <InfoRow label="Model" value={selectedMeter.model} />
          <InfoRow label="Type" value={selectedMeter.meterType} />
          <InfoRow
            label="Status"
            value={<StatusChip status={selectedMeter.status} size="small" />}
          />
          {selectedMeter.relayStatus && (
            <InfoRow
              label="Relay"
              value={<StatusChip status={selectedMeter.relayStatus} size="small" />}
            />
          )}
          {selectedMeter.lastCommunication && (
            <InfoRow
              label="Last Seen"
              value={formatRelativeTime(selectedMeter.lastCommunication)}
            />
          )}
        </Card>

        <View style={styles.actions}>
          <Button
            title="Load Token"
            onPress={() => navigation.navigate('LoadToken', { meterId })}
            fullWidth
            style={styles.actionButton}
          />
          <Button
            title="View Consumption"
            onPress={() => navigation.navigate('ConsumptionTrend', { meterId })}
            variant="outline"
            fullWidth
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const InfoRow: React.FC<{ label: string; value: string | React.ReactNode }> = ({
  label,
  value,
}) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {typeof value === 'string' ? <Text style={styles.infoValue}>{value}</Text> : value}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    paddingTop: 50,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  balanceCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  balanceLabel: {
    fontSize: theme.fontSize.md,
    color: colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  balanceValue: {
    fontSize: theme.fontSize.xxxl + 8,
    fontWeight: theme.fontWeight.bold,
    color: colors.primary.main,
  },
  lowBalanceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: colors.danger.main + '20',
    borderRadius: theme.borderRadius.sm,
  },
  lowBalanceText: {
    fontSize: theme.fontSize.sm,
    color: colors.danger.main,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.fontWeight.medium,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    fontSize: theme.fontSize.md,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: theme.fontSize.md,
    color: colors.text.primary,
    fontWeight: theme.fontWeight.medium,
  },
  actions: {
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    marginBottom: theme.spacing.md,
  },
});

export default MeterDetailsScreen;
