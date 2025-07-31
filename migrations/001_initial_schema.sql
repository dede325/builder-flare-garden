-- =============================================
-- Aviation Cleaning Management System
-- SQL Migration - Initial Schema
-- Compatible with Supabase PostgreSQL and SQLite (offline)
-- =============================================

-- Enable Row Level Security for Supabase
-- Comment out for SQLite
-- ALTER DATABASE ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 1. PROFILES TABLE (Users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'employee',
    department VARCHAR(100) DEFAULT 'cleaning_operations',
    phone VARCHAR(50),
    emergency_contact VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- For SQLite compatibility (replace UUID and TIMESTAMP)
-- CREATE TABLE IF NOT EXISTS profiles_sqlite (
--     id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
--     email TEXT UNIQUE NOT NULL,
--     name TEXT NOT NULL,
--     role TEXT DEFAULT 'employee',
--     department TEXT DEFAULT 'cleaning_operations',
--     phone TEXT,
--     emergency_contact TEXT,
--     avatar_url TEXT,
--     is_active INTEGER DEFAULT 1,
--     created_at TEXT DEFAULT (datetime('now')),
--     updated_at TEXT DEFAULT (datetime('now'))
-- );

-- =============================================
-- 2. AIRCRAFT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS aircraft (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration VARCHAR(20) UNIQUE NOT NULL, -- Format: D2-ABC, CS-DXB, etc.
    manufacturer VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    variant VARCHAR(50),
    serial_number VARCHAR(100),
    year_manufactured INTEGER,
    max_passengers INTEGER,
    cargo_capacity DECIMAL(10,2), -- in kg
    fuel_capacity DECIMAL(10,2), -- in liters
    location VARCHAR(255),
    hangar VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- active, maintenance, inactive, retired
    last_cleaning_date DATE,
    notes TEXT,
    technical_specs JSONB, -- For flexible technical data storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- For SQLite compatibility
-- CREATE TABLE IF NOT EXISTS aircraft_sqlite (
--     id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
--     registration TEXT UNIQUE NOT NULL,
--     manufacturer TEXT NOT NULL,
--     model TEXT NOT NULL,
--     variant TEXT,
--     serial_number TEXT,
--     year_manufactured INTEGER,
--     max_passengers INTEGER,
--     cargo_capacity REAL,
--     fuel_capacity REAL,
--     location TEXT,
--     hangar TEXT,
--     status TEXT DEFAULT 'active',
--     last_cleaning_date TEXT,
--     notes TEXT,
--     technical_specs TEXT, -- JSON as TEXT
--     created_at TEXT DEFAULT (datetime('now')),
--     updated_at TEXT DEFAULT (datetime('now')),
--     created_by TEXT
-- );

-- =============================================
-- 3. EMPLOYEES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    id_number VARCHAR(50) UNIQUE,
    role VARCHAR(100) NOT NULL,
    department VARCHAR(100) DEFAULT 'cleaning_operations',
    shift_preference VARCHAR(50), -- morning, afternoon, night, flexible
    hire_date DATE,
    birth_date DATE,
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    certifications TEXT[], -- Array of certification names
    photo_url TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, vacation, terminated
    hourly_rate DECIMAL(8,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- For SQLite compatibility
-- CREATE TABLE IF NOT EXISTS employees_sqlite (
--     id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
--     employee_number TEXT UNIQUE NOT NULL,
--     name TEXT NOT NULL,
--     email TEXT,
--     phone TEXT,
--     id_number TEXT UNIQUE,
--     role TEXT NOT NULL,
--     department TEXT DEFAULT 'cleaning_operations',
--     shift_preference TEXT,
--     hire_date TEXT,
--     birth_date TEXT,
--     address TEXT,
--     emergency_contact_name TEXT,
--     emergency_contact_phone TEXT,
--     certifications TEXT, -- JSON array as TEXT
--     photo_url TEXT,
--     status TEXT DEFAULT 'active',
--     hourly_rate REAL,
--     notes TEXT,
--     created_at TEXT DEFAULT (datetime('now')),
--     updated_at TEXT DEFAULT (datetime('now')),
--     created_by TEXT
-- );

-- =============================================
-- 4. CLEANING FORMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS cleaning_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- Format: FL-LOC-MDDMMYYHHMMSS
    date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL, -- morning, afternoon, night
    location VARCHAR(255) NOT NULL,
    aircraft_id UUID NOT NULL REFERENCES aircraft(id),
    intervention_types TEXT[] NOT NULL, -- Array of intervention types
    status VARCHAR(50) DEFAULT 'draft', -- draft, pending_signatures, completed, cancelled
    supervisor_signature_url TEXT,
    client_signature_url TEXT,
    client_confirmed_without_signature BOOLEAN DEFAULT false,
    qr_code_url TEXT,
    pdf_url TEXT,
    notes TEXT,
    version INTEGER DEFAULT 1,
    change_history JSONB DEFAULT '[]'::jsonb, -- Version history and changes
    sync_status VARCHAR(20) DEFAULT 'pending', -- pending, synced, error
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- For SQLite compatibility
-- CREATE TABLE IF NOT EXISTS cleaning_forms_sqlite (
--     id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
--     code TEXT UNIQUE NOT NULL,
--     date TEXT NOT NULL,
--     shift TEXT NOT NULL,
--     location TEXT NOT NULL,
--     aircraft_id TEXT NOT NULL,
--     intervention_types TEXT, -- JSON array as TEXT
--     status TEXT DEFAULT 'draft',
--     supervisor_signature_url TEXT,
--     client_signature_url TEXT,
--     client_confirmed_without_signature INTEGER DEFAULT 0,
--     qr_code_url TEXT,
--     pdf_url TEXT,
--     notes TEXT,
--     version INTEGER DEFAULT 1,
--     change_history TEXT DEFAULT '[]', -- JSON as TEXT
--     sync_status TEXT DEFAULT 'pending',
--     last_sync_at TEXT,
--     created_at TEXT DEFAULT (datetime('now')),
--     updated_at TEXT DEFAULT (datetime('now')),
--     created_by TEXT
-- );

-- =============================================
-- 5. CLEANING FORM EMPLOYEES (Junction Table)
-- =============================================
CREATE TABLE IF NOT EXISTS cleaning_form_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cleaning_form_id UUID NOT NULL REFERENCES cleaning_forms(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    task VARCHAR(255),
    start_time TIME,
    end_time TIME,
    hours_worked DECIMAL(4,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cleaning_form_id, employee_id)
);

-- For SQLite compatibility
-- CREATE TABLE IF NOT EXISTS cleaning_form_employees_sqlite (
--     id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
--     cleaning_form_id TEXT NOT NULL,
--     employee_id TEXT NOT NULL,
--     task TEXT,
--     start_time TEXT,
--     end_time TEXT,
--     hours_worked REAL,
--     created_at TEXT DEFAULT (datetime('now')),
--     UNIQUE(cleaning_form_id, employee_id)
-- );

-- =============================================
-- 6. SYSTEM SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Whether setting is visible to all users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- For SQLite compatibility
-- CREATE TABLE IF NOT EXISTS system_settings_sqlite (
--     id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
--     setting_key TEXT UNIQUE NOT NULL,
--     setting_value TEXT NOT NULL, -- JSON as TEXT
--     description TEXT,
--     is_public INTEGER DEFAULT 0,
--     created_at TEXT DEFAULT (datetime('now')),
--     updated_at TEXT DEFAULT (datetime('now')),
--     updated_by TEXT
-- );

-- =============================================
-- 7. FILE ATTACHMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS file_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'cleaning_form', 'aircraft', 'employee', etc.
    entity_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    file_url TEXT NOT NULL,
    storage_path TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- For SQLite compatibility
-- CREATE TABLE IF NOT EXISTS file_attachments_sqlite (
--     id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
--     entity_type TEXT NOT NULL,
--     entity_id TEXT NOT NULL,
--     file_name TEXT NOT NULL,
--     file_type TEXT,
--     file_size INTEGER,
--     file_url TEXT NOT NULL,
--     storage_path TEXT,
--     uploaded_by TEXT,
--     created_at TEXT DEFAULT (datetime('now'))
-- );

-- =============================================
-- 8. AUDIT LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES profiles(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- For SQLite compatibility
-- CREATE TABLE IF NOT EXISTS audit_log_sqlite (
--     id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
--     table_name TEXT NOT NULL,
--     record_id TEXT NOT NULL,
--     action TEXT NOT NULL,
--     old_data TEXT, -- JSON as TEXT
--     new_data TEXT, -- JSON as TEXT
--     changed_fields TEXT, -- JSON array as TEXT
--     user_id TEXT,
--     timestamp TEXT DEFAULT (datetime('now')),
--     ip_address TEXT,
--     user_agent TEXT
-- );

-- =============================================
-- INDEXES FOR BETTER PERFORMANCE
-- =============================================

-- Aircraft indexes
CREATE INDEX IF NOT EXISTS idx_aircraft_registration ON aircraft(registration);
CREATE INDEX IF NOT EXISTS idx_aircraft_status ON aircraft(status);
CREATE INDEX IF NOT EXISTS idx_aircraft_location ON aircraft(location);

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);

-- Cleaning forms indexes
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_code ON cleaning_forms(code);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_date ON cleaning_forms(date);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_aircraft_id ON cleaning_forms(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_status ON cleaning_forms(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_sync_status ON cleaning_forms(sync_status);

-- Cleaning form employees indexes
CREATE INDEX IF NOT EXISTS idx_cleaning_form_employees_form_id ON cleaning_form_employees(cleaning_form_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_form_employees_employee_id ON cleaning_form_employees(employee_id);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- File attachments indexes
CREATE INDEX IF NOT EXISTS idx_file_attachments_entity ON file_attachments(entity_type, entity_id);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Default intervention types
INSERT INTO system_settings (setting_key, setting_value, description, is_public) 
VALUES 
('intervention_types', '["Limpeza Exterior", "Limpeza Interior", "Polimento", "Lavagem Profunda Durante a Manutenção de Base"]', 'Available intervention types for cleaning forms', true),
('location_options', '["Hangar 1", "Hangar 2", "Hangar 3", "Rampa A", "Rampa B", "Rampa C", "Terminal", "Zona de Manutenção"]', 'Available locations for cleaning operations', true),
('company_settings', '{"name": "AviationOps", "logo": "", "primaryColor": "#00b0ea", "secondaryColor": "#009ddf"}', 'Company branding and configuration', true),
('system_config', '{"theme": "aviation-blue", "notifications": true, "autoSync": true, "offlineMode": false, "language": "pt", "timezone": "Atlantic/Azores"}', 'System configuration defaults', false);

-- Sample aircraft data (optional)
-- INSERT INTO aircraft (registration, manufacturer, model, location, status) 
-- VALUES 
-- ('D2-ABC', 'Airbus', 'A320', 'Hangar 1', 'active'),
-- ('CS-DXB', 'Boeing', '737-800', 'Hangar 2', 'active'),
-- ('D2-XYZ', 'Embraer', 'E190', 'Rampa A', 'maintenance');

-- =============================================
-- ROW LEVEL SECURITY POLICIES (Supabase only)
-- =============================================

-- Enable RLS on all tables
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cleaning_forms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cleaning_form_employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow authenticated users full access for now)
-- More granular policies can be added based on roles later

-- CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- CREATE POLICY "Users can view all aircraft" ON aircraft FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Users can modify aircraft" ON aircraft FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Users can view all employees" ON employees FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Users can modify employees" ON employees FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Users can view all cleaning forms" ON cleaning_forms FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Users can modify cleaning forms" ON cleaning_forms FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Users can view all cleaning form employees" ON cleaning_form_employees FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Users can modify cleaning form employees" ON cleaning_form_employees FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Users can view public settings" ON system_settings FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can modify settings" ON system_settings FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Users can view all attachments" ON file_attachments FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Users can modify attachments" ON file_attachments FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Users can view audit log" ON audit_log FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "System can insert audit log" ON audit_log FOR INSERT WITH CHECK (true);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update timestamps automatically (PostgreSQL version)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_aircraft_updated_at BEFORE UPDATE ON aircraft FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_cleaning_forms_updated_at BEFORE UPDATE ON cleaning_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE profiles IS 'User profiles and authentication data';
COMMENT ON TABLE aircraft IS 'Aircraft registry with technical specifications';
COMMENT ON TABLE employees IS 'Employee information for cleaning operations';
COMMENT ON TABLE cleaning_forms IS 'Main cleaning requisition forms';
COMMENT ON TABLE cleaning_form_employees IS 'Junction table linking forms to employees';
COMMENT ON TABLE system_settings IS 'System configuration and settings';
COMMENT ON TABLE file_attachments IS 'File storage references for all entities';
COMMENT ON TABLE audit_log IS 'Complete audit trail for all changes';
