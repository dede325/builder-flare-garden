import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export const capacitorService = {
  // App lifecycle
  isNative: () => Capacitor.isNativePlatform(),
  
  getPlatform: () => Capacitor.getPlatform(),
  
  // App info
  getAppInfo: async () => {
    if (!Capacitor.isNativePlatform()) return null;
    return await App.getInfo();
  },

  // Device info
  getDeviceInfo: async () => {
    return await Device.getInfo();
  },

  // Network status
  getNetworkStatus: async () => {
    return await Network.getStatus();
  },

  // Listen to network changes
  onNetworkChange: (callback: (status: any) => void) => {
    return Network.addListener('networkStatusChange', callback);
  },

  // Preferences (secure storage)
  setPreference: async (key: string, value: string) => {
    await Preferences.set({ key, value });
  },

  getPreference: async (key: string) => {
    const { value } = await Preferences.get({ key });
    return value;
  },

  removePreference: async (key: string) => {
    await Preferences.remove({ key });
  },

  clearPreferences: async () => {
    await Preferences.clear();
  },

  // App state listeners
  onAppStateChange: (callback: (state: any) => void) => {
    return App.addListener('appStateChange', callback);
  },

  // App URL handling
  onAppUrlOpen: (callback: (data: any) => void) => {
    return App.addListener('appUrlOpen', callback);
  },

  // Back button (Android)
  onBackButton: (callback: () => void) => {
    return App.addListener('backButton', callback);
  }
};

// Helper to sync data when app comes to foreground
export const setupAppLifecycleSync = (syncCallback: () => void) => {
  if (!Capacitor.isNativePlatform()) return;

  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      // App came to foreground, trigger sync
      syncCallback();
    }
  });
};

// Helper to handle network changes
export const setupNetworkSync = (
  onOnline: () => void,
  onOffline: () => void
) => {
  Network.addListener('networkStatusChange', (status) => {
    if (status.connected) {
      onOnline();
    } else {
      onOffline();
    }
  });
};
