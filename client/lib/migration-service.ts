/**
 * Migration Service
 * Migrates offline data to Supabase when it becomes available
 */

import { supabase } from './supabase';
import { offlineService, offlineDb } from './offline-db';

interface MigrationResult {
  success: boolean;
  message: string;
  details?: {
    aircraft: number;
    employees: number;
    tasks: number;
    flightSheets: number;
    total: number;
    errors: string[];
  };
}

interface MigrationProgress {
  current: number;
  total: number;
  table: string;
  status: 'migrating' | 'completed' | 'error';
}

class MigrationService {
  private onProgress?: (progress: MigrationProgress) => void;

  /**
   * Set progress callback
   */
  setProgressCallback(callback: (progress: MigrationProgress) => void) {
    this.onProgress = callback;
  }

  /**
   * Check if Supabase is properly configured
   */
  async isSupabaseConfigured(): Promise<boolean> {
    try {
      if (!supabase) return false;
      
      // Test connection with a simple query
      const { error } = await supabase.from('aircraft').select('id').limit(1);
      return !error;
    } catch (error) {
      console.warn('Supabase not configured or not accessible:', error);
      return false;
    }
  }

  /**
   * Get offline data counts
   */
  async getOfflineDataCounts() {
    const [aircraft, employees, tasks, flightSheets] = await Promise.all([
      offlineService.aircraft.getAll(),
      offlineService.employees.getAll(),
      offlineService.tasks.getAll(),
      offlineService.flightSheets.getAll()
    ]);

    return {
      aircraft: aircraft.length,
      employees: employees.length,
      tasks: tasks.length,
      flightSheets: flightSheets.length,
      total: aircraft.length + employees.length + tasks.length + flightSheets.length
    };
  }

