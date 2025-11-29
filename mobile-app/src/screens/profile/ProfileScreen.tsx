import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { getInitials } from '../../utils/formatters';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, customer } = useAppSelector((state) => state.auth);
  const { meters } = useAppSelector((state) => state.meters);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(user.firstName, user.lastName)}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </Card>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Account Summary</Text>
          <View style={styles.statsRow}>
            <StatItem icon="speedometer" label="Linked Meters" value={meters.length.toString()} />
            <StatItem icon="person" label="Account Type" value="Customer" />
          </View>
        </Card>

        {/* Personal Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <InfoRow icon="person" label="First Name" value={user.firstName} />
          <InfoRow icon="person" label="Last Name" value={user.lastName} />
          <InfoRow icon="mail" label="Email" value={user.email} />
          {customer?.phoneNumber && (
            <InfoRow icon="call" label="Phone" value={customer.phoneNumber} />
          )}
          {customer?.address && (
            <InfoRow icon="home" label="Address" value={customer.address} />
          )}
          {customer?.accountNumber && (
            <InfoRow icon="card" label="Account Number" value={customer.accountNumber} />
          )}
        </Card>

        {/* Actions */}
        <Card style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="settings-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.actionText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="help-circle-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.actionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="document-text-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.actionText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <Button
          title="Logout"
          variant="danger"
          onPress={handleLogout}
          fullWidth
          style={styles.logoutButton}
        />

        {/* App Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value }) => {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={24} color={colors.primary.main} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={20} color={colors.text.light} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
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
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  userCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.inverse,
  },
  userName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.fontSize.md,
    color: colors.text.secondary,
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: colors.primary.main,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: theme.fontSize.md,
    color: colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  infoValue: {
    fontSize: theme.fontSize.md,
    color: colors.text.primary,
    fontWeight: theme.fontWeight.medium,
  },
  actionsCard: {
    marginBottom: theme.spacing.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  actionText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: colors.text.primary,
    marginLeft: theme.spacing.md,
  },
  logoutButton: {
    marginBottom: theme.spacing.xl,
  },
  version: {
    fontSize: theme.fontSize.sm,
    color: colors.text.light,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
});

export default ProfileScreen;
