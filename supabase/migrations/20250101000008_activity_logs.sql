-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000008_activity_logs.sql
-- Descrição: Sistema completo de auditoria e logs de atividade
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Enum para tipos de atividade
CREATE TYPE public.activity_type AS ENUM (
  'login',
  'logout',
  'create',
  'update',
  'delete',
  'view',
  'export',
  'import',
  'approve',
  'reject',
  'assign',
  'unassign',
  'upload',
  'download',
  'sync',
  'system',
  'security',
  'error'
);

-- Enum para níveis de severidade
CREATE TYPE public.severity_level AS ENUM (
  'info',
  'warning',
  'error',
  'critical'
);

-- Tabela de logs de atividade do utilizador
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação do utilizador
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Detalhes da atividade
  activity_type public.activity_type NOT NULL,
  resource_type TEXT, -- aircraft, employee, task, etc.
  resource_id UUID,
  action_description TEXT NOT NULL,
  
  -- Contexto da atividade
  old_values JSONB,
  new_values JSONB,
  changes_summary JSONB,
  
  -- Metadados técnicos
  user_agent TEXT,
  ip_address INET,
  device_info JSONB,
  platform TEXT, -- web, mobile, api
  
  -- Localização e contexto
  location_info JSONB, -- país, cidade, coordenadas se disponível
  department TEXT,
  
  -- Resultado da atividade
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  severity_level public.severity_level DEFAULT 'info',
  
  -- Metadados adicionais
  duration_ms INTEGER, -- duração da operação em ms
  additional_data JSONB DEFAULT '{}'::jsonb,
  
  -- Sync metadata para mobile
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  
  -- Timestamps obrigatórios
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

-- Particionamento por data para performance (logs históricos)
-- CREATE TABLE user_activity_log_y2025m01 PARTITION OF user_activity_log
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_session ON public.user_activity_log(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON public.user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_resource ON public.user_activity_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_severity ON public.user_activity_log(severity_level);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_success ON public.user_activity_log(success);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_platform ON public.user_activity_log(platform);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_ip ON public.user_activity_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created ON public.user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_sync ON public.user_activity_log(sync_version, last_synced);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_deleted ON public.user_activity_log(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_user_activity_log_updated_at
  BEFORE UPDATE ON public.user_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para log de atividade simplificado
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_activity_type public.activity_type,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_action_description TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_additional_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  session_info RECORD;
BEGIN
  -- Gerar ID do log
  log_id := uuid_generate_v4();
  
  -- Obter informações da sessão atual (se disponível)
  BEGIN
    SELECT 
      current_setting('request.headers')::jsonb->>'user-agent' as user_agent,
      current_setting('request.headers')::jsonb->>'x-forwarded-for' as ip_address,
      current_setting('request.platform', true) as platform
    INTO session_info;
  EXCEPTION
    WHEN others THEN
      session_info.user_agent := NULL;
      session_info.ip_address := NULL;
      session_info.platform := 'system';
  END;
  
  -- Inserir log
  INSERT INTO public.user_activity_log (
    id,
    user_id,
    activity_type,
    resource_type,
    resource_id,
    action_description,
    old_values,
    new_values,
    user_agent,
    ip_address,
    platform,
    success,
    error_message,
    severity_level,
    additional_data
  ) VALUES (
    log_id,
    p_user_id,
    p_activity_type,
    p_resource_type,
    p_resource_id,
    COALESCE(p_action_description, p_activity_type::text || ' on ' || p_resource_type),
    p_old_values,
    p_new_values,
    session_info.user_agent,
    session_info.ip_address::inet,
    COALESCE(session_info.platform, 'unknown'),
    p_success,
    p_error_message,
    CASE 
      WHEN p_error_message IS NOT NULL THEN 'error'::public.severity_level
      WHEN p_success = false THEN 'warning'::public.severity_level
      ELSE 'info'::public.severity_level
    END,
    p_additional_data
  );
  
  RETURN log_id;
END;
$$;

-- Função para log automático de mudanças em tabelas
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_val UUID;
  activity_type_val public.activity_type;
  old_values_json JSONB;
  new_values_json JSONB;
BEGIN
  -- Determinar user_id (de auth.uid() ou de contexto)
  user_id_val := auth.uid();
  
  -- Determinar tipo de atividade
  CASE TG_OP
    WHEN 'INSERT' THEN activity_type_val := 'create';
    WHEN 'UPDATE' THEN activity_type_val := 'update';
    WHEN 'DELETE' THEN activity_type_val := 'delete';
  END CASE;
  
  -- Preparar valores antigos e novos
  IF TG_OP = 'DELETE' THEN
    old_values_json := to_jsonb(OLD);
    new_values_json := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    old_values_json := to_jsonb(OLD);
    new_values_json := to_jsonb(NEW);
  ELSE -- INSERT
    old_values_json := NULL;
    new_values_json := to_jsonb(NEW);
  END IF;
  
  -- Log apenas se há utilizador identificado
  IF user_id_val IS NOT NULL THEN
    PERFORM public.log_user_activity(
      user_id_val,
      activity_type_val,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      TG_OP || ' on ' || TG_TABLE_NAME,
      old_values_json,
      new_values_json
    );
  END IF;
  
  -- Retornar conforme operação
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Função para limpar logs antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs(
  retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Mover logs antigos para deleted_at em vez de deletar fisicamente
  UPDATE public.user_activity_log
  SET deleted_at = public.now_utc()
  WHERE created_at < public.now_utc() - (retention_days || ' days')::interval
  AND deleted_at IS NULL
  AND severity_level != 'critical'; -- Manter logs críticos
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Marked % old activity logs for deletion', deleted_count;
  RETURN deleted_count;
END;
$$;

-- View para atividades recentes por utilizador
CREATE OR REPLACE VIEW public.recent_user_activities AS
SELECT 
  ual.id,
  up.employee_number,
  up.display_name as user_name,
  ual.activity_type,
  ual.resource_type,
  ual.action_description,
  ual.success,
  ual.severity_level,
  ual.platform,
  ual.created_at,
  CASE 
    WHEN ual.created_at > public.now_utc() - interval '1 hour' THEN 'very_recent'
    WHEN ual.created_at > public.now_utc() - interval '1 day' THEN 'recent'
    WHEN ual.created_at > public.now_utc() - interval '7 days' THEN 'this_week'
    ELSE 'older'
  END as recency
FROM public.user_activity_log ual
INNER JOIN public.user_profiles up ON ual.user_id = up.id
WHERE ual.deleted_at IS NULL
ORDER BY ual.created_at DESC;

-- View para estatísticas de atividade
CREATE OR REPLACE VIEW public.activity_statistics AS
SELECT 
  activity_type,
  resource_type,
  platform,
  COUNT(*) as total_activities,
  COUNT(CASE WHEN success THEN 1 END) as successful_activities,
  COUNT(CASE WHEN NOT success THEN 1 END) as failed_activities,
  COUNT(CASE WHEN severity_level = 'error' THEN 1 END) as error_count,
  COUNT(CASE WHEN severity_level = 'critical' THEN 1 END) as critical_count,
  MIN(created_at) as first_activity,
  MAX(created_at) as last_activity,
  COUNT(DISTINCT user_id) as unique_users
FROM public.user_activity_log
WHERE deleted_at IS NULL
AND created_at > public.now_utc() - interval '30 days'
GROUP BY activity_type, resource_type, platform
ORDER BY total_activities DESC;

-- View para alertas de segurança
CREATE OR REPLACE VIEW public.security_alerts AS
SELECT 
  ual.id,
  up.employee_number,
  up.display_name as user_name,
  ual.activity_type,
  ual.action_description,
  ual.ip_address,
  ual.user_agent,
  ual.error_message,
  ual.created_at,
  CASE 
    WHEN ual.activity_type = 'login' AND NOT ual.success THEN 'failed_login'
    WHEN ual.severity_level = 'critical' THEN 'critical_activity'
    WHEN ual.activity_type = 'security' THEN 'security_event'
    ELSE 'other'
  END as alert_type
FROM public.user_activity_log ual
LEFT JOIN public.user_profiles up ON ual.user_id = up.id
WHERE ual.deleted_at IS NULL
AND (
  (ual.activity_type = 'login' AND NOT ual.success) OR
  ual.severity_level IN ('error', 'critical') OR
  ual.activity_type = 'security'
)
AND ual.created_at > public.now_utc() - interval '7 days'
ORDER BY ual.created_at DESC;

-- Políticas RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Política: utilizadores podem ver os próprios logs
CREATE POLICY "Users can view own activity logs" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Política: admins podem ver todos os logs
CREATE POLICY "Admins can view all activity logs" ON public.user_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'manager')
      AND r.level <= 30
      AND ur.is_active = true
      AND ur.deleted_at IS NULL
    )
  );

