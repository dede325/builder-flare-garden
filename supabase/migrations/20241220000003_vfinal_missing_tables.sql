-- =========================================================================
-- AirPlus Aviation - TABELAS EM FALTA PARA SISTEMA COMPLETO
-- Migration: 20241220000003_vfinal_missing_tables.sql
-- Version: VFINAL
-- Description: Adiciona todas as tabelas essenciais que faltavam no sistema
-- =========================================================================

-- =========================================================================
-- SISTEMA DE EVIDÊNCIA FOTOGRÁFICA
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.photo_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES public.cleaning_forms(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('before', 'after')),
    category TEXT NOT NULL CHECK (category IN ('exterior', 'interior', 'details')),
    description TEXT,
    location TEXT,
    gps_coordinates JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    captured_by TEXT NOT NULL,
    captured_by_user_id UUID REFERENCES public.employees(id),
    file_size INTEGER,
    resolution JSONB,
    tags JSONB DEFAULT '[]'::jsonb,
    supabase_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- TABELAS DE CONFIGURAÇÃO DO SISTEMA
-- =========================================================================

-- Tipos de intervenção configuráveis
CREATE TABLE IF NOT EXISTS public.intervention_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações de turnos
CREATE TABLE IF NOT EXISTS public.shift_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações de localização
CREATE TABLE IF NOT EXISTS public.location_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- SISTEMA DE RASTREAMENTO DE MIGRAÇÕES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.migration_history (
    version TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    execution_time_ms INTEGER,
    checksum TEXT
);

-- =========================================================================
-- SISTEMA DE LOGS E AUDITORIA
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- SISTEMA DE PERMISSÕES AVANÇADO
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES public.user_profiles(id),
    PRIMARY KEY (role_id, permission_id)
);

-- =========================================================================
-- SISTEMA DE NOTIFICAÇÕES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    read_at TIMESTAMPTZ,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- SISTEMA DE ANEXOS E ARQUIVOS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    checksum TEXT,
    uploaded_by UUID REFERENCES public.user_profiles(id),
    upload_session TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- SISTEMA DE CÓDIGOS QR
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,
    qr_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ,
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    last_scanned_by UUID REFERENCES public.user_profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- RELACIONAMENTOS COMPLEMENTARES
-- =========================================================================

-- Funcionários em formulários de limpeza (many-to-many)
CREATE TABLE IF NOT EXISTS public.cleaning_form_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cleaning_form_id UUID NOT NULL REFERENCES public.cleaning_forms(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    role_in_form TEXT DEFAULT 'technician',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cleaning_form_id, employee_id)
);

-- =========================================================================
-- INDEXES PARA PERFORMANCE
-- =========================================================================

-- Photo evidence
CREATE INDEX IF NOT EXISTS idx_photo_evidence_form_id ON public.photo_evidence(form_id);
CREATE INDEX IF NOT EXISTS idx_photo_evidence_type_category ON public.photo_evidence(type, category);
CREATE INDEX IF NOT EXISTS idx_photo_evidence_timestamp ON public.photo_evidence(timestamp);
CREATE INDEX IF NOT EXISTS idx_photo_evidence_captured_by_user_id ON public.photo_evidence(captured_by_user_id);

-- Configuration tables
CREATE INDEX IF NOT EXISTS idx_intervention_types_active_order ON public.intervention_types(is_active, "order");
CREATE INDEX IF NOT EXISTS idx_shift_configs_active_order ON public.shift_configs(is_active, "order");
CREATE INDEX IF NOT EXISTS idx_location_configs_active_order ON public.location_configs(is_active, "order");

