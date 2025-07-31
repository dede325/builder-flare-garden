-- Migration for specific employees with real data
-- Insert specific employees with their roles and details

-- Insert specific employees into employees table (for backward compatibility)
INSERT INTO employees (id, name, email, role, certifications, hire_date, status, created_at, updated_at, is_system_user) VALUES
-- Directors
('a1234567-89ab-cdef-0123-456789abcd01', 'Amizanguel da Silva', 'amizanguel.silva@aviationops.ao', 'Director', '["Gestão", "Liderança"]', '2020-01-15', 'active', NOW(), NOW(), true),
('a1234567-89ab-cdef-0123-456789abcd02', 'Jaime da Graça', 'jaime.graca@aviationops.ao', 'Director', '["Gestão", "Liderança"]', '2019-03-20', 'active', NOW(), NOW(), true),

-- Department Heads
('a1234567-89ab-cdef-0123-456789abcd03', 'Evandra dos Santos', 'evandra.santos@aviationops.ao', 'D. Comercial e Marketing', '["Marketing", "Gestão Comercial"]', '2021-06-10', 'active', NOW(), NOW(), true),
('a1234567-89ab-cdef-0123-456789abcd04', 'Liliana dos Santos', 'liliana.santos@aviationops.ao', 'D. Recursos Humanos', '["Recursos Humanos", "Gestão de Pessoas"]', '2020-09-05', 'active', NOW(), NOW(), true),

-- Technicians
('a1234567-89ab-cdef-0123-456789abcd05', 'Augusto Tomás', 'augusto.tomas@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Segurança"]', '2018-04-12', 'active', NOW(), NOW(), true),
('a1234567-89ab-cdef-0123-456789abcd06', 'Celestino Domingos', 'celestino.domingos@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Segurança"]', '2019-07-08', 'active', NOW(), NOW(), true),
('a1234567-89ab-cdef-0123-456789abcd07', 'Daniel Segunda', 'daniel.segunda@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Operações de Rampa"]', '2020-02-14', 'active', NOW(), NOW(), true),
('a1234567-89ab-cdef-0123-456789abcd08', 'Joaquim Cumbando João', 'joaquim.joao@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Segurança"]', '2018-11-30', 'active', NOW(), NOW(), true),
('a1234567-89ab-cdef-0123-456789abcd09', 'José Garrido', 'jose.garrido@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Operações de Rampa"]', '2019-01-25', 'active', NOW(), NOW(), true),
('a1234567-89ab-cdef-0123-456789abcd10', 'José João', 'jose.joao@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Segurança"]', '2017-08-18', 'active', NOW(), NOW(), true),
('a1234567-89ab-cdef-0123-456789abcd11', 'Manuel Coelho', 'manuel.coelho@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Operações de Rampa"]', '2020-05-22', 'active', NOW(), NOW(), true),
('a1234567-89ab-cdef-0123-456789abcd12', 'Mário Quiluange', 'mario.quiluange@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Segurança"]', '2016-12-03', 'active', NOW(), NOW(), true),
('a1234567-89ab-cdef-0123-456789abcd13', 'Reginaldo Golveia', 'reginaldo.golveia@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Operações de Rampa"]', '2016-10-15', 'active', NOW(), NOW(), true),
('a1234567-89ab-cdef-0123-456789abcd14', 'Wilson Hongolo', 'wilson.hongolo@aviationops.ao', 'Técnico Auxiliar de Placa', '["Manutenção de Aeronaves", "Segurança"]', '2015-03-08', 'active', NOW(), NOW(), true);

-- Function to create auth users and profiles for specific employees
-- This creates complete user profiles with authentication
CREATE OR REPLACE FUNCTION create_employee_auth_profiles()
RETURNS void AS $$
DECLARE
    employee_record RECORD;
    user_uuid UUID;
    default_password TEXT := 'AviationOps2024!'; -- Default password for all users
