# Smart HES Mobile App - Setup Guide

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- Expo CLI (will be installed with dependencies)
- iOS Simulator (Mac only) or Android Emulator
- A physical device with Expo Go app (optional but recommended)

## Installation Steps

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and update the API URL to point to your backend server:

```env
API_URL=http://your-server-ip:5000/api
SOCKET_URL=http://your-server-ip:5000
```

**Important for Android Emulator:**
- Use `http://10.0.2.2:5000/api` to access localhost from Android emulator
- Use your computer's local IP (e.g., `http://192.168.1.100:5000/api`) for physical devices

**Important for iOS Simulator:**
- Use `http://localhost:5000/api` for iOS simulator
- Use your computer's local IP for physical devices

### 3. Start Development Server

```bash
npm start
```

This will start the Expo development server and show you options to:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your phone

### 4. Run on Specific Platform

```bash
# iOS (Mac only)
npm run ios

# Android
npm run android

# Web (for quick testing)
npm run web
```

## Backend Setup

Ensure your backend server is running and accessible:

1. Start the backend server:
```bash
cd ../smaer-hes-backend
npm run dev
```

2. Verify the server is running:
```bash
curl http://localhost:5000/health
```

3. Ensure the mobile API routes are accessible:
```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Testing the App

### 1. Register a New Account

- Open the app
- Click "Get Started"
- Fill in the registration form
- Submit to create your account

### 2. Link a Meter

- After login, you'll see the dashboard
- Click "Link Meter" button
- Enter a valid meter number from your system
- The meter should appear in "My Meters"

### 3. Load a Token

- Click on a meter card
- Select "Load Token"
- Enter token value or amount
- Confirm to load the token

### 4. View Consumption Trends

- Click on a meter card
- Select "View Trends"
- Choose a time period (24h, 7d, 30d, 90d)
- View the consumption chart

## Troubleshooting

### "Cannot connect to server"

**Solution:**
1. Ensure backend server is running
2. Check the API_URL in `.env` matches your server address
3. For Android emulator, use `10.0.2.2` instead of `localhost`
4. For physical devices, use your computer's local IP address
5. Ensure your phone and computer are on the same network

### "Metro bundler failed to start"

**Solution:**
```bash
# Clear metro cache
expo start -c

# Or manually clear
rm -rf node_modules
npm install
```

### "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Images/assets not loading

**Solution:**
```bash
# Clear expo cache
expo start -c
```

## Building for Production

### Using EAS Build (Recommended)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure EAS:
```bash
eas build:configure
```

4. Build for Android:
```bash
eas build --platform android
```

5. Build for iOS:
```bash
eas build --platform ios
```

### Using Expo Classic Build

```bash
# Android APK
expo build:android -t apk

# Android App Bundle (for Play Store)
expo build:android -t app-bundle

# iOS (requires Apple Developer account)
expo build:ios
```

## App Configuration

### Update App Name and Icon

Edit `app.json`:

```json
{
  "expo": {
    "name": "Smart HES",
    "slug": "smart-hes-customer",
    "icon": "./assets/icon.png",
    ...
  }
}
```

### Configure Push Notifications

1. Get your Expo project ID from `app.json`
2. Update `.env`:
```env
EXPO_PROJECT_ID=your-project-id
```

3. The app will automatically request notification permissions on launch

## Features Implemented

✅ **Authentication**
- Customer registration
- Login with email/password
- JWT token management
- Secure token storage

✅ **Meter Management**
- Link meters to account
- View all linked meters
- Real-time meter status
- Balance monitoring

✅ **Token Loading**
- Load tokens remotely
- Amount input or token paste
- Success confirmation
- Balance update

✅ **Consumption Analytics**
- View consumption trends
- Multiple time periods (24h, 7d, 30d, 90d)
- Interactive charts
- Usage statistics

✅ **Notifications**
- Low balance alerts (<100 kWh)
- Token load confirmations
- Meter offline notifications
- Mark as read/unread
- Delete notifications

✅ **Profile Management**
- View user information
- Update profile details
- View linked meters
- Logout functionality

## Next Steps

1. **Add Custom Assets**: Replace placeholder icons and splash screens in `/assets`
2. **Configure Push Notifications**: Set up Firebase Cloud Messaging for production
3. **Add Biometric Auth**: Implement Face ID / Fingerprint authentication
4. **Implement Offline Mode**: Add local database for offline access
5. **Add Dark Mode**: Implement theme switching
6. **Internationalization**: Add multi-language support

## Support

For issues or questions:
- Check the main README.md for API documentation
- Review backend logs for API errors
- Check Expo documentation: https://docs.expo.dev/

## License

This project is proprietary software. All rights reserved.
