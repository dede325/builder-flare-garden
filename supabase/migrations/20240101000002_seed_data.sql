-- Seed data for AviationOps database
-- Inserts demo data matching the offline database structure

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public, created_at, updated_at) VALUES
(
    'intervention_types',
    '["Limpeza Exterior", "Limpeza Interior", "Polimento", "Lavagem Profunda Durante a Manutenção de Base"]'::jsonb,
    'Available intervention types for cleaning forms',
    true,
    NOW(),
    NOW()
),
(
    'location_options',
    '["Hangar 1", "Hangar 2", "Hangar 3", "Rampa A", "Rampa B", "Rampa C", "Terminal", "Zona de Manutenção"]'::jsonb,
    'Available locations for cleaning operations',
    true,
    NOW(),
    NOW()
),
(
    'company_settings',
    '{
        "name": "AviationOps",
        "logo": "",
        "primaryColor": "#00b0ea",
        "secondaryColor": "#009ddf"
    }'::jsonb,
    'Company branding and configuration',
    true,
    NOW(),
    NOW()
),
(
    'system_config',
    '{
        "theme": "aviation-blue",
        "notifications": true,
        "autoSync": true,
        "offlineMode": false,
        "language": "pt",
        "timezone": "Atlantic/Azores"
    }'::jsonb,
    'System configuration defaults',
    false,
    NOW(),
    NOW()
),
(
    'aircraft_types',
    '["Avião Comercial", "Avião Privado", "Jato Executivo", "Avião de Carga", "Helicóptero", "Planador"]'::jsonb,
    'Available aircraft types',
    true,
    NOW(),
    NOW()
),
(
    'manufacturers',
    '["Airbus", "Boeing", "Cessna", "Piper", "Embraer", "Beechcraft", "Cirrus", "Diamond", "Mooney", "Gulfstream"]'::jsonb,
    'Aircraft manufacturers',
    true,
    NOW(),
    NOW()
),
(
    'employee_roles',
    '["Piloto Comercial", "Piloto Privado", "Copiloto", "Mecânico", "Técnico de Manutenção", "Gestor de Operações", "Supervisor de Limpeza", "Técnico de Limpeza"]'::jsonb,
    'Available employee roles',
    true,
    NOW(),
    NOW()
),
(
    'certifications',
    '["ANAC", "IFR", "VFR", "Tipo Boeing 737", "Tipo Airbus A320", "ANAC Manutenção", "Inglês Técnico", "Mercadorias Perigosas"]'::jsonb,
    'Available certifications',
    true,
    NOW(),
    NOW()
),
(
    'departments',
    '["Operações", "Manutenção", "Limpeza", "Administração", "Recursos Humanos", "Qualidade", "Segurança"]'::jsonb,
    'Company departments',
    true,
    NOW(),
    NOW()
);

-- Insert demo aircraft
INSERT INTO aircraft (id, registration, model, manufacturer, status, last_inspection, flight_hours, created_at, updated_at) VALUES
(
    '01234567-89ab-cdef-0123-456789abcdef',
    'PT-ABC',
    'Cessna 172',
    'Cessna',
    'active',
    '2024-01-15',
    1250,
    '2024-01-01 00:00:00+00',
    '2024-01-15 00:00:00+00'
),
(
    '11234567-89ab-cdef-0123-456789abcdef',
    'PT-XYZ',
    'Piper Cherokee',
    'Piper',
    'maintenance',
    '2024-01-10',
    890,
    '2024-01-01 00:00:00+00',
    '2024-01-10 00:00:00+00'
),
(
    '21234567-89ab-cdef-0123-456789abcdef',
    'PT-DEF',
    'Boeing 737-800',
    'Boeing',
    'active',
    '2024-01-20',
    15420,
    '2024-01-01 00:00:00+00',
    '2024-01-20 00:00:00+00'
),
(
    '31234567-89ab-cdef-0123-456789abcdef',
    'PT-GHI',
    'Embraer EMB-110',
    'Embraer',
    'active',
    '2024-01-12',
    3250,
    '2024-01-01 00:00:00+00',
    '2024-01-12 00:00:00+00'
);

