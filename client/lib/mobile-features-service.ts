import { advancedFeaturesService, MobileFeaturesConfig } from "./advanced-features-service";

// Push Notifications Service
class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string = "";

  async initialize() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push messaging is not supported');
    }

    const isEnabled = await advancedFeaturesService.isMobileFeatureEnabled('pushNotifications');
    if (!isEnabled) {
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      throw new Error('Service Worker not registered');
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription) {
    // Implementation would send to your backend
    console.log('Push subscription:', subscription);
  }

  async sendNotification(title: string, body: string, data?: any) {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        data,
        tag: 'aviation-cleaning'
      });
    }
  }
}

// Offline Storage Service
class OfflineStorageService {
  private dbName = 'aviation_offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<boolean> {
    const isEnabled = await advancedFeaturesService.isMobileFeatureEnabled('offlineMode');
    if (!isEnabled) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('forms')) {
          const formStore = db.createObjectStore('forms', { keyPath: 'id' });
          formStore.createIndex('status', 'status', { unique: false });
          formStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('formId', 'formId', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }
      };
    });
  }

  async storeForm(form: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['forms'], 'readwrite');
      const store = transaction.objectStore('forms');
      
      const request = store.put({
        ...form,
        offlineTimestamp: new Date().toISOString()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineForms(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['forms'], 'readonly');
      const store = transaction.objectStore('forms');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async storePhoto(photo: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readwrite');
      const store = transaction.objectStore('photos');
      
      const request = store.put(photo);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addToSyncQueue(item: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      
      const request = store.put({
        ...item,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('navigator' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }
}

// QR Code Service
class QRCodeService {
  private stream: MediaStream | null = null;

  async initialize(): Promise<boolean> {
    const isEnabled = await advancedFeaturesService.isMobileFeatureEnabled('qrCodeScanning');
    return isEnabled;
  }

  async startCamera(): Promise<MediaStream> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      return this.stream;
    } catch (error) {
      console.error('Camera access failed:', error);
      throw error;
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async scanQRCode(imageData: ImageData): Promise<string | null> {
    // This would integrate with a QR code library like jsQR
    // For now, return a mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock QR code detection
        resolve('AIRCRAFT_001');
      }, 100);
    });
  }

  generateQRCode(data: string): string {
    // This would generate a QR code using a library like qrcode
    // For now, return a data URL placeholder
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-size="12">${data}</text></svg>`;
  }
}

// Biometric Authentication Service
class BiometricAuthService {
  async initialize(): Promise<boolean> {
    const isEnabled = await advancedFeaturesService.isMobileFeatureEnabled('biometricAuth');
    return isEnabled && this.isSupported();
  }

  isSupported(): boolean {
    return 'PublicKeyCredential' in window && 
           'authenticator' in PublicKeyCredential &&
           typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;
    
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  async register(userId: string): Promise<boolean> {
    if (!await this.isAvailable()) return false;

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Aviation Cleaning System",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userId,
            displayName: "User"
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "direct"
        }
      });

      // Store credential ID for future use
      if (credential) {
        localStorage.setItem(`biometric_${userId}`, credential.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      return false;
    }
  }

  async authenticate(userId: string): Promise<boolean> {
    if (!await this.isAvailable()) return false;

    const credentialId = localStorage.getItem(`biometric_${userId}`);
    if (!credentialId) return false;

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: new TextEncoder().encode(credentialId),
            type: "public-key"
          }],
          userVerification: "required",
          timeout: 60000
        }
      });

      return !!credential;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  async remove(userId: string): Promise<boolean> {
    try {
      localStorage.removeItem(`biometric_${userId}`);
      return true;
    } catch {
      return false;
    }
  }
}

// Background Sync Service
class BackgroundSyncService {
  private syncInterval: number = 15 * 60 * 1000; // 15 minutes

  async initialize(): Promise<boolean> {
    const config = await advancedFeaturesService.getConfigurationById('mobile-features');
    if (!config?.isActive) return false;

    const mobileConfig = config.config as MobileFeaturesConfig;
    if (!mobileConfig.offlineMode.enabled || !mobileConfig.offlineMode.backgroundSync) {
      return false;
    }

    this.syncInterval = mobileConfig.offlineMode.syncInterval * 60 * 1000;
    this.startBackgroundSync();
    return true;
  }

  private startBackgroundSync(): void {
    // Register background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('background-sync');
      });
    }

    // Fallback to regular interval sync
    setInterval(() => {
      if (navigator.onLine) {
        this.performSync();
      }
    }, this.syncInterval);
  }

  private async performSync(): Promise<void> {
    try {
      const offlineStorage = new OfflineStorageService();
      await offlineStorage.initialize();
      
      const syncQueue = await offlineStorage.getSyncQueue();
      
      for (const item of syncQueue) {
        try {
          // Process sync item
          await this.processSyncItem(item);
        } catch (error) {
          console.error('Failed to sync item:', error);
        }
      }

      if (syncQueue.length > 0) {
        await offlineStorage.clearSyncQueue();
      }
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  private async processSyncItem(item: any): Promise<void> {
    // Implementation would sync with backend
    console.log('Syncing item:', item);
  }
}

// Main Mobile Features Service
class MobileFeaturesService {
  public pushNotifications = new PushNotificationService();
  public offlineStorage = new OfflineStorageService();
  public qrCode = new QRCodeService();
  public biometricAuth = new BiometricAuthService();
  public backgroundSync = new BackgroundSyncService();

  async initializeAll(): Promise<{
    pushNotifications: boolean;
    offlineStorage: boolean;
    qrCode: boolean;
    biometricAuth: boolean;
    backgroundSync: boolean;
  }> {
    const results = await Promise.allSettled([
      this.pushNotifications.initialize(),
      this.offlineStorage.initialize(),
      this.qrCode.initialize(),
      this.biometricAuth.initialize(),
      this.backgroundSync.initialize()
    ]);

    return {
      pushNotifications: results[0].status === 'fulfilled' ? results[0].value : false,
      offlineStorage: results[1].status === 'fulfilled' ? results[1].value : false,
      qrCode: results[2].status === 'fulfilled' ? results[2].value : false,
      biometricAuth: results[3].status === 'fulfilled' ? results[3].value : false,
      backgroundSync: results[4].status === 'fulfilled' ? results[4].value : false,
    };
  }

  async getFeatureStatus(): Promise<Record<string, boolean>> {
    return {
      pushNotificationsSupported: 'Notification' in window && 'serviceWorker' in navigator,
      offlineStorageSupported: 'indexedDB' in window,
      qrCodeSupported: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      biometricSupported: this.biometricAuth.isSupported(),
      backgroundSyncSupported: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    };
  }
}

export const mobileFeaturesService = new MobileFeaturesService();
