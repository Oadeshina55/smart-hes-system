import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation.types';
import GradientBackground from '../../components/common/GradientBackground';
import Button from '../../components/common/Button';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');

type Props = AuthStackScreenProps<'Onboarding'>;

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>⚡</Text>
          </View>

          <Text style={styles.title}>Smart HES</Text>
          <Text style={styles.subtitle}>Energy Management Made Easy</Text>

          <View style={styles.features}>
            <FeatureItem
              icon="📊"
              title="Track Consumption"
              description="Monitor your energy usage in real-time"
            />
            <FeatureItem
              icon="💳"
              title="Load Tokens"
              description="Purchase and load tokens instantly"
            />
            <FeatureItem
              icon="🔔"
              title="Get Notified"
              description="Receive alerts for low balance and updates"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('Register')}
            fullWidth
            style={styles.button}
          />

          <Button
            title="I Already Have an Account"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            fullWidth
            style={styles.button}
          />
        </View>
      </View>
    </GradientBackground>
  );
};

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl * 2,
    paddingBottom: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logo: {
    fontSize: 60,
  },
  title: {
    fontSize: theme.fontSize.xxxl + 8,
    fontWeight: theme.fontWeight.bold,
    color: colors.text.inverse,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: colors.text.inverse,
    opacity: 0.9,
    marginBottom: theme.spacing.xxl,
  },
  features: {
    width: '100%',
    marginTop: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  featureIcon: {
    fontSize: 40,
    marginRight: theme.spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: colors.text.inverse,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: theme.fontSize.sm,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  footer: {
    width: '100%',
  },
  button: {
    marginBottom: theme.spacing.md,
  },
});

export default OnboardingScreen;
