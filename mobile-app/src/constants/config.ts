import Constants from 'expo-constants';

const ENV = {
  dev: {
    apiUrl: 'http://localhost:5000/api',
    socketUrl: 'http://localhost:5000',
  },
  staging: {
    apiUrl: 'https://staging-api.smarthes.com/api',
    socketUrl: 'https://staging-api.smarthes.com',
  },
  prod: {
    apiUrl: 'https://api.smarthes.com/api',
    socketUrl: 'https://api.smarthes.com',
  },
};

const getEnvVars = () => {
  // Use environment variables if available
  if (process.env.API_URL) {
    return {
      apiUrl: process.env.API_URL,
      socketUrl: process.env.SOCKET_URL || process.env.API_URL.replace('/api', ''),
    };
  }

  // Default to dev environment
  if (__DEV__) {
    return ENV.dev;
  }

  // Production
  return ENV.prod;
};

export const config = {
  ...getEnvVars(),
  lowBalanceThreshold: 100, // kWh
  apiTimeout: 10000, // 10 seconds
  tokenExpiryDays: 30,
};

export default config;
