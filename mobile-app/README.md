# Smart HES Customer Mobile App 📱⚡

A world-class React Native mobile application for Smart HES customers to monitor their energy consumption, load tokens, and manage their meters with a modern, intuitive UI/UX.

## 🌟 Features

### ✅ **Implemented Backend APIs**
All backend endpoints are ready and tested:
- Customer Registration & Authentication
- Meter Linking (link meter number to account)
- Token Loading (remote token loading to meters)
- Consumption Trends (24h, 7d, 30d, 90d periods)
- Balance Checking & Low Balance Alerts
- Real-time Notifications
- Profile Management

### 📱 **Mobile App Features**
- **Authentication**: Secure login/register with JWT tokens
- **Dashboard**: Overview of all linked meters and energy status
- **Meter Management**: Link meters, view details, check balance
- **Consumption Analytics**: Beautiful charts showing usage trends
- **Token Loading**: Instant token recharge directly from app
- **Notifications**: Real-time alerts for low balance (<100 kWh)
- **Profile**: Update user information and preferences
- **Modern UI/UX**: Gradient backgrounds, smooth animations, glassmorphism

## 🚀 Quick Start

### Prerequisites
```bash
node >= 18.x
npm or yarn
Expo CLI (will be installed with dependencies)
iOS Simulator (Mac) or Android Emulator
```

### Installation

1. **Install Dependencies**
```bash
cd mobile-app
npm install
# or
yarn install
```

2. **Configure API Endpoint**
Create `.env` file:
```env
API_URL=http://your-backend-server:5000/api
SOCKET_URL=http://your-backend-server:5000
```

3. **Start Development Server**
```bash
npm start
# or
expo start
```

4. **Run on Device/Emulator**
```bash
# iOS (Mac only)
npm run ios

# Android
npm run android

# Web (for testing)
npm run web
```

## 📁 Project Structure

```
mobile-app/
├── src/
│   ├── screens/              # All app screens
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── OnboardingScreen.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.tsx
│   │   │   └── MeterDetailsScreen.tsx
│   │   ├── consumption/
│   │   │   └── ConsumptionTrendScreen.tsx
│   │   ├── token/
│   │   │   └── LoadTokenScreen.tsx
│   │   ├── notifications/
│   │   │   └── NotificationsScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   ├── components/           # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── GradientBackground.tsx
│   │   ├── meter/
│   │   │   ├── MeterCard.tsx
│   │   │   ├── BalanceIndicator.tsx
│   │   │   └── StatusChip.tsx
│   │   ├── charts/
│   │   │   ├── ConsumptionChart.tsx
│   │   │   └── TrendChart.tsx
│   │   └── notifications/
│   │       └── NotificationItem.tsx
│   ├── navigation/           # Navigation setup
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── services/             # API services
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── meter.service.ts
│   │   ├── consumption.service.ts
│   │   ├── token.service.ts
│   │   └── notification.service.ts
│   ├── store/                # Redux store
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── meterSlice.ts
│   │   │   └── notificationSlice.ts
│   │   └── hooks.ts
│   ├── utils/                # Utilities
│   │   ├── storage.ts
│   │   ├── validators.ts
│   │   └── formatters.ts
│   ├── constants/            # Constants
│   │   ├── colors.ts
│   │   ├── theme.ts
│   │   └── config.ts
│   └── types/                # TypeScript types
│       ├── api.types.ts
│       ├── meter.types.ts
│       └── navigation.types.ts
├── assets/                   # Images, fonts, etc
│   ├── images/
│   ├── fonts/
│   └── animations/           # Lottie animations
├── app.json                  # Expo configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🎨 UI/UX Design System

### Color Palette
```typescript
const colors = {
  primary: {
    main: '#6366F1',      // Indigo
    light: '#818CF8',
    dark: '#4F46E5',
    gradient: ['#667eea', '#764ba2'],
  },
  success: {
    main: '#10B981',      // Green
    light: '#34D399',
    dark: '#059669',
  },
  warning: {
    main: '#F59E0B',      // Amber
    light: '#FBBF24',
    dark: '#D97706',
  },
  danger: {
    main: '#EF4444',      // Red
    light: '#F87171',
    dark: '#DC2626',
  },
  background: {
    primary: '#F9FAFB',
    secondary: '#FFFFFF',
    dark: '#1F2937',
  },
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    light: '#9CA3AF',
    inverse: '#FFFFFF',
  },
};
```

### Typography
- **Primary Font**: Inter (clean, modern)
- **Headings**: Bold, 24-32px
- **Body**: Regular, 14-16px
- **Captions**: Regular, 12px

### Components Style
- **Cards**: Elevated with subtle shadows, rounded corners (16px)
- **Buttons**: Gradient backgrounds, 48px height, rounded (12px)
- **Inputs**: Bordered, focused state with primary color, 48px height
- **Charts**: Smooth gradients, animated transitions
- **Animations**: Lottie for loading states, Reanimated for gestures

## 📱 Key Screens Implementation

### 1. Login Screen
- Gradient background
- Email/password inputs with validation
- "Remember me" checkbox
- Social login buttons (future)
- Link to register screen

### 2. Registration Screen
- Multi-step form (Personal Info → Account Setup → Meter Linking)
- Form validation with Formik + Yup
- Success animation

### 3. Dashboard Screen
- Header with user greeting and notification bell
- Balance cards for each meter (gradient backgrounds)
- Quick actions (Load Token, View Consumption)
- Recent activity feed
- Pull-to-refresh

### 4. Meter Details Screen
- Large balance indicator (circular progress)
- Status chips (Online/Offline, Relay Connected/Disconnected)
- Meter information cards
- Action buttons (Load Token, View Trends, Unlink)

### 5. Consumption Trend Screen
- Period selector (24h, 7d, 30d, 90d)
- Line chart with gradient fill
- Statistics cards (Total, Average, Peak)
- Export data option

### 6. Load Token Screen
- Amount input or token paste
- Meter selector dropdown
- Preview before loading
- Success confirmation with animation

### 7. Notifications Screen
- Categorized notifications (Alerts, Info, Updates)
- Mark as read/unread
- Delete functionality
- Empty state illustration

### 8. Profile Screen
- Avatar with edit option
- Personal information form
- Linked meters list
- App preferences
- Logout button

## 🔗 API Integration

### Base Configuration
```typescript
// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      await AsyncStorage.removeItem('authToken');
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Authentication Service
```typescript
// src/services/auth.service.ts
import api from './api';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/mobile/login', { email, password });
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }) => {
    const response = await api.post('/mobile/register', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/mobile/profile');
    return response.data;
  },

  updateProfile: async (userData: Partial<User>) => {
    const response = await api.put('/mobile/profile', userData);
    return response.data;
  },
};
```

