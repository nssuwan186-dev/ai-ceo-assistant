import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.resort.manager',
  appName: 'Resort Manager',
  webDir: 'out',
  server: {
    // If you have a remote backend API, set the URL here
    // Example: url: 'https://your-api.com', allowNavigation: ['your-api.com']
    // For now, app runs standalone with local data
    allowNavigation: ['*'],
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
    },
  },
};

export default config;
