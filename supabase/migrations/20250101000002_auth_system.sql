-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000002_auth_system.sql
-- Descrição: Sistema de autenticação básico e configurações de segurança
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Ativar Row Level Security por padrão
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Configurar política de passwords para Supabase Auth
-- (Estas configurações são aplicadas via Supabase Dashboard, documentadas aqui)
/*
Password Policy Configuration:
- Minimum length: 8 characters
- Require uppercase: true
- Require lowercase: true
- Require numbers: true
- Require symbols: false
- Prevent password reuse: 5 previous passwords
*/

-- Função para validar formato de email
CREATE OR REPLACE FUNCTION public.is_valid_email(email text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- Função para validar número de telefone (formato Angola)
CREATE OR REPLACE FUNCTION public.is_valid_phone_angola(phone text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Formato: +244XXXXXXXXX ou 244XXXXXXXXX ou 9XXXXXXXX
  RETURN phone ~* '^(\+244|244)?[9][0-9]{8}$';
END;
$$;

-- Função para validar número de documento Angola
CREATE OR REPLACE FUNCTION public.is_valid_angola_document(doc_number text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Formato: 12 dígitos + 2 letras + 3 dígitos (e.g., 001023626BA037)
  RETURN doc_number ~ '^[0-9]{9}[A-Z]{2}[0-9]{3}$';
END;
$$;

-- Função para hash de dados sensíveis (adicional ao Supabase Auth)
CREATE OR REPLACE FUNCTION public.hash_sensitive_data(input_data text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN encode(digest(input_data || current_setting('app.jwt_secret', true), 'sha256'), 'hex');
END;
$$;

-- Função para verificar força da password
CREATE OR REPLACE FUNCTION public.check_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result jsonb := '{}';
  score integer := 0;
BEGIN
  -- Verificar comprimento mínimo
  IF length(password) >= 8 THEN
    score := score + 1;
    result := jsonb_set(result, '{length}', 'true');
  ELSE
    result := jsonb_set(result, '{length}', 'false');
  END IF;
  
  -- Verificar letras maiúsculas
  IF password ~ '[A-Z]' THEN
    score := score + 1;
    result := jsonb_set(result, '{uppercase}', 'true');
  ELSE
    result := jsonb_set(result, '{uppercase}', 'false');
  END IF;
  
  -- Verificar letras minúsculas
  IF password ~ '[a-z]' THEN
    score := score + 1;
    result := jsonb_set(result, '{lowercase}', 'true');
  ELSE
    result := jsonb_set(result, '{lowercase}', 'false');
  END IF;
  
  -- Verificar números
  IF password ~ '[0-9]' THEN
    score := score + 1;
    result := jsonb_set(result, '{numbers}', 'true');
  ELSE
    result := jsonb_set(result, '{numbers}', 'false');
  END IF;
  
  -- Verificar símbolos
  IF password ~ '[^A-Za-z0-9]' THEN
    score := score + 1;
    result := jsonb_set(result, '{symbols}', 'true');
  ELSE
    result := jsonb_set(result, '{symbols}', 'false');
  END IF;
  
  -- Calcular score final
  result := jsonb_set(result, '{score}', score::text);
  
  -- Determinar força
  IF score >= 4 THEN
    result := jsonb_set(result, '{strength}', '"strong"');
  ELSIF score >= 3 THEN
    result := jsonb_set(result, '{strength}', '"medium"');
  ELSE
    result := jsonb_set(result, '{strength}', '"weak"');
  END IF;
  
  RETURN result;
END;
$$;

-- Enum para status de utilizador
CREATE TYPE public.user_status AS ENUM (
  'active',
  'inactive', 
  'suspended',
  'pending_verification',
  'locked'
);

-- Enum para tipos de autenticação
CREATE TYPE public.auth_provider AS ENUM (
  'email',
  'google',
  'microsoft',
  'apple'
);

-- Tabela de configurações de autenticação
CREATE TABLE IF NOT EXISTS public.auth_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_system_setting BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc()
);

-- Trigger para updated_at na tabela auth_settings
CREATE TRIGGER update_auth_settings_updated_at
  BEFORE UPDATE ON public.auth_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configurações padrão de autenticação
INSERT INTO public.auth_settings (setting_key, setting_value, description) VALUES
('password_policy', '{
  "min_length": 8,
  "require_uppercase": true,
  "require_lowercase": true,
  "require_numbers": true,
  "require_symbols": false,
  "max_age_days": 90,
  "prevent_reuse_count": 5
}', 'Política de passwords do sistema'),

('session_policy', '{
  "max_duration_hours": 24,
  "idle_timeout_minutes": 120,
  "concurrent_sessions_limit": 3,
  "require_mfa_for_admin": true
}', 'Política de sessões do sistema'),

('account_lockout', '{
  "max_failed_attempts": 5,
  "lockout_duration_minutes": 30,
  "reset_attempts_after_minutes": 60
}', 'Política de bloqueio de contas'),

('mfa_settings', '{
  "enabled": true,
  "required_for_roles": ["super_admin", "admin"],
  "methods": ["totp", "sms"],
  "backup_codes_count": 10
}', 'Configurações de autenticação multi-fator');

-- Comentários
COMMENT ON FUNCTION public.is_valid_email(text) IS 'Valida formato de endereço de email';
COMMENT ON FUNCTION public.is_valid_phone_angola(text) IS 'Valida formato de telefone angolano';
COMMENT ON FUNCTION public.is_valid_angola_document(text) IS 'Valida formato de documento de identificação angolano';
COMMENT ON FUNCTION public.hash_sensitive_data(text) IS 'Hash seguro para dados sensíveis';
COMMENT ON FUNCTION public.check_password_strength(text) IS 'Verifica força da password e retorna score detalhado';

COMMENT ON TYPE public.user_status IS 'Status possíveis para utilizadores do sistema';
COMMENT ON TYPE public.auth_provider IS 'Provedores de autenticação suportados';

COMMENT ON TABLE public.auth_settings IS 'Configurações de autenticação e segurança do sistema';
COMMENT ON COLUMN public.auth_settings.setting_key IS 'Chave única da configuração';
COMMENT ON COLUMN public.auth_settings.setting_value IS 'Valor da configuração em formato JSON';
COMMENT ON COLUMN public.auth_settings.is_system_setting IS 'Indica se é configuração do sistema (não editável via UI)';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000002_auth_system.sql aplicada com sucesso';
  RAISE NOTICE 'Sistema de autenticação básico configurado';
  RAISE NOTICE 'Funções de validação criadas';
  RAISE NOTICE 'Configurações de segurança inseridas';
END $$;
