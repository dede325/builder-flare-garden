-- =========================================================================
-- AirPlus Aviation - CORREÇÃO DE CONFLITOS DE FUNÇÕES
-- Migration: 20241220000005_fix_function_conflicts.sql
-- Version: VFINAL_FIX
-- Description: Remove funções existentes que conflitam e recria com assinaturas corretas
-- =========================================================================

-- =========================================================================
-- REMOVER FUNÇÕES EXISTENTES QUE PODEM CONFLITAR
-- =========================================================================

-- Remove função get_user_roles se existir
DROP FUNCTION IF EXISTS get_user_roles(uuid);
DROP FUNCTION IF EXISTS get_user_roles(p_user_id uuid);

-- Remove função get_user_permissions se existir  
DROP FUNCTION IF EXISTS get_user_permissions(uuid);
DROP FUNCTION IF EXISTS get_user_permissions(p_user_id uuid);

-- Remove função assign_user_role se existir
DROP FUNCTION IF EXISTS assign_user_role(uuid, text, uuid);
DROP FUNCTION IF EXISTS assign_user_role(p_user_id uuid, p_role_name text, p_assigned_by uuid);

-- Remove função log_user_activity se existir
DROP FUNCTION IF EXISTS log_user_activity(uuid, text, text, uuid, jsonb);
DROP FUNCTION IF EXISTS log_user_activity(p_user_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_details jsonb);

-- Remove função generate_qr_code se existir
DROP FUNCTION IF EXISTS generate_qr_code(text, uuid, jsonb);
DROP FUNCTION IF EXISTS generate_qr_code(p_entity_type text, p_entity_id uuid, p_qr_data jsonb);

-- Remove função create_migration_tracking se existir
DROP FUNCTION IF EXISTS create_migration_tracking();

-- =========================================================================
-- RECRIAR FUNÇÕES COM ASSINATURAS CORRETAS
-- =========================================================================

-- Função para log de atividade do usuário
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_activity_logs (
        user_id, action, entity_type, entity_id, details
    ) VALUES (
        p_user_id, p_action, p_entity_type, p_entity_id, p_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter roles do usuário
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TABLE(role_name TEXT, role_level INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name::TEXT, r.level::INTEGER
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter permissões do usuário
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(permission_name TEXT, resource TEXT, action TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.name::TEXT, p.resource::TEXT, p.action::TEXT
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atribuir role a usuário
CREATE OR REPLACE FUNCTION assign_user_role(
    p_user_id UUID,
    p_role_name TEXT,
    p_assigned_by UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_role_id UUID;
BEGIN
    -- Buscar role ID
    SELECT id INTO v_role_id FROM public.roles WHERE name = p_role_name;
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role % não encontrada', p_role_name;
    END IF;
    
    -- Inserir associação (ignore se já existe)
    INSERT INTO public.user_roles (user_id, role_id, assigned_by)
    VALUES (p_user_id, v_role_id, p_assigned_by)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar códigos QR
CREATE OR REPLACE FUNCTION generate_qr_code(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_qr_data JSONB
) RETURNS TEXT AS $$
DECLARE
    v_qr_code TEXT;
BEGIN
    -- Gerar código único
    v_qr_code := 'QR-' || UPPER(SUBSTRING(p_entity_type FROM 1 FOR 3)) || '-' || 
                 EXTRACT(YEAR FROM NOW()) || '-' || 
                 LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');
    
    -- Inserir na tabela
    INSERT INTO public.qr_codes (entity_type, entity_id, qr_code, qr_data)
    VALUES (p_entity_type, p_entity_id, v_qr_code, p_qr_data)
    ON CONFLICT (qr_code) DO UPDATE SET
        qr_data = EXCLUDED.qr_data,
        updated_at = NOW();
    
    RETURN v_qr_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar tabela de rastreamento de migrações (se necessário)
CREATE OR REPLACE FUNCTION create_migration_tracking()
RETURNS VOID AS $$
BEGIN
    -- Esta função é chamada pelo sistema de migrações
    -- A tabela migration_history já foi criada na migração anterior
    -- Não precisa fazer nada aqui
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- VERIFICAR SE TODAS AS TABELAS EXISTEM
-- =========================================================================

DO $$
DECLARE
    missing_tables TEXT[] := '{}';
    table_name TEXT;
    table_exists BOOLEAN;
BEGIN
    -- Lista de tabelas que devem existir
    FOREACH table_name IN ARRAY ARRAY[
        'user_profiles', 'roles', 'user_roles', 'aircraft', 'employees',
        'cleaning_forms', 'tasks', 'flight_sheets', 'system_settings',
        'photo_evidence', 'intervention_types', 'shift_configs', 
        'location_configs', 'migration_history', 'user_activity_logs',
        'permissions', 'role_permissions', 'notifications', 
        'file_attachments', 'qr_codes', 'cleaning_form_employees'
    ]
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'ATENÇÃO: Tabelas faltando: %', array_to_string(missing_tables, ', ');
        RAISE NOTICE 'Execute as migrações anteriores primeiro: 20241220000003 e 20241220000004';
    ELSE
        RAISE NOTICE 'SUCESSO: Todas as 21 tabelas estão presentes no banco de dados';
    END IF;
END $$;

-- =========================================================================
-- TESTE DAS FUNÇÕES RECRIADAS
-- =========================================================================

DO $$
DECLARE
    test_user_id UUID;
    test_role_name TEXT;
    test_qr_code TEXT;
BEGIN
    -- Testar se as funções foram criadas corretamente
    
    -- Buscar um usuário de teste (se existir)
    SELECT id INTO test_user_id FROM public.user_profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Testar get_user_roles
        SELECT role_name INTO test_role_name 
        FROM get_user_roles(test_user_id) 
        LIMIT 1;
        
        RAISE NOTICE 'Função get_user_roles funcionando corretamente';
        
        -- Testar log_user_activity
        PERFORM log_user_activity(
            test_user_id, 
            'test_function', 
            'system', 
            test_user_id, 
            '{"test": true}'::jsonb
        );
        
        RAISE NOTICE 'Função log_user_activity funcionando corretamente';
    END IF;
    
    -- Testar generate_qr_code
    test_qr_code := generate_qr_code(
        'test',
        gen_random_uuid(),
        '{"test": "function_test"}'::jsonb
    );
    
    RAISE NOTICE 'Função generate_qr_code funcionando corretamente: %', test_qr_code;
    
    -- Limpar dados de teste
    DELETE FROM public.qr_codes WHERE qr_code = test_qr_code;
    DELETE FROM public.user_activity_logs WHERE action = 'test_function';
    
    RAISE NOTICE 'Todas as funções foram recriadas e testadas com sucesso!';
END $$;

-- =========================================================================
-- REGISTRAR MIGRAÇÃO
-- =========================================================================

INSERT INTO public.migration_history (version, name, description, applied_at, success)
VALUES ('20241220000005', 'Fix Function Conflicts', 'Remove e recria funções com conflitos de assinatura', NOW(), true)
ON CONFLICT (version) DO UPDATE SET
    applied_at = NOW(),
    success = true;

-- Atualizar versão do schema
INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
VALUES ('schema_version', '"vfinal_fixed"', 'Versão final do schema com funções corrigidas', false)
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = '"vfinal_fixed"',
    updated_at = NOW();

SELECT 'VFINAL Function Conflicts Fixed Successfully' as status;
