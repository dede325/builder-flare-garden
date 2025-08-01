/**
 * Database Migration Runner
 * Handles both Supabase (PostgreSQL) and Offline (SQLite) migrations
 */

import { supabase } from "./supabase";
import { openDB, IDBPDatabase } from "idb";

interface MigrationResult {
  success: boolean;
  message: string;
  error?: any;
}

interface MigrationStatus {
  version: string;
  applied_at: string;
  success: boolean;
}

// Migration definitions
const MIGRATIONS = {
  "001": {
    name: "Initial Schema",
    description: "Create initial tables for aviation cleaning management",
    supabase: `
      -- This would be the full Supabase migration
      -- In production, this should be run via Supabase CLI
      -- supabase migration new initial_schema
      SELECT 'Migration should be run via Supabase Dashboard or CLI' as message;
    `,
    sqlite: `
      -- SQLite schema for offline database
      -- This will be executed via IndexedDB/Dexie
      CREATE TABLE IF NOT EXISTS migration_history (
        version TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT (datetime('now')),
        success INTEGER DEFAULT 1
      );
    `,
  },
};

/**
 * Check if Supabase is available and connected
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      console.log("Supabase environment variables not configured");
      return false;
    }

    const { data, error } = await supabase
      .from("_supabase_migrations")
      .select("version")
      .limit(1);

    if (error && error.code === "PGRST116") {
      // Table doesn't exist, but connection is working
      return true;
    }

    return !error;
  } catch (error) {
    console.error("Supabase connection failed:", error);
    return false;
  }
}

/**
 * Run Supabase migrations
 */
export async function runSupabaseMigrations(): Promise<MigrationResult> {
  try {
    const isConnected = await checkSupabaseConnection();

    if (!isConnected) {
      return {
        success: false,
        message:
          "Supabase not available. Please configure environment variables and run migrations via Supabase CLI.",
      };
    }

    // Check if migration tracking table exists
    const { error: trackingError } = await supabase
      .from("migration_history")
      .select("version")
      .limit(1);

    if (trackingError) {
      // Create migration tracking table
      const { error: createError } = await supabase.rpc(
        "create_migration_tracking",
      );
      if (createError) {
        console.error("Failed to create migration tracking:", createError);
      }
    }

    // Migrations should be run via Supabase CLI in production
    return {
      success: true,
      message: "Supabase migrations should be run via CLI: supabase db push",
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to run Supabase migrations",
      error,
    };
  }
}

/**
 * Initialize offline database with SQLite schema
 */
export async function initializeOfflineDatabase(): Promise<MigrationResult> {
  try {
    // Initialize IndexedDB for offline storage

    const dbName = "aviation_cleaning_db";
    const version = 1;

    const db = await openDB(dbName, version, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create object stores (tables) for our offline database

        if (!db.objectStoreNames.contains("aircraft")) {
          const aircraftStore = db.createObjectStore("aircraft", {
            keyPath: "id",
          });
          aircraftStore.createIndex("registration", "registration", {
            unique: true,
          });
          aircraftStore.createIndex("status", "status");
          aircraftStore.createIndex("needs_sync", "needs_sync");
        }

        if (!db.objectStoreNames.contains("employees")) {
          const employeeStore = db.createObjectStore("employees", {
            keyPath: "id",
          });
          employeeStore.createIndex("employee_number", "employee_number", {
            unique: true,
          });
          employeeStore.createIndex("status", "status");
          employeeStore.createIndex("needs_sync", "needs_sync");
        }

        if (!db.objectStoreNames.contains("cleaning_forms")) {
          const formsStore = db.createObjectStore("cleaning_forms", {
            keyPath: "id",
          });
          formsStore.createIndex("code", "code", { unique: true });
          formsStore.createIndex("date", "date");
          formsStore.createIndex("aircraft_id", "aircraft_id");
          formsStore.createIndex("status", "status");
          formsStore.createIndex("needs_sync", "needs_sync");
        }

        if (!db.objectStoreNames.contains("cleaning_form_employees")) {
          const formEmployeesStore = db.createObjectStore(
            "cleaning_form_employees",
            { keyPath: "id" },
          );
          formEmployeesStore.createIndex(
            "cleaning_form_id",
            "cleaning_form_id",
          );
          formEmployeesStore.createIndex("employee_id", "employee_id");
          formEmployeesStore.createIndex("needs_sync", "needs_sync");
        }

        if (!db.objectStoreNames.contains("system_settings")) {
          const settingsStore = db.createObjectStore("system_settings", {
            keyPath: "setting_key",
          });
          settingsStore.createIndex("is_public", "is_public");
          settingsStore.createIndex("needs_sync", "needs_sync");
        }

        if (!db.objectStoreNames.contains("file_attachments")) {
          const attachmentsStore = db.createObjectStore("file_attachments", {
            keyPath: "id",
          });
          attachmentsStore.createIndex("entity_type_id", [
            "entity_type",
            "entity_id",
          ]);
          attachmentsStore.createIndex("needs_sync", "needs_sync");
        }

        if (!db.objectStoreNames.contains("sync_queue")) {
          const syncStore = db.createObjectStore("sync_queue", {
            keyPath: "id",
          });
          syncStore.createIndex("status", "status");
          syncStore.createIndex("table_name", "table_name");
          syncStore.createIndex("created_at", "created_at");
        }

        if (!db.objectStoreNames.contains("offline_metadata")) {
          const metadataStore = db.createObjectStore("offline_metadata", {
            keyPath: "key",
          });
        }

        if (!db.objectStoreNames.contains("migration_history")) {
          const migrationStore = db.createObjectStore("migration_history", {
            keyPath: "version",
          });
        }
      },
    });

    // Insert default data
    await insertDefaultOfflineData(db);

    // Record migration
    await db.put("migration_history", {
      version: "001",
      name: "Initial Schema",
      applied_at: new Date().toISOString(),
      success: true,
    });

    db.close();

    return {
      success: true,
      message: "Offline database initialized successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to initialize offline database",
      error,
    };
  }
}

