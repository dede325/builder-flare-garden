-- =========================================================================
-- AirPlus Aviation - FINAL PRODUCTION SEED DATA
-- Migration: 20241220000002_vfinal_seed_data.sql
-- Version: VFINAL
-- Description: Production-ready seed data based on real system data
-- =========================================================================

-- =========================================================================
-- SYSTEM ROLES
-- =========================================================================

INSERT INTO public.roles (name, display_name, description, level) VALUES
('admin', 'Administrador', 'Acesso total ao sistema', 100),
('supervisor', 'Supervisor', 'Supervisão de operações e equipes', 80),
('operacional', 'Operacional', 'Operações de limpeza e manutenção', 60),
('cliente', 'Cliente', 'Acesso limitado para clientes', 40)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    level = EXCLUDED.level,
    updated_at = NOW();

-- =========================================================================
-- SYSTEM SETTINGS
-- =========================================================================

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public) VALUES
-- Intervention types
('intervention_types', '["Limpeza Exterior", "Limpeza Interior", "Polimento", "Lavagem Profunda Durante a Manutenção de Base"]', 'Tipos de intervenção disponíveis', true),

-- Location options
('location_options', '["Hangar 1", "Hangar 2", "Hangar 3", "Rampa A", "Rampa B", "Rampa C", "Terminal", "Zona de Manutenção"]', 'Locais disponíveis para operações', true),

-- Company settings
('company_settings', '{"name": "AviationOps", "logo": "", "primaryColor": "#00b0ea", "secondaryColor": "#009ddf"}', 'Configurações da empresa', true),

-- System configuration
('system_config', '{"theme": "aviation-blue", "notifications": true, "autoSync": true, "offlineMode": false, "language": "pt", "timezone": "Atlantic/Azores"}', 'Configuração padrão do sistema', false),

-- Aircraft types
('aircraft_types', '["Avião Comercial", "Avião Privado", "Jato Executivo", "Avião de Carga", "Helicóptero", "Planador"]', 'Tipos de aeronave disponíveis', true),

-- Manufacturers
('manufacturers', '["Airbus", "Boeing", "Cessna", "Piper", "Embraer", "Beechcraft", "Cirrus", "Diamond", "Mooney", "Gulfstream"]', 'Fabricantes de aeronaves', true),

-- Employee roles
('employee_roles', '["Piloto Comercial", "Piloto Privado", "Copiloto", "Mecânico", "Técnico de Manutenção", "Gestor de Operações", "Supervisor de Limpeza", "Técnico de Limpeza"]', 'Funções de funcionários disponíveis', true),

-- Certifications
('certifications', '["ANAC", "IFR", "VFR", "Tipo Boeing 737", "Tipo Airbus A320", "ANAC Manutenção", "Inglês Técnico", "Mercadorias Perigosas"]', 'Certificações disponíveis', true),

-- Departments
('departments', '["Operações", "Manutenção", "Limpeza", "Administração", "Recursos Humanos", "Qualidade", "Segurança"]', 'Departamentos da empresa', true)

ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    updated_at = NOW();

-- =========================================================================
-- AIRCRAFT DATA (REAL DATA FROM SYSTEM)
-- =========================================================================

INSERT INTO public.aircraft (id, registration, model, manufacturer, status, last_inspection, flight_hours) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 'PT-ABC', 'Cessna 172', 'Cessna', 'active', '2024-01-15', 1250),
('11234567-89ab-cdef-0123-456789abcdef', 'PT-XYZ', 'Piper Cherokee', 'Piper', 'maintenance', '2024-01-10', 890),
('21234567-89ab-cdef-0123-456789abcdef', 'PT-DEF', 'Boeing 737-800', 'Boeing', 'active', '2024-01-20', 15420),
('31234567-89ab-cdef-0123-456789abcdef', 'PT-GHI', 'Embraer EMB-110', 'Embraer', 'active', '2024-01-12', 3250)
ON CONFLICT (id) DO UPDATE SET
    registration = EXCLUDED.registration,
    model = EXCLUDED.model,
    manufacturer = EXCLUDED.manufacturer,
    status = EXCLUDED.status,
    last_inspection = EXCLUDED.last_inspection,
    flight_hours = EXCLUDED.flight_hours,
    updated_at = NOW();