  /**
   * Migrate all offline data to Supabase
   */
  async migrateAllData(): Promise<MigrationResult> {
    const isConfigured = await this.isSupabaseConfigured();
    
    if (!isConfigured) {
      return {
        success: false,
        message: 'Supabase não está configurado ou não é acessível. Verifique as variáveis de ambiente.'
      };
    }

    const errors: string[] = [];
    let totalMigrated = 0;

    try {
      // Get offline data
      const [aircraft, employees, tasks, flightSheets] = await Promise.all([
        offlineService.aircraft.getAll(),
        offlineService.employees.getAll(),
        offlineService.tasks.getAll(),
        offlineService.flightSheets.getAll()
      ]);

      const totalRecords = aircraft.length + employees.length + tasks.length + flightSheets.length;
      let currentRecord = 0;

      // Migrate aircraft
      this.reportProgress(currentRecord, totalRecords, 'aircraft', 'migrating');
      const aircraftResult = await this.migrateAircraft(aircraft);
      totalMigrated += aircraftResult.migrated;
      errors.push(...aircraftResult.errors);
      currentRecord += aircraft.length;

      // Migrate employees
      this.reportProgress(currentRecord, totalRecords, 'employees', 'migrating');
      const employeesResult = await this.migrateEmployees(employees);
      totalMigrated += employeesResult.migrated;
      errors.push(...employeesResult.errors);
      currentRecord += employees.length;

      // Migrate tasks
      this.reportProgress(currentRecord, totalRecords, 'tasks', 'migrating');
      const tasksResult = await this.migrateTasks(tasks);
      totalMigrated += tasksResult.migrated;
      errors.push(...tasksResult.errors);
      currentRecord += tasks.length;

      // Migrate flight sheets
      this.reportProgress(currentRecord, totalRecords, 'flight_sheets', 'migrating');
      const flightSheetsResult = await this.migrateFlightSheets(flightSheets);
      totalMigrated += flightSheetsResult.migrated;
      errors.push(...flightSheetsResult.errors);

      this.reportProgress(totalRecords, totalRecords, 'completed', 'completed');

      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Migração concluída com sucesso! ${totalMigrated} registros migrados.`
          : `Migração parcialmente concluída. ${totalMigrated} registros migrados com ${errors.length} erros.`,
        details: {
          aircraft: aircraftResult.migrated,
          employees: employeesResult.migrated,
          tasks: tasksResult.migrated,
          flightSheets: flightSheetsResult.migrated,
          total: totalMigrated,
          errors
        }
      };

    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        message: `Erro na migração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        details: {
          aircraft: 0,
          employees: 0,
          tasks: 0,
          flightSheets: 0,
          total: 0,
          errors: [error instanceof Error ? error.message : 'Erro desconhecido']
        }
      };
    }
  }

  /**
   * Migrate aircraft data
   */
  private async migrateAircraft(aircraft: any[]): Promise<{migrated: number, errors: string[]}> {
    const errors: string[] = [];
    let migrated = 0;

    for (const item of aircraft) {
      try {
        // Check if already exists
        const { data: existing } = await supabase
          .from('aircraft')
          .select('id')
          .eq('id', item.id)
          .single();

        const aircraftData = {
          id: item.id,
          registration: item.registration,
          model: item.model,
          manufacturer: item.manufacturer,
          status: item.status,
          last_inspection: item.last_inspection,
          flight_hours: item.flight_hours,
          created_at: item.created_at,
          updated_at: item.updated_at
        };

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('aircraft')
            .update(aircraftData)
            .eq('id', item.id);

          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('aircraft')
            .insert(aircraftData);

          if (error) throw error;
        }

        migrated++;
      } catch (error) {
        errors.push(`Aircraft ${item.registration}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return { migrated, errors };
  }

  /**
   * Migrate employees data
   */
  private async migrateEmployees(employees: any[]): Promise<{migrated: number, errors: string[]}> {
    const errors: string[] = [];
    let migrated = 0;

    for (const item of employees) {
      try {
        const { data: existing } = await supabase
          .from('employees')
          .select('id')
          .eq('id', item.id)
          .single();

        const employeeData = {
          id: item.id,
          name: item.name,
          email: item.email,
          role: item.role,
          certifications: item.certifications,
          hire_date: item.hire_date,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at
        };

        if (existing) {
          const { error } = await supabase
            .from('employees')
            .update(employeeData)
            .eq('id', item.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('employees')
            .insert(employeeData);

          if (error) throw error;
        }

        migrated++;
      } catch (error) {
        errors.push(`Employee ${item.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return { migrated, errors };
  }

  /**
   * Migrate tasks data
   */
  private async migrateTasks(tasks: any[]): Promise<{migrated: number, errors: string[]}> {
    const errors: string[] = [];
    let migrated = 0;

    for (const item of tasks) {
      try {
        const { data: existing } = await supabase
          .from('tasks')
          .select('id')
          .eq('id', item.id)
          .single();

        const taskData = {
          id: item.id,
          title: item.title,
          description: item.description,
          assigned_to: item.assigned_to,
          aircraft_id: item.aircraft_id,
          priority: item.priority,
          status: item.status,
          due_date: item.due_date,
          created_at: item.created_at,
          updated_at: item.updated_at
        };

        if (existing) {
          const { error } = await supabase
            .from('tasks')
            .update(taskData)
            .eq('id', item.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('tasks')
            .insert(taskData);

          if (error) throw error;
        }

        migrated++;
      } catch (error) {
        errors.push(`Task ${item.title}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return { migrated, errors };
  }

  /**
   * Migrate flight sheets data
   */
  private async migrateFlightSheets(flightSheets: any[]): Promise<{migrated: number, errors: string[]}> {
    const errors: string[] = [];
    let migrated = 0;

    for (const item of flightSheets) {
      try {
        const { data: existing } = await supabase
          .from('flight_sheets')
          .select('id')
          .eq('id', item.id)
          .single();

        const flightSheetData = {
          id: item.id,
          flight_number: item.flight_number,
          aircraft_id: item.aircraft_id,
          pilot_id: item.pilot_id,
          copilot_id: item.copilot_id,
          departure_airport: item.departure_airport,
          arrival_airport: item.arrival_airport,
          departure_time: item.departure_time,
          arrival_time: item.arrival_time,
          flight_hours: item.flight_hours,
          fuel_consumption: item.fuel_consumption,
          notes: item.notes,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at
        };

        if (existing) {
          const { error } = await supabase
            .from('flight_sheets')
            .update(flightSheetData)
            .eq('id', item.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('flight_sheets')
            .insert(flightSheetData);

          if (error) throw error;
        }

        migrated++;
      } catch (error) {
        errors.push(`Flight ${item.flight_number}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return { migrated, errors };
  }

  /**
   * Report migration progress
   */
  private reportProgress(current: number, total: number, table: string, status: 'migrating' | 'completed' | 'error') {
    if (this.onProgress) {
      this.onProgress({
        current,
        total,
        table,
        status
      });
    }
  }

  /**
   * Clear sync queue after successful migration
   */
  async clearSyncQueue(): Promise<void> {
    try {
      await offlineDb.syncQueue.clear();
      console.log('Sync queue cleared after successful migration');
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }

  /**
   * Mark all offline data as synced
   */
  async markAllAsSynced(): Promise<void> {
    try {
      // Update all records to mark as synced
      const tables = ['aircraft', 'employees', 'tasks', 'flightSheets'] as const;
      
      for (const tableName of tables) {
        const table = offlineDb[tableName];
        const records = await table.toArray();
        
        for (const record of records) {
          await table.update(record.id, {
            synced: true,
            lastModified: new Date()
          });
        }
      }

      console.log('All offline data marked as synced');
    } catch (error) {
      console.error('Failed to mark data as synced:', error);
    }
  }
}

export const migrationService = new MigrationService();
