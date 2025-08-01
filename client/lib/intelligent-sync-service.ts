import Dexie, { Table } from "dexie";
import { supabase } from "./supabase";
import { photoEvidenceService } from "./photo-evidence-service";

// Enhanced offline data interfaces
interface OfflineForm {
  id: string;
  code: string;
  data: any;
  lastModified: string;
  syncStatus: "pending" | "syncing" | "synced" | "error";
  lastSyncAttempt?: string;
  syncError?: string;
  retryCount: number;
  createdOffline: boolean;
}

interface OfflineEmployee {
  id: string;
  data: any;
  lastModified: string;
  syncStatus: "pending" | "syncing" | "synced" | "error";
  lastSyncAttempt?: string;
  syncError?: string;
  retryCount: number;
  isCached: boolean; // For cache vs local creation
}

interface OfflineAircraft {
  id: string;
  data: any;
  lastModified: string;
  syncStatus: "pending" | "syncing" | "synced" | "error";
  lastSyncAttempt?: string;
  syncError?: string;
  retryCount: number;
  isCached: boolean;
}

interface SyncOperation {
  id?: number;
  type: "create" | "update" | "delete";
  entity: "form" | "employee" | "aircraft" | "photo";
  entityId: string;
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
  priority: "low" | "normal" | "high";
}

interface SyncLog {
  id?: number;
  timestamp: string;
  type: "success" | "error" | "info";
  entity: string;
  entityId: string;
  operation: string;
  message: string;
  details?: any;
}

interface ConnectionStatus {
  isOnline: boolean;
  lastOnline?: string;
  lastOffline?: string;
  connectionType?: string;
  effectiveType?: string;
}

interface SyncStats {
  totalItems: number;
  syncedItems: number;
  pendingItems: number;
  errorItems: number;
  lastSync?: string;
  isOnline: boolean;
  syncInProgress: boolean;
}

class IntelligentSyncDatabase extends Dexie {
  forms!: Table<OfflineForm>;
  employees!: Table<OfflineEmployee>;
  aircraft!: Table<OfflineAircraft>;
  photoEvidence!: Table<any>;
  interventionTypes!: Table<any>;
  shiftConfigs!: Table<any>;
  locationConfigs!: Table<any>;
  notifications!: Table<any>;
  qrCodes!: Table<any>;
  tasks!: Table<any>;
  flightSheets!: Table<any>;
  syncOperations!: Table<SyncOperation>;
  syncLogs!: Table<SyncLog>;
  metadata!: Table<{ key: string; value: any; timestamp: string }>;

  constructor() {
    super("IntelligentSyncDB");

    this.version(2).stores({
      forms: "id, syncStatus, lastModified, retryCount, createdOffline",
      employees: "id, syncStatus, lastModified, retryCount, isCached",
      aircraft: "id, syncStatus, lastModified, retryCount, isCached",
      photoEvidence: "id, form_id, type, category, timestamp, syncStatus",
      interventionTypes: "id, name, is_active, order, syncStatus",
      shiftConfigs: "id, name, is_active, order, syncStatus",
      locationConfigs: "id, name, is_active, order, syncStatus",
      notifications: "id, user_id, read_at, type, priority, syncStatus",
      qrCodes: "id, entity_type, entity_id, qr_code, is_active, syncStatus",
      tasks: "id, assigned_to, aircraft_id, status, due_date, syncStatus",
      flightSheets: "id, aircraft_id, flight_number, status, syncStatus",
      syncOperations:
        "++id, type, entity, entityId, timestamp, retryCount, priority",
      syncLogs: "++id, timestamp, type, entity, entityId",
      metadata: "key, timestamp",
    });
  }
}

class IntelligentSyncService {
  private db: IntelligentSyncDatabase;
  private connectionStatus: ConnectionStatus;
  private syncInProgress = false;
  private autoSyncInterval?: NodeJS.Timeout;
  private retryTimeout?: NodeJS.Timeout;
  private observers: ((stats: SyncStats) => void)[] = [];

  constructor() {
    this.db = new IntelligentSyncDatabase();
    this.connectionStatus = {
      isOnline: navigator.onLine,
      connectionType: this.getConnectionType(),
      effectiveType: this.getEffectiveType(),
    };

    this.setupConnectionMonitoring();
    this.setupAutoSync();
    this.initializeMetadata();
  }

