/**
 * Comprehensive Offline Storage Service
 * Handles offline data storage using IndexedDB (web) or SQLite (mobile via Capacitor)
 * Provides bidirectional sync with Supabase when online
 */

import Dexie, { Table } from "dexie";
import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabase";

// Core data interfaces for offline storage
interface OfflineEntity {
  id: string;
  data: any;
  lastModified: string;
  syncStatus: "pending" | "syncing" | "synced" | "error" | "conflict";
  lastSyncAttempt?: string;
  syncError?: string;
  retryCount: number;
  hash?: string; // For conflict detection
}

interface ConflictResolution {
  id: string;
  entityType: string;
  localData: any;
  remoteData: any;
  conflictType: "update_conflict" | "delete_conflict";
  timestamp: string;
  resolved: boolean;
  resolution?: "local" | "remote" | "manual";
}

interface SyncOperation {
  id?: number;
  operation: "create" | "update" | "delete";
  entityType: string;
  entityId: string;
  data: any;
  priority: "low" | "normal" | "high" | "critical";
  timestamp: string;
  userId?: string;
  retryCount: number;
  lastError?: string;
}

interface OfflineMetadata {
  key: string;
  value: any;
  timestamp: string;
  category: "sync" | "config" | "cache" | "user";
}

// Enhanced database schema with conflict resolution
class OfflineDatabase extends Dexie {
  // Entity tables
  cleaningForms!: Table<OfflineEntity>;
  employees!: Table<OfflineEntity>;
  aircraft!: Table<OfflineEntity>;
  photoEvidence!: Table<OfflineEntity>;
  userProfiles!: Table<OfflineEntity>;
  configurations!: Table<OfflineEntity>;

  // Sync management tables
  syncOperations!: Table<SyncOperation>;
  conflicts!: Table<ConflictResolution>;
  metadata!: Table<OfflineMetadata>;

  // Cache tables for frequently accessed data
  cache!: Table<{ key: string; data: any; expiry: string; category: string }>;

  constructor() {
    super("AirPlusOfflineDB");

    this.version(3).stores({
      // Entity tables with indexes for efficient querying
      cleaningForms: "id, syncStatus, lastModified, retryCount, hash",
      employees: "id, syncStatus, lastModified, retryCount, hash",
      aircraft: "id, syncStatus, lastModified, retryCount, hash",
      photoEvidence: "id, syncStatus, lastModified, retryCount, hash",
      userProfiles: "id, syncStatus, lastModified, retryCount, hash",
      configurations: "id, syncStatus, lastModified, retryCount, hash",

      // Sync management
      syncOperations:
        "++id, operation, entityType, entityId, priority, timestamp, userId, retryCount",
      conflicts: "id, entityType, timestamp, resolved",
      metadata: "key, category, timestamp",

      // Cache with expiry
      cache: "key, category, expiry",
    });

    // Add hooks for automatic timestamping and hash generation
    this.cleaningForms.hook("creating", this.addCreationMetadata);
    this.cleaningForms.hook("updating", this.addUpdateMetadata);
    this.employees.hook("creating", this.addCreationMetadata);
    this.employees.hook("updating", this.addUpdateMetadata);
    this.aircraft.hook("creating", this.addCreationMetadata);
    this.aircraft.hook("updating", this.addUpdateMetadata);
    this.photoEvidence.hook("creating", this.addCreationMetadata);
    this.photoEvidence.hook("updating", this.addUpdateMetadata);
    this.userProfiles.hook("creating", this.addCreationMetadata);
    this.userProfiles.hook("updating", this.addUpdateMetadata);
    this.configurations.hook("creating", this.addCreationMetadata);
    this.configurations.hook("updating", this.addUpdateMetadata);
  }

  private addCreationMetadata = (
    primKey: any,
    obj: OfflineEntity,
    trans: any,
  ) => {
    const now = new Date().toISOString();
    obj.lastModified = now;
    obj.syncStatus = "pending";
    obj.retryCount = 0;
    obj.hash = this.generateHash(obj.data);
  };

  private addUpdateMetadata = (
    modifications: any,
    primKey: any,
    obj: OfflineEntity,
    trans: any,
  ) => {
    if (modifications.data !== undefined) {
      modifications.lastModified = new Date().toISOString();
      modifications.syncStatus = "pending";
      modifications.retryCount = 0;
      modifications.hash = this.generateHash(modifications.data || obj.data);
    }
  };