-- =========================================================================
-- EMPLOYEE DATA (REAL DATA FROM SYSTEM)
-- =========================================================================

INSERT INTO public.employees (id, name, email, role, certifications, hire_date, status) VALUES
-- Management and Directors
('a1234567-89ab-cdef-0123-456789abcd01', 'Amizanguel da Silva', 'amizanguel.silva@aviationops.ao', 'Director', '["Gestão", "Liderança"]', '2020-01-15', 'active'),
('a1234567-89ab-cdef-0123-456789abcd02', 'Jaime da Graça', 'jaime.graca@aviationops.ao', 'Director', '["Gestão", "Liderança"]', '2019-03-20', 'active'),
('a1234567-89ab-cdef-0123-456789abcd03', 'Evandra dos Santos', 'evandra.santos@aviationops.ao', 'D. Comercial e Marketing', '["Marketing", "Gestão Comercial"]', '2021-06-10', 'active'),
('a1234567-89ab-cdef-0123-456789abcd04', 'Liliana dos Santos', 'liliana.santos@aviationops.ao', 'D. Recursos Humanos', '["Recursos Humanos", "Gestão de Pessoas"]', '2020-09-05', 'active'),

-- Technical Staff
('a1234567-89ab-cdef-0123-456789abcd05', 'Augusto Tomás', 'augusto.tomas@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Segurança"]', '2018-04-12', 'active'),
('a1234567-89ab-cdef-0123-456789abcd06', 'Celestino Domingos', 'celestino.domingos@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Segurança"]', '2019-07-08', 'active'),
('a1234567-89ab-cdef-0123-456789abcd07', 'Daniel Segunda', 'daniel.segunda@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Operações de Rampa"]', '2020-02-14', 'active'),
('a1234567-89ab-cdef-0123-456789abcd08', 'Joaquim Cumbando João', 'joaquim.joao@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Segurança"]', '2018-11-30', 'active'),
('a1234567-89ab-cdef-0123-456789abcd09', 'José Garrido', 'jose.garrido@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Operações de Rampa"]', '2019-01-25', 'active'),
('a1234567-89ab-cdef-0123-456789abcd10', 'José João', 'jose.joao@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Segurança"]', '2017-08-18', 'active'),

-- Additional Technical Staff
('01234567-89ab-cdef-0123-456789abcd01', 'Maria Santos', 'maria@aviation.com', 'Piloto Comercial', '["ANAC", "IFR"]', '2023-06-01', 'active'),
('01234567-89ab-cdef-0123-456789abcd02', 'Carlos Lima', 'carlos@aviation.com', 'Mecânico', '["ANAC Manutenção"]', '2023-08-15', 'active'),
('01234567-89ab-cdef-0123-456789abcd03', 'Ana Rodrigues', 'ana@aviation.com', 'Supervisor de Limpeza', '["Mercadorias Perigosas"]', '2023-05-10', 'active'),
('01234567-89ab-cdef-0123-456789abcd04', 'João Silva', 'joao@aviation.com', 'Gestor de Operações', '["ANAC", "VFR", "Inglês Técnico"]', '2023-03-20', 'active'),
('01234567-89ab-cdef-0123-456789abcd05', 'Pedro Oliveira', 'pedro@aviation.com', 'Copiloto', '["ANAC", "IFR", "Tipo Boeing 737"]', '2023-09-01', 'active'),
('01234567-89ab-cdef-0123-456789abcd06', 'Lucia Costa', 'lucia@aviation.com', 'Técnico de Limpeza', '[]', '2023-11-15', 'active')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    certifications = EXCLUDED.certifications,
    hire_date = EXCLUDED.hire_date,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =========================================================================