-- Insert demo employees
INSERT INTO employees (id, name, email, role, certifications, hire_date, status, created_at, updated_at) VALUES
(
    '01234567-89ab-cdef-0123-456789abcd01',
    'Maria Santos',
    'maria@aviation.com',
    'Piloto Comercial',
    '["ANAC", "IFR"]'::jsonb,
    '2023-06-01',
    'active',
    '2023-06-01 00:00:00+00',
    '2024-01-01 00:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd02',
    'Carlos Lima',
    'carlos@aviation.com',
    'Mecânico',
    '["ANAC Manutenção"]'::jsonb,
    '2023-08-15',
    'active',
    '2023-08-15 00:00:00+00',
    '2024-01-01 00:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd03',
    'Ana Rodrigues',
    'ana@aviation.com',
    'Supervisor de Limpeza',
    '["Mercadorias Perigosas"]'::jsonb,
    '2023-05-10',
    'active',
    '2023-05-10 00:00:00+00',
    '2024-01-01 00:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd04',
    'João Silva',
    'joao@aviation.com',
    'Gestor de Operações',
    '["ANAC", "VFR", "Inglês Técnico"]'::jsonb,
    '2023-03-20',
    'active',
    '2023-03-20 00:00:00+00',
    '2024-01-01 00:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd05',
    'Pedro Oliveira',
    'pedro@aviation.com',
    'Copiloto',
    '["ANAC", "IFR", "Tipo Boeing 737"]'::jsonb,
    '2023-09-01',
    'active',
    '2023-09-01 00:00:00+00',
    '2024-01-01 00:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd06',
    'Lucia Costa',
    'lucia@aviation.com',
    'Técnico de Limpeza',
    '[]'::jsonb,
    '2023-11-15',
    'active',
    '2023-11-15 00:00:00+00',
    '2024-01-01 00:00:00+00'
);

-- Insert demo tasks
INSERT INTO tasks (id, title, description, assigned_to, aircraft_id, priority, status, due_date, created_at, updated_at) VALUES
(
    '01234567-89ab-cdef-0123-456789abcd10',
    'Inspeção 100h PT-ABC',
    'Inspeção programada de 100 horas de voo conforme manual do fabricante',
    '01234567-89ab-cdef-0123-456789abcd02',
    '01234567-89ab-cdef-0123-456789abcdef',
    'high',
    'pending',
    '2024-02-01',
    '2024-01-15 00:00:00+00',
    '2024-01-15 00:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd11',
    'Limpeza Completa PT-DEF',
    'Limpeza completa interior e exterior após voo comercial',
    '01234567-89ab-cdef-0123-456789abcd03',
    '21234567-89ab-cdef-0123-456789abcdef',
    'medium',
    'in_progress',
    '2024-01-25',
    '2024-01-22 00:00:00+00',
    '2024-01-22 00:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd12',
    'Verificação Sistema Hidráulico',
    'Verificação de rotina do sistema hidráulico do Embraer',
    '01234567-89ab-cdef-0123-456789abcd02',
    '31234567-89ab-cdef-0123-456789abcdef',
    'urgent',
    'pending',
    '2024-01-24',
    '2024-01-23 00:00:00+00',
    '2024-01-23 00:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd13',
    'Troca de Óleo PT-XYZ',
    'Troca de óleo do motor durante manutenção programada',
    '01234567-89ab-cdef-0123-456789abcd02',
    '11234567-89ab-cdef-0123-456789abcdef',
    'high',
    'completed',
    '2024-01-20',
    '2024-01-18 00:00:00+00',
    '2024-01-20 00:00:00+00'
);

-- Insert demo flight sheets
INSERT INTO flight_sheets (id, flight_number, aircraft_id, pilot_id, copilot_id, departure_airport, arrival_airport, departure_time, arrival_time, flight_hours, fuel_consumption, notes, status, created_at, updated_at) VALUES
(
    '01234567-89ab-cdef-0123-456789abcd20',
    'AO001',
    '01234567-89ab-cdef-0123-456789abcdef',
    '01234567-89ab-cdef-0123-456789abcd01',
    NULL,
    'SBSP',
    'SBRJ',
    '2024-01-20 08:00:00+00',
    '2024-01-20 09:30:00+00',
    1.5,
    45.50,
    'Voo de treinamento sem intercorrências',
    'completed',
    '2024-01-20 00:00:00+00',
    '2024-01-20 10:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd21',
    'AO002',
    '21234567-89ab-cdef-0123-456789abcdef',
    '01234567-89ab-cdef-0123-456789abcd01',
    '01234567-89ab-cdef-0123-456789abcd05',
    'SBGR',
    'SBRF',
    '2024-01-22 14:00:00+00',
    '2024-01-22 16:45:00+00',
    2.75,
    1250.80,
    'Voo comercial com 180 passageiros',
    'completed',
    '2024-01-22 00:00:00+00',
    '2024-01-22 17:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd22',
    'AO003',
    '31234567-89ab-cdef-0123-456789abcdef',
    '01234567-89ab-cdef-0123-456789abcd04',
    NULL,
    'SBCT',
    'SBPA',
    '2024-01-24 10:30:00+00',
    NULL,
    0,
    0,
    'Voo regional programado',
    'planned',
    '2024-01-23 00:00:00+00',
    '2024-01-23 00:00:00+00'
);

