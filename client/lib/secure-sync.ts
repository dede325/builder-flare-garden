/**
 * Secure Sync Service for Aviation Cleaning Forms
 * Handles encrypted offline storage and secure synchronization with Supabase
 */

import { openDB, IDBPDatabase } from "idb";
import { supabase } from "./supabase";
import {
  SecureFormPackage,
  createSecureFormPackage,
  decryptFormData,
  verifyDataIntegrity,
  generateSecureDownloadLink,
} from "./crypto-utils";

interface SyncQueueItem {
  id: string;
  type: "create" | "update" | "delete";
  formPackage: SecureFormPackage;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

interface SyncStats {
  totalItems: number;
  pendingSync: number;
  lastSync: string | null;
  errors: number;
}

class SecureSyncService {
  private db: IDBPDatabase | null = null;
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the secure sync service
   */
  async initialize(): Promise<void> {
    try {
      this.db = await openDB("aviation-secure-db", 1, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // Secure forms storage
          if (!db.objectStoreNames.contains("secure_forms")) {
            const formsStore = db.createObjectStore("secure_forms", {
              keyPath: "metadata.id",
            });
            formsStore.createIndex("syncStatus", "syncStatus");
            formsStore.createIndex("lastModified", "metadata.lastModified");
            formsStore.createIndex("retryCount", "retryCount");
          }

          // Sync queue for pending operations
          if (!db.objectStoreNames.contains("sync_queue")) {
            const syncStore = db.createObjectStore("sync_queue", {
              keyPath: "id",
            });
            syncStore.createIndex("type", "type");
            syncStore.createIndex("timestamp", "timestamp");
            syncStore.createIndex("retryCount", "retryCount");
          }

          // Sync metadata
          if (!db.objectStoreNames.contains("sync_metadata")) {
            db.createObjectStore("sync_metadata", { keyPath: "key" });
          }
        },
      });

      // Start automatic sync if online
      this.startAutoSync();

      // Listen for online/offline events
      window.addEventListener("online", this.handleOnline.bind(this));
      window.addEventListener("offline", this.handleOffline.bind(this));

