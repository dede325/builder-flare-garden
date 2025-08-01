-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000009_user_sessions.sql
-- Descrição: Sistema avançado de gestão de sessões de utilizador
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Enum para status de sessão
CREATE TYPE public.session_status AS ENUM (
  'active',
  'expired',
  'terminated',
  'suspicious',
  'locked'
);

-- Enum para tipos de dispositivo
CREATE TYPE public.device_type AS ENUM (
  'desktop',
  'mobile',
  'tablet',
  'api',
  'unknown'
);

-- Tabela de sessões de utilizador
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação da sessão
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Detalhes da sessão
  session_status public.session_status DEFAULT 'active',
  device_type public.device_type DEFAULT 'unknown',
  device_fingerprint TEXT,
  
  -- Informações do dispositivo/browser
  user_agent TEXT,
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  os_version TEXT,
  device_model TEXT,
  
  -- Localização e rede
  ip_address INET NOT NULL,
  country_code CHAR(2),
  city TEXT,
  timezone TEXT DEFAULT 'Africa/Luanda',
  
  -- Timestamps da sessão
  login_at TIMESTAMPTZ DEFAULT public.now_utc(),
  last_activity_at TIMESTAMPTZ DEFAULT public.now_utc(),
  expires_at TIMESTAMPTZ NOT NULL,
  logout_at TIMESTAMPTZ,
  
  -- Configurações de segurança
  is_trusted_device BOOLEAN DEFAULT false,
  requires_mfa BOOLEAN DEFAULT false,
  mfa_verified BOOLEAN DEFAULT false,
  
  -- Metadados da sessão
  login_method TEXT DEFAULT 'password', -- password, sso, api_key, etc.
  platform TEXT DEFAULT 'web', -- web, mobile, api
  app_version TEXT,
  
  -- Estatísticas de uso
  activity_count INTEGER DEFAULT 0,
  data_transferred_mb NUMERIC(10,2) DEFAULT 0,
  
  -- Detecção de anomalias
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  flags JSONB DEFAULT '[]'::jsonb, -- Array de flags de segurança
  
  -- Sync metadata para mobile
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  
  -- Timestamps obrigatórios
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON public.user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON public.user_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_type ON public.user_sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON public.user_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(last_activity_at) WHERE session_status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_risk ON public.user_sessions(risk_score);
CREATE INDEX IF NOT EXISTS idx_user_sessions_trusted ON public.user_sessions(is_trusted_device) WHERE is_trusted_device = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_sync ON public.user_sessions(sync_version, last_synced);
CREATE INDEX IF NOT EXISTS idx_user_sessions_deleted ON public.user_sessions(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar nova sessão
CREATE OR REPLACE FUNCTION public.create_user_session(
  p_user_id UUID,
  p_session_token TEXT,
  p_refresh_token TEXT DEFAULT NULL,
  p_ip_address INET,
  p_user_agent TEXT DEFAULT NULL,
  p_device_type public.device_type DEFAULT 'unknown',
  p_platform TEXT DEFAULT 'web',
  p_expires_hours INTEGER DEFAULT 24
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id UUID;
  max_sessions INTEGER;
  session_duration INTEGER;
  current_session_count INTEGER;
BEGIN
  -- Obter configurações de sessão
  SELECT 
    (setting_value->>'concurrent_sessions_limit')::integer,
    (setting_value->>'max_duration_hours')::integer
  INTO max_sessions, session_duration
  FROM public.auth_settings
  WHERE setting_key = 'session_policy';
  
  -- Usar configurações padrão se não encontradas
  max_sessions := COALESCE(max_sessions, 3);
  session_duration := COALESCE(session_duration, p_expires_hours);
  
  -- Verificar limite de sessões concorrentes
  SELECT COUNT(*)
  INTO current_session_count
  FROM public.user_sessions
  WHERE user_id = p_user_id
  AND session_status = 'active'
  AND expires_at > public.now_utc()
  AND deleted_at IS NULL;
  
  -- Terminar sessões mais antigas se exceder limite
  IF current_session_count >= max_sessions THEN
    UPDATE public.user_sessions
    SET 
      session_status = 'terminated',
      logout_at = public.now_utc(),
      updated_at = public.now_utc()
    WHERE user_id = p_user_id
    AND session_status = 'active'
    AND id IN (
      SELECT id
      FROM public.user_sessions
      WHERE user_id = p_user_id
      AND session_status = 'active'
      ORDER BY last_activity_at ASC
      LIMIT current_session_count - max_sessions + 1
    );
  END IF;
  
  -- Criar nova sessão
  session_id := uuid_generate_v4();
  
  INSERT INTO public.user_sessions (
    id,
    session_token,
    refresh_token,
    user_id,
    device_type,
    user_agent,
    ip_address,
    platform,
    expires_at
  ) VALUES (
    session_id,
    p_session_token,
    p_refresh_token,
    p_user_id,
    p_device_type,
    p_user_agent,
    p_ip_address,
    p_platform,
    public.now_utc() + (session_duration || ' hours')::interval
  );
  
  -- Log da criação da sessão
  PERFORM public.log_user_activity(
    p_user_id,
    'login',
    'user_session',
    session_id,
    'User session created',
    NULL,
    jsonb_build_object(
      'ip_address', p_ip_address::text,
      'device_type', p_device_type,
      'platform', p_platform
    )
  );
  
  RETURN session_id;
END;
$$;

-- Função para atualizar atividade da sessão
CREATE OR REPLACE FUNCTION public.update_session_activity(
  p_session_token TEXT,
  p_data_transferred_mb NUMERIC DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_found BOOLEAN := false;
BEGIN
  UPDATE public.user_sessions
  SET 
    last_activity_at = public.now_utc(),
    activity_count = activity_count + 1,
    data_transferred_mb = data_transferred_mb + COALESCE(p_data_transferred_mb, 0),
    updated_at = public.now_utc()
  WHERE session_token = p_session_token
  AND session_status = 'active'
  AND expires_at > public.now_utc()
  AND deleted_at IS NULL;
  
  GET DIAGNOSTICS session_found = FOUND;
  RETURN session_found;
END;
$$;

-- Função para terminar sessão
CREATE OR REPLACE FUNCTION public.terminate_session(
  p_session_token TEXT,
  p_reason TEXT DEFAULT 'user_logout'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_user_id UUID;
  session_id UUID;
BEGIN
  -- Obter dados da sessão
  SELECT user_id, id
  INTO session_user_id, session_id
  FROM public.user_sessions
  WHERE session_token = p_session_token
  AND deleted_at IS NULL;
  
  IF session_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Terminar sessão
  UPDATE public.user_sessions
  SET 
    session_status = 'terminated',
    logout_at = public.now_utc(),
    updated_at = public.now_utc()
  WHERE session_token = p_session_token;
  
  -- Log do logout
  PERFORM public.log_user_activity(
    session_user_id,
    'logout',
    'user_session',
    session_id,
    'User session terminated: ' || p_reason
  );
  
  RETURN true;
END;
$$;

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Marcar sessões expiradas
  UPDATE public.user_sessions
  SET 
    session_status = 'expired',
    updated_at = public.now_utc()
  WHERE session_status = 'active'
  AND expires_at <= public.now_utc()
  AND deleted_at IS NULL;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Soft delete sessões muito antigas
  UPDATE public.user_sessions
  SET deleted_at = public.now_utc()
  WHERE created_at < public.now_utc() - interval '90 days'
  AND deleted_at IS NULL;
  
  RAISE NOTICE 'Expired % sessions', expired_count;
  RETURN expired_count;
END;
$$;

-- Função para detectar sessões suspeitas
CREATE OR REPLACE FUNCTION public.detect_suspicious_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  suspicious_count INTEGER := 0;
  session_rec RECORD;
BEGIN
  -- Procurar por padrões suspeitos
  FOR session_rec IN
    SELECT 
      id,
      user_id,
      ip_address,
      user_agent,
      login_at,
      last_activity_at,
      activity_count
    FROM public.user_sessions
    WHERE session_status = 'active'
    AND deleted_at IS NULL
  LOOP
    -- Verificar múltiplos logins de IPs diferentes
    IF EXISTS (
      SELECT 1 FROM public.user_sessions
      WHERE user_id = session_rec.user_id
      AND ip_address != session_rec.ip_address
      AND session_status = 'active'
      AND login_at > public.now_utc() - interval '1 hour'
      AND deleted_at IS NULL
    ) THEN
      UPDATE public.user_sessions
      SET 
        session_status = 'suspicious',
        risk_score = LEAST(risk_score + 20, 100),
        flags = flags || '["multiple_locations"]'::jsonb,
        updated_at = public.now_utc()
      WHERE id = session_rec.id;
      
      suspicious_count := suspicious_count + 1;
    END IF;
    
    -- Verificar atividade anormalmente alta
    IF session_rec.activity_count > 1000 
    AND session_rec.last_activity_at > session_rec.login_at + interval '1 hour' THEN
      UPDATE public.user_sessions
      SET 
        risk_score = LEAST(risk_score + 15, 100),
        flags = flags || '["high_activity"]'::jsonb,
        updated_at = public.now_utc()
      WHERE id = session_rec.id;
    END IF;
  END LOOP;
  
  RETURN suspicious_count;
END;
$$;

-- View para sessões ativas
CREATE OR REPLACE VIEW public.active_user_sessions AS
SELECT 
  us.id,
  up.employee_number,
  up.display_name as user_name,
  us.device_type,
  us.platform,
  us.ip_address,
  us.country_code,
  us.login_at,
  us.last_activity_at,
  us.expires_at,
  us.is_trusted_device,
  us.risk_score,
  extract(epoch from (public.now_utc() - us.last_activity_at))/60 as minutes_since_activity,
  extract(epoch from (us.expires_at - public.now_utc()))/3600 as hours_until_expiry
FROM public.user_sessions us
INNER JOIN public.user_profiles up ON us.user_id = up.id
WHERE us.session_status = 'active'
AND us.expires_at > public.now_utc()
AND us.deleted_at IS NULL
ORDER BY us.last_activity_at DESC;

-- View para estatísticas de sessões
CREATE OR REPLACE VIEW public.session_statistics AS
SELECT 
  device_type,
  platform,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN session_status = 'active' THEN 1 END) as active_sessions,
  COUNT(CASE WHEN session_status = 'expired' THEN 1 END) as expired_sessions,
  COUNT(CASE WHEN session_status = 'suspicious' THEN 1 END) as suspicious_sessions,
  AVG(activity_count) as avg_activity_count,
  AVG(risk_score) as avg_risk_score,
  COUNT(DISTINCT user_id) as unique_users
FROM public.user_sessions
WHERE deleted_at IS NULL
AND created_at > public.now_utc() - interval '30 days'
GROUP BY device_type, platform
ORDER BY total_sessions DESC;

-- Políticas RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Política: utilizadores podem ver as próprias sessões
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Política: admins podem ver todas as sessões
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
      AND r.level <= 20
      AND ur.is_active = true
      AND ur.deleted_at IS NULL
    )
  );

-- Política: apenas sistema pode modificar sessões
CREATE POLICY "Only system can modify sessions" ON public.user_sessions
  FOR ALL USING (false); -- Controlado pelas funções

-- Comentários
COMMENT ON TABLE public.user_sessions IS 'Gestão avançada de sessões de utilizador com segurança e auditoria';
COMMENT ON COLUMN public.user_sessions.session_token IS 'Token único da sessão para autenticação';
COMMENT ON COLUMN public.user_sessions.device_fingerprint IS 'Fingerprint único do dispositivo';
COMMENT ON COLUMN public.user_sessions.risk_score IS 'Score de risco da sessão (0-100)';
COMMENT ON COLUMN public.user_sessions.flags IS 'Array de flags de segurança da sessão';
COMMENT ON COLUMN public.user_sessions.is_trusted_device IS 'Indica se é um dispositivo confiável';

COMMENT ON FUNCTION public.create_user_session IS 'Cria nova sessão com validações de limite';
COMMENT ON FUNCTION public.update_session_activity IS 'Atualiza atividade da sessão';
COMMENT ON FUNCTION public.terminate_session IS 'Termina sessão com logging';
COMMENT ON FUNCTION public.cleanup_expired_sessions() IS 'Remove sessões expiradas';
COMMENT ON FUNCTION public.detect_suspicious_sessions() IS 'Detecta e marca sessões suspeitas';

COMMENT ON VIEW public.active_user_sessions IS 'Vista de sessões ativas com metadados úteis';
COMMENT ON VIEW public.session_statistics IS 'Estatísticas de uso de sessões por tipo e plataforma';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000009_user_sessions.sql aplicada com sucesso';
  RAISE NOTICE 'Sistema de gestão de sessões criado';
  RAISE NOTICE 'Funções de segurança e detecção implementadas';
  RAISE NOTICE 'Views de monitorização configuradas';
  RAISE NOTICE 'Políticas de acesso aplicadas';
END $$;