  private getConnectionType(): string {
    // @ts-ignore
    return navigator.connection?.type || "unknown";
  }

  private getEffectiveType(): string {
    // @ts-ignore
    return navigator.connection?.effectiveType || "unknown";
  }

  private setupConnectionMonitoring() {
    const updateOnlineStatus = () => {
      const wasOnline = this.connectionStatus.isOnline;
      this.connectionStatus.isOnline = navigator.onLine;
      this.connectionStatus.connectionType = this.getConnectionType();
      this.connectionStatus.effectiveType = this.getEffectiveType();

      if (!wasOnline && navigator.onLine) {
        this.connectionStatus.lastOnline = new Date().toISOString();
        this.onComeOnline();
      } else if (wasOnline && !navigator.onLine) {
        this.connectionStatus.lastOffline = new Date().toISOString();
        this.onGoOffline();
      }

      this.notifyObservers();
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Monitor connection quality changes
    // @ts-ignore
    if (navigator.connection) {
      // @ts-ignore
      navigator.connection.addEventListener("change", updateOnlineStatus);
    }
  }

  private async initializeMetadata() {
    await this.setMetadata("initialized", true);
    await this.setMetadata("version", "1.0.0");
  }

  private setupAutoSync() {
    // Sync every 30 seconds when online and there are pending operations
    this.autoSyncInterval = setInterval(async () => {
      if (this.connectionStatus.isOnline && !this.syncInProgress) {
        const pendingCount = await this.getPendingOperationsCount();
        if (pendingCount > 0) {
          await this.performSync();
        }
      }
    }, 30000);
  }

  private async onComeOnline() {
    await this.logSync(
      "info",
      "connection",
      "system",
      "came-online",
      "Application came online",
    );

    // Wait a moment for connection to stabilize
    setTimeout(() => {
      this.performSync();
    }, 1000);
  }

  private async onGoOffline() {
    await this.logSync(
      "info",
      "connection",
      "system",
      "went-offline",
      "Application went offline",
    );
  }

  // Forms Management
  async saveForm(formData: any): Promise<string> {
    const id = formData.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const offlineForm: OfflineForm = {
      id,
      code: formData.code || `OFFLINE-${Date.now()}`,
      data: formData,
      lastModified: now,
      syncStatus: "pending",
      retryCount: 0,
      createdOffline: !navigator.onLine,
    };

    await this.db.forms.put(offlineForm);
    await this.addSyncOperation("create", "form", id, formData, "high");

    await this.logSync("info", "form", id, "saved", "Form saved locally");

    if (navigator.onLine) {
      setTimeout(() => this.performSync(), 100);
    }

    this.notifyObservers();
    return id;
  }

  async updateForm(id: string, formData: any): Promise<void> {
    const existing = await this.db.forms.get(id);
    if (!existing) {
      throw new Error("Form not found");
    }

    const now = new Date().toISOString();
    const updated: OfflineForm = {
      ...existing,
      data: { ...existing.data, ...formData },
      lastModified: now,
      syncStatus: "pending",
      retryCount: 0,
    };

    await this.db.forms.put(updated);
    await this.addSyncOperation("update", "form", id, updated.data, "high");

    await this.logSync("info", "form", id, "updated", "Form updated locally");

    if (navigator.onLine) {
      setTimeout(() => this.performSync(), 100);
    }

    this.notifyObservers();
  }

  async deleteForm(id: string): Promise<void> {
    await this.db.forms.delete(id);
    await this.addSyncOperation("delete", "form", id, null, "normal");

    await this.logSync(
      "info",
      "form",
      id,
      "deleted",
      "Form marked for deletion",
    );

    if (navigator.onLine) {
      setTimeout(() => this.performSync(), 100);
    }

    this.notifyObservers();
  }

  async getForm(id: string): Promise<any | null> {
    const form = await this.db.forms.get(id);
    return form?.data || null;
  }

  async getAllForms(): Promise<any[]> {
    const forms = await this.db.forms.toArray();
    return forms.map((f) => ({
      ...f.data,
      _syncStatus: f.syncStatus,
      _lastModified: f.lastModified,
      _createdOffline: f.createdOffline,
    }));
  }

  // Employees Cache Management
  async cacheEmployees(employees: any[]): Promise<void> {
    const now = new Date().toISOString();

    for (const employee of employees) {
      const offlineEmployee: OfflineEmployee = {
        id: employee.id,
        data: employee,
        lastModified: now,
        syncStatus: "synced",
        retryCount: 0,
        isCached: true,
      };

      await this.db.employees.put(offlineEmployee);
    }

    await this.setMetadata("employeesLastCached", now);
    await this.logSync(
      "info",
      "employees",
      "cache",
      "cached",
      `Cached ${employees.length} employees`,
    );
  }

  async saveEmployee(employeeData: any): Promise<string> {
    const id = employeeData.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const offlineEmployee: OfflineEmployee = {
      id,
      data: employeeData,
      lastModified: now,
      syncStatus: "pending",
      retryCount: 0,
      isCached: false,
    };

    await this.db.employees.put(offlineEmployee);
    await this.addSyncOperation(
      "create",
      "employee",
      id,
      employeeData,
      "normal",
    );

    await this.logSync(
      "info",
      "employee",
      id,
      "saved",
      "Employee saved locally",
    );

    if (navigator.onLine) {
      setTimeout(() => this.performSync(), 100);
    }

    this.notifyObservers();
    return id;
  }

  async getAllEmployees(): Promise<any[]> {
    const employees = await this.db.employees.toArray();
    return employees.map((e) => ({
      ...e.data,
      _syncStatus: e.syncStatus,
      _isCached: e.isCached,
    }));
  }

  // Aircraft Cache Management
  async cacheAircraft(aircraft: any[]): Promise<void> {
    const now = new Date().toISOString();

    for (const plane of aircraft) {
      const offlineAircraft: OfflineAircraft = {
        id: plane.id,
        data: plane,
        lastModified: now,
        syncStatus: "synced",
        retryCount: 0,
        isCached: true,
      };

      await this.db.aircraft.put(offlineAircraft);
    }

    await this.setMetadata("aircraftLastCached", now);
    await this.logSync(
      "info",
      "aircraft",
      "cache",
      "cached",
      `Cached ${aircraft.length} aircraft`,
    );
  }

  async saveAircraft(aircraftData: any): Promise<string> {
    const id = aircraftData.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const offlineAircraft: OfflineAircraft = {
      id,
      data: aircraftData,
      lastModified: now,
      syncStatus: "pending",
      retryCount: 0,
      isCached: false,
    };

    await this.db.aircraft.put(offlineAircraft);
    await this.addSyncOperation(
      "create",
      "aircraft",
      id,
      aircraftData,
      "normal",
    );

    await this.logSync(
      "info",
      "aircraft",
      id,
      "saved",
      "Aircraft saved locally",
    );

    if (navigator.onLine) {
      setTimeout(() => this.performSync(), 100);
    }

    this.notifyObservers();
    return id;
  }

  async getAllAircraft(): Promise<any[]> {
    const aircraft = await this.db.aircraft.toArray();
    return aircraft.map((a) => ({
      ...a.data,
      _syncStatus: a.syncStatus,
      _isCached: a.isCached,
    }));
  }

  // Sync Operations
  private async addSyncOperation(
    type: "create" | "update" | "delete",
    entity:
      | "form"
      | "employee"
      | "aircraft"
      | "photo"
      | "intervention_type"
      | "shift_config"
      | "location_config"
      | "notification"
      | "qr_code"
      | "task"
      | "flight_sheet",
    entityId: string,
    data: any,
    priority: "low" | "normal" | "high" = "normal",
  ): Promise<void> {
    const operation: SyncOperation = {
      type,
      entity,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      priority,
    };

    await this.db.syncOperations.add(operation);
  }

  private async getPendingOperationsCount(): Promise<number> {
    return await this.db.syncOperations.where("retryCount").below(3).count();
  }

  async performSync(): Promise<boolean> {
    if (this.syncInProgress || !navigator.onLine) {
      return false;
    }

    this.syncInProgress = true;
    let successCount = 0;
    let errorCount = 0;

    try {
      await this.logSync(
        "info",
        "sync",
        "system",
        "started",
        "Sync operation started",
      );

      // Get pending operations sorted by priority and timestamp
      const operations = await this.db.syncOperations
        .where("retryCount")
        .below(3)
        .toArray();

      // Sort by priority (high first) then by timestamp
      operations.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return (
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      for (const operation of operations) {
        try {
          await this.syncSingleOperation(operation);
          successCount++;

          // Remove successful operation from queue
          await this.db.syncOperations.delete(operation.id!);
        } catch (error) {
          errorCount++;
          console.error("Sync operation failed:", operation, error);

          // Update retry count and error message
          operation.retryCount++;
          operation.lastError =
            error instanceof Error ? error.message : "Unknown error";

          if (operation.retryCount >= 3) {
            // Mark entity as error status and remove from queue
            await this.markEntityAsError(
              operation.entity,
              operation.entityId,
              operation.lastError,
            );
            await this.db.syncOperations.delete(operation.id!);

            await this.logSync(
              "error",
              operation.entity,
              operation.entityId,
              "sync-failed",
              `Failed to sync after 3 attempts: ${operation.lastError}`,
            );
          } else {
            // Keep in queue for retry
            await this.db.syncOperations.put(operation);

            await this.logSync(
              "error",
              operation.entity,
              operation.entityId,
              "sync-retry",
              `Sync attempt ${operation.retryCount} failed: ${operation.lastError}`,
            );
          }
        }
      }

      // Sync photos
      await this.syncPhotos();

      // Update last sync timestamp
      await this.setMetadata("lastSync", new Date().toISOString());

      await this.logSync(
        "success",
        "sync",
        "system",
        "completed",
        `Sync completed: ${successCount} success, ${errorCount} errors`,
      );

      this.notifyObservers();
      return true;
    } catch (error) {
      console.error("Sync operation failed:", error);
      await this.logSync(
        "error",
        "sync",
        "system",
        "failed",
        `Sync operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncSingleOperation(operation: SyncOperation): Promise<void> {
    if (!supabase) {
      throw new Error("Supabase not configured");
    }

    const { type, entity, entityId, data } = operation;

    switch (entity) {
      case "form":
        await this.syncFormOperation(type, entityId, data);
        break;
      case "employee":
        await this.syncEmployeeOperation(type, entityId, data);
        break;
      case "aircraft":
        await this.syncAircraftOperation(type, entityId, data);
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  private async syncFormOperation(
    type: string,
    entityId: string,
    data: any,
  ): Promise<void> {
    switch (type) {
      case "create":
        const { error: createError } = await supabase
          .from("cleaning_forms")
          .insert(data);
        if (createError) throw createError;
        break;

      case "update":
        const { error: updateError } = await supabase
          .from("cleaning_forms")
          .update(data)
          .eq("id", entityId);
        if (updateError) throw updateError;
        break;

      case "delete":
        const { error: deleteError } = await supabase
          .from("cleaning_forms")
          .delete()
          .eq("id", entityId);
        if (deleteError) throw deleteError;
        break;
    }

    // Update local sync status
    const form = await this.db.forms.get(entityId);
    if (form) {
      form.syncStatus = "synced";
      form.lastSyncAttempt = new Date().toISOString();
      delete form.syncError;
      await this.db.forms.put(form);
    }
  }

  private async syncEmployeeOperation(
    type: string,
    entityId: string,
    data: any,
  ): Promise<void> {
    switch (type) {
      case "create":
        const { error: createError } = await supabase
          .from("employees")
          .insert(data);
        if (createError) throw createError;
        break;

      case "update":
        const { error: updateError } = await supabase
          .from("employees")
          .update(data)
          .eq("id", entityId);
        if (updateError) throw updateError;
        break;

      case "delete":
        const { error: deleteError } = await supabase
          .from("employees")
          .delete()
          .eq("id", entityId);
        if (deleteError) throw deleteError;
        break;
    }

    // Update local sync status
    const employee = await this.db.employees.get(entityId);
    if (employee) {
      employee.syncStatus = "synced";
      employee.lastSyncAttempt = new Date().toISOString();
      delete employee.syncError;
      await this.db.employees.put(employee);
    }
  }

  private async syncAircraftOperation(
    type: string,
    entityId: string,
    data: any,
  ): Promise<void> {
    switch (type) {
      case "create":
        const { error: createError } = await supabase
          .from("aircraft")
          .insert(data);
        if (createError) throw createError;
        break;

      case "update":
        const { error: updateError } = await supabase
          .from("aircraft")
          .update(data)
          .eq("id", entityId);
        if (updateError) throw updateError;
        break;

      case "delete":
        const { error: deleteError } = await supabase
          .from("aircraft")
          .delete()
          .eq("id", entityId);
        if (deleteError) throw deleteError;
        break;
    }

    // Update local sync status
    const aircraft = await this.db.aircraft.get(entityId);
    if (aircraft) {
      aircraft.syncStatus = "synced";
      aircraft.lastSyncAttempt = new Date().toISOString();
      delete aircraft.syncError;
      await this.db.aircraft.put(aircraft);
    }
  }

  private async syncPhotos(): Promise<void> {
    try {
      await photoEvidenceService.processUploadQueue();
    } catch (error) {
      console.warn("Photo sync failed:", error);
    }
  }

  private async markEntityAsError(
    entity: string,
    entityId: string,
    error: string,
  ): Promise<void> {
    const now = new Date().toISOString();

    switch (entity) {
      case "form":
        const form = await this.db.forms.get(entityId);
        if (form) {
          form.syncStatus = "error";
          form.syncError = error;
          form.lastSyncAttempt = now;
          await this.db.forms.put(form);
        }
        break;

      case "employee":
        const employee = await this.db.employees.get(entityId);
        if (employee) {
          employee.syncStatus = "error";
          employee.syncError = error;
          employee.lastSyncAttempt = now;
          await this.db.employees.put(employee);
        }
        break;

      case "aircraft":
        const aircraft = await this.db.aircraft.get(entityId);
        if (aircraft) {
          aircraft.syncStatus = "error";
          aircraft.syncError = error;
          aircraft.lastSyncAttempt = now;
          await this.db.aircraft.put(aircraft);
        }
        break;
    }
  }

  // Sync Status and Statistics
  async getSyncStats(): Promise<SyncStats> {
    const [
      forms,
      employees,
      aircraft,
      photos,
      interventions,
      shifts,
      locations,
      notifications,
      qrCodes,
      tasks,
      flightSheets,
      pendingOps,
    ] = await Promise.all([
      this.db.forms.toArray(),
      this.db.employees.toArray(),
      this.db.aircraft.toArray(),
      this.db.photoEvidence.toArray(),
      this.db.interventionTypes.toArray(),
      this.db.shiftConfigs.toArray(),
      this.db.locationConfigs.toArray(),
      this.db.notifications.toArray(),
      this.db.qrCodes.toArray(),
      this.db.tasks.toArray(),
      this.db.flightSheets.toArray(),
      this.db.syncOperations.toArray(),
    ]);

    const allItems = [
      ...forms,
      ...employees,
      ...aircraft,
      ...photos,
      ...interventions,
      ...shifts,
      ...locations,
      ...notifications,
      ...qrCodes,
      ...tasks,
      ...flightSheets,
    ];
    const totalItems = allItems.length;
    const syncedItems = allItems.filter(
      (item) => item.syncStatus === "synced",
    ).length;
    const pendingItems =
      allItems.filter((item) => item.syncStatus === "pending").length +
      pendingOps.length;
    const errorItems = allItems.filter(
      (item) => item.syncStatus === "error",
    ).length;

    const lastSync = await this.getMetadata("lastSync");

    return {
      totalItems,
      syncedItems,
      pendingItems,
      errorItems,
      lastSync: lastSync?.value,
      isOnline: this.connectionStatus.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    return { ...this.connectionStatus };
  }

  // Logs Management
  private async logSync(
    type: "success" | "error" | "info",
    entity: string,
    entityId: string,
    operation: string,
    message: string,
    details?: any,
  ): Promise<void> {
    const log: SyncLog = {
      timestamp: new Date().toISOString(),
      type,
      entity,
      entityId,
      operation,
      message,
      details,
    };

    await this.db.syncLogs.add(log);

    // Keep only last 1000 logs
    const logCount = await this.db.syncLogs.count();
    if (logCount > 1000) {
      const oldestLogs = await this.db.syncLogs
        .orderBy("timestamp")
        .limit(logCount - 1000)
        .toArray();
      const idsToDelete = oldestLogs.map((log) => log.id!);
      await this.db.syncLogs.bulkDelete(idsToDelete);
    }
  }

  async getSyncLogs(limit: number = 100): Promise<SyncLog[]> {
    return await this.db.syncLogs
      .orderBy("timestamp")
      .reverse()
      .limit(limit)
      .toArray();
  }

  async clearSyncLogs(): Promise<void> {
    await this.db.syncLogs.clear();
  }

  // Metadata Management
  private async setMetadata(key: string, value: any): Promise<void> {
    await this.db.metadata.put({
      key,
      value,
      timestamp: new Date().toISOString(),
    });
  }

  private async getMetadata(
    key: string,
  ): Promise<{ value: any; timestamp: string } | null> {
    const result = await this.db.metadata.get(key);
    return result ? { value: result.value, timestamp: result.timestamp } : null;
  }

  // Observer Pattern for UI Updates
  subscribe(observer: (stats: SyncStats) => void): () => void {
    this.observers.push(observer);

    // Send initial stats
    this.getSyncStats().then(observer);

    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers(): void {
    this.getSyncStats().then((stats) => {
      this.observers.forEach((observer) => observer(stats));
    });
  }

  // Manual sync trigger
  async forceSyncNow(): Promise<boolean> {
    if (!this.connectionStatus.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    return await this.performSync();
  }

  // Retry failed operations
  async retryFailedOperations(): Promise<void> {
    // Reset retry count for failed operations
    const failedOps = await this.db.syncOperations
      .where("retryCount")
      .aboveOrEqual(3)
      .toArray();

    for (const op of failedOps) {
      op.retryCount = 0;
      delete op.lastError;
      await this.db.syncOperations.put(op);
    }

    // Reset error status for entities
    const [errorForms, errorEmployees, errorAircraft] = await Promise.all([
      this.db.forms.where("syncStatus").equals("error").toArray(),
      this.db.employees.where("syncStatus").equals("error").toArray(),
      this.db.aircraft.where("syncStatus").equals("error").toArray(),
    ]);

    for (const form of errorForms) {
      form.syncStatus = "pending";
      form.retryCount = 0;
      delete form.syncError;
      await this.db.forms.put(form);
    }

    for (const employee of errorEmployees) {
      employee.syncStatus = "pending";
      employee.retryCount = 0;
      delete employee.syncError;
      await this.db.employees.put(employee);
    }

    for (const aircraft of errorAircraft) {
      aircraft.syncStatus = "pending";
      aircraft.retryCount = 0;
      delete aircraft.syncError;
      await this.db.aircraft.put(aircraft);
    }

    await this.logSync(
      "info",
      "sync",
      "system",
      "retry-reset",
      "Reset all failed operations for retry",
    );

    if (this.connectionStatus.isOnline) {
      setTimeout(() => this.performSync(), 1000);
    }

    this.notifyObservers();
  }

  // Clear all offline data
  async clearAllOfflineData(): Promise<void> {
    await Promise.all([
      this.db.forms.clear(),
      this.db.employees.clear(),
      this.db.aircraft.clear(),
      this.db.photoEvidence.clear(),
      this.db.interventionTypes.clear(),
      this.db.shiftConfigs.clear(),
      this.db.locationConfigs.clear(),
      this.db.notifications.clear(),
      this.db.qrCodes.clear(),
      this.db.tasks.clear(),
      this.db.flightSheets.clear(),
      this.db.syncOperations.clear(),
      this.db.syncLogs.clear(),
      this.db.metadata.clear(),
    ]);

    await this.initializeMetadata();
    await this.logSync(
      "info",
      "system",
      "all",
      "cleared",
      "All offline data cleared",
    );
    this.notifyObservers();
  }

  // Start background sync processes
  startBackgroundSync(): void {
    // Start auto-sync if not already running
    if (!this.autoSyncInterval && this.connectionStatus.isOnline) {
      this.autoSyncInterval = setInterval(() => {
        this.performSync();
      }, this.syncInterval);
    }
  }

  // Stop background sync processes
  stopBackgroundSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  // Cleanup and destroy
  destroy(): void {
    this.stopBackgroundSync();

    window.removeEventListener("online", this.onComeOnline);
    window.removeEventListener("offline", this.onGoOffline);

    this.db.close();
  }
}

// Export singleton instance
export const intelligentSyncService = new IntelligentSyncService();

// Auto-initialize and setup
export const setupIntelligentSync = () => {
  // Start any background processes if needed
  intelligentSyncService.startBackgroundSync();

  return {
    destroy: () => {
      // Clean up any background processes
      intelligentSyncService.stopBackgroundSync();
    },
  };
};

export type { SyncStats, ConnectionStatus, SyncLog };