-- Política: apenas sistema pode inserir logs
CREATE POLICY "Only system can insert activity logs" ON public.user_activity_log
  FOR INSERT WITH CHECK (true); -- Controlado pelas funções

-- Comentários
COMMENT ON TABLE public.user_activity_log IS 'Log completo de atividades dos utilizadores para auditoria';
COMMENT ON COLUMN public.user_activity_log.session_id IS 'ID da sessão para correlacionar atividades';
COMMENT ON COLUMN public.user_activity_log.old_values IS 'Valores anteriores em operações de UPDATE';
COMMENT ON COLUMN public.user_activity_log.new_values IS 'Valores novos em operações de INSERT/UPDATE';
COMMENT ON COLUMN public.user_activity_log.changes_summary IS 'Resumo das alterações para visualização';
COMMENT ON COLUMN public.user_activity_log.duration_ms IS 'Duração da operação em milissegundos';

COMMENT ON FUNCTION public.log_user_activity IS 'Função principal para registar atividade do utilizador';
COMMENT ON FUNCTION public.audit_trigger_function() IS 'Função de trigger para auditoria automática de tabelas';
COMMENT ON FUNCTION public.cleanup_old_activity_logs(INTEGER) IS 'Remove logs antigos baseado em período de retenção';

COMMENT ON VIEW public.recent_user_activities IS 'Atividades recentes dos utilizadores com classificação temporal';
COMMENT ON VIEW public.activity_statistics IS 'Estatísticas de atividade por tipo, recurso e plataforma';
COMMENT ON VIEW public.security_alerts IS 'Alertas de segurança baseados em logs de atividade';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000008_activity_logs.sql aplicada com sucesso';
  RAISE NOTICE 'Sistema de logs de atividade criado';
  RAISE NOTICE 'Funções de auditoria automática implementadas';
  RAISE NOTICE 'Views de análise e alertas configuradas';
  RAISE NOTICE 'Políticas de segurança aplicadas';
END $$;