BEGIN
    -- Loop through specific employees and create auth profiles
    FOR employee_record IN (
        SELECT 
            name,
            email,
            role,
            certifications,
            hire_date,
            CASE 
                WHEN name = 'Augusto Tomás' THEN '000862944ME035'
                WHEN name = 'Amizanguel da Silva' THEN '001023626BA037'
                WHEN name = 'Celestino Domingos' THEN '000951540HA036'
                WHEN name = 'Daniel Segunda' THEN '003557571HO034'
                WHEN name = 'Evandra dos Santos' THEN '005280783LA047'
                WHEN name = 'Jaime da Graça' THEN '000821215LA035'
                WHEN name = 'Joaquim Cumbando João' THEN '001141347LA031'
                WHEN name = 'José Garrido' THEN '003588004ME037'
                WHEN name = 'José João' THEN '000040089LA035'
                WHEN name = 'Liliana dos Santos' THEN '005259127LA042'
                WHEN name = 'Manuel Coelho' THEN '000650503LN039'
                WHEN name = 'Mário Quiluange' THEN '000062106LA017'
                WHEN name = 'Reginaldo Golveia' THEN '000195323LA017'
                WHEN name = 'Wilson Hongolo' THEN '000161916LA015'
                ELSE NULL
            END as employee_number
        FROM employees 
        WHERE is_system_user = true
    ) LOOP
        -- Generate UUID for user
        user_uuid := uuid_generate_v4();
        
        -- Insert into user_profiles (simulating auth.users creation)
        INSERT INTO user_profiles (
            id,
            employee_number,
            first_name,
            last_name,
            display_name,
            phone,
            emergency_contact,
            department,
            hire_date,
            license_number,
            certifications,
            preferences,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            user_uuid,
            employee_record.employee_number,
            split_part(employee_record.name, ' ', 1), -- First name
            CASE 
                WHEN array_length(string_to_array(employee_record.name, ' '), 1) > 2 
                THEN array_to_string(string_to_array(employee_record.name, ' ')[2:], ' ')
                ELSE split_part(employee_record.name, ' ', 2)
            END, -- Last name
            employee_record.name, -- Display name
            '+244 9' || LPAD((RANDOM() * 99999999)::INT::TEXT, 8, '0'), -- Random phone
            '+244 9' || LPAD((RANDOM() * 99999999)::INT::TEXT, 8, '0'), -- Random emergency contact
            CASE 
                WHEN employee_record.role LIKE '%Director%' OR employee_record.role = 'Director' THEN 'Administração'
                WHEN employee_record.role LIKE '%Comercial%' THEN 'Comercial e Marketing'
                WHEN employee_record.role LIKE '%Recursos Humanos%' THEN 'Recursos Humanos'
                WHEN employee_record.role LIKE '%Técnico%' THEN 'Manutenção'
                ELSE 'Operações'
            END, -- Department
            employee_record.hire_date::DATE,
            CASE 
                WHEN employee_record.role LIKE '%Técnico%' THEN 'TEC' || employee_record.employee_number
                WHEN employee_record.role = 'Director' THEN 'DIR' || employee_record.employee_number
                ELSE 'GES' || employee_record.employee_number
            END, -- License number
            employee_record.certifications,
            '{
                "theme": "aviation-blue",
                "notifications": true,
                "language": "pt",
                "timezone": "Africa/Luanda"
            }'::jsonb,
            true,
            NOW(),
            NOW()
        );
        
        -- Assign appropriate role based on position
        IF employee_record.role = 'Director' THEN
            -- Assign manager role to directors
            INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
            SELECT user_uuid, id, NULL, true FROM roles WHERE name = 'manager';
        ELSIF employee_record.role LIKE '%D.%' OR employee_record.role LIKE '%Recursos Humanos%' OR employee_record.role LIKE '%Comercial%' THEN
            -- Assign supervisor role to department heads
            INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
            SELECT user_uuid, id, NULL, true FROM roles WHERE name = 'supervisor';
        ELSIF employee_record.role LIKE '%Técnico%' THEN
            -- Assign technician role to technical staff
            INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
            SELECT user_uuid, id, NULL, true FROM roles WHERE name = 'technician';
        ELSE
            -- Default to technician role
            INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
            SELECT user_uuid, id, NULL, true FROM roles WHERE name = 'technician';
        END IF;
        
        -- Update employees table with user_id reference
        UPDATE employees 
        SET user_id = user_uuid 
        WHERE email = employee_record.email;
        
        -- Log the creation
        INSERT INTO user_activity_log (user_id, action, resource_type, details)
        VALUES (
            user_uuid,
            'employee_profile_created',
            'user_profiles',
            jsonb_build_object(
                'employee_number', employee_record.employee_number,
                'role', employee_record.role,
                'auto_generated', true
            )
        );
        
    END LOOP;
    
    RAISE NOTICE 'Created profiles for % employees', (SELECT COUNT(*) FROM employees WHERE is_system_user = true);
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create profiles
SELECT create_employee_auth_profiles();

