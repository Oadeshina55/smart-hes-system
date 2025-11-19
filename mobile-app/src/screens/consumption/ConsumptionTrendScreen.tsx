import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardStackScreenProps } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchConsumptionTrend } from '../../store/slices/meterSlice';
import Card from '../../components/common/Card';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatEnergy } from '../../utils/formatters';

type Props = DashboardStackScreenProps<'ConsumptionTrend'>;

type Period = '24h' | '7d' | '30d' | '90d';

const ConsumptionTrendScreen: React.FC<Props> = ({ route, navigation }) => {
  const { meterId } = route.params;
  const dispatch = useAppDispatch();
  const { consumptionTrend, loadingConsumption } = useAppSelector((state) => state.meters);

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('7d');

  useEffect(() => {
    loadData();
  }, [meterId, selectedPeriod]);

  const loadData = () => {
    dispatch(fetchConsumptionTrend({ meterId, params: { period: selectedPeriod } }));
  };

  const periods: { value: Period; label: string }[] = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consumption Trend</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.value}
              onPress={() => setSelectedPeriod(period.value)}
              style={[
                styles.periodButton,
                selectedPeriod === period.value && styles.periodButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.value && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Statistics Cards */}
        {consumptionTrend && (
          <>
            <View style={styles.statsContainer}>
              <StatCard
                icon="flash"
                label="Total Consumption"
                value={formatEnergy(consumptionTrend.totalConsumption)}
                color={colors.primary.main}
              />
              <StatCard
                icon="trending-up"
                label="Average"
                value={formatEnergy(consumptionTrend.averageConsumption)}
                color={colors.info.main}
              />
            </View>

            <Card style={styles.balanceCard}>
              <View style={styles.balanceIconContainer}>
                <Ionicons name="battery-half" size={32} color={colors.success.main} />
              </View>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceValue}>
                {formatEnergy(consumptionTrend.currentBalance)}
              </Text>
            </Card>

            {/* Chart Placeholder */}
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Consumption Over Time</Text>
              <View style={styles.chartPlaceholder}>
                <Ionicons name="bar-chart" size={64} color={colors.text.light} />
                <Text style={styles.chartPlaceholderText}>
                  Chart visualization will be implemented with react-native-chart-kit
                </Text>
              </View>
            </Card>
          </>
        )}

        {loadingConsumption && (
          <Card>
            <Text style={styles.loadingText}>Loading consumption data...</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </Card>
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
  periodSelector: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    marginHorizontal: 2,
    backgroundColor: colors.background.card,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  periodButtonText: {
    fontSize: theme.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: theme.fontWeight.medium,
  },
  periodButtonTextActive: {
    color: colors.text.inverse,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  balanceCard: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  balanceIconContainer: {
    marginBottom: theme.spacing.sm,
  },
  balanceLabel: {
    fontSize: theme.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  balanceValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: colors.success.main,
  },
  chartCard: {
    marginBottom: theme.spacing.lg,
  },
  chartTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: theme.borderRadius.md,
  },
  chartPlaceholderText: {
    fontSize: theme.fontSize.sm,
    color: colors.text.light,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
});

export default ConsumptionTrendScreen;
