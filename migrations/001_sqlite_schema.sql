-- =============================================
-- Aviation Cleaning Management System
-- SQLite Migration - Offline Database Schema
-- Compatible with IndexedDB/Dexie.js structure
-- =============================================

-- =============================================
-- 1. PROFILES TABLE (Users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'employee',
    department TEXT DEFAULT 'cleaning_operations',
    phone TEXT,
    emergency_contact TEXT,
    avatar_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- 2. AIRCRAFT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS aircraft (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    registration TEXT UNIQUE NOT NULL,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    variant TEXT,
    serial_number TEXT,
    year_manufactured INTEGER,
    max_passengers INTEGER,
    cargo_capacity REAL,
    fuel_capacity REAL,
    location TEXT,
    hangar TEXT,
    status TEXT DEFAULT 'active',
    last_cleaning_date TEXT,
    notes TEXT,
    technical_specs TEXT, -- JSON as TEXT
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    -- Sync fields
    needs_sync INTEGER DEFAULT 1,
    last_sync_at TEXT,
    sync_error TEXT
);

-- =============================================
-- 3. EMPLOYEES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    employee_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    id_number TEXT UNIQUE,
    role TEXT NOT NULL,
    department TEXT DEFAULT 'cleaning_operations',
    shift_preference TEXT,
    hire_date TEXT,
    birth_date TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    certifications TEXT, -- JSON array as TEXT
    photo_url TEXT,
    status TEXT DEFAULT 'active',
    hourly_rate REAL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    -- Sync fields
    needs_sync INTEGER DEFAULT 1,
    last_sync_at TEXT,
    sync_error TEXT
);

-- =============================================
-- 4. CLEANING FORMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS cleaning_forms (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    code TEXT UNIQUE NOT NULL,
    date TEXT NOT NULL,
    shift TEXT NOT NULL,
    location TEXT NOT NULL,
    aircraft_id TEXT NOT NULL,
    intervention_types TEXT NOT NULL, -- JSON array as TEXT
    status TEXT DEFAULT 'draft',
    supervisor_signature_url TEXT,
    client_signature_url TEXT,
    client_confirmed_without_signature INTEGER DEFAULT 0,
    qr_code_url TEXT,
    pdf_url TEXT,
    notes TEXT,
    version INTEGER DEFAULT 1,
    change_history TEXT DEFAULT '[]', -- JSON as TEXT
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    -- Sync fields
    needs_sync INTEGER DEFAULT 1,
    last_sync_at TEXT,
    sync_error TEXT,
    FOREIGN KEY (aircraft_id) REFERENCES aircraft(id)
);

-- =============================================
-- 5. CLEANING FORM EMPLOYEES (Junction Table)
-- =============================================
CREATE TABLE IF NOT EXISTS cleaning_form_employees (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cleaning_form_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    task TEXT,
    start_time TEXT,
    end_time TEXT,
    hours_worked REAL,
    created_at TEXT DEFAULT (datetime('now')),
    -- Sync fields
    needs_sync INTEGER DEFAULT 1,
    last_sync_at TEXT,
    UNIQUE(cleaning_form_id, employee_id),
    FOREIGN KEY (cleaning_form_id) REFERENCES cleaning_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- =============================================
-- 6. SYSTEM SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL, -- JSON as TEXT
    description TEXT,
    is_public INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    updated_by TEXT,
    -- Sync fields
    needs_sync INTEGER DEFAULT 1,
    last_sync_at TEXT
);

-- =============================================
-- 7. FILE ATTACHMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS file_attachments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    file_url TEXT NOT NULL,
    storage_path TEXT,
    local_path TEXT, -- For offline storage
    uploaded_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    -- Sync fields
    needs_sync INTEGER DEFAULT 1,
    last_sync_at TEXT,
    sync_error TEXT
);

-- =============================================
-- 8. SYNC QUEUE TABLE (Offline-specific)
-- =============================================
CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    data TEXT, -- JSON data to sync
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TEXT DEFAULT (datetime('now')),
    processed_at TEXT,
    error_message TEXT,
    status TEXT DEFAULT 'pending' -- pending, processing, completed, failed
);

