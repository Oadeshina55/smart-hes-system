import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardStackScreenProps } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadToken, clearTokenLoadResult } from '../../store/slices/meterSlice';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { validateToken, validateAmount } from '../../utils/validators';
import { formatToken } from '../../utils/formatters';

type Props = DashboardStackScreenProps<'LoadToken'>;

const LoadTokenScreen: React.FC<Props> = ({ route, navigation }) => {
  const { meterId } = route.params || {};
  const dispatch = useAppDispatch();
  const { meters, loadingToken, tokenLoadResult } = useAppSelector((state) => state.meters);

  const [selectedMeterId, setSelectedMeterId] = useState(meterId || meters[0]?._id || '');
  const [token, setToken] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [amountError, setAmountError] = useState('');

  const handleLoadToken = async () => {
    setTokenError('');
    setAmountError('');

    if (!selectedMeterId) {
      Alert.alert('Error', 'Please select a meter');
      return;
    }

    if (!token && !amount) {
      Alert.alert('Error', 'Please enter either a token or an amount');
      return;
    }

    if (token && !validateToken(token)) {
      setTokenError('Invalid token (must be 20 digits)');
      return;
    }

    if (amount && !validateAmount(amount)) {
      setAmountError('Invalid amount');
      return;
    }

    try {
      await dispatch(
        loadToken({
          meterId: selectedMeterId,
          token: token || undefined,
          amount: amount ? parseFloat(amount) : undefined,
        })
      ).unwrap();

      Alert.alert('Success', 'Token loaded successfully!', [
        {
          text: 'OK',
          onPress: () => {
            dispatch(clearTokenLoadResult());
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to load token');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Load Token</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Enter Token or Amount</Text>
          <Text style={styles.description}>
            You can either enter a 20-digit token or specify an amount in kWh
          </Text>

          <Input
            label="Token (20 digits)"
            placeholder="XXXXX XXXXX XXXXX XXXXX"
            value={formatToken(token)}
            onChangeText={(text) => setToken(text.replace(/\s/g, ''))}
            keyboardType="number-pad"
            maxLength={24}
            icon="key-outline"
            error={tokenError}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Input
            label="Amount (kWh)"
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            icon="cash-outline"
            error={amountError}
          />

          <Button
            title="Load Token"
            onPress={handleLoadToken}
            loading={loadingToken}
            fullWidth
            style={styles.loadButton}
          />
        </Card>

        {tokenLoadResult && (
          <Card style={styles.resultCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success.main} />
            </View>
            <Text style={styles.successTitle}>Token Loaded Successfully!</Text>
            <Text style={styles.successMessage}>{tokenLoadResult.message}</Text>
            {tokenLoadResult.newBalance && (
              <Text style={styles.newBalance}>
                New Balance: {tokenLoadResult.newBalance} kWh
              </Text>
            )}
          </Card>
        )}
      </ScrollView>
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
  card: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    color: colors.text.light,
    fontWeight: theme.fontWeight.medium,
  },
  loadButton: {
    marginTop: theme.spacing.md,
  },
  resultCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successIcon: {
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: colors.success.main,
    marginBottom: theme.spacing.sm,
  },
  successMessage: {
    fontSize: theme.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  newBalance: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: colors.primary.main,
  },
});

export default LoadTokenScreen;