### Meter Service
```typescript
// src/services/meter.service.ts
import api from './api';

export const meterService = {
  getMyMeters: async () => {
    const response = await api.get('/mobile/my-meters');
    return response.data;
  },

  getMeterDetails: async (meterId: string) => {
    const response = await api.get(`/mobile/meter/${meterId}`);
    return response.data;
  },

  linkMeter: async (meterNumber: string) => {
    const response = await api.post('/mobile/link-meter', { meterNumber });
    return response.data;
  },

  getBalance: async (meterId: string) => {
    const response = await api.get(`/mobile/balance/${meterId}`);
    return response.data;
  },

  getConsumptionTrend: async (meterId: string, period: string = '7d') => {
    const response = await api.get(`/mobile/consumption-trend/${meterId}`, {
      params: { period },
    });
    return response.data;
  },

  loadToken: async (meterId: string, amount?: number, token?: string) => {
    const response = await api.post('/mobile/load-token', {
      meterId,
      amount,
      token,
    });
    return response.data;
  },
};
```

### Notification Service
```typescript
// src/services/notification.service.ts
import api from './api';

export const notificationService = {
  getNotifications: async (unreadOnly: boolean = false, page: number = 1) => {
    const response = await api.get('/mobile/notifications', {
      params: { unreadOnly, page, limit: 20 },
    });
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`/mobile/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/mobile/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/mobile/notifications/${notificationId}`);
    return response.data;
  },
};
```

## 🔔 Push Notifications Setup

### Configure Expo Notifications

1. **Install expo-notifications** (already in package.json)

2. **Request permissions and get token**
```typescript
// src/utils/notifications.ts
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

3. **Listen for notifications**
```typescript
useEffect(() => {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    // Update Redux store or show in-app notification
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    // Navigate to relevant screen
  });

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}, []);
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
- Unit tests for services
- Component tests with React Native Testing Library
- Integration tests for navigation flows
- E2E tests with Detox (optional)

## 📦 Building for Production

### Android
```bash
# Generate Android APK
expo build:android -t apk

# Generate Android App Bundle (AAB) for Play Store
expo build:android -t app-bundle
```

### iOS
```bash
# Generate iOS IPA
expo build:ios -t archive
```

## 🚢 Deployment

### Expo Application Services (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for production
eas build --platform android
eas build --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

## 🔐 Security Best Practices

1. **Secure Storage**: Use `expo-secure-store` for tokens
2. **API Keys**: Never commit API keys, use environment variables
3. **Certificate Pinning**: Implement for production
4. **Input Validation**: Validate all user inputs
5. **HTTPS Only**: Ensure backend uses HTTPS
6. **Token Refresh**: Implement automatic token refresh

## 📊 Analytics & Monitoring

### Recommended Tools
- **Sentry**: Error tracking and performance monitoring
- **Firebase Analytics**: User behavior and engagement
- **Amplitude**: Product analytics

## 🛠 Development Tools

- **React Native Debugger**: Debug React Native apps
- **Flipper**: Platform for debugging mobile apps
- **Reactotron**: Inspect Redux store and API calls

## 📝 Environment Variables

Create `.env` file:
```env
# API Configuration
API_URL=http://your-backend-server:5000/api
SOCKET_URL=http://your-backend-server:5000

# Push Notifications (Expo)
EXPO_PROJECT_ID=your-expo-project-id

# Feature Flags
ENABLE_BIOMETRIC_AUTH=true
ENABLE_OFFLINE_MODE=false
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 💡 Support

For support, email support@smarthes.com or create an issue in the repository.

## 🎯 Roadmap

- [ ] Biometric authentication (Face ID / Fingerprint)
- [ ] Offline mode with local database
- [ ] Dark mode theme
- [ ] Multi-language support (i18n)
- [ ] Voice commands integration
- [ ] Widget for iOS/Android home screen
- [ ] Apple Watch / Wear OS companion app
- [ ] AR feature to locate meters

---

**Built with ❤️ for Smart HES Customers**
