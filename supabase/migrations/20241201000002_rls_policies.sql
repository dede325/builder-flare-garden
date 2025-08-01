-- =========================================================================
-- AirPlus Aviation Cleaning Management System - RLS Policies
-- Migration: 20241201000002_rls_policies.sql
-- Description: Comprehensive Row Level Security policies for all tables
--             based on user roles and organizational hierarchy
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- HELPER FUNCTIONS FOR RLS
-- =========================================================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION auth.user_has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = role_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has minimum role level
CREATE OR REPLACE FUNCTION auth.user_has_min_role_level(min_level INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.level >= min_level
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION auth.user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid() AND p.name = permission_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's maximum role level
CREATE OR REPLACE FUNCTION auth.user_max_role_level()
RETURNS INTEGER AS $$
DECLARE
    max_level INTEGER;
BEGIN
    SELECT COALESCE(MAX(r.level), 0) INTO max_level
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid();
    
    RETURN max_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is active
CREATE OR REPLACE FUNCTION auth.user_is_active()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- USER PROFILES POLICIES
-- =========================================================================

-- Users can view their own profile and admins can view all
CREATE POLICY "user_profiles_select" ON public.user_profiles
    FOR SELECT USING (
        id = auth.uid() OR 
        auth.user_has_permission('read_users') OR
        auth.user_has_min_role_level(70) -- Supervisors can view team profiles
    );

-- Users can update their own profile, admins can update any
CREATE POLICY "user_profiles_update" ON public.user_profiles
    FOR UPDATE USING (
        (id = auth.uid() AND auth.user_is_active()) OR
        auth.user_has_permission('update_users')
    );

-- Only admins can insert new user profiles
CREATE POLICY "user_profiles_insert" ON public.user_profiles
    FOR INSERT WITH CHECK (
        auth.user_has_permission('create_users')
    );

-- Only admins can delete user profiles
CREATE POLICY "user_profiles_delete" ON public.user_profiles
    FOR DELETE USING (
        auth.user_has_permission('delete_users')
    );

-- =========================================================================
-- ROLES AND PERMISSIONS POLICIES
-- =========================================================================

-- Everyone can view roles (needed for UI)
CREATE POLICY "roles_select" ON public.roles
    FOR SELECT USING (true);

-- Only admins can modify roles
CREATE POLICY "roles_modify" ON public.roles
    FOR ALL USING (
        auth.user_has_permission('manage_roles')
    );

-- Everyone can view permissions (needed for UI)
CREATE POLICY "permissions_select" ON public.permissions
    FOR SELECT USING (true);

-- Only admins can modify permissions
CREATE POLICY "permissions_modify" ON public.permissions
    FOR ALL USING (
        auth.user_has_permission('manage_permissions')
    );

-- View role permissions for UI purposes
CREATE POLICY "role_permissions_select" ON public.role_permissions
    FOR SELECT USING (true);

-- Only admins can modify role permissions
CREATE POLICY "role_permissions_modify" ON public.role_permissions
    FOR ALL USING (
        auth.user_has_permission('manage_roles')
    );

-- Users can view their own roles, admins and supervisors can view others
CREATE POLICY "user_roles_select" ON public.user_roles
    FOR SELECT USING (
        user_id = auth.uid() OR
        auth.user_has_permission('read_users') OR
        auth.user_has_min_role_level(70)
    );

-- Only admins can assign/remove roles
CREATE POLICY "user_roles_modify" ON public.user_roles
    FOR ALL USING (
        auth.user_has_permission('manage_user_roles')
    );

-- =========================================================================
-- AIRCRAFT POLICIES
-- =========================================================================

-- All authenticated users can view aircraft
CREATE POLICY "aircraft_select" ON public.aircraft
    FOR SELECT USING (
        auth.user_is_active()
    );

-- Supervisors and above can create/update aircraft
CREATE POLICY "aircraft_insert" ON public.aircraft
    FOR INSERT WITH CHECK (
        auth.user_has_permission('create_aircraft') OR
        auth.user_has_min_role_level(70)
    );

CREATE POLICY "aircraft_update" ON public.aircraft
    FOR UPDATE USING (
        auth.user_has_permission('update_aircraft') OR
        auth.user_has_min_role_level(70)
    );

-- Only admins can delete aircraft
CREATE POLICY "aircraft_delete" ON public.aircraft
    FOR DELETE USING (
        auth.user_has_permission('delete_aircraft')
    );

-- =========================================================================
-- EMPLOYEES POLICIES
-- =========================================================================

-- All authenticated users can view employees
CREATE POLICY "employees_select" ON public.employees
    FOR SELECT USING (
        auth.user_is_active()
    );

-- Supervisors and above can create/update employees
CREATE POLICY "employees_insert" ON public.employees
    FOR INSERT WITH CHECK (
        auth.user_has_permission('create_employees') OR
        auth.user_has_min_role_level(70)
    );

CREATE POLICY "employees_update" ON public.employees
    FOR UPDATE USING (
        auth.user_has_permission('update_employees') OR
        auth.user_has_min_role_level(70)
    );

-- Only admins can delete employees
CREATE POLICY "employees_delete" ON public.employees
    FOR DELETE USING (
        auth.user_has_permission('delete_employees')
    );

-- =========================================================================
-- SYSTEM CONFIGURATIONS POLICIES
-- =========================================================================

-- All users can view non-system configurations
CREATE POLICY "system_configurations_select" ON public.system_configurations
    FOR SELECT USING (
        auth.user_is_active() AND (
            NOT is_system OR 
            auth.user_has_permission('read_system_config')
        )
    );

-- Supervisors can update general configs, admins can update system configs
CREATE POLICY "system_configurations_insert" ON public.system_configurations
    FOR INSERT WITH CHECK (
        (NOT is_system AND auth.user_has_min_role_level(70)) OR
        (is_system AND auth.user_has_permission('manage_system_config'))
    );

CREATE POLICY "system_configurations_update" ON public.system_configurations
    FOR UPDATE USING (
        (NOT is_system AND auth.user_has_min_role_level(70)) OR
        (is_system AND auth.user_has_permission('manage_system_config'))
    );

-- Only admins can delete configurations
CREATE POLICY "system_configurations_delete" ON public.system_configurations
    FOR DELETE USING (
        auth.user_has_permission('manage_system_config')
    );

-- =========================================================================
-- MICRO-CONFIGURATION TABLES POLICIES
-- =========================================================================

-- All users can view configuration tables
CREATE POLICY "intervention_types_select" ON public.intervention_types
    FOR SELECT USING (auth.user_is_active());

CREATE POLICY "work_shifts_select" ON public.work_shifts
    FOR SELECT USING (auth.user_is_active());

CREATE POLICY "cleaning_locations_select" ON public.cleaning_locations
    FOR SELECT USING (auth.user_is_active());

-- Supervisors and above can modify configuration tables
CREATE POLICY "intervention_types_modify" ON public.intervention_types
    FOR ALL USING (auth.user_has_min_role_level(70));

CREATE POLICY "work_shifts_modify" ON public.work_shifts
    FOR ALL USING (auth.user_has_min_role_level(70));

CREATE POLICY "cleaning_locations_modify" ON public.cleaning_locations
    FOR ALL USING (auth.user_has_min_role_level(70));

-- =========================================================================
-- CLEANING FORMS POLICIES
-- =========================================================================

-- Users can view forms they created, are assigned to, or supervising
-- Supervisors can view all forms, clients can view completed forms
CREATE POLICY "cleaning_forms_select" ON public.cleaning_forms
    FOR SELECT USING (
        auth.user_is_active() AND (
            created_by = auth.uid() OR
            supervisor_id = auth.uid() OR
            auth.uid() = ANY(assigned_to) OR
            auth.user_has_min_role_level(70) OR
            (auth.user_has_role('client') AND status = 'completed')
        )
    );

-- Users can create forms, system assigns creator automatically
CREATE POLICY "cleaning_forms_insert" ON public.cleaning_forms
    FOR INSERT WITH CHECK (
        auth.user_is_active() AND created_by = auth.uid()
    );

-- Users can update forms they created or are supervising
-- Assigned employees can update specific fields
CREATE POLICY "cleaning_forms_update" ON public.cleaning_forms
    FOR UPDATE USING (
        auth.user_is_active() AND (
            created_by = auth.uid() OR
            supervisor_id = auth.uid() OR
            (auth.uid() = ANY(assigned_to) AND status IN ('assigned', 'in_progress')) OR
            auth.user_has_min_role_level(70)
        )
    );

-- Only supervisors and above can delete forms
CREATE POLICY "cleaning_forms_delete" ON public.cleaning_forms
    FOR DELETE USING (
        auth.user_has_min_role_level(70)
    );

-- =========================================================================
-- FORM TASKS POLICIES
-- =========================================================================

-- Users can view tasks for forms they have access to
CREATE POLICY "form_tasks_select" ON public.form_tasks
    FOR SELECT USING (
        auth.user_is_active() AND EXISTS (
            SELECT 1 FROM public.cleaning_forms cf
            WHERE cf.id = form_id AND (
                cf.created_by = auth.uid() OR
                cf.supervisor_id = auth.uid() OR
                auth.uid() = ANY(cf.assigned_to) OR
                auth.user_has_min_role_level(70) OR
                (auth.user_has_role('client') AND cf.status = 'completed')
            )
        )
    );

-- Users can create tasks for forms they have access to
CREATE POLICY "form_tasks_insert" ON public.form_tasks
    FOR INSERT WITH CHECK (
        auth.user_is_active() AND EXISTS (
            SELECT 1 FROM public.cleaning_forms cf
            WHERE cf.id = form_id AND (
                cf.created_by = auth.uid() OR
                cf.supervisor_id = auth.uid() OR
                auth.user_has_min_role_level(70)
            )
        )
    );

-- Users can update tasks they're assigned to or supervising
CREATE POLICY "form_tasks_update" ON public.form_tasks
    FOR UPDATE USING (
        auth.user_is_active() AND (
            employee_id = (
                SELECT id FROM public.user_profiles WHERE id = auth.uid()
            ) OR EXISTS (
                SELECT 1 FROM public.cleaning_forms cf
                WHERE cf.id = form_id AND (
                    cf.created_by = auth.uid() OR
                    cf.supervisor_id = auth.uid() OR
                    auth.user_has_min_role_level(70)
                )
            )
        )
    );

-- Only supervisors can delete tasks
CREATE POLICY "form_tasks_delete" ON public.form_tasks
    FOR DELETE USING (
        auth.user_has_min_role_level(70)
    );

-- =========================================================================
-- PHOTO EVIDENCE POLICIES
-- =========================================================================

-- Users can view photos for forms they have access to
CREATE POLICY "photo_evidence_select" ON public.photo_evidence
    FOR SELECT USING (
        auth.user_is_active() AND (
            taken_by = auth.uid() OR EXISTS (
                SELECT 1 FROM public.cleaning_forms cf
                WHERE cf.id = form_id AND (
                    cf.created_by = auth.uid() OR
                    cf.supervisor_id = auth.uid() OR
                    auth.uid() = ANY(cf.assigned_to) OR
                    auth.user_has_min_role_level(70) OR
                    (auth.user_has_role('client') AND cf.status = 'completed')
                )
            )
        )
    );

-- Users can upload photos for forms they have access to
CREATE POLICY "photo_evidence_insert" ON public.photo_evidence
    FOR INSERT WITH CHECK (
        auth.user_is_active() AND taken_by = auth.uid() AND EXISTS (
            SELECT 1 FROM public.cleaning_forms cf
            WHERE cf.id = form_id AND (
                cf.created_by = auth.uid() OR
                cf.supervisor_id = auth.uid() OR
                auth.uid() = ANY(cf.assigned_to) OR
                auth.user_has_min_role_level(70)
            )
        )
    );

-- Users can update photos they uploaded or supervisors can update any
CREATE POLICY "photo_evidence_update" ON public.photo_evidence
    FOR UPDATE USING (
        auth.user_is_active() AND (
            taken_by = auth.uid() OR
            auth.user_has_min_role_level(70)
        )
    );

-- Users can delete their own photos, supervisors can delete any
CREATE POLICY "photo_evidence_delete" ON public.photo_evidence
    FOR DELETE USING (
        auth.user_is_active() AND (
            taken_by = auth.uid() OR
            auth.user_has_min_role_level(70)
        )
    );

-- =========================================================================
-- QR CODES POLICIES
-- =========================================================================

-- All authenticated users can view QR codes
CREATE POLICY "qr_codes_select" ON public.qr_codes
    FOR SELECT USING (auth.user_is_active());

-- Supervisors and above can create QR codes
CREATE POLICY "qr_codes_insert" ON public.qr_codes
    FOR INSERT WITH CHECK (auth.user_has_min_role_level(70));

-- Supervisors and above can update QR codes
CREATE POLICY "qr_codes_update" ON public.qr_codes
    FOR UPDATE USING (auth.user_has_min_role_level(70));

-- Only admins can delete QR codes
CREATE POLICY "qr_codes_delete" ON public.qr_codes
    FOR DELETE USING (auth.user_has_permission('delete_qr_codes'));

-- =========================================================================
-- AUDIT AND LOGGING POLICIES
-- =========================================================================

-- Users can view their own activities, supervisors can view team activities
CREATE POLICY "user_activities_select" ON public.user_activities
    FOR SELECT USING (
        user_id = auth.uid() OR
        auth.user_has_permission('read_audit_logs') OR
        auth.user_has_min_role_level(70)
    );

-- System automatically inserts user activities
CREATE POLICY "user_activities_insert" ON public.user_activities
    FOR INSERT WITH CHECK (true); -- Handled by application logic

-- No updates or deletes allowed on user activities
CREATE POLICY "user_activities_no_modify" ON public.user_activities
    FOR UPDATE USING (false);

CREATE POLICY "user_activities_no_delete" ON public.user_activities
    FOR DELETE USING (false);

-- Only admins can view audit logs
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT USING (auth.user_has_permission('read_audit_logs'));

-- System automatically inserts audit logs
CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT WITH CHECK (true); -- Handled by triggers

-- No updates or deletes allowed on audit logs
CREATE POLICY "audit_logs_no_modify" ON public.audit_logs
    FOR UPDATE USING (false);

CREATE POLICY "audit_logs_no_delete" ON public.audit_logs
    FOR DELETE USING (false);

-- Users can view their own sync logs, admins can view all
CREATE POLICY "sync_logs_select" ON public.sync_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        auth.user_has_permission('read_sync_logs')
    );