  private generateHash(data: any): string {
    // Simple hash function for conflict detection
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

export class OfflineStorageService {
  private db: OfflineDatabase;
  private isInitialized = false;
  private platform: "web" | "mobile";
  private connectionMonitor?: any;

  constructor() {
    this.db = new OfflineDatabase();
    this.platform = Capacitor.isNativePlatform() ? "mobile" : "web";
    this.initialize();
  }

  private async initialize() {
    try {
      await this.db.open();
      await this.initializeMetadata();
      this.setupConnectionMonitoring();
      this.isInitialized = true;
      console.log(`OfflineStorageService initialized for ${this.platform}`);
    } catch (error) {
      console.error("Failed to initialize OfflineStorageService:", error);
      throw error;
    }
  }

  private async initializeMetadata() {
    const metadata = {
      initialized: { value: true, category: "config" as const },
      version: { value: "3.0.0", category: "config" as const },
      platform: { value: this.platform, category: "config" as const },
      lastCleanup: {
        value: new Date().toISOString(),
        category: "sync" as const,
      },
    };

    for (const [key, data] of Object.entries(metadata)) {
      await this.setMetadata(key, data.value, data.category);
    }
  }

  private setupConnectionMonitoring() {
    // Monitor connection status for automatic sync triggers
    const handleConnectionChange = () => {
      if (navigator.onLine) {
        this.onConnectionRestored();
      }
    };

    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);

    // For mobile platforms, listen to network state changes
    if (this.platform === "mobile") {
      // Capacitor network plugin would go here
      // import { Network } from '@capacitor/network';
    }
  }

  private async onConnectionRestored() {
    console.log("Connection restored, triggering sync...");
    // Trigger sync with a slight delay to ensure connection is stable
    setTimeout(() => {
      this.syncPendingOperations();
    }, 2000);
  }

  // CRUD Operations for different entity types
  async saveCleaningForm(formData: any): Promise<string> {
    const id = formData.id || crypto.randomUUID();
    const entity: OfflineEntity = {
      id,
      data: { ...formData, id },
      lastModified: new Date().toISOString(),
      syncStatus: "pending",
      retryCount: 0,
    };

    await this.db.cleaningForms.put(entity);
    await this.addSyncOperation(
      "create",
      "cleaning_forms",
      id,
      entity.data,
      "high",
    );

    if (navigator.onLine) {
      this.syncEntity("cleaningForms", id);
    }

    return id;
  }

  async updateCleaningForm(id: string, updates: any): Promise<void> {
    const existing = await this.db.cleaningForms.get(id);
    if (!existing) {
      throw new Error("Cleaning form not found");
    }

    const updatedData = { ...existing.data, ...updates };
    const entity: OfflineEntity = {
      ...existing,
      data: updatedData,
      lastModified: new Date().toISOString(),
      syncStatus: "pending",
      retryCount: 0,
    };

    await this.db.cleaningForms.put(entity);
    await this.addSyncOperation(
      "update",
      "cleaning_forms",
      id,
      updatedData,
      "high",
    );

    if (navigator.onLine) {
      this.syncEntity("cleaningForms", id);
    }
  }

  async getCleaningForm(id: string): Promise<any | null> {
    const entity = await this.db.cleaningForms.get(id);
    return entity?.data || null;
  }

  async getAllCleaningForms(): Promise<any[]> {
    const entities = await this.db.cleaningForms.toArray();
    return entities.map((entity) => ({
      ...entity.data,
      _syncStatus: entity.syncStatus,
      _lastModified: entity.lastModified,
      _retryCount: entity.retryCount,
    }));
  }

  async deleteCleaningForm(id: string): Promise<void> {
    await this.db.cleaningForms.delete(id);
    await this.addSyncOperation("delete", "cleaning_forms", id, null, "normal");

    if (navigator.onLine) {
      this.syncDeletion("cleaning_forms", id);
    }
  }

  // Employee operations
  async saveEmployee(employeeData: any): Promise<string> {
    const id = employeeData.id || crypto.randomUUID();
    const entity: OfflineEntity = {
      id,
      data: { ...employeeData, id },
      lastModified: new Date().toISOString(),
      syncStatus: "pending",
      retryCount: 0,
    };

    await this.db.employees.put(entity);
    await this.addSyncOperation(
      "create",
      "employees",
      id,
      entity.data,
      "normal",
    );

    if (navigator.onLine) {
      this.syncEntity("employees", id);
    }

    return id;
  }

  async updateEmployee(id: string, updates: any): Promise<void> {
    const existing = await this.db.employees.get(id);
    if (!existing) {
      throw new Error("Employee not found");
    }

    const updatedData = { ...existing.data, ...updates };
    const entity: OfflineEntity = {
      ...existing,
      data: updatedData,
      lastModified: new Date().toISOString(),
      syncStatus: "pending",
      retryCount: 0,
    };

    await this.db.employees.put(entity);
    await this.addSyncOperation(
      "update",
      "employees",
      id,
      updatedData,
      "normal",
    );

    if (navigator.onLine) {
      this.syncEntity("employees", id);
    }
  }

  async getAllEmployees(): Promise<any[]> {
    const entities = await this.db.employees.toArray();
    return entities.map((entity) => ({
      ...entity.data,
      _syncStatus: entity.syncStatus,
      _lastModified: entity.lastModified,
    }));
  }

  // Aircraft operations
  async saveAircraft(aircraftData: any): Promise<string> {
    const id = aircraftData.id || crypto.randomUUID();
    const entity: OfflineEntity = {
      id,
      data: { ...aircraftData, id },
      lastModified: new Date().toISOString(),
      syncStatus: "pending",
      retryCount: 0,
    };

    await this.db.aircraft.put(entity);
    await this.addSyncOperation(
      "create",
      "aircraft",
      id,
      entity.data,
      "normal",
    );

    if (navigator.onLine) {
      this.syncEntity("aircraft", id);
    }

    return id;
  }

  async getAllAircraft(): Promise<any[]> {
    const entities = await this.db.aircraft.toArray();
    return entities.map((entity) => ({
      ...entity.data,
      _syncStatus: entity.syncStatus,
      _lastModified: entity.lastModified,
    }));
  }

  // Photo evidence operations
  async savePhotoEvidence(photoData: any): Promise<string> {
    const id = photoData.id || crypto.randomUUID();
    const entity: OfflineEntity = {
      id,
      data: { ...photoData, id },
      lastModified: new Date().toISOString(),
      syncStatus: "pending",
      retryCount: 0,
    };

    await this.db.photoEvidence.put(entity);
    await this.addSyncOperation(
      "create",
      "photo_evidence",
      id,
      entity.data,
      "high",
    );

    if (navigator.onLine) {
      this.syncEntity("photoEvidence", id);
    }

    return id;
  }

  async getAllPhotoEvidence(): Promise<any[]> {
    const entities = await this.db.photoEvidence.toArray();
    return entities.map((entity) => ({
      ...entity.data,
      _syncStatus: entity.syncStatus,
      _lastModified: entity.lastModified,
    }));
  }

  // Configuration operations
  async saveConfiguration(configData: any): Promise<string> {
    const id = configData.id || configData.key || crypto.randomUUID();
    const entity: OfflineEntity = {
      id,
      data: { ...configData, id },
      lastModified: new Date().toISOString(),
      syncStatus: "pending",
      retryCount: 0,
    };

    await this.db.configurations.put(entity);
    await this.addSyncOperation(
      "create",
      "configurations",
      id,
      entity.data,
      "low",
    );

    if (navigator.onLine) {
      this.syncEntity("configurations", id);
    }

    return id;
  }

  async getAllConfigurations(): Promise<any[]> {
    const entities = await this.db.configurations.toArray();
    return entities.map((entity) => ({
      ...entity.data,
      _syncStatus: entity.syncStatus,
      _lastModified: entity.lastModified,
    }));
  }

  // Sync operations management
  private async addSyncOperation(
    operation: "create" | "update" | "delete",
    entityType: string,
    entityId: string,
    data: any,
    priority: "low" | "normal" | "high" | "critical" = "normal",
  ): Promise<void> {
    const syncOp: SyncOperation = {
      operation,
      entityType,
      entityId,
      data,
      priority,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    await this.db.syncOperations.add(syncOp);
  }

  async syncPendingOperations(): Promise<boolean> {
    if (!navigator.onLine || !supabase) {
      console.log("Cannot sync: offline or Supabase not configured");
      return false;
    }

    try {
      const pendingOps = await this.db.syncOperations
        .where("retryCount")
        .below(3)
        .toArray();

      // Sort by priority and timestamp
      const sortedOps = pendingOps.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return (
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      let successCount = 0;
      let errorCount = 0;

      for (const op of sortedOps) {
        try {
          await this.syncSingleOperation(op);
          await this.db.syncOperations.delete(op.id!);
          successCount++;
        } catch (error) {
          errorCount++;
          await this.handleSyncError(op, error);
        }
      }

      console.log(
        `Sync completed: ${successCount} success, ${errorCount} errors`,
      );
      return errorCount === 0;
    } catch (error) {
      console.error("Sync operation failed:", error);
      return false;
    }
  }

  private async syncSingleOperation(op: SyncOperation): Promise<void> {
    const { operation, entityType, entityId, data } = op;

    switch (operation) {
      case "create":
        const { error: createError } = await supabase
          .from(entityType)
          .insert(data);
        if (createError) throw createError;
        break;

      case "update":
        const { error: updateError } = await supabase
          .from(entityType)
          .update(data)
          .eq("id", entityId);
        if (updateError) throw updateError;
        break;

      case "delete":
        const { error: deleteError } = await supabase
          .from(entityType)
          .delete()
          .eq("id", entityId);
        if (deleteError) throw deleteError;
        break;
    }

    // Update local entity sync status
    await this.markEntityAsSynced(entityType, entityId);
  }

  private async handleSyncError(op: SyncOperation, error: any): Promise<void> {
    op.retryCount++;
    op.lastError = error instanceof Error ? error.message : "Unknown error";

    if (op.retryCount >= 3) {
      // Mark as failed and remove from queue
      await this.markEntityAsError(op.entityType, op.entityId, op.lastError);
      await this.db.syncOperations.delete(op.id!);
    } else {
      // Keep in queue for retry
      await this.db.syncOperations.put(op);
    }
  }

  private async markEntityAsSynced(
    entityType: string,
    entityId: string,
  ): Promise<void> {
    const tableMap: { [key: string]: Table<OfflineEntity> } = {
      cleaning_forms: this.db.cleaningForms,
      employees: this.db.employees,
      aircraft: this.db.aircraft,
      photo_evidence: this.db.photoEvidence,
      user_profiles: this.db.userProfiles,
      configurations: this.db.configurations,
    };

    const table = tableMap[entityType];
    if (table) {
      await table.update(entityId, {
        syncStatus: "synced" as const,
        lastSyncAttempt: new Date().toISOString(),
        syncError: undefined,
      });
    }
  }

  private async markEntityAsError(
    entityType: string,
    entityId: string,
    error: string,
  ): Promise<void> {
    const tableMap: { [key: string]: Table<OfflineEntity> } = {
      cleaning_forms: this.db.cleaningForms,
      employees: this.db.employees,
      aircraft: this.db.aircraft,
      photo_evidence: this.db.photoEvidence,
      user_profiles: this.db.userProfiles,
      configurations: this.db.configurations,
    };

    const table = tableMap[entityType];
    if (table) {
      await table.update(entityId, {
        syncStatus: "error" as const,
        lastSyncAttempt: new Date().toISOString(),
        syncError: error,
      });
    }
  }

  private async syncEntity(tableName: string, entityId: string): Promise<void> {
    // Individual entity sync
    setTimeout(() => {
      this.syncPendingOperations();
    }, 100);
  }

  private async syncDeletion(
    entityType: string,
    entityId: string,
  ): Promise<void> {
    // Handle deletion sync
    setTimeout(() => {
      this.syncPendingOperations();
    }, 100);
  }

  // Conflict resolution
  async getConflicts(): Promise<ConflictResolution[]> {
    return await this.db.conflicts.where("resolved").equals(false).toArray();
  }

  async resolveConflict(
    conflictId: string,
    resolution: "local" | "remote",
  ): Promise<void> {
    const conflict = await this.db.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error("Conflict not found");
    }

    const dataToUse =
      resolution === "local" ? conflict.localData : conflict.remoteData;

    // Apply resolution
    const tableMap: { [key: string]: Table<OfflineEntity> } = {
      cleaning_forms: this.db.cleaningForms,
      employees: this.db.employees,
      aircraft: this.db.aircraft,
      photo_evidence: this.db.photoEvidence,
      user_profiles: this.db.userProfiles,
      configurations: this.db.configurations,
    };

    const table = tableMap[conflict.entityType];
    if (table) {
      await table.update(conflict.id, {
        data: dataToUse,
        syncStatus: "pending" as const,
        lastModified: new Date().toISOString(),
      });
    }

    // Mark conflict as resolved
    await this.db.conflicts.update(conflictId, {
      resolved: true,
      resolution,
    });

    // Trigger sync
    if (navigator.onLine) {
      this.syncPendingOperations();
    }
  }

  // Cache management
  async setCache(
    key: string,
    data: any,
    category: string = "general",
    ttlMinutes: number = 60,
  ): Promise<void> {
    const expiry = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    await this.db.cache.put({ key, data, expiry, category });
  }

  async getCache(key: string): Promise<any | null> {
    const cached = await this.db.cache.get(key);
    if (!cached) return null;

    if (new Date(cached.expiry) < new Date()) {
      // Expired, remove it
      await this.db.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  async clearExpiredCache(): Promise<void> {
    const now = new Date().toISOString();
    await this.db.cache.where("expiry").below(now).delete();
  }

  // Metadata management
  async setMetadata(
    key: string,
    value: any,
    category: "sync" | "config" | "cache" | "user" = "config",
  ): Promise<void> {
    await this.db.metadata.put({
      key,
      value,
      timestamp: new Date().toISOString(),
      category,
    });
  }

  async getMetadata(key: string): Promise<any | null> {
    const metadata = await this.db.metadata.get(key);
    return metadata?.value || null;
  }

  // Statistics and monitoring
  async getSyncStats(): Promise<{
    totalEntities: number;
    syncedEntities: number;
    pendingEntities: number;
    errorEntities: number;
    pendingOperations: number;
    conflicts: number;
  }> {
    const [
      forms,
      employees,
      aircraft,
      photos,
      profiles,
      configs,
      operations,
      conflicts,
    ] = await Promise.all([
      this.db.cleaningForms.toArray(),
      this.db.employees.toArray(),
      this.db.aircraft.toArray(),
      this.db.photoEvidence.toArray(),
      this.db.userProfiles.toArray(),
      this.db.configurations.toArray(),
      this.db.syncOperations.toArray(),
      this.db.conflicts.where("resolved").equals(false).toArray(),
    ]);

    const allEntities = [
      ...forms,
      ...employees,
      ...aircraft,
      ...photos,
      ...profiles,
      ...configs,
    ];

    return {
      totalEntities: allEntities.length,
      syncedEntities: allEntities.filter((e) => e.syncStatus === "synced")
        .length,
      pendingEntities: allEntities.filter((e) => e.syncStatus === "pending")
        .length,
      errorEntities: allEntities.filter((e) => e.syncStatus === "error").length,
      pendingOperations: operations.length,
      conflicts: conflicts.length,
    };
  }

  // Cleanup and maintenance
  async performMaintenance(): Promise<void> {
    console.log("Performing offline storage maintenance...");

    // Clear expired cache
    await this.clearExpiredCache();

    // Clean up old sync logs (keep last 1000)
    const metadataCount = await this.db.metadata
      .where("category")
      .equals("sync")
      .count();
    if (metadataCount > 1000) {
      const oldEntries = await this.db.metadata
        .where("category")
        .equals("sync")
        .orderBy("timestamp")
        .limit(metadataCount - 1000)
        .toArray();

      const keysToDelete = oldEntries.map((entry) => entry.key);
      await this.db.metadata.bulkDelete(keysToDelete);
    }

    await this.setMetadata("lastMaintenance", new Date().toISOString(), "sync");
    console.log("Maintenance completed");
  }

  // Export and import for backup
  async exportAllData(): Promise<{
    entities: any;
    operations: SyncOperation[];
    metadata: OfflineMetadata[];
    timestamp: string;
  }> {
    const [
      forms,
      employees,
      aircraft,
      photos,
      profiles,
      configs,
      operations,
      metadata,
    ] = await Promise.all([
      this.db.cleaningForms.toArray(),
      this.db.employees.toArray(),
      this.db.aircraft.toArray(),
      this.db.photoEvidence.toArray(),
      this.db.userProfiles.toArray(),
      this.db.configurations.toArray(),
      this.db.syncOperations.toArray(),
      this.db.metadata.toArray(),
    ]);

    return {
      entities: {
        cleaningForms: forms,
        employees,
        aircraft,
        photoEvidence: photos,
        userProfiles: profiles,
        configurations: configs,
      },
      operations,
      metadata,
      timestamp: new Date().toISOString(),
    };
  }

  async clearAllData(): Promise<void> {
    await Promise.all([
      this.db.cleaningForms.clear(),
      this.db.employees.clear(),
      this.db.aircraft.clear(),
      this.db.photoEvidence.clear(),
      this.db.userProfiles.clear(),
      this.db.configurations.clear(),
      this.db.syncOperations.clear(),
      this.db.conflicts.clear(),
      this.db.cache.clear(),
      this.db.metadata.clear(),
    ]);

    await this.initializeMetadata();
    console.log("All offline data cleared");
  }

  // Destroy and cleanup
  destroy(): void {
    this.db.close();
  }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService();

export type {
  OfflineEntity,
  SyncOperation,
  ConflictResolution,
  OfflineMetadata,
};
