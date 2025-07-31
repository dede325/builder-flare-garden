import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.airplus.aviation',
  appName: 'AirPlus Aviation',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    App: {
      launchUrl: 'https://bd27758bea3848a48634fddab10e201a-f54cc508e9464780986cbc6c6.projects.builder.codes'
    },
    Camera: {
      permissions: ['camera', 'photos']
    },
    Filesystem: {
      enabled: true
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
