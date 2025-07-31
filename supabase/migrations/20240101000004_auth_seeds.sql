-- Authentication System Seeds
-- Insert roles, permissions, and initial data

-- Insert system roles
INSERT INTO roles (id, name, display_name, description, level, is_system_role) VALUES
('00000000-0000-0000-0000-000000000001', 'super_admin', 'Super Administrador', 'Acesso total ao sistema', 100, true),
('00000000-0000-0000-0000-000000000002', 'admin', 'Administrador', 'Administrador do sistema', 90, true),
('00000000-0000-0000-0000-000000000003', 'manager', 'Gestor', 'Gestor de operações', 70, false),
('00000000-0000-0000-0000-000000000004', 'supervisor', 'Supervisor', 'Supervisor de equipa', 50, false),
('00000000-0000-0000-0000-000000000005', 'pilot', 'Piloto', 'Piloto de aeronaves', 40, false),
('00000000-0000-0000-0000-000000000006', 'mechanic', 'Mecânico', 'Técnico de manutenção', 30, false),
('00000000-0000-0000-0000-000000000007', 'technician', 'Técnico', 'Técnico de limpeza', 20, false),
('00000000-0000-0000-0000-000000000008', 'viewer', 'Visualizador', 'Apenas visualização', 10, false);

-- Insert permissions
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
-- System permissions
('manage_system', 'Gerenciar Sistema', 'Configurações completas do sistema', 'system', 'manage'),
('manage_users', 'Gerenciar Utilizadores', 'Criar, editar e remover utilizadores', 'users', 'manage'),
('manage_roles', 'Gerenciar Roles', 'Criar e editar roles do sistema', 'roles', 'manage'),
('manage_permissions', 'Gerenciar Permissões', 'Configurar permissões do sistema', 'permissions', 'manage'),
('manage_user_roles', 'Gerenciar Roles de Utilizadores', 'Atribuir roles aos utilizadores', 'user_roles', 'manage'),

-- User permissions
('read_users', 'Ver Utilizadores', 'Visualizar perfis de utilizadores', 'users', 'read'),
('update_users', 'Editar Utilizadores', 'Editar perfis de utilizadores', 'users', 'update'),
('create_users', 'Criar Utilizadores', 'Registar novos utilizadores', 'users', 'create'),
('delete_users', 'Remover Utilizadores', 'Desativar utilizadores', 'users', 'delete'),

-- Aircraft permissions
('read_aircraft', 'Ver Aeronaves', 'Visualizar dados das aeronaves', 'aircraft', 'read'),
('create_aircraft', 'Criar Aeronaves', 'Registar novas aeronaves', 'aircraft', 'create'),
('update_aircraft', 'Editar Aeronaves', 'Modificar dados das aeronaves', 'aircraft', 'update'),
('delete_aircraft', 'Remover Aeronaves', 'Remover aeronaves do sistema', 'aircraft', 'delete'),
('manage_aircraft', 'Gerenciar Aeronaves', 'Controlo completo das aeronaves', 'aircraft', 'manage'),

-- Employee permissions
('read_employees', 'Ver Funcionários', 'Visualizar dados dos funcionários', 'employees', 'read'),
('create_employees', 'Criar Funcionários', 'Registar novos funcionários', 'employees', 'create'),
('update_employees', 'Editar Funcionários', 'Modificar dados dos funcionários', 'employees', 'update'),
('delete_employees', 'Remover Funcionários', 'Remover funcionários do sistema', 'employees', 'delete'),
('manage_employees', 'Gerenciar Funcionários', 'Controlo completo dos funcionários', 'employees', 'manage'),

-- Task permissions
('read_tasks', 'Ver Tarefas', 'Visualizar tarefas', 'tasks', 'read'),
('create_tasks', 'Criar Tarefas', 'Criar novas tarefas', 'tasks', 'create'),
('update_tasks', 'Editar Tarefas', 'Modificar tarefas', 'tasks', 'update'),
('delete_tasks', 'Remover Tarefas', 'Remover tarefas', 'tasks', 'delete'),
('assign_tasks', 'Atribuir Tarefas', 'Atribuir tarefas a funcionários', 'tasks', 'assign'),
('complete_tasks', 'Concluir Tarefas', 'Marcar tarefas como concluídas', 'tasks', 'complete'),