-- Drop the function after use
DROP FUNCTION IF EXISTS create_employee_auth_profiles();

-- Create some sample tasks assigned to these employees
INSERT INTO tasks (id, title, description, assigned_to, aircraft_id, priority, status, due_date, created_at, updated_at) VALUES
-- Assign tasks to different technicians
('t1234567-89ab-cdef-0123-456789abcd01', 'Inspeção Diária PT-ABC', 'Inspeção visual diária da aeronave PT-ABC', 'a1234567-89ab-cdef-0123-456789abcd05', '01234567-89ab-cdef-0123-456789abcdef', 'medium', 'pending', '2024-01-25', NOW(), NOW()),
('t1234567-89ab-cdef-0123-456789abcd02', 'Manutenção Motor PT-XYZ', 'Verificação e manutenção do motor', 'a1234567-89ab-cdef-0123-456789abcd06', '11234567-89ab-cdef-0123-456789abcdef', 'high', 'in_progress', '2024-01-26', NOW(), NOW()),
('t1234567-89ab-cdef-0123-456789abcd03', 'Limpeza Completa PT-DEF', 'Limpeza completa interior e exterior', 'a1234567-89ab-cdef-0123-456789abcd07', '21234567-89ab-cdef-0123-456789abcdef', 'medium', 'pending', '2024-01-27', NOW(), NOW()),
('t1234567-89ab-cdef-0123-456789abcd04', 'Verificação Sistema Hidráulico', 'Inspeção do sistema hidráulico', 'a1234567-89ab-cdef-0123-456789abcd08', '31234567-89ab-cdef-0123-456789abcdef', 'urgent', 'pending', '2024-01-24', NOW(), NOW()),
('t1234567-89ab-cdef-0123-456789abcd05', 'Troca de Filtros', 'Substituição de filtros de combustível', 'a1234567-89ab-cdef-0123-456789abcd09', '01234567-89ab-cdef-0123-456789abcdef', 'medium', 'completed', '2024-01-23', NOW(), NOW());

-- Create some cleaning forms with these employees
INSERT INTO cleaning_forms (id, code, aircraft_id, date, time_start, time_end, location, intervention_type, observations, status, created_by, completed_by, created_at, updated_at) VALUES
('c1234567-89ab-cdef-0123-456789abcd01', 'LMP-ANG-001-2024', '01234567-89ab-cdef-0123-456789abcdef', '2024-01-22', '08:00:00', '10:30:00', 'Hangar Principal', 'Limpeza Completa', 'Limpeza executada pela equipa de Augusto Tomás', 'completed', 'a1234567-89ab-cdef-0123-456789abcd05', 'a1234567-89ab-cdef-0123-456789abcd05', NOW(), NOW()),
('c1234567-89ab-cdef-0123-456789abcd02', 'LMP-ANG-002-2024', '21234567-89ab-cdef-0123-456789abcdef', '2024-01-23', '14:00:00', NULL, 'Rampa A', 'Limpeza Interior', 'Limpeza em progresso', 'in_progress', 'a1234567-89ab-cdef-0123-456789abcd06', NULL, NOW(), NOW());