/**
 * Insert default data for offline database
 */
async function insertDefaultOfflineData(db: IDBPDatabase): Promise<void> {
  const defaultSettings = [
    {
      setting_key: "intervention_types",
      setting_value: JSON.stringify([
        "Limpeza Exterior",
        "Limpeza Interior",
        "Polimento",
        "Lavagem Profunda Durante a Manutenção de Base",
      ]),
      description: "Available intervention types for cleaning forms",
      is_public: true,
      needs_sync: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      setting_key: "location_options",
      setting_value: JSON.stringify([
        "Hangar 1",
        "Hangar 2",
        "Hangar 3",
        "Rampa A",
        "Rampa B",
        "Rampa C",
        "Terminal",
        "Zona de Manutenção",
      ]),
      description: "Available locations for cleaning operations",
      is_public: true,
      needs_sync: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      setting_key: "company_settings",
      setting_value: JSON.stringify({
        name: "AviationOps",
        logo: "",
        primaryColor: "#00b0ea",
        secondaryColor: "#009ddf",
      }),
      description: "Company branding and configuration",
      is_public: true,
      needs_sync: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      setting_key: "system_config",
      setting_value: JSON.stringify({
        theme: "aviation-blue",
        notifications: true,
        autoSync: true,
        offlineMode: false,
        language: "pt",
        timezone: "Atlantic/Azores",
      }),
      description: "System configuration defaults",
      is_public: false,
      needs_sync: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const defaultMetadata = [
    {
      key: "last_full_sync",
      value: null,
      updated_at: new Date().toISOString(),
    },
    {
      key: "sync_status",
      value: "never_synced",
      updated_at: new Date().toISOString(),
    },
    {
      key: "app_version",
      value: "1.0.0",
      updated_at: new Date().toISOString(),
    },
    {
      key: "schema_version",
      value: "001",
      updated_at: new Date().toISOString(),
    },
    { key: "total_records", value: "0", updated_at: new Date().toISOString() },
    {
      key: "pending_sync_count",
      value: "0",
      updated_at: new Date().toISOString(),
    },
  ];

  // Insert default settings
  const settingsTransaction = db.transaction("system_settings", "readwrite");
  for (const setting of defaultSettings) {
    await settingsTransaction.store.put(setting);
  }
  await settingsTransaction.done;

  // Insert default metadata
  const metadataTransaction = db.transaction("offline_metadata", "readwrite");
  for (const metadata of defaultMetadata) {
    await metadataTransaction.store.put(metadata);
  }
  await metadataTransaction.done;
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  supabase: boolean;
  offline: boolean;
  details: any;
}> {
  const supabaseConnected = await checkSupabaseConnection();

  let offlineInitialized = false;
  let offlineDetails = null;

  try {
    const db = await openDB("aviation_cleaning_db", 1);
    const migrations = await db.getAll("migration_history");
    offlineInitialized = migrations.length > 0;
    offlineDetails = migrations;
    db.close();
  } catch (error) {
    console.log("Offline database not initialized");
  }

  return {
    supabase: supabaseConnected,
    offline: offlineInitialized,
    details: {
      supabase_env_configured: !!(
        import.meta.env.VITE_SUPABASE_URL &&
        import.meta.env.VITE_SUPABASE_ANON_KEY
      ),
      offline_migrations: offlineDetails,
    },
  };
}

/**
 * Run all necessary migrations
 */
export async function runAllMigrations(): Promise<{
  supabase: MigrationResult;
  offline: MigrationResult;
}> {
  const supabaseResult = await runSupabaseMigrations();
  const offlineResult = await initializeOfflineDatabase();

  return {
    supabase: supabaseResult,
    offline: offlineResult,
  };
}

/**
 * Reset offline database
 */
export async function resetOfflineDatabase(): Promise<MigrationResult> {
  try {
    // Delete the IndexedDB database
    await new Promise((resolve, reject) => {
      const deleteReq = indexedDB.deleteDatabase("aviation_cleaning_db");
      deleteReq.onsuccess = () => resolve(true);
      deleteReq.onerror = () => reject(deleteReq.error);
    });

    // Reinitialize
    return await initializeOfflineDatabase();
  } catch (error) {
    return {
      success: false,
      message: "Failed to reset offline database",
      error,
    };
  }
}

// Export migration utilities for external use
export const migrations = {
  checkSupabaseConnection,
  runSupabaseMigrations,
  initializeOfflineDatabase,
  getMigrationStatus,
  runAllMigrations,
  resetOfflineDatabase,
};