-- Flight sheet permissions
('read_flight_sheets', 'Ver Fichas de Voo', 'Visualizar fichas de voo', 'flight_sheets', 'read'),
('create_flight_sheets', 'Criar Fichas de Voo', 'Criar novas fichas de voo', 'flight_sheets', 'create'),
('update_flight_sheets', 'Editar Fichas de Voo', 'Modificar fichas de voo', 'flight_sheets', 'update'),
('delete_flight_sheets', 'Remover Fichas de Voo', 'Remover fichas de voo', 'flight_sheets', 'delete'),
('approve_flight_sheets', 'Aprovar Fichas de Voo', 'Aprovar fichas de voo', 'flight_sheets', 'approve'),

-- Cleaning form permissions
('read_cleaning_forms', 'Ver Formulários de Limpeza', 'Visualizar formulários de limpeza', 'cleaning_forms', 'read'),
('create_cleaning_forms', 'Criar Formulários de Limpeza', 'Criar novos formulários', 'cleaning_forms', 'create'),
('update_cleaning_forms', 'Editar Formulários de Limpeza', 'Modificar formulários', 'cleaning_forms', 'update'),
('delete_cleaning_forms', 'Remover Formulários de Limpeza', 'Remover formulários', 'cleaning_forms', 'delete'),
('approve_cleaning_forms', 'Aprovar Formulários de Limpeza', 'Aprovar trabalhos de limpeza', 'cleaning_forms', 'approve'),

-- Report permissions
('read_reports', 'Ver Relatórios', 'Visualizar relatórios do sistema', 'reports', 'read'),
('create_reports', 'Criar Relatórios', 'Gerar relatórios personalizados', 'reports', 'create'),
('export_reports', 'Exportar Relatórios', 'Exportar relatórios em vários formatos', 'reports', 'export'),

-- Settings permissions
('read_settings', 'Ver Configurações', 'Visualizar configurações do sistema', 'settings', 'read'),
('update_settings', 'Editar Configurações', 'Modificar configurações', 'settings', 'update'),

-- Activity log permissions
('read_activity_logs', 'Ver Logs de Atividade', 'Visualizar logs de atividade', 'activity_logs', 'read'),
('manage_activity_logs', 'Gerenciar Logs de Atividade', 'Gerenciar logs do sistema', 'activity_logs', 'manage');

-- Assign permissions to roles

-- Super Admin - All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions;

-- Admin - All except super admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id 
FROM permissions 
WHERE name != 'manage_system';

-- Manager - Management permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000003', id 
FROM permissions 
WHERE name IN (
    'read_users', 'update_users', 'create_users',
    'read_aircraft', 'create_aircraft', 'update_aircraft', 'manage_aircraft',
    'read_employees', 'create_employees', 'update_employees', 'manage_employees',
    'read_tasks', 'create_tasks', 'update_tasks', 'assign_tasks', 'complete_tasks',
    'read_flight_sheets', 'create_flight_sheets', 'update_flight_sheets', 'approve_flight_sheets',
    'read_cleaning_forms', 'create_cleaning_forms', 'update_cleaning_forms', 'approve_cleaning_forms',
    'read_reports', 'create_reports', 'export_reports',
    'read_settings', 'update_settings',
    'read_activity_logs'
);

-- Supervisor - Team management
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id 
FROM permissions 
WHERE name IN (
    'read_users', 'update_users',
    'read_aircraft', 'update_aircraft',
    'read_employees', 'update_employees',
    'read_tasks', 'create_tasks', 'update_tasks', 'assign_tasks', 'complete_tasks',
    'read_flight_sheets', 'create_flight_sheets', 'update_flight_sheets',
    'read_cleaning_forms', 'create_cleaning_forms', 'update_cleaning_forms', 'approve_cleaning_forms',
    'read_reports', 'create_reports',
    'read_settings'
);

-- Pilot - Flight operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000005', id 
FROM permissions 
WHERE name IN (
    'read_aircraft', 'update_aircraft',
    'read_employees',
    'read_tasks', 'update_tasks', 'complete_tasks',
    'read_flight_sheets', 'create_flight_sheets', 'update_flight_sheets',
    'read_cleaning_forms',
    'read_reports'
);

