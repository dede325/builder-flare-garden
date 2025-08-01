-- =========================================================================
-- AirPlus Aviation Cleaning Management System - FINAL PRODUCTION SCHEMA
-- Migration: 20241220000001_vfinal_production_schema.sql
-- Version: VFINAL
-- Description: Complete production-ready database schema based on real data
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =========================================================================
-- CORE AUTHENTICATION AND USER MANAGEMENT
-- =========================================================================

-- User profiles extending Supabase auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_number TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    phone TEXT,
    department TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    hire_date DATE,
    license_number TEXT,
    certifications JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles system
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 10,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles assignment
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.user_profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- =========================================================================
-- AIRCRAFT MANAGEMENT
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.aircraft (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
    last_inspection DATE,
    flight_hours INTEGER DEFAULT 0,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- EMPLOYEE MANAGEMENT
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT NOT NULL,
    certifications JSONB DEFAULT '[]'::jsonb,
    hire_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- CLEANING OPERATIONS
-- =========================================================================

-- Cleaning forms
CREATE TABLE IF NOT EXISTS public.cleaning_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    aircraft_id UUID NOT NULL REFERENCES public.aircraft(id),
    date DATE NOT NULL,
    time_start TIME,
    time_end TIME,
    location TEXT,
    intervention_type TEXT NOT NULL,
    observations TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES public.employees(id),
    completed_by UUID REFERENCES public.employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- TASK MANAGEMENT
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.employees(id),
    aircraft_id UUID REFERENCES public.aircraft(id),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- FLIGHT SHEETS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.flight_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_number TEXT NOT NULL,
    aircraft_id UUID NOT NULL REFERENCES public.aircraft(id),
    pilot_id UUID REFERENCES public.employees(id),
    copilot_id UUID REFERENCES public.employees(id),
    departure_airport TEXT,
    arrival_airport TEXT,
    departure_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    flight_hours DECIMAL(5,2),
    fuel_consumption DECIMAL(8,2),
    notes TEXT,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- SYSTEM CONFIGURATION
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- INDEXES FOR PERFORMANCE
-- =========================================================================

-- User profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_number ON public.user_profiles(employee_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);

-- Aircraft
CREATE INDEX IF NOT EXISTS idx_aircraft_registration ON public.aircraft(registration);
CREATE INDEX IF NOT EXISTS idx_aircraft_status ON public.aircraft(status);

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

-- Cleaning forms
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_code ON public.cleaning_forms(code);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_aircraft_id ON public.cleaning_forms(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_status ON public.cleaning_forms(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_date ON public.cleaning_forms(date);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_aircraft_id ON public.tasks(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Flight sheets
CREATE INDEX IF NOT EXISTS idx_flight_sheets_aircraft_id ON public.flight_sheets(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_flight_sheets_flight_number ON public.flight_sheets(flight_number);
CREATE INDEX IF NOT EXISTS idx_flight_sheets_status ON public.flight_sheets(status);

-- =========================================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =========================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aircraft_updated_at BEFORE UPDATE ON public.aircraft
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleaning_forms_updated_at BEFORE UPDATE ON public.cleaning_forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flight_sheets_updated_at BEFORE UPDATE ON public.flight_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- HELPER FUNCTIONS
-- =========================================================================

-- Generate cleaning form codes
CREATE OR REPLACE FUNCTION generate_cleaning_form_code()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    sequence_num INTEGER;
BEGIN
    prefix := 'LMP-' || LPAD(EXTRACT(YEAR FROM NOW())::TEXT, 4, '0') || '-';
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.cleaning_forms
    WHERE code LIKE prefix || '%';
    
    RETURN prefix || LPAD(sequence_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-assign form codes
CREATE OR REPLACE FUNCTION auto_assign_form_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := generate_cleaning_form_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_cleaning_form_code BEFORE INSERT ON public.cleaning_forms
    FOR EACH ROW EXECUTE FUNCTION auto_assign_form_code();

-- =========================================================================
-- RLS POLICIES (Row Level Security)
-- =========================================================================

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for authenticated users
CREATE POLICY "Users can view all profiles" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all aircraft" ON public.aircraft
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all employees" ON public.employees
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all cleaning forms" ON public.cleaning_forms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create cleaning forms" ON public.cleaning_forms
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their cleaning forms" ON public.cleaning_forms
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all tasks" ON public.tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update tasks" ON public.tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view flight sheets" ON public.flight_sheets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view public system settings" ON public.system_settings
    FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');

-- =========================================================================
-- COMMENTS FOR DOCUMENTATION
-- =========================================================================

COMMENT ON TABLE public.user_profiles IS 'User profiles extending Supabase auth with aviation-specific data';
COMMENT ON TABLE public.aircraft IS 'Aircraft fleet management';
COMMENT ON TABLE public.employees IS 'Employee management for aviation operations';
COMMENT ON TABLE public.cleaning_forms IS 'Aircraft cleaning operation forms';
COMMENT ON TABLE public.tasks IS 'Task management system';
COMMENT ON TABLE public.flight_sheets IS 'Flight operation records';
COMMENT ON TABLE public.system_settings IS 'System configuration and settings';

-- =========================================================================
-- SCHEMA VERSION
-- =========================================================================

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
VALUES ('schema_version', '"vfinal"', 'Database schema version', false)
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = '"vfinal"',
    updated_at = NOW();

-- Success message
SELECT 'VFINAL Production Schema Created Successfully' as status;