-- CLEANING FORMS (REAL DATA FROM SYSTEM)
-- =========================================================================

INSERT INTO public.cleaning_forms (id, code, aircraft_id, date, time_start, time_end, location, intervention_type, observations, status, created_by, completed_by) VALUES
('01234567-89ab-cdef-0123-456789abcd30', 'LMP-001-2024', '01234567-89ab-cdef-0123-456789abcdef', '2024-01-20', '10:00:00', '12:30:00', 'Hangar 1', 'Limpeza Completa', 'Limpeza após voo de treinamento. Removidas manchas de óleo do trem de pouso.', 'completed', '01234567-89ab-cdef-0123-456789abcd03', '01234567-89ab-cdef-0123-456789abcd03'),
('01234567-89ab-cdef-0123-456789abcd31', 'LMP-002-2024', '21234567-89ab-cdef-0123-456789abcdef', '2024-01-22', '08:00:00', NULL, 'Rampa A', 'Limpeza Interior', 'Limpeza pós-voo comercial. Foco na cabine e área de passageiros.', 'in_progress', '01234567-89ab-cdef-0123-456789abcd03', NULL),
('01234567-89ab-cdef-0123-456789abcd32', 'LMP-003-2024', '11234567-89ab-cdef-0123-456789abcdef', '2024-01-18', '14:00:00', '16:00:00', 'Zona de Manutenção', 'Lavagem Profunda Durante a Manutenção de Base', 'Lavagem completa durante manutenção programada. Aplicado tratamento anticorrosão.', 'completed', '01234567-89ab-cdef-0123-456789abcd03', '01234567-89ab-cdef-0123-456789abcd06')
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    aircraft_id = EXCLUDED.aircraft_id,
    date = EXCLUDED.date,
    time_start = EXCLUDED.time_start,
    time_end = EXCLUDED.time_end,
    location = EXCLUDED.location,
    intervention_type = EXCLUDED.intervention_type,
    observations = EXCLUDED.observations,
    status = EXCLUDED.status,
    created_by = EXCLUDED.created_by,
    completed_by = EXCLUDED.completed_by,
    updated_at = NOW();

-- =========================================================================
-- TASKS (REAL DATA FROM SYSTEM)
-- =========================================================================

INSERT INTO public.tasks (id, title, description, assigned_to, aircraft_id, priority, status, due_date) VALUES
('01234567-89ab-cdef-0123-456789abcd10', 'Inspeção 100h PT-ABC', 'Inspeção programada de 100 horas de voo conforme manual do fabricante', '01234567-89ab-cdef-0123-456789abcd02', '01234567-89ab-cdef-0123-456789abcdef', 'high', 'pending', '2024-02-01'),
('01234567-89ab-cdef-0123-456789abcd11', 'Limpeza Completa PT-DEF', 'Limpeza completa interior e exterior após voo comercial', '01234567-89ab-cdef-0123-456789abcd03', '21234567-89ab-cdef-0123-456789abcdef', 'medium', 'in_progress', '2024-01-25'),
('01234567-89ab-cdef-0123-456789abcd12', 'Verificação Sistema Hidráulico', 'Verificação de rotina do sistema hidráulico do Embraer', '01234567-89ab-cdef-0123-456789abcd02', '31234567-89ab-cdef-0123-456789abcdef', 'urgent', 'pending', '2024-01-24'),
('01234567-89ab-cdef-0123-456789abcd13', 'Troca de Óleo PT-XYZ', 'Troca de óleo do motor durante manutenção programada', '01234567-89ab-cdef-0123-456789abcd02', '11234567-89ab-cdef-0123-456789abcdef', 'high', 'completed', '2024-01-20')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    assigned_to = EXCLUDED.assigned_to,
    aircraft_id = EXCLUDED.aircraft_id,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    due_date = EXCLUDED.due_date,
    updated_at = NOW();

