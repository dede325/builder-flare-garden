import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aviationops.app',
  appName: 'AviationOps',
  webDir: 'dist/spa',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    App: {
      launchUrl: 'https://bd27758bea3848a48634fddab10e201a-f54cc508e9464780986cbc6c6.projects.builder.codes'
    },
    Network: {
      enabled: true
    },
    Preferences: {
      enabled: true
    }
  }
};

export default config;