-- =============================================
-- 9. OFFLINE METADATA TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS offline_metadata (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- INDEXES FOR BETTER PERFORMANCE
-- =============================================

-- Aircraft indexes
CREATE INDEX IF NOT EXISTS idx_aircraft_registration ON aircraft(registration);
CREATE INDEX IF NOT EXISTS idx_aircraft_status ON aircraft(status);
CREATE INDEX IF NOT EXISTS idx_aircraft_sync ON aircraft(needs_sync);

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_sync ON employees(needs_sync);

-- Cleaning forms indexes
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_code ON cleaning_forms(code);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_date ON cleaning_forms(date);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_aircraft_id ON cleaning_forms(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_status ON cleaning_forms(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_sync ON cleaning_forms(needs_sync);

-- Cleaning form employees indexes
CREATE INDEX IF NOT EXISTS idx_cleaning_form_employees_form_id ON cleaning_form_employees(cleaning_form_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_form_employees_employee_id ON cleaning_form_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_form_employees_sync ON cleaning_form_employees(needs_sync);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_sync ON system_settings(needs_sync);

-- File attachments indexes
CREATE INDEX IF NOT EXISTS idx_file_attachments_entity ON file_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_sync ON file_attachments(needs_sync);

-- Sync queue indexes
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);

-- Offline metadata indexes
CREATE INDEX IF NOT EXISTS idx_offline_metadata_key ON offline_metadata(key);

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Default intervention types
INSERT OR REPLACE INTO system_settings (setting_key, setting_value, description, is_public, needs_sync) 
VALUES 
('intervention_types', '["Limpeza Exterior", "Limpeza Interior", "Polimento", "Lavagem Profunda Durante a Manutenção de Base"]', 'Available intervention types for cleaning forms', 1, 1),
('location_options', '["Hangar 1", "Hangar 2", "Hangar 3", "Rampa A", "Rampa B", "Rampa C", "Terminal", "Zona de Manutenção"]', 'Available locations for cleaning operations', 1, 1),
('company_settings', '{"name": "AviationOps", "logo": "", "primaryColor": "#00b0ea", "secondaryColor": "#009ddf"}', 'Company branding and configuration', 1, 1),
('system_config', '{"theme": "aviation-blue", "notifications": true, "autoSync": true, "offlineMode": false, "language": "pt", "timezone": "Atlantic/Azores"}', 'System configuration defaults', 0, 1);

-- Default offline metadata
INSERT OR REPLACE INTO offline_metadata (key, value) 
VALUES 
('last_full_sync', NULL),
('sync_status', 'never_synced'),
('app_version', '1.0.0'),
('schema_version', '001'),
('total_records', '0'),
('pending_sync_count', '0');

-- =============================================
-- TRIGGERS FOR AUTOMATIC SYNC FLAGGING
-- =============================================

-- Flag records for sync when updated
CREATE TRIGGER IF NOT EXISTS trigger_aircraft_sync_flag
AFTER UPDATE ON aircraft
FOR EACH ROW
WHEN NEW.needs_sync = 0
BEGIN
    UPDATE aircraft 
    SET needs_sync = 1, updated_at = datetime('now') 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_employees_sync_flag
AFTER UPDATE ON employees
FOR EACH ROW
WHEN NEW.needs_sync = 0
BEGIN
    UPDATE employees 
    SET needs_sync = 1, updated_at = datetime('now') 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_cleaning_forms_sync_flag
AFTER UPDATE ON cleaning_forms
FOR EACH ROW
WHEN NEW.needs_sync = 0
BEGIN
    UPDATE cleaning_forms 
    SET needs_sync = 1, updated_at = datetime('now') 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_system_settings_sync_flag
AFTER UPDATE ON system_settings
FOR EACH ROW
WHEN NEW.needs_sync = 0
BEGIN
    UPDATE system_settings 
    SET needs_sync = 1, updated_at = datetime('now') 
    WHERE id = NEW.id;
END;

-- =============================================
-- VIEWS FOR EASIER QUERYING
-- =============================================

-- View for pending sync records
CREATE VIEW IF NOT EXISTS pending_sync_summary AS
SELECT 
    'aircraft' as table_name, COUNT(*) as count
FROM aircraft WHERE needs_sync = 1
UNION ALL
SELECT 
    'employees' as table_name, COUNT(*) as count  
FROM employees WHERE needs_sync = 1
UNION ALL
SELECT 
    'cleaning_forms' as table_name, COUNT(*) as count
FROM cleaning_forms WHERE needs_sync = 1
UNION ALL
SELECT 
    'cleaning_form_employees' as table_name, COUNT(*) as count
FROM cleaning_form_employees WHERE needs_sync = 1
UNION ALL
SELECT 
    'system_settings' as table_name, COUNT(*) as count
FROM system_settings WHERE needs_sync = 1
UNION ALL
SELECT 
    'file_attachments' as table_name, COUNT(*) as count
FROM file_attachments WHERE needs_sync = 1;

-- View for cleaning forms with aircraft details
CREATE VIEW IF NOT EXISTS cleaning_forms_with_aircraft AS
SELECT 
    cf.*,
    a.registration as aircraft_registration,
    a.manufacturer as aircraft_manufacturer,
    a.model as aircraft_model,
    a.location as aircraft_location
FROM cleaning_forms cf
LEFT JOIN aircraft a ON cf.aircraft_id = a.id;

-- View for active employees with current assignments
CREATE VIEW IF NOT EXISTS active_employees AS
SELECT 
    e.*,
    COUNT(cfe.id) as current_assignments
FROM employees e
LEFT JOIN cleaning_form_employees cfe ON e.id = cfe.employee_id
LEFT JOIN cleaning_forms cf ON cfe.cleaning_form_id = cf.id 
    AND cf.status IN ('draft', 'pending_signatures')
WHERE e.status = 'active'
GROUP BY e.id;

-- =============================================
-- CLEANUP PROCEDURES (Manual execution)
-- =============================================

-- Clean up old completed forms (older than 1 year)
-- DELETE FROM cleaning_forms 
-- WHERE status = 'completed' 
-- AND created_at < date('now', '-1 year');

-- Clean up old sync queue entries (older than 1 month)
-- DELETE FROM sync_queue 
-- WHERE status IN ('completed', 'failed') 
-- AND created_at < date('now', '-1 month');

-- Vacuum database to reclaim space
-- VACUUM;

-- =============================================
-- SAMPLE QUERIES FOR TESTING
-- =============================================

-- Get sync summary
-- SELECT * FROM pending_sync_summary;

-- Get recent cleaning forms with aircraft info
-- SELECT * FROM cleaning_forms_with_aircraft 
-- ORDER BY created_at DESC LIMIT 10;

-- Get active employees
-- SELECT * FROM active_employees;

-- Get system configuration
-- SELECT setting_key, setting_value 
-- FROM system_settings 
-- WHERE setting_key IN ('intervention_types', 'location_options', 'company_settings');