-- =========================================================================
-- FLIGHT SHEETS (REAL DATA FROM SYSTEM)
-- =========================================================================

INSERT INTO public.flight_sheets (id, flight_number, aircraft_id, pilot_id, copilot_id, departure_airport, arrival_airport, departure_time, arrival_time, flight_hours, fuel_consumption, notes, status) VALUES
('01234567-89ab-cdef-0123-456789abcd20', 'AO001', '01234567-89ab-cdef-0123-456789abcdef', '01234567-89ab-cdef-0123-456789abcd01', NULL, 'SBSP', 'SBRJ', '2024-01-20T08:00:00Z', '2024-01-20T09:30:00Z', 1.5, 45.5, 'Voo de treinamento sem intercorrências', 'completed'),
('01234567-89ab-cdef-0123-456789abcd21', 'AO002', '21234567-89ab-cdef-0123-456789abcdef', '01234567-89ab-cdef-0123-456789abcd01', '01234567-89ab-cdef-0123-456789abcd05', 'SBGR', 'SBRF', '2024-01-22T14:00:00Z', '2024-01-22T16:45:00Z', 2.75, 1250.8, 'Voo comercial com 180 passageiros', 'completed'),
('01234567-89ab-cdef-0123-456789abcd22', 'AO003', '31234567-89ab-cdef-0123-456789abcdef', '01234567-89ab-cdef-0123-456789abcd04', NULL, 'SBCT', 'SBPA', '2024-01-24T10:30:00Z', NULL, 0, 0, 'Voo regional programado', 'planned')
ON CONFLICT (id) DO UPDATE SET
    flight_number = EXCLUDED.flight_number,
    aircraft_id = EXCLUDED.aircraft_id,
    pilot_id = EXCLUDED.pilot_id,
    copilot_id = EXCLUDED.copilot_id,
    departure_airport = EXCLUDED.departure_airport,
    arrival_airport = EXCLUDED.arrival_airport,
    departure_time = EXCLUDED.departure_time,
    arrival_time = EXCLUDED.arrival_time,
    flight_hours = EXCLUDED.flight_hours,
    fuel_consumption = EXCLUDED.fuel_consumption,
    notes = EXCLUDED.notes,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =========================================================================
-- VERIFICATION AND SUMMARY
-- =========================================================================

-- Final verification
DO $$
DECLARE 
    total_aircraft INTEGER;
    total_employees INTEGER;
    total_forms INTEGER;
    total_tasks INTEGER;
    total_flights INTEGER;
    total_settings INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_aircraft FROM public.aircraft;
    SELECT COUNT(*) INTO total_employees FROM public.employees;
    SELECT COUNT(*) INTO total_forms FROM public.cleaning_forms;
    SELECT COUNT(*) INTO total_tasks FROM public.tasks;
    SELECT COUNT(*) INTO total_flights FROM public.flight_sheets;
    SELECT COUNT(*) INTO total_settings FROM public.system_settings;
    
    RAISE NOTICE 'VFINAL SEED DATA LOADED:';
    RAISE NOTICE '========================';
    RAISE NOTICE 'Aircraft: %', total_aircraft;
    RAISE NOTICE 'Employees: %', total_employees;
    RAISE NOTICE 'Cleaning Forms: %', total_forms;
    RAISE NOTICE 'Tasks: %', total_tasks;
    RAISE NOTICE 'Flight Sheets: %', total_flights;
    RAISE NOTICE 'System Settings: %', total_settings;
    RAISE NOTICE 'Production system ready!';
END $$;

-- Update seed data version
INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
VALUES ('seed_data_version', '"vfinal"', 'Seed data version', false)
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = '"vfinal"',
    updated_at = NOW();

SELECT 'VFINAL Production Seed Data Loaded Successfully' as status;
