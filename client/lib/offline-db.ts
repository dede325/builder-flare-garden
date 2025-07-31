import Dexie, { Table } from 'dexie';
import { Aircraft, Employee, Task, FlightSheet } from './supabase';

// Offline database tables
interface OfflineAircraft extends Aircraft {
  synced: boolean;
  lastModified: Date;
}

interface OfflineEmployee extends Employee {
  synced: boolean;
  lastModified: Date;
}

interface OfflineTask extends Task {
  synced: boolean;
  lastModified: Date;
}

interface OfflineFlightSheet extends FlightSheet {
  synced: boolean;
  lastModified: Date;
}

interface SyncQueue {
  id?: number;
  table: string;
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
}

class OfflineDatabase extends Dexie {
  aircraft!: Table<OfflineAircraft>;
  employees!: Table<OfflineEmployee>;
  tasks!: Table<OfflineTask>;
  flightSheets!: Table<OfflineFlightSheet>;
  syncQueue!: Table<SyncQueue>;

  constructor() {
    super('AviationOpsDB');
    
    this.version(1).stores({
      aircraft: 'id, registration, model, manufacturer, status, synced, lastModified',
      employees: 'id, name, email, role, status, synced, lastModified',
      tasks: 'id, title, assigned_to, aircraft_id, priority, status, due_date, synced, lastModified',
      flightSheets: 'id, flight_number, aircraft_id, pilot_id, departure_time, status, synced, lastModified',
      syncQueue: '++id, table, recordId, operation, timestamp'
    });
  }
}

export const offlineDb = new OfflineDatabase();

// Offline-first data operations
export const offlineService = {
  // Aircraft operations
  aircraft: {
    getAll: () => offlineDb.aircraft.orderBy('registration').toArray(),
    
    create: async (aircraft: Omit<Aircraft, 'id' | 'created_at' | 'updated_at'>) => {
      const id = crypto.randomUUID();
      const now = new Date();
      const record: OfflineAircraft = {
        ...aircraft,
        id,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        synced: false,
        lastModified: now
      };
      
      await offlineDb.aircraft.add(record);
      await addToSyncQueue('aircraft', id, 'create', record);
      return record;
    },
    
    update: async (id: string, updates: Partial<Aircraft>) => {
      const now = new Date();
      const updatedRecord = {
        ...updates,
        updated_at: now.toISOString(),
        synced: false,
        lastModified: now
      };
      
      await offlineDb.aircraft.update(id, updatedRecord);
      await addToSyncQueue('aircraft', id, 'update', updatedRecord);
      return updatedRecord;
    },
    
    delete: async (id: string) => {
      await offlineDb.aircraft.delete(id);
      await addToSyncQueue('aircraft', id, 'delete', { id });
    }
  },

  // Employee operations
  employees: {
    getAll: () => offlineDb.employees.orderBy('name').toArray(),
    
    create: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
      const id = crypto.randomUUID();
      const now = new Date();
      const record: OfflineEmployee = {
        ...employee,
        id,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        synced: false,
        lastModified: now
      };
      
      await offlineDb.employees.add(record);
      await addToSyncQueue('employees', id, 'create', record);
      return record;
    },
    
    update: async (id: string, updates: Partial<Employee>) => {
      const now = new Date();
      const updatedRecord = {
        ...updates,
        updated_at: now.toISOString(),
        synced: false,
        lastModified: now
      };
      
      await offlineDb.employees.update(id, updatedRecord);
      await addToSyncQueue('employees', id, 'update', updatedRecord);
      return updatedRecord;
    },
    
    delete: async (id: string) => {
      await offlineDb.employees.delete(id);
      await addToSyncQueue('employees', id, 'delete', { id });
    }
  },

  // Task operations
  tasks: {
    getAll: () => offlineDb.tasks.orderBy('created_at').reverse().toArray(),
    
    create: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      const id = crypto.randomUUID();
      const now = new Date();
      const record: OfflineTask = {
        ...task,
        id,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        synced: false,
        lastModified: now
      };
      
      await offlineDb.tasks.add(record);
      await addToSyncQueue('tasks', id, 'create', record);
      return record;
    },
    
    update: async (id: string, updates: Partial<Task>) => {
      const now = new Date();
      const updatedRecord = {
        ...updates,
        updated_at: now.toISOString(),
        synced: false,
        lastModified: now
      };
      
      await offlineDb.tasks.update(id, updatedRecord);
      await addToSyncQueue('tasks', id, 'update', updatedRecord);
      return updatedRecord;
    },
    
    delete: async (id: string) => {
      await offlineDb.tasks.delete(id);
      await addToSyncQueue('tasks', id, 'delete', { id });
    }
  },

  // Flight sheet operations
  flightSheets: {
    getAll: () => offlineDb.flightSheets.orderBy('departure_time').reverse().toArray(),
    
    create: async (sheet: Omit<FlightSheet, 'id' | 'created_at' | 'updated_at'>) => {
      const id = crypto.randomUUID();
      const now = new Date();
      const record: OfflineFlightSheet = {
        ...sheet,
        id,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        synced: false,
        lastModified: now
      };
      
      await offlineDb.flightSheets.add(record);
      await addToSyncQueue('flight_sheets', id, 'create', record);
      return record;
    },
    
    update: async (id: string, updates: Partial<FlightSheet>) => {
      const now = new Date();
      const updatedRecord = {
        ...updates,
        updated_at: now.toISOString(),
        synced: false,
        lastModified: now
      };
      
      await offlineDb.flightSheets.update(id, updatedRecord);
      await addToSyncQueue('flight_sheets', id, 'update', updatedRecord);
      return updatedRecord;
    },
    
    delete: async (id: string) => {
      await offlineDb.flightSheets.delete(id);
      await addToSyncQueue('flight_sheets', id, 'delete', { id });
    }
  }
};

// Sync queue management
const addToSyncQueue = async (
  table: string,
  recordId: string,
  operation: 'create' | 'update' | 'delete',
  data: any
) => {
  await offlineDb.syncQueue.add({
    table,
    recordId,
    operation,
    data,
    timestamp: new Date()
  });
};

// Sync with Supabase when online
export const syncService = {
  async syncToServer() {
    const pendingOperations = await offlineDb.syncQueue.orderBy('timestamp').toArray();
    
    for (const operation of pendingOperations) {
      try {
        // Here you would implement the actual sync with Supabase
        // For now, we'll just mark as synced
        console.log(`Syncing ${operation.operation} on ${operation.table}:${operation.recordId}`);
        
        // Remove from sync queue after successful sync
        await offlineDb.syncQueue.delete(operation.id!);
        
        // Mark record as synced
        const table = offlineDb[operation.table as keyof OfflineDatabase] as Table<any>;
        if (operation.operation !== 'delete') {
          await table.update(operation.recordId, { synced: true });
        }
      } catch (error) {
        console.error('Sync failed for operation:', operation, error);
        // Keep in queue for retry
      }
    }
  },

  async syncFromServer() {
    // Here you would fetch latest data from Supabase and update local DB
    console.log('Syncing from server...');
    // Implementation would depend on your sync strategy
    // (last-modified timestamps, version numbers, etc.)
  },

  async fullSync() {
    await this.syncToServer();
    await this.syncFromServer();
  },

  getPendingSyncCount: async () => {
    return await offlineDb.syncQueue.count();
  }
};

// Auto-sync when coming online
export const setupAutoSync = () => {
  const handleOnline = () => {
    console.log('App came online, starting sync...');
    syncService.fullSync();
  };

  window.addEventListener('online', handleOnline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
  };
};
