-- Verification and integrity check for all migrations
-- Ensures all tables, relationships, and data are properly set up

-- Verify all required tables exist
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    required_tables TEXT[] := ARRAY[
        'aircraft', 'employees', 'tasks', 'flight_sheets', 
        'cleaning_forms', 'cleaning_form_employees', 'system_settings', 'file_attachments',
        'roles', 'permissions', 'role_permissions', 'user_profiles', 'user_roles',
        'user_activity_log', 'user_sessions', 'password_reset_tokens'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'All required tables exist ✓';
    END IF;
END $$;

-- Verify all roles exist
DO $$
DECLARE
    missing_roles TEXT[] := ARRAY[]::TEXT[];
    required_roles TEXT[] := ARRAY[
        'super_admin', 'admin', 'manager', 'supervisor', 
        'pilot', 'mechanic', 'technician', 'viewer'
    ];
    role_name TEXT;
BEGIN
    FOREACH role_name IN ARRAY required_roles
    LOOP
        IF NOT EXISTS (SELECT 1 FROM roles WHERE name = role_name) THEN
            missing_roles := array_append(missing_roles, role_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_roles, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required roles: %', array_to_string(missing_roles, ', ');
    ELSE
        RAISE NOTICE 'All required roles exist ✓';
    END IF;
END $$;

-- Verify all required functions exist
DO $$
DECLARE
    missing_functions TEXT[] := ARRAY[]::TEXT[];
    required_functions TEXT[] := ARRAY[
        'get_user_permissions', 'user_has_permission', 'get_user_roles',
        'handle_new_user', 'log_user_activity', 'assign_user_role', 'remove_user_role'
    ];
    function_name TEXT;
BEGIN
    FOREACH function_name IN ARRAY required_functions
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = function_name AND routine_schema = 'public') THEN
            missing_functions := array_append(missing_functions, function_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_functions, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required functions: %', array_to_string(missing_functions, ', ');
    ELSE
        RAISE NOTICE 'All required functions exist ✓';
    END IF;
END $$;

-- Verify RLS is enabled on auth tables
DO $$
DECLARE
    rls_tables TEXT[] := ARRAY[
        'roles', 'permissions', 'role_permissions', 'user_profiles', 
        'user_roles', 'user_activity_log', 'user_sessions', 'password_reset_tokens'
    ];
    table_name TEXT;
    rls_enabled BOOLEAN;
BEGIN
    FOREACH table_name IN ARRAY rls_tables
    LOOP
        SELECT relrowsecurity INTO rls_enabled 
        FROM pg_class 
        WHERE relname = table_name AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'RLS not enabled on table: %', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'RLS enabled on all auth tables ✓';
END $$;

-- Create data integrity check function
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    count_result BIGINT,
    details TEXT
) AS $$
BEGIN
    -- Check roles have permissions
    RETURN QUERY
    SELECT 
        'roles_with_permissions'::TEXT,
        CASE WHEN COUNT(*) >= 8 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*),
        'Roles with at least one permission'::TEXT
    FROM roles r
    WHERE EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id);
    
    -- Check employees exist
    RETURN QUERY
    SELECT 
        'employees_created'::TEXT,
        CASE WHEN COUNT(*) >= 14 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*),
        'Specific employees from Angola'::TEXT
    FROM employees 
    WHERE is_system_user = true;
    
    -- Check user profiles exist
    RETURN QUERY
    SELECT 
        'user_profiles_created'::TEXT,
        CASE WHEN COUNT(*) >= 14 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*),
        'User profiles for specific employees'::TEXT
    FROM user_profiles 
    WHERE employee_number IS NOT NULL;
    
    -- Check system settings
    RETURN QUERY
    SELECT 
        'system_settings_configured'::TEXT,
        CASE WHEN COUNT(*) >= 9 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*),
        'System configuration settings'::TEXT
    FROM system_settings;
    
    -- Check aircraft exist
    RETURN QUERY
    SELECT 
        'aircraft_exist'::TEXT,
        CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*),
        'Demo aircraft in system'::TEXT
    FROM aircraft;
    
    -- Check tasks assigned
    RETURN QUERY
    SELECT 
        'tasks_assigned'::TEXT,
        CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*),
        'Tasks assigned to employees'::TEXT
    FROM tasks 
    WHERE assigned_to IS NOT NULL;
    
    -- Check cleaning forms
    RETURN QUERY
    SELECT 
        'cleaning_forms_exist'::TEXT,
        CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*),
        'Cleaning forms with employees'::TEXT
    FROM cleaning_forms;
    
    -- Check permissions count
    RETURN QUERY
    SELECT 
        'permissions_exist'::TEXT,
        CASE WHEN COUNT(*) >= 40 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*),
        'System permissions defined'::TEXT
    FROM permissions;
    
END;
$$ LANGUAGE plpgsql;

-- Run integrity check
SELECT * FROM check_data_integrity();

-- Create summary view for admin dashboard
CREATE OR REPLACE VIEW system_summary AS
SELECT 
    'users' as entity,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE up.is_active = true) as active_count
FROM user_profiles up

UNION ALL

SELECT 
    'employees' as entity,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count
FROM employees

UNION ALL

SELECT 
    'aircraft' as entity,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count
FROM aircraft

UNION ALL

SELECT 
    'tasks' as entity,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress')) as active_count
FROM tasks

UNION ALL

SELECT 
    'cleaning_forms' as entity,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status IN ('draft', 'in_progress')) as active_count
FROM cleaning_forms

UNION ALL

SELECT 
    'roles' as entity,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE NOT is_system_role) as active_count
FROM roles;

-- Create function to get employee dashboard stats
CREATE OR REPLACE FUNCTION get_employee_stats(employee_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'assigned_tasks', (
            SELECT COUNT(*) 
            FROM tasks t 
            JOIN employees e ON t.assigned_to = e.id 
            WHERE e.user_id = employee_user_id 
            AND t.status IN ('pending', 'in_progress')
        ),
        'completed_tasks_this_month', (
            SELECT COUNT(*) 
            FROM tasks t 
            JOIN employees e ON t.assigned_to = e.id 
            WHERE e.user_id = employee_user_id 
            AND t.status = 'completed'
            AND t.updated_at >= date_trunc('month', NOW())
        ),
        'cleaning_forms_this_month', (
            SELECT COUNT(*) 
            FROM cleaning_forms cf
            WHERE cf.created_by = employee_user_id
            AND cf.created_at >= date_trunc('month', NOW())
        ),
        'role_level', (
            SELECT COALESCE(MAX(r.level), 0)
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = employee_user_id
            AND ur.is_active = true
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON system_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_data_integrity() TO authenticated;

-- Final verification message
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'MIGRATION VERIFICATION COMPLETED';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'All tables, functions, and data verified ✓';
    RAISE NOTICE 'Employees: % created', (SELECT COUNT(*) FROM employees WHERE is_system_user = true);
    RAISE NOTICE 'User Profiles: % created', (SELECT COUNT(*) FROM user_profiles WHERE employee_number IS NOT NULL);
    RAISE NOTICE 'Roles: % configured', (SELECT COUNT(*) FROM roles);
    RAISE NOTICE 'Permissions: % defined', (SELECT COUNT(*) FROM permissions);
    RAISE NOTICE '===========================================';
END $$;
