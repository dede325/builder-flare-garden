/**
 * Comprehensive Sync Manager
 * Orchestrates all offline/online synchronization with conflict resolution,
 * real-time updates, and intelligent batching
 */

import { offlineStorageService } from "./offline-storage-service";
import { intelligentSyncService } from "./intelligent-sync-service";
import { photoEvidenceService } from "./photo-evidence-service";
import { supabase } from "./supabase";

interface SyncEvent {
  type: "sync_start" | "sync_progress" | "sync_complete" | "sync_error" | "conflict_detected";
  data?: any;
  timestamp: string;
}

interface SyncProgress {
  current: number;
  total: number;
  currentEntity: string;
  phase: "preparing" | "uploading" | "downloading" | "resolving" | "finalizing";
}

interface ConflictInfo {
  id: string;
  entityType: string;
  localData: any;
  remoteData: any;
  conflictFields: string[];
}

export class ComprehensiveSyncManager {
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private eventListeners: Map<string, ((event: SyncEvent) => void)[]> = new Map();
  private syncInterval?: NodeJS.Timeout;
  private realTimeSubscriptions: Map<string, any> = new Map();

  constructor() {
    this.setupConnectionMonitoring();
    this.setupRealtimeSubscriptions();
    this.startPeriodicSync();
  }