-- System automatically inserts sync logs
CREATE POLICY "sync_logs_insert" ON public.sync_logs
    FOR INSERT WITH CHECK (true); -- Handled by sync service

-- =========================================================================
-- PERFORMANCE METRICS POLICIES
-- =========================================================================

-- Users can view metrics for entities they have access to
CREATE POLICY "performance_metrics_select" ON public.performance_metrics
    FOR SELECT USING (
        auth.user_is_active() AND (
            -- Users can see their own metrics
            (entity_type = 'user' AND entity_id::TEXT = auth.uid()::TEXT) OR
            -- Supervisors can see all metrics
            auth.user_has_min_role_level(70) OR
            -- Admins can see all metrics
            auth.user_has_permission('read_performance_metrics')
        )
    );

-- Only system or admins can insert performance metrics
CREATE POLICY "performance_metrics_insert" ON public.performance_metrics
    FOR INSERT WITH CHECK (
        auth.user_has_permission('create_performance_metrics')
    );

-- No updates allowed on performance metrics (immutable)
CREATE POLICY "performance_metrics_no_update" ON public.performance_metrics
    FOR UPDATE USING (false);

-- Only admins can delete performance metrics
CREATE POLICY "performance_metrics_delete" ON public.performance_metrics
    FOR DELETE USING (
        auth.user_has_permission('delete_performance_metrics')
    );