-- Add employees to cleaning forms
INSERT INTO cleaning_form_employees (id, cleaning_form_id, employee_id, role, start_time, end_time, created_at, updated_at) VALUES
('ce123456-89ab-cdef-0123-456789abcd01', 'c1234567-89ab-cdef-0123-456789abcd01', 'a1234567-89ab-cdef-0123-456789abcd05', 'supervisor', '08:00:00', '10:30:00', NOW(), NOW()),
('ce123456-89ab-cdef-0123-456789abcd02', 'c1234567-89ab-cdef-0123-456789abcd01', 'a1234567-89ab-cdef-0123-456789abcd10', 'technician', '08:00:00', '10:30:00', NOW(), NOW()),
('ce123456-89ab-cdef-0123-456789abcd03', 'c1234567-89ab-cdef-0123-456789abcd02', 'a1234567-89ab-cdef-0123-456789abcd06', 'supervisor', '14:00:00', NULL, NOW(), NOW()),
('ce123456-89ab-cdef-0123-456789abcd04', 'c1234567-89ab-cdef-0123-456789abcd02', 'a1234567-89ab-cdef-0123-456789abcd11', 'technician', '14:00:00', NULL, NOW(), NOW());

-- Update system_settings with real company information
UPDATE system_settings 
SET setting_value = '{
    "name": "AviationOps Angola",
    "logo": "",
    "primaryColor": "#00b0ea",
    "secondaryColor": "#009ddf",
    "country": "Angola",
    "timezone": "Africa/Luanda",
    "currency": "AOA",
    "language": "pt"
}'::jsonb
WHERE setting_key = 'company_settings';

-- Add additional permissions for Angolan aviation regulations
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('manage_anac_compliance', 'Gerir Conformidade ANAC', 'Gerir conformidade com regulamentos da ANAC', 'compliance', 'manage'),
('read_anac_reports', 'Ver Relatórios ANAC', 'Visualizar relatórios de conformidade ANAC', 'compliance', 'read'),
('manage_safety_protocols', 'Gerir Protocolos de Segurança', 'Configurar protocolos de segurança aeroportuária', 'safety', 'manage'),
('read_maintenance_logs', 'Ver Logs de Manutenção', 'Acesso aos registos de manutenção', 'maintenance_logs', 'read'),
('create_maintenance_logs', 'Criar Logs de Manutenção', 'Registar atividades de manutenção', 'maintenance_logs', 'create');

-- Assign new permissions to appropriate roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name IN ('admin', 'manager') 
AND p.name IN ('manage_anac_compliance', 'read_anac_reports', 'manage_safety_protocols');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name IN ('supervisor', 'mechanic', 'technician') 
AND p.name IN ('read_anac_reports', 'read_maintenance_logs', 'create_maintenance_logs');

-- Create initial admin user profile for system setup
-- This should be called after actual auth.users creation via Supabase Auth
INSERT INTO user_profiles (
    id,
    employee_number,
    first_name,
    last_name,
    display_name,
    phone,
    department,
    hire_date,
    license_number,
    certifications,
    preferences,
    is_active,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001', -- This should match actual auth.users.id
    'ADMIN001',
    'Sistema',
    'Administrador',
    'Administrador do Sistema',
    '+244 900000000',
    'Administração',
    '2024-01-01',
    'ADMIN001',
    '["Administração do Sistema", "Gestão Completa"]'::jsonb,
    '{
        "theme": "aviation-blue",
        "notifications": true,
        "language": "pt",
        "timezone": "Africa/Luanda"
    }'::jsonb,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Assign super_admin role to system admin
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT '00000000-0000-0000-0000-000000000001', id, NULL, true 
FROM roles WHERE name = 'super_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Log completion
INSERT INTO user_activity_log (user_id, action, resource_type, details)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'employee_migration_completed',
    'system',
    jsonb_build_object(
        'total_employees', (SELECT COUNT(*) FROM employees WHERE is_system_user = true),
        'migration_date', NOW(),
        'version', '20240101000005'
    )
);