-- Logs and audit
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON public.user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_entity_type_id ON public.user_activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON public.notifications(type, priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- File attachments
CREATE INDEX IF NOT EXISTS idx_file_attachments_entity ON public.file_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_by ON public.file_attachments(uploaded_by);

-- QR codes
CREATE INDEX IF NOT EXISTS idx_qr_codes_entity ON public.qr_codes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_code ON public.qr_codes(qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON public.qr_codes(is_active);

-- Cleaning form employees
CREATE INDEX IF NOT EXISTS idx_cleaning_form_employees_form_id ON public.cleaning_form_employees(cleaning_form_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_form_employees_employee_id ON public.cleaning_form_employees(employee_id);

-- =========================================================================
-- TRIGGERS PARA AUTO-UPDATE TIMESTAMPS
-- =========================================================================

-- Photo evidence
CREATE TRIGGER update_photo_evidence_updated_at BEFORE UPDATE ON public.photo_evidence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Configuration tables
CREATE TRIGGER update_intervention_types_updated_at BEFORE UPDATE ON public.intervention_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_configs_updated_at BEFORE UPDATE ON public.shift_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_configs_updated_at BEFORE UPDATE ON public.location_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- File attachments
CREATE TRIGGER update_file_attachments_updated_at BEFORE UPDATE ON public.file_attachments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- QR codes
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON public.qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- RLS POLICIES (Row Level Security)
-- =========================================================================

-- Enable RLS
ALTER TABLE public.photo_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_form_employees ENABLE ROW LEVEL SECURITY;

-- Photo evidence policies
CREATE POLICY "Users can view photo evidence" ON public.photo_evidence
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create photo evidence" ON public.photo_evidence
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their photo evidence" ON public.photo_evidence
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Configuration policies (read-only for most users)
CREATE POLICY "Users can view intervention types" ON public.intervention_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view shift configs" ON public.shift_configs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view location configs" ON public.location_configs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Users can update their notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- File attachments policies
CREATE POLICY "Users can view file attachments" ON public.file_attachments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create file attachments" ON public.file_attachments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- QR codes policies
CREATE POLICY "Users can view QR codes" ON public.qr_codes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update QR scans" ON public.qr_codes
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Cleaning form employees policies
CREATE POLICY "Users can view cleaning form employees" ON public.cleaning_form_employees
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage cleaning form employees" ON public.cleaning_form_employees
    FOR ALL USING (auth.role() = 'authenticated');

-- =========================================================================
-- HELPER FUNCTIONS
-- =========================================================================
-- Funções foram movidas para migração 20241220000005 para evitar conflitos

-- =========================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =========================================================================

COMMENT ON TABLE public.photo_evidence IS 'Evidência fotográfica dos formulários de limpeza';
COMMENT ON TABLE public.intervention_types IS 'Tipos de intervenção configuráveis para limpeza';
COMMENT ON TABLE public.shift_configs IS 'Configurações de turnos de trabalho';
COMMENT ON TABLE public.location_configs IS 'Configurações de locais de operação';
COMMENT ON TABLE public.migration_history IS 'Histórico de migrações do banco de dados';
COMMENT ON TABLE public.user_activity_logs IS 'Logs de atividade dos usuários para auditoria';
COMMENT ON TABLE public.permissions IS 'Permissões do sistema de controle de acesso';
COMMENT ON TABLE public.role_permissions IS 'Associação entre roles e permissões';
COMMENT ON TABLE public.notifications IS 'Sistema de notificações para usuários';
COMMENT ON TABLE public.file_attachments IS 'Anexos de arquivos para entidades do sistema';
COMMENT ON TABLE public.qr_codes IS 'Códigos QR para identificação de entidades';
COMMENT ON TABLE public.cleaning_form_employees IS 'Associação entre formulários de limpeza e funcionários';

-- =========================================================================
-- VALIDAÇÃO FINAL
-- =========================================================================

-- Registrar migração
INSERT INTO public.migration_history (version, name, description, applied_at, success)
VALUES ('20241220000003', 'Missing Tables VFINAL', 'Adiciona todas as tabelas essenciais que faltavam no sistema', NOW(), true)
ON CONFLICT (version) DO UPDATE SET
    applied_at = NOW(),
    success = true;

-- Atualizar versão do schema
INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
VALUES ('schema_version', '"vfinal_complete"', 'Versão completa do schema do banco de dados', false)
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = '"vfinal_complete"',
    updated_at = NOW();

-- Mensagem de sucesso
SELECT 'VFINAL Missing Tables Migration Completed Successfully' as status;