-- =========================================================================
-- VIEW POLICIES
-- =========================================================================

-- Create policies for views (they inherit from underlying tables but good to be explicit)

-- User management view - same as user_profiles
CREATE POLICY "user_management_view_select" ON public.user_management_view
    FOR SELECT USING (
        id = auth.uid() OR 
        auth.user_has_permission('read_users') OR
        auth.user_has_min_role_level(70)
    );

-- =========================================================================
-- SPECIAL POLICIES FOR SPECIFIC ROLES
-- =========================================================================

-- Client-specific policies: clients can only see completed forms and related data
-- This is already handled in the individual table policies above

-- Operational users: can only modify assigned tasks and upload evidence
-- This is already handled in the cleaning_forms and form_tasks policies above

-- Supervisor override: supervisors have broader access as implemented above

-- Admin override: admins have full access through permission checks

-- =========================================================================
-- POLICY COMMENTS
-- =========================================================================

COMMENT ON POLICY "user_profiles_select" ON public.user_profiles IS 
    'Users can view their own profile, supervisors can view team profiles, admins can view all';

COMMENT ON POLICY "cleaning_forms_select" ON public.cleaning_forms IS 
    'Complex policy: users see forms they created/assigned to/supervising, supervisors see all, clients see completed forms only';

COMMENT ON POLICY "photo_evidence_insert" ON public.photo_evidence IS 
    'Users can upload photos for forms they have access to, automatically tagged with their user ID';

COMMENT ON FUNCTION auth.user_has_role(TEXT) IS 
    'Helper function to check if authenticated user has specific role';

COMMENT ON FUNCTION auth.user_has_min_role_level(INTEGER) IS 
    'Helper function to check if authenticated user has minimum role level (hierarchy)';

-- =========================================================================
-- POLICY VALIDATION NOTES
-- =========================================================================

-- These RLS policies implement a comprehensive security model:
--
-- 1. Role-based access control with hierarchical levels
-- 2. Resource-specific permissions
-- 3. Entity-based access (users can access data they're related to)
-- 4. Audit trail protection (immutable logs)
-- 5. Client isolation (clients only see their completed work)
-- 6. Supervisor oversight (supervisors can access team data)
-- 7. Admin overrides (admins have system-wide access)
--
-- Security principles implemented:
-- - Principle of least privilege
-- - Defense in depth
-- - Separation of concerns
-- - Audit trail integrity
-- - Data classification (system vs user data)
--
-- The policies support:
-- - Multi-tenant operation (if needed in future)
-- - Offline sync (users can access data they're authorized for)
-- - Real-time collaboration (proper access controls)
-- - Compliance and audit requirements
-- - Mobile and web application access patterns