  // Event management
  addEventListener(type: string, listener: (event: SyncEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: (event: SyncEvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(type: SyncEvent['type'], data?: any): void {
    const event: SyncEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  // Connection monitoring
  private setupConnectionMonitoring(): void {
    const handleConnectionChange = () => {
      const wasOnline = this.isOnline;
      this.isOnline = navigator.onLine;

      if (!wasOnline && this.isOnline) {
        console.log("Connection restored - triggering full sync");
        this.performFullSync();
      }
    };

    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);

    // Monitor connection quality for mobile
    if ("connection" in navigator) {
      (navigator as any).connection.addEventListener("change", () => {
        const connection = (navigator as any).connection;
        console.log(`Connection type: ${connection.effectiveType}, downlink: ${connection.downlink}`);
        
        // Adjust sync behavior based on connection quality
        if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") {
          this.setSyncMode("low-bandwidth");
        } else {
          this.setSyncMode("normal");
        }
      });
    }
  }

  private setSyncMode(mode: "normal" | "low-bandwidth"): void {
    if (mode === "low-bandwidth") {
      // Reduce sync frequency and batch sizes
      this.startPeriodicSync(300000); // 5 minutes instead of 1 minute
    } else {
      this.startPeriodicSync(60000); // Normal 1 minute interval
    }
  }

  // Real-time subscriptions
  private setupRealtimeSubscriptions(): void {
    if (!supabase) return;

    const tables = [
      "cleaning_forms",
      "employees", 
      "aircraft",
      "photo_evidence",
      "configurations"
    ];

    tables.forEach(table => {
      const subscription = supabase
        .channel(`${table}_changes`)
        .on("postgres_changes", 
          { event: "*", schema: "public", table },
          (payload) => this.handleRealtimeUpdate(table, payload)
        )
        .subscribe();

      this.realTimeSubscriptions.set(table, subscription);
    });
  }

  private async handleRealtimeUpdate(table: string, payload: any): Promise<void> {
    console.log(`Real-time update for ${table}:`, payload);

    const { eventType, new: newRecord, old: oldRecord } = payload;

    try {
      switch (eventType) {
        case "INSERT":
          await this.handleRemoteInsert(table, newRecord);
          break;
        case "UPDATE":
          await this.handleRemoteUpdate(table, newRecord, oldRecord);
          break;
        case "DELETE":
          await this.handleRemoteDelete(table, oldRecord);
          break;
      }
    } catch (error) {
      console.error(`Error handling real-time update for ${table}:`, error);
    }
  }

  private async handleRemoteInsert(table: string, record: any): Promise<void> {
    // Check if we have this record locally
    const localRecord = await this.getLocalRecord(table, record.id);
    
    if (!localRecord) {
      // New record from server, add to local storage
      await this.saveLocalRecord(table, record, "synced");
    } else if (localRecord._syncStatus === "error") {
      // Local record failed to sync, this might be the successful version
      await this.saveLocalRecord(table, record, "synced");
    }
    // If local record exists and is pending/synced, ignore (we likely created it)
  }

  private async handleRemoteUpdate(table: string, newRecord: any, oldRecord: any): Promise<void> {
    const localRecord = await this.getLocalRecord(table, newRecord.id);
    
    if (!localRecord) {
      // Record doesn't exist locally, add it
      await this.saveLocalRecord(table, newRecord, "synced");
      return;
    }

    // Check for conflicts
    if (localRecord._syncStatus === "pending") {
      // Local changes haven't been synced yet, potential conflict
      const hasConflict = this.detectConflict(localRecord, newRecord);
      
      if (hasConflict) {
        await this.createConflictResolution(table, newRecord.id, localRecord, newRecord);
        this.emitEvent("conflict_detected", {
          entityType: table,
          entityId: newRecord.id,
          localData: localRecord,
          remoteData: newRecord,
        });
      } else {
        // No conflict, update local record
        await this.saveLocalRecord(table, newRecord, "synced");
      }
    } else {
      // Local record is synced, safe to update
      await this.saveLocalRecord(table, newRecord, "synced");
    }
  }

  private async handleRemoteDelete(table: string, record: any): Promise<void> {
    // Remove from local storage if it exists
    await this.deleteLocalRecord(table, record.id);
  }

  private detectConflict(localRecord: any, remoteRecord: any): boolean {
    // Simple conflict detection based on timestamps and field changes
    const localModified = new Date(localRecord._lastModified);
    const remoteModified = new Date(remoteRecord.updated_at || remoteRecord.lastModified);
    
    // If remote was modified after local, check for field differences
    if (remoteModified > localModified) {
      return this.hasFieldDifferences(localRecord, remoteRecord);
    }
    
    return false;
  }

  private hasFieldDifferences(local: any, remote: any): boolean {
    // Compare key fields to detect conflicts
    const keyFields = ["name", "status", "data", "content", "form_data"];
    
    return keyFields.some(field => {
      if (field in local && field in remote) {
        return JSON.stringify(local[field]) !== JSON.stringify(remote[field]);
      }
      return false;
    });
  }

  private async createConflictResolution(
    table: string, 
    entityId: string, 
    localData: any, 
    remoteData: any
  ): Promise<void> {
    const conflictId = `${table}_${entityId}_${Date.now()}`;
    
    await offlineStorageService.db.conflicts.add({
      id: conflictId,
      entityType: table,
      localData,
      remoteData,
      conflictType: "update_conflict",
      timestamp: new Date().toISOString(),
      resolved: false,
    });
  }

  // Record management helpers
  private async getLocalRecord(table: string, id: string): Promise<any | null> {
    switch (table) {
      case "cleaning_forms":
        return await offlineStorageService.getCleaningForm(id);
      case "employees":
        const employees = await offlineStorageService.getAllEmployees();
        return employees.find(e => e.id === id) || null;
      case "aircraft":
        const aircraft = await offlineStorageService.getAllAircraft();
        return aircraft.find(a => a.id === id) || null;
      case "photo_evidence":
        const photos = await offlineStorageService.getAllPhotoEvidence();
        return photos.find(p => p.id === id) || null;
      case "configurations":
        const configs = await offlineStorageService.getAllConfigurations();
        return configs.find(c => c.id === id) || null;
      default:
        return null;
    }
  }

  private async saveLocalRecord(table: string, record: any, syncStatus: string): Promise<void> {
    // Mark record with sync status to avoid triggering sync operations
    const recordWithStatus = { ...record, _syncStatus: syncStatus };
    
    switch (table) {
      case "cleaning_forms":
        await offlineStorageService.saveCleaningForm(recordWithStatus);
        break;
      case "employees":
        await offlineStorageService.saveEmployee(recordWithStatus);
        break;
      case "aircraft":
        await offlineStorageService.saveAircraft(recordWithStatus);
        break;
      case "photo_evidence":
        await offlineStorageService.savePhotoEvidence(recordWithStatus);
        break;
      case "configurations":
        await offlineStorageService.saveConfiguration(recordWithStatus);
        break;
    }
  }

  private async deleteLocalRecord(table: string, id: string): Promise<void> {
    switch (table) {
      case "cleaning_forms":
        await offlineStorageService.deleteCleaningForm(id);
        break;
      // Add other entity types as needed
    }
  }

  // Main sync operations
  async performFullSync(): Promise<boolean> {
    if (this.syncInProgress || !this.isOnline) {
      console.log("Sync already in progress or offline");
      return false;
    }

    this.syncInProgress = true;
    this.emitEvent("sync_start");

    try {
      console.log("Starting comprehensive sync...");

      // Phase 1: Upload pending local changes
      this.emitEvent("sync_progress", { 
        current: 1, 
        total: 5, 
        phase: "uploading",
        currentEntity: "local_changes" 
      });

      await this.uploadPendingChanges();

      // Phase 2: Download remote changes
      this.emitEvent("sync_progress", { 
        current: 2, 
        total: 5, 
        phase: "downloading",
        currentEntity: "remote_changes" 
      });

      await this.downloadRemoteChanges();

      // Phase 3: Sync photos
      this.emitEvent("sync_progress", { 
        current: 3, 
        total: 5, 
        phase: "uploading",
        currentEntity: "photo_evidence" 
      });

      await this.syncPhotoEvidence();

      // Phase 4: Resolve any conflicts
      this.emitEvent("sync_progress", { 
        current: 4, 
        total: 5, 
        phase: "resolving",
        currentEntity: "conflicts" 
      });

      await this.resolveAutoResolvableConflicts();

      // Phase 5: Cleanup and finalize
      this.emitEvent("sync_progress", { 
        current: 5, 
        total: 5, 
        phase: "finalizing",
        currentEntity: "cleanup" 
      });

      await this.performCleanup();

      this.emitEvent("sync_complete", { success: true });
      console.log("Comprehensive sync completed successfully");
      return true;

    } catch (error) {
      console.error("Sync failed:", error);
      this.emitEvent("sync_error", { error: error instanceof Error ? error.message : "Unknown error" });
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async uploadPendingChanges(): Promise<void> {
    // Use the intelligent sync service for uploading
    await intelligentSyncService.forceSyncNow();
    
    // Also use the offline storage service
    await offlineStorageService.syncPendingOperations();
  }

  private async downloadRemoteChanges(): Promise<void> {
    if (!supabase) return;

    const tables = [
      { name: "cleaning_forms", localMethod: "getAllCleaningForms" },
      { name: "employees", localMethod: "getAllEmployees" },
      { name: "aircraft", localMethod: "getAllAircraft" },
      { name: "photo_evidence", localMethod: "getAllPhotoEvidence" },
      { name: "configurations", localMethod: "getAllConfigurations" },
    ];

    for (const table of tables) {
      try {
        // Get last sync timestamp
        const lastSync = await offlineStorageService.getMetadata(`last_sync_${table.name}`);
        const since = lastSync ? new Date(lastSync) : new Date(0);

        // Query for updates since last sync
        const { data, error } = await supabase
          .from(table.name)
          .select("*")
          .gte("updated_at", since.toISOString())
          .order("updated_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          console.log(`Downloaded ${data.length} records from ${table.name}`);
          
          // Process each record
          for (const record of data) {
            await this.handleRemoteUpdate(table.name, record, null);
          }
        }

        // Update last sync timestamp
        await offlineStorageService.setMetadata(
          `last_sync_${table.name}`, 
          new Date().toISOString(),
          "sync"
        );

      } catch (error) {
        console.error(`Error downloading from ${table.name}:`, error);
      }
    }
  }

  private async syncPhotoEvidence(): Promise<void> {
    try {
      await photoEvidenceService.processUploadQueue();
    } catch (error) {
      console.warn("Photo sync failed:", error);
    }
  }

  private async resolveAutoResolvableConflicts(): Promise<void> {
    const conflicts = await offlineStorageService.getConflicts();
    
    for (const conflict of conflicts) {
      // Auto-resolve simple conflicts using "last write wins" strategy
      if (this.canAutoResolve(conflict)) {
        const resolution = this.determineAutoResolution(conflict);
        await offlineStorageService.resolveConflict(conflict.id, resolution);
        console.log(`Auto-resolved conflict ${conflict.id} using ${resolution} data`);
      }
    }
  }

  private canAutoResolve(conflict: any): boolean {
    // Simple auto-resolution rules
    const localTime = new Date(conflict.localData._lastModified || conflict.localData.updated_at);
    const remoteTime = new Date(conflict.remoteData.updated_at);
    
    // If one is significantly newer (>1 hour), auto-resolve
    const timeDiff = Math.abs(localTime.getTime() - remoteTime.getTime());
    return timeDiff > 3600000; // 1 hour
  }

  private determineAutoResolution(conflict: any): "local" | "remote" {
    const localTime = new Date(conflict.localData._lastModified || conflict.localData.updated_at);
    const remoteTime = new Date(conflict.remoteData.updated_at);
    
    return localTime > remoteTime ? "local" : "remote";
  }

  private async performCleanup(): Promise<void> {
    await offlineStorageService.performMaintenance();
  }

  // Periodic sync
  private startPeriodicSync(interval: number = 60000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.performFullSync();
      }
    }, interval);
  }

  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  // Public API
  async manualSync(): Promise<boolean> {
    return await this.performFullSync();
  }

  async getSyncStatus(): Promise<{
    isOnline: boolean;
    syncInProgress: boolean;
    lastSync: string | null;
    stats: any;
    conflicts: number;
  }> {
    const stats = await offlineStorageService.getSyncStats();
    const conflicts = await offlineStorageService.getConflicts();
    const lastSync = await offlineStorageService.getMetadata("lastSync");

    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSync,
      stats,
      conflicts: conflicts.length,
    };
  }

