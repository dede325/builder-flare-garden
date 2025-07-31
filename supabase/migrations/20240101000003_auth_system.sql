-- Authentication and Authorization System
-- Complete user profiles, roles, and permissions

-- Enable RLS
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0, -- Higher number = more permissions
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL, -- aircraft, employees, tasks, etc
    action VARCHAR(50) NOT NULL,   -- create, read, update, delete, manage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Extend auth.users with profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_number VARCHAR(20) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    avatar_url TEXT,
    phone VARCHAR(20),
    emergency_contact VARCHAR(20),
    department VARCHAR(100),
    hire_date DATE,
    license_number VARCHAR(50),
    certifications JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles junction table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Create audit log for user actions
CREATE TABLE user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table for enhanced session management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_level ON roles(level);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_user_profiles_employee_number ON user_profiles(employee_number);
CREATE INDEX idx_user_profiles_department ON user_profiles(department);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active);
CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_created_at ON user_activity_log(created_at);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission_name VARCHAR, resource VARCHAR, action VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name, p.resource, p.action
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM get_user_permissions(user_uuid)
        WHERE permission_name = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role_name VARCHAR, role_display_name VARCHAR, role_level INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.display_name, r.level
    FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, display_name, created_at, updated_at)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NOW(), NOW());
    
    -- Assign default role (technician) to new users
    INSERT INTO user_roles (user_id, role_id)
    SELECT NEW.id, id FROM roles WHERE name = 'technician' LIMIT 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    user_uuid UUID,
    action_name VARCHAR,
    resource_type VARCHAR DEFAULT NULL,
    resource_uuid UUID DEFAULT NULL,
    details JSONB DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_str TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO user_activity_log (
        user_id, action, resource_type, resource_id, details, ip_address, user_agent
    ) VALUES (
        user_uuid, action_name, resource_type, resource_uuid, details, ip_addr, user_agent_str
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for roles table
CREATE POLICY "Users can view all roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage roles" ON roles FOR ALL USING (
    user_has_permission(auth.uid(), 'manage_roles')
);

-- Policies for permissions table
CREATE POLICY "Users can view all permissions" ON permissions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage permissions" ON permissions FOR ALL USING (
    user_has_permission(auth.uid(), 'manage_permissions')
);

-- Policies for role_permissions table
CREATE POLICY "Users can view role permissions" ON role_permissions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage role permissions" ON role_permissions FOR ALL USING (
    user_has_permission(auth.uid(), 'manage_roles')
);

-- Policies for user_profiles table
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (
    auth.uid() = id
);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (
    auth.uid() = id
);
CREATE POLICY "Managers can view all profiles" ON user_profiles FOR SELECT USING (
    user_has_permission(auth.uid(), 'read_users')
);
CREATE POLICY "Managers can update profiles" ON user_profiles FOR UPDATE USING (
    user_has_permission(auth.uid(), 'update_users')
);
CREATE POLICY "Admins can manage profiles" ON user_profiles FOR ALL USING (
    user_has_permission(auth.uid(), 'manage_users')
);

-- Policies for user_roles table
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT USING (
    auth.uid() = user_id
);
CREATE POLICY "Managers can view user roles" ON user_roles FOR SELECT USING (
    user_has_permission(auth.uid(), 'read_users')
);
CREATE POLICY "Only admins can manage user roles" ON user_roles FOR ALL USING (
    user_has_permission(auth.uid(), 'manage_user_roles')
);

-- Policies for user_activity_log table
CREATE POLICY "Users can view their own activity" ON user_activity_log FOR SELECT USING (
    auth.uid() = user_id
);
CREATE POLICY "Managers can view all activity logs" ON user_activity_log FOR SELECT USING (
    user_has_permission(auth.uid(), 'read_activity_logs')
);
CREATE POLICY "Only system can insert activity logs" ON user_activity_log FOR INSERT WITH CHECK (true);

-- Policies for user_sessions table
CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT USING (
    auth.uid() = user_id
);
CREATE POLICY "Users can manage their own sessions" ON user_sessions FOR ALL USING (
    auth.uid() = user_id
);
CREATE POLICY "Admins can view all sessions" ON user_sessions FOR SELECT USING (
    user_has_permission(auth.uid(), 'manage_users')
);

-- Policies for password_reset_tokens table
CREATE POLICY "Users can manage their own reset tokens" ON password_reset_tokens FOR ALL USING (
    auth.uid() = user_id
);
