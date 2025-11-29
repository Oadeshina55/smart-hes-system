import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardStackScreenProps } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMyMeters } from '../../store/slices/meterSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import { linkMeter } from '../../store/slices/meterSlice';
import GradientBackground from '../../components/common/GradientBackground';
import MeterCard from '../../components/meter/MeterCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { getInitials } from '../../utils/formatters';

type Props = DashboardStackScreenProps<'DashboardHome'>;

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { meters, loading } = useAppSelector((state) => state.meters);
  const { unreadCount } = useAppSelector((state) => state.notifications);

  const [refreshing, setRefreshing] = useState(false);
  const [showLinkMeter, setShowLinkMeter] = useState(false);
  const [meterNumber, setMeterNumber] = useState('');
  const [linkingMeter, setLinkingMeter] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    dispatch(fetchMyMeters());
    dispatch(fetchNotifications({ limit: 20 }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLinkMeter = async () => {
    if (!meterNumber.trim()) {
      Alert.alert('Error', 'Please enter a meter number');
      return;
    }

    setLinkingMeter(true);
    try {
      await dispatch(linkMeter({ meterNumber: meterNumber.toUpperCase() })).unwrap();
      Alert.alert('Success', 'Meter linked successfully!');
      setMeterNumber('');
      setShowLinkMeter(false);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to link meter');
    } finally {
      setLinkingMeter(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <GradientBackground style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications' as any)}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text.inverse} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </GradientBackground>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actions}>
            <ActionButton
              icon="add-circle"
              label="Link Meter"
              onPress={() => setShowLinkMeter(true)}
            />
            <ActionButton
              icon="cash"
              label="Load Token"
              onPress={() =>
                meters.length > 0 &&
                navigation.navigate('LoadToken', { meterId: meters[0]._id })
              }
            />
            <ActionButton
              icon="bar-chart"
              label="View Trends"
              onPress={() =>
                meters.length > 0 &&
                navigation.navigate('ConsumptionTrend', { meterId: meters[0]._id })
              }
            />
          </View>
        </Card>

        {/* Link Meter Form */}
        {showLinkMeter && (
          <Card style={styles.linkMeterCard}>
            <Text style={styles.linkMeterTitle}>Link New Meter</Text>
            <Input
              placeholder="Enter meter number"
              value={meterNumber}
              onChangeText={setMeterNumber}
              autoCapitalize="characters"
              icon="speedometer-outline"
              containerStyle={styles.linkMeterInput}
            />
            <View style={styles.linkMeterButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowLinkMeter(false);
                  setMeterNumber('');
                }}
                style={styles.linkMeterButton}
              />
              <Button
                title="Link Meter"
                onPress={handleLinkMeter}
                loading={linkingMeter}
                style={styles.linkMeterButton}
              />
            </View>
          </Card>
        )}

        {/* My Meters */}
        <View style={styles.metersSection}>
          <Text style={styles.sectionTitle}>My Meters</Text>

          {loading && meters.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>Loading meters...</Text>
            </Card>
          ) : meters.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>
                You haven't linked any meters yet. Click "Link Meter" to get started.
              </Text>
            </Card>
          ) : (
            meters.map((meter) => (
              <MeterCard
                key={meter._id}
                meter={meter}
                onPress={() => navigation.navigate('MeterDetails', { meterId: meter._id })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionButton}>
      <View style={styles.actionIconContainer}>
        <Ionicons name={icon} size={28} color={colors.primary.main} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingTop: 50,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: theme.fontSize.md,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  userName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.inverse,
    marginTop: theme.spacing.xs,
  },
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  actionsCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary.light + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionLabel: {
    fontSize: theme.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  linkMeterCard: {
    marginBottom: theme.spacing.lg,
  },
  linkMeterTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  linkMeterInput: {
    marginBottom: theme.spacing.md,
  },
  linkMeterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkMeterButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  metersSection: {
    marginBottom: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
});

export default DashboardScreen;