  async getConflicts(): Promise<ConflictInfo[]> {
    const conflicts = await offlineStorageService.getConflicts();
    
    return conflicts.map(conflict => ({
      id: conflict.id,
      entityType: conflict.entityType,
      localData: conflict.localData,
      remoteData: conflict.remoteData,
      conflictFields: this.getConflictFields(conflict.localData, conflict.remoteData),
    }));
  }

  private getConflictFields(local: any, remote: any): string[] {
    const conflicts: string[] = [];
    const allFields = new Set([...Object.keys(local), ...Object.keys(remote)]);
    
    allFields.forEach(field => {
      if (field.startsWith("_")) return; // Skip internal fields
      
      if (JSON.stringify(local[field]) !== JSON.stringify(remote[field])) {
        conflicts.push(field);
      }
    });
    
    return conflicts;
  }

  async resolveConflict(conflictId: string, resolution: "local" | "remote"): Promise<void> {
    await offlineStorageService.resolveConflict(conflictId, resolution);
    
    // Trigger sync to apply resolution
    if (this.isOnline) {
      setTimeout(() => this.performFullSync(), 1000);
    }
  }

  // Cleanup
  destroy(): void {
    this.stopPeriodicSync();
    
    // Unsubscribe from real-time subscriptions
    this.realTimeSubscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.realTimeSubscriptions.clear();
    
    // Clear event listeners
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const comprehensiveSyncManager = new ComprehensiveSyncManager();

export type { SyncEvent, SyncProgress, ConflictInfo };