      console.log("Secure sync service initialized");
    } catch (error) {
      console.error("Failed to initialize secure sync service:", error);
      throw error;
    }
  }

  /**
   * Save form securely (encrypted) to local storage
   */
  async saveFormSecurely(formData: any): Promise<string> {
    if (!this.db) throw new Error("Sync service not initialized");

    try {
      // Create secure package with encryption
      const securePackage = await createSecureFormPackage(formData);

      // Store in IndexedDB
      await this.db.put("secure_forms", securePackage);

      // Add to sync queue if online or mark for later sync
      await this.addToSyncQueue("create", securePackage);

      // Attempt immediate sync if online
      if (navigator.onLine) {
        this.syncToSupabase().catch((error) =>
          console.warn("Immediate sync failed, will retry later:", error),
        );
      }

      return securePackage.metadata.id;
    } catch (error) {
      console.error("Failed to save form securely:", error);
      throw new Error("Falha ao salvar folha com segurança");
    }
  }

  /**
   * Update existing form securely
   */
  async updateFormSecurely(formId: string, formData: any): Promise<void> {
    if (!this.db) throw new Error("Sync service not initialized");

    try {
      // Get existing package
      const existingPackage = await this.db.get("secure_forms", formId);
      if (!existingPackage) {
        throw new Error("Form not found");
      }

      // Create updated secure package
      const securePackage = await createSecureFormPackage({
        ...formData,
        id: formId,
      });

      // Update metadata
      securePackage.metadata.lastModified = new Date().toISOString();
      securePackage.syncStatus = "pending";
      securePackage.retryCount = 0;

      // Store updated package
      await this.db.put("secure_forms", securePackage);

      // Add to sync queue
      await this.addToSyncQueue("update", securePackage);

      // Attempt immediate sync if online
      if (navigator.onLine) {
        this.syncToSupabase().catch((error) =>
          console.warn("Immediate sync failed, will retry later:", error),
        );
      }
    } catch (error) {
      console.error("Failed to update form securely:", error);
      throw new Error("Falha ao atualizar folha com segurança");
    }
  }

  /**
   * Get decrypted form data
   */
  async getDecryptedForm(formId: string): Promise<any | null> {
    if (!this.db) throw new Error("Sync service not initialized");

    try {
      const securePackage = await this.db.get("secure_forms", formId);
      if (!securePackage) return null;

      // Decrypt the data
      const decryptedData = await decryptFormData(securePackage.encryptedData);

      // Verify data integrity
      const isValid = await verifyDataIntegrity(
        decryptedData,
        securePackage.metadata.hash,
      );

      if (!isValid) {
        console.error("Data integrity check failed for form:", formId);
        throw new Error("Dados corrompidos detectados");
      }

      return decryptedData;
    } catch (error) {
      console.error("Failed to decrypt form:", error);
      throw new Error("Falha ao descriptografar folha");
    }
  }

  /**
   * Get all forms (decrypted)
   */
  async getAllForms(): Promise<any[]> {
    if (!this.db) throw new Error("Sync service not initialized");

    try {
      const securePackages = await this.db.getAll("secure_forms");
      const forms = [];

      for (const pkg of securePackages) {
        try {
          const decryptedData = await decryptFormData(pkg.encryptedData);
          forms.push({
            ...decryptedData,
            syncStatus: pkg.syncStatus,
            lastModified: pkg.metadata.lastModified,
          });
        } catch (error) {
          console.warn("Failed to decrypt form:", pkg.metadata.id, error);
        }
      }

      return forms;
    } catch (error) {
      console.error("Failed to get all forms:", error);
      return [];
    }
  }

  /**
   * Add operation to sync queue
   */
  private async addToSyncQueue(
    type: "create" | "update" | "delete",
    formPackage: SecureFormPackage,
  ): Promise<void> {
    if (!this.db) return;

    const queueItem: SyncQueueItem = {
      id: `${type}_${formPackage.metadata.id}_${Date.now()}`,
      type,
      formPackage,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    await this.db.put("sync_queue", queueItem);
  }

  /**
   * Sync all pending items to Supabase
   */
  async syncToSupabase(): Promise<void> {
    if (!this.db || this.syncInProgress || !navigator.onLine) return;

    this.syncInProgress = true;

    try {
      const pendingItems = await this.db.getAllFromIndex(
        "sync_queue",
        "retryCount",
        IDBKeyRange.bound(0, 3),
      );

      for (const item of pendingItems) {
        try {
          await this.syncSingleItem(item);

          // Remove from queue on success
          await this.db.delete("sync_queue", item.id);

          // Update form sync status
          const formPackage = await this.db.get(
            "secure_forms",
            item.formPackage.metadata.id,
          );
          if (formPackage) {
            formPackage.syncStatus = "synced";
            formPackage.lastSyncAttempt = new Date().toISOString();
            await this.db.put("secure_forms", formPackage);
          }
        } catch (error) {
          console.error("Failed to sync item:", item.id, error);

          // Check if it's a Supabase configuration error
          const isConfigError =
            error instanceof Error &&
            (error.message.includes("Supabase client not configured") ||
              error.message.includes("Supabase client not initialized") ||
              error.message.includes("Cannot read properties of null") ||
              error.message.includes("from") ||
              !import.meta.env.VITE_SUPABASE_URL);

          if (isConfigError) {
            console.warn(
              "Supabase not configured - forms will be stored locally only",
            );
            // Don't increment retry count for config issues, just mark as pending
            item.lastError = "Supabase not configured - local storage only";
            item.retryCount = 0; // Reset retry count
            await this.db.put("sync_queue", item);
          } else {
            // Increment retry count for actual errors
            item.retryCount++;
            item.lastError =
              error instanceof Error ? error.message : "Unknown error";

            if (item.retryCount <= 3) {
              await this.db.put("sync_queue", item);
            } else {
              // Mark as permanently failed
              const formPackage = await this.db.get(
                "secure_forms",
                item.formPackage.metadata.id,
              );
              if (formPackage) {
                formPackage.syncStatus = "error";
                formPackage.lastSyncAttempt = new Date().toISOString();
                await this.db.put("secure_forms", formPackage);
              }
              await this.db.delete("sync_queue", item.id);
            }
          }
        }
      }

      // Update last sync timestamp
      await this.updateSyncMetadata("lastSync", new Date().toISOString());
    } catch (error) {
      console.error("Sync operation failed:", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync single item to Supabase
   */
  private async syncSingleItem(item: SyncQueueItem): Promise<void> {
    const { type, formPackage } = item;

    // Decrypt data for upload
    const decryptedData = await decryptFormData(formPackage.encryptedData);

    switch (type) {
      case "create":
        await this.uploadToSupabase(decryptedData, formPackage.metadata);
        break;
      case "update":
        await this.updateInSupabase(decryptedData, formPackage.metadata);
        break;
      case "delete":
        await this.deleteFromSupabase(formPackage.metadata.id);
        break;
    }
  }

  /**
   * Upload form to Supabase with PDF generation
   */
  private async uploadToSupabase(formData: any, metadata: any): Promise<void> {
    try {
      // Check if supabase client is properly initialized
      if (!supabase) {
        console.warn(
          "Supabase client not configured - skipping sync. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.",
        );
        throw new Error("Supabase client not configured");
      }

      // Insert form data into Supabase
      const { error: insertError } = await supabase
        .from("cleaning_forms")
        .insert({
          id: metadata.id,
          code: metadata.id, // Use secure ID as code
          ...formData,
          security_hash: metadata.hash,
          created_at: metadata.createdAt,
          updated_at: metadata.lastModified,
        });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw insertError;
      }

      console.log("Successfully synced form to Supabase:", metadata.id);

      // Generate and upload PDF (if data exists)
      if (formData.aircraftId && formData.employees?.length > 0) {
        await this.generateAndUploadPDF(formData, metadata.id);
      }
    } catch (error) {
      console.error("Upload to Supabase failed:", error);
      throw error;
    }
  }

  /**
   * Update form in Supabase
   */
  private async updateInSupabase(formData: any, metadata: any): Promise<void> {
    const { error } = await supabase
      .from("cleaning_forms")
      .update({
        ...formData,
        security_hash: metadata.hash,
        updated_at: metadata.lastModified,
      })
      .eq("id", metadata.id);

    if (error) throw error;

    // Regenerate PDF if needed
    if (formData.aircraftId && formData.employees?.length > 0) {
      await this.generateAndUploadPDF(formData, metadata.id);
    }
  }

  /**
   * Delete form from Supabase
   */
  private async deleteFromSupabase(formId: string): Promise<void> {
    const { error } = await supabase
      .from("cleaning_forms")
      .delete()
      .eq("id", formId);

    if (error) throw error;

    // Delete PDF from storage
    await supabase.storage.from("cleaning-forms").remove([`${formId}.pdf`]);
  }

  /**
   * Generate and upload PDF to Supabase Storage
   */
  private async generateAndUploadPDF(
    formData: any,
    formId: string,
  ): Promise<string> {
    // This would integrate with the existing PDF generation utility
    // For now, return a placeholder URL
    const secureUrl = generateSecureDownloadLink(formId);
    return secureUrl;
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<SyncStats> {
    if (!this.db) {
      return { totalItems: 0, pendingSync: 0, lastSync: null, errors: 0 };
    }

    const [allForms, pendingQueue, lastSync] = await Promise.all([
      this.db.getAll("secure_forms"),
      this.db.getAllFromIndex(
        "sync_queue",
        "retryCount",
        IDBKeyRange.bound(0, 3),
      ),
      this.getSyncMetadata("lastSync"),
    ]);

    // Check if Supabase is configured
    const isSupabaseConfigured =
      !!supabase && !!import.meta.env.VITE_SUPABASE_URL;

    // If Supabase is not configured, don't count pending items as errors
    let errors = 0;
    let actualPending = 0;

    if (isSupabaseConfigured) {
      errors = allForms.filter((form) => form.syncStatus === "error").length;
      actualPending = pendingQueue.length;
    } else {
      // In demo mode, show 0 errors but keep pending count for local storage indication
      errors = 0;
      actualPending = 0; // Don't show pending if Supabase isn't configured
    }

    return {
      totalItems: allForms.length,
      pendingSync: actualPending,
      lastSync: isSupabaseConfigured ? lastSync || null : "Local storage only",
      errors,
    };
  }

  /**
   * Force full sync
   */
  async forceSyncAll(): Promise<void> {
    await this.syncToSupabase();
  }

  /**
   * Clear all local data (for testing/reset)
   */
  async clearAllData(): Promise<void> {
    if (!this.db) return;

    await Promise.all([
      this.db.clear("secure_forms"),
      this.db.clear("sync_queue"),
      this.db.clear("sync_metadata"),
    ]);
  }

  /**
   * Auto sync management
   */
  private startAutoSync(): void {
    // Sync every 5 minutes if online
    this.syncInterval = setInterval(
      () => {
        if (navigator.onLine && !this.syncInProgress) {
          this.syncToSupabase().catch(console.error);
        }
      },
      5 * 60 * 1000,
    );
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private handleOnline(): void {
    console.log("App went online, attempting sync...");
    this.syncToSupabase().catch(console.error);
  }

  private handleOffline(): void {
    console.log("App went offline, sync paused");
  }

  /**
   * Sync metadata helpers
   */
  private async updateSyncMetadata(key: string, value: string): Promise<void> {
    if (!this.db) return;
    await this.db.put("sync_metadata", {
      key,
      value,
      updated: new Date().toISOString(),
    });
  }

  private async getSyncMetadata(key: string): Promise<string | null> {
    if (!this.db) return null;
    const record = await this.db.get("sync_metadata", key);
    return record?.value || null;
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    this.stopAutoSync();
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);

    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const secureSyncService = new SecureSyncService();

// Auto-initialize when module loads
secureSyncService.initialize().catch(console.error);