-- Insert demo cleaning forms
INSERT INTO cleaning_forms (id, code, aircraft_id, date, time_start, time_end, location, intervention_type, observations, status, created_by, completed_by, created_at, updated_at) VALUES
(
    '01234567-89ab-cdef-0123-456789abcd30',
    'LMP-001-2024',
    '01234567-89ab-cdef-0123-456789abcdef',
    '2024-01-20',
    '10:00:00',
    '12:30:00',
    'Hangar 1',
    'Limpeza Completa',
    'Limpeza após voo de treinamento. Removidas manchas de óleo do trem de pouso.',
    'completed',
    '01234567-89ab-cdef-0123-456789abcd03',
    '01234567-89ab-cdef-0123-456789abcd03',
    '2024-01-20 10:00:00+00',
    '2024-01-20 12:30:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd31',
    'LMP-002-2024',
    '21234567-89ab-cdef-0123-456789abcdef',
    '2024-01-22',
    '08:00:00',
    NULL,
    'Rampa A',
    'Limpeza Interior',
    'Limpeza pós-voo comercial. Foco na cabine e área de passageiros.',
    'in_progress',
    '01234567-89ab-cdef-0123-456789abcd03',
    NULL,
    '2024-01-22 08:00:00+00',
    '2024-01-22 09:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd32',
    'LMP-003-2024',
    '11234567-89ab-cdef-0123-456789abcdef',
    '2024-01-18',
    '14:00:00',
    '16:00:00',
    'Zona de Manutenção',
    'Lavagem Profunda Durante a Manutenção de Base',
    'Lavagem completa durante manutenção programada. Aplicado tratamento anticorrosão.',
    'completed',
    '01234567-89ab-cdef-0123-456789abcd03',
    '01234567-89ab-cdef-0123-456789abcd06',
    '2024-01-18 14:00:00+00',
    '2024-01-18 16:00:00+00'
);

-- Insert demo cleaning form employees
INSERT INTO cleaning_form_employees (id, cleaning_form_id, employee_id, role, start_time, end_time, signature_data, created_at, updated_at) VALUES
(
    '01234567-89ab-cdef-0123-456789abcd40',
    '01234567-89ab-cdef-0123-456789abcd30',
    '01234567-89ab-cdef-0123-456789abcd03',
    'supervisor',
    '10:00:00',
    '12:30:00',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    '2024-01-20 10:00:00+00',
    '2024-01-20 12:30:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd41',
    '01234567-89ab-cdef-0123-456789abcd30',
    '01234567-89ab-cdef-0123-456789abcd06',
    'technician',
    '10:00:00',
    '12:30:00',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    '2024-01-20 10:00:00+00',
    '2024-01-20 12:30:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd42',
    '01234567-89ab-cdef-0123-456789abcd31',
    '01234567-89ab-cdef-0123-456789abcd03',
    'supervisor',
    '08:00:00',
    NULL,
    NULL,
    '2024-01-22 08:00:00+00',
    '2024-01-22 09:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd43',
    '01234567-89ab-cdef-0123-456789abcd32',
    '01234567-89ab-cdef-0123-456789abcd03',
    'supervisor',
    '14:00:00',
    '16:00:00',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    '2024-01-18 14:00:00+00',
    '2024-01-18 16:00:00+00'
),
(
    '01234567-89ab-cdef-0123-456789abcd44',
    '01234567-89ab-cdef-0123-456789abcd32',
    '01234567-89ab-cdef-0123-456789abcd06',
    'technician',
    '14:00:00',
    '16:00:00',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    '2024-01-18 14:00:00+00',
    '2024-01-18 16:00:00+00'
);