-- Mechanic - Maintenance operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000006', id 
FROM permissions 
WHERE name IN (
    'read_aircraft', 'update_aircraft',
    'read_employees',
    'read_tasks', 'update_tasks', 'complete_tasks',
    'read_flight_sheets',
    'read_cleaning_forms', 'create_cleaning_forms', 'update_cleaning_forms',
    'read_reports'
);

-- Technician - Basic operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000007', id 
FROM permissions 
WHERE name IN (
    'read_aircraft',
    'read_employees',
    'read_tasks', 'update_tasks', 'complete_tasks',
    'read_flight_sheets',
    'read_cleaning_forms', 'create_cleaning_forms', 'update_cleaning_forms',
    'read_reports'
);

-- Viewer - Read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000008', id 
FROM permissions 
WHERE name LIKE 'read_%';

-- Update existing employees table to link with auth system
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_system_user BOOLEAN DEFAULT false;

-- Update tasks and flight_sheets to use user_id references
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES auth.users(id);
ALTER TABLE flight_sheets ADD COLUMN IF NOT EXISTS pilot_user_id UUID REFERENCES auth.users(id);
ALTER TABLE flight_sheets ADD COLUMN IF NOT EXISTS copilot_user_id UUID REFERENCES auth.users(id);
ALTER TABLE cleaning_forms ADD COLUMN IF NOT EXISTS created_user_id UUID REFERENCES auth.users(id);
ALTER TABLE cleaning_forms ADD COLUMN IF NOT EXISTS completed_user_id UUID REFERENCES auth.users(id);

-- Create default admin user function (to be called after user registration)
CREATE OR REPLACE FUNCTION create_admin_user(
    user_email TEXT,
    user_password TEXT,
    full_name TEXT DEFAULT 'Administrador'
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- This would typically be called via Supabase Auth API
    -- For now, just prepare the structure
    
    -- The actual user creation must be done via Supabase Auth
    -- This function prepares the profile and role assignment
    
    RETURN NULL; -- Return user ID when implemented
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign role to user
CREATE OR REPLACE FUNCTION assign_user_role(
    target_user_id UUID,
    role_name VARCHAR,
    assigned_by_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    role_id_to_assign UUID;
BEGIN
    -- Get role ID
    SELECT id INTO role_id_to_assign 
    FROM roles 
    WHERE name = role_name;
    
    IF role_id_to_assign IS NULL THEN
        RAISE EXCEPTION 'Role % not found', role_name;
    END IF;
    
    -- Insert or update user role
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (target_user_id, role_id_to_assign, assigned_by_user_id)
    ON CONFLICT (user_id, role_id) 
    DO UPDATE SET 
        is_active = true,
        assigned_by = COALESCE(assigned_by_user_id, user_roles.assigned_by),
        assigned_at = NOW();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to remove role from user
CREATE OR REPLACE FUNCTION remove_user_role(
    target_user_id UUID,
    role_name VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_roles 
    SET is_active = false 
    WHERE user_id = target_user_id 
    AND role_id = (SELECT id FROM roles WHERE name = role_name);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for easy user management
CREATE OR REPLACE VIEW user_management_view AS
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at as user_created_at,
    up.employee_number,
    up.first_name,
    up.last_name,
    up.display_name,
    up.department,
    up.hire_date,
    up.phone,
    up.is_active,
    up.last_login,
    COALESCE(
        json_agg(
            json_build_object(
                'name', r.name,
                'display_name', r.display_name,
                'level', r.level
            )
        ) FILTER (WHERE r.id IS NOT NULL), 
        '[]'::json
    ) as roles,
    COALESCE(
        array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL),
        ARRAY[]::varchar[]
    ) as permissions
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY u.id, u.email, u.email_confirmed_at, u.created_at, 
         up.employee_number, up.first_name, up.last_name, up.display_name,
         up.department, up.hire_date, up.phone, up.is_active, up.last_login;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON user_management_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity(UUID, VARCHAR, VARCHAR, UUID, JSONB, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_role(UUID, VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_user_role(UUID, VARCHAR) TO authenticated;
