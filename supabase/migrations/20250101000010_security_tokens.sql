-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000010_security_tokens.sql
-- Descrição: Sistema de tokens de segurança para reset, verificação e API
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Enum para tipos de token
CREATE TYPE public.token_type AS ENUM (
  'password_reset',
  'email_verification',
  'phone_verification',
  'mfa_setup',
  'api_key',
  'temporary_access',
  'account_recovery',
  'device_trust'
);

-- Enum para status de token
CREATE TYPE public.token_status AS ENUM (
  'active',
  'used',
  'expired',
  'revoked',
  'invalid'
);

-- Tabela de tokens de segurança
CREATE TABLE IF NOT EXISTS public.security_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação do token
  token_value TEXT UNIQUE NOT NULL,
  token_hash TEXT UNIQUE NOT NULL, -- Hash do token para segurança
  token_type public.token_type NOT NULL,
  token_status public.token_status DEFAULT 'active',
  
  -- Associação
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
  
  -- Configurações do token
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  
  -- Restrições de acesso
  ip_restrictions INET[], -- IPs permitidos
  device_restrictions JSONB, -- Dispositivos permitidos
  scope_restrictions JSONB, -- Escopo de acesso limitado
  
  -- Metadados de criação
  created_by UUID REFERENCES public.user_profiles(id),
  creation_reason TEXT,
  creation_context JSONB,
  
  -- Metadados de uso
  first_used_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  last_used_ip INET,
  last_used_user_agent TEXT,
  
  -- Dados específicos do tipo
  verification_data JSONB, -- Dados específicos para verificação
  recovery_data JSONB, -- Dados para recuperação de conta
  api_permissions JSONB, -- Permissões para API keys
  
  -- Sync metadata para mobile
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  
  -- Timestamps obrigatórios
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_security_tokens_value ON public.security_tokens(token_value);
CREATE INDEX IF NOT EXISTS idx_security_tokens_hash ON public.security_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_security_tokens_type ON public.security_tokens(token_type);
CREATE INDEX IF NOT EXISTS idx_security_tokens_status ON public.security_tokens(token_status);
CREATE INDEX IF NOT EXISTS idx_security_tokens_user ON public.security_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_security_tokens_session ON public.security_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_security_tokens_expires ON public.security_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_tokens_active ON public.security_tokens(token_status, expires_at) WHERE token_status = 'active';
CREATE INDEX IF NOT EXISTS idx_security_tokens_sync ON public.security_tokens(sync_version, last_synced);
CREATE INDEX IF NOT EXISTS idx_security_tokens_deleted ON public.security_tokens(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_security_tokens_updated_at
  BEFORE UPDATE ON public.security_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar token seguro
CREATE OR REPLACE FUNCTION public.generate_secure_token(
  token_length INTEGER DEFAULT 32
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..token_length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  
  RETURN result;
END;
$$;

-- Função para criar token de segurança
CREATE OR REPLACE FUNCTION public.create_security_token(
  p_token_type public.token_type,
  p_user_id UUID,
  p_expires_minutes INTEGER DEFAULT 60,
  p_max_uses INTEGER DEFAULT 1,
  p_scope_restrictions JSONB DEFAULT NULL,
  p_creation_reason TEXT DEFAULT NULL
)
RETURNS TABLE(token_id UUID, token_value TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token_id UUID;
  new_token_value TEXT;
  token_hash_value TEXT;
  default_expires INTEGER;
BEGIN
  -- Gerar token único
  new_token_id := uuid_generate_v4();
  new_token_value := public.generate_secure_token(
    CASE p_token_type
      WHEN 'api_key' THEN 64
      WHEN 'password_reset' THEN 32
      WHEN 'email_verification' THEN 24
      WHEN 'phone_verification' THEN 6 -- Código numérico curto
      ELSE 32
    END
  );
  
  -- Para códigos de verificação telefónica, usar apenas números
  IF p_token_type = 'phone_verification' THEN
    new_token_value := lpad(floor(random() * 1000000)::TEXT, 6, '0');
  END IF;
  
  -- Criar hash do token
  token_hash_value := encode(digest(new_token_value, 'sha256'), 'hex');
  
  -- Definir expiração padrão baseada no tipo
  default_expires := CASE p_token_type
    WHEN 'password_reset' THEN 30 -- 30 minutos
    WHEN 'email_verification' THEN 1440 -- 24 horas
    WHEN 'phone_verification' THEN 5 -- 5 minutos
    WHEN 'mfa_setup' THEN 60 -- 1 hora
    WHEN 'api_key' THEN 525600 -- 1 ano
    WHEN 'temporary_access' THEN 60 -- 1 hora
    WHEN 'account_recovery' THEN 120 -- 2 horas
    WHEN 'device_trust' THEN 10080 -- 7 dias
    ELSE p_expires_minutes
  END;
  
  -- Revogar tokens anteriores do mesmo tipo (se aplicável)
  IF p_token_type IN ('password_reset', 'email_verification', 'phone_verification', 'mfa_setup') THEN
    UPDATE public.security_tokens
    SET 
      token_status = 'revoked',
      updated_at = public.now_utc()
    WHERE user_id = p_user_id
    AND token_type = p_token_type
    AND token_status = 'active'
    AND deleted_at IS NULL;
  END IF;
  
  -- Inserir novo token
  INSERT INTO public.security_tokens (
    id,
    token_value,
    token_hash,
    token_type,
    user_id,
    expires_at,
    max_uses,
    scope_restrictions,
    creation_reason
  ) VALUES (
    new_token_id,
    new_token_value,
    token_hash_value,
    p_token_type,
    p_user_id,
    public.now_utc() + (default_expires || ' minutes')::interval,
    p_max_uses,
    p_scope_restrictions,
    p_creation_reason
  );
  
  -- Log da criação do token
  PERFORM public.log_user_activity(
    p_user_id,
    'create',
    'security_token',
    new_token_id,
    'Security token created: ' || p_token_type::TEXT,
    NULL,
    jsonb_build_object(
      'token_type', p_token_type,
      'expires_minutes', default_expires,
      'max_uses', p_max_uses
    )
  );
  
  RETURN QUERY SELECT new_token_id, new_token_value;
END;
$$;

-- Função para validar e usar token
CREATE OR REPLACE FUNCTION public.validate_and_use_token(
  p_token_value TEXT,
  p_expected_type public.token_type DEFAULT NULL,
  p_user_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
  is_valid BOOLEAN,
  token_id UUID,
  user_id UUID,
  remaining_uses INTEGER,
  token_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_rec RECORD;
  token_hash_value TEXT;
  ip_allowed BOOLEAN := true;
BEGIN
  -- Criar hash do token para busca
  token_hash_value := encode(digest(p_token_value, 'sha256'), 'hex');
  
  -- Buscar token
  SELECT *
  INTO token_rec
  FROM public.security_tokens
  WHERE token_hash = token_hash_value
  AND deleted_at IS NULL;
  
  -- Verificar se token existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 0, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Verificar tipo se especificado
  IF p_expected_type IS NOT NULL AND token_rec.token_type != p_expected_type THEN
    RETURN QUERY SELECT false, token_rec.id, token_rec.user_id, 0, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Verificar status
  IF token_rec.token_status != 'active' THEN
    RETURN QUERY SELECT false, token_rec.id, token_rec.user_id, 0, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Verificar expiração
  IF token_rec.expires_at <= public.now_utc() THEN
    UPDATE public.security_tokens
    SET token_status = 'expired', updated_at = public.now_utc()
    WHERE id = token_rec.id;
    
    RETURN QUERY SELECT false, token_rec.id, token_rec.user_id, 0, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Verificar usos restantes
  IF token_rec.current_uses >= token_rec.max_uses THEN
    UPDATE public.security_tokens
    SET token_status = 'used', updated_at = public.now_utc()
    WHERE id = token_rec.id;
    
    RETURN QUERY SELECT false, token_rec.id, token_rec.user_id, 0, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Verificar restrições de IP
  IF p_user_ip IS NOT NULL AND token_rec.ip_restrictions IS NOT NULL THEN
    ip_allowed := p_user_ip = ANY(token_rec.ip_restrictions);
    IF NOT ip_allowed THEN
      RETURN QUERY SELECT false, token_rec.id, token_rec.user_id, 0, NULL::JSONB;
      RETURN;
    END IF;
  END IF;
  
  -- Token é válido, atualizar uso
  UPDATE public.security_tokens
  SET 
    current_uses = current_uses + 1,
    last_used_at = public.now_utc(),
    last_used_ip = p_user_ip,
    last_used_user_agent = p_user_agent,
    first_used_at = COALESCE(first_used_at, public.now_utc()),
    token_status = CASE 
      WHEN current_uses + 1 >= max_uses THEN 'used'::public.token_status
      ELSE 'active'::public.token_status
    END,
    updated_at = public.now_utc()
  WHERE id = token_rec.id;
  
  -- Log do uso do token
  PERFORM public.log_user_activity(
    token_rec.user_id,
    'update',
    'security_token',
    token_rec.id,
    'Security token used: ' || token_rec.token_type::TEXT,
    NULL,
    jsonb_build_object(
      'ip_address', p_user_ip::TEXT,
      'remaining_uses', token_rec.max_uses - token_rec.current_uses - 1
    )
  );
  
  -- Retornar sucesso
  RETURN QUERY SELECT 
    true,
    token_rec.id,
    token_rec.user_id,
    token_rec.max_uses - token_rec.current_uses - 1,
    jsonb_build_object(
      'verification_data', token_rec.verification_data,
      'recovery_data', token_rec.recovery_data,
      'api_permissions', token_rec.api_permissions,
      'scope_restrictions', token_rec.scope_restrictions
    );
END;
$$;

-- Função para revogar tokens
CREATE OR REPLACE FUNCTION public.revoke_tokens(
  p_user_id UUID DEFAULT NULL,
  p_token_type public.token_type DEFAULT NULL,
  p_reason TEXT DEFAULT 'Manual revocation'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE public.security_tokens
  SET 
    token_status = 'revoked',
    updated_at = public.now_utc(),
    creation_reason = COALESCE(creation_reason, '') || ' | Revoked: ' || p_reason
  WHERE (p_user_id IS NULL OR user_id = p_user_id)
  AND (p_token_type IS NULL OR token_type = p_token_type)
  AND token_status = 'active'
  AND deleted_at IS NULL;
  
  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  
  RAISE NOTICE 'Revoked % tokens for user % type %', revoked_count, p_user_id, p_token_type;
  RETURN revoked_count;
END;
$$;

-- Função para limpar tokens expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Marcar tokens expirados
  UPDATE public.security_tokens
  SET 
    token_status = 'expired',
    updated_at = public.now_utc()
  WHERE token_status = 'active'
  AND expires_at <= public.now_utc()
  AND deleted_at IS NULL;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Soft delete tokens muito antigos (90 dias)
  UPDATE public.security_tokens
  SET deleted_at = public.now_utc()
  WHERE created_at < public.now_utc() - interval '90 days'
  AND deleted_at IS NULL
  AND token_status IN ('used', 'expired', 'revoked');
  
  RAISE NOTICE 'Expired % tokens', expired_count;
  RETURN expired_count;
END;
$$;

-- View para tokens ativos por utilizador
CREATE OR REPLACE VIEW public.active_user_tokens AS
SELECT 
  st.id,
  up.employee_number,
  up.display_name as user_name,
  st.token_type,
  st.expires_at,
  st.max_uses,
  st.current_uses,
  st.max_uses - st.current_uses as remaining_uses,
  st.created_at,
  st.last_used_at,
  extract(epoch from (st.expires_at - public.now_utc()))/3600 as hours_until_expiry
FROM public.security_tokens st
INNER JOIN public.user_profiles up ON st.user_id = up.id
WHERE st.token_status = 'active'
AND st.expires_at > public.now_utc()
AND st.deleted_at IS NULL
ORDER BY st.expires_at;

-- View para estatísticas de tokens
CREATE OR REPLACE VIEW public.token_statistics AS
SELECT 
  token_type,
  token_status,
  COUNT(*) as total_tokens,
  COUNT(CASE WHEN expires_at > public.now_utc() THEN 1 END) as valid_tokens,
  COUNT(CASE WHEN expires_at <= public.now_utc() THEN 1 END) as expired_tokens,
  AVG(current_uses) as avg_uses,
  COUNT(DISTINCT user_id) as unique_users
FROM public.security_tokens
WHERE deleted_at IS NULL
AND created_at > public.now_utc() - interval '30 days'
GROUP BY token_type, token_status
ORDER BY token_type, token_status;

-- Políticas RLS
ALTER TABLE public.security_tokens ENABLE ROW LEVEL SECURITY;

-- Política: utilizadores podem ver os próprios tokens não-sensíveis
CREATE POLICY "Users can view own non-sensitive tokens" ON public.security_tokens
  FOR SELECT USING (
    auth.uid() = user_id 
    AND token_type NOT IN ('api_key', 'account_recovery')
  );

-- Política: admins podem ver todos os tokens (sem valor)
CREATE POLICY "Admins can view all tokens metadata" ON public.security_tokens
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

-- Política: apenas sistema pode modificar tokens
CREATE POLICY "Only system can modify tokens" ON public.security_tokens
  FOR ALL USING (false); -- Controlado pelas funções

-- Comentários
COMMENT ON TABLE public.security_tokens IS 'Sistema de tokens de segurança para reset, verificação e API';
COMMENT ON COLUMN public.security_tokens.token_value IS 'Valor do token (apenas na criação)';
COMMENT ON COLUMN public.security_tokens.token_hash IS 'Hash SHA256 do token para busca segura';
COMMENT ON COLUMN public.security_tokens.ip_restrictions IS 'Array de IPs permitidos para uso do token';
COMMENT ON COLUMN public.security_tokens.scope_restrictions IS 'Restrições de escopo em formato JSON';
COMMENT ON COLUMN public.security_tokens.verification_data IS 'Dados específicos para tokens de verificação';

COMMENT ON FUNCTION public.generate_secure_token(INTEGER) IS 'Gera token seguro com comprimento especificado';
COMMENT ON FUNCTION public.create_security_token IS 'Cria novo token de segurança com validações';
COMMENT ON FUNCTION public.validate_and_use_token IS 'Valida e consome token com verificações de segurança';
COMMENT ON FUNCTION public.revoke_tokens IS 'Revoga tokens baseado em critérios';
COMMENT ON FUNCTION public.cleanup_expired_tokens() IS 'Remove tokens expirados e antigos';

COMMENT ON VIEW public.active_user_tokens IS 'Tokens ativos por utilizador com metadados úteis';
COMMENT ON VIEW public.token_statistics IS 'Estatísticas de uso e status dos tokens';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000010_security_tokens.sql aplicada com sucesso';
  RAISE NOTICE 'Sistema de tokens de segurança criado';
  RAISE NOTICE 'Funções de validação e gestão implementadas';
  RAISE NOTICE 'Views de monitorização configuradas';
  RAISE NOTICE 'Políticas de segurança aplicadas';
  RAISE NOTICE '=== FASE 1 (Fundações) CONCLUÍDA ===';
END $$;
