-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000003_user_profiles.sql
-- Descrição: Perfis estendidos de utilizadores com dados específicos Angola
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Tabela de perfis de utilizador (estende auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações pessoais
  employee_number TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  
  -- Contactos
  phone TEXT CHECK (public.is_valid_phone_angola(phone)),
  phone_secondary TEXT CHECK (public.is_valid_phone_angola(phone_secondary)),
  address TEXT,
  city TEXT DEFAULT 'Luanda',
  province TEXT DEFAULT 'Luanda',
  postal_code TEXT,
  
  -- Dados profissionais
  department TEXT,
  position TEXT,
  hire_date DATE,
  termination_date DATE,
  salary_grade TEXT,
  
  -- Dados de emergência
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT CHECK (public.is_valid_phone_angola(emergency_contact_phone)),
  emergency_contact_relationship TEXT,
  
  -- Documentação Angola
  bi_number TEXT CHECK (public.is_valid_angola_document(bi_number)),
  passport_number TEXT,
  tax_number TEXT,
  social_security_number TEXT,
  license_number TEXT,
  
  -- Certificações e qualificações
  certifications JSONB DEFAULT '[]'::jsonb,
  qualifications JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '["pt"]'::jsonb,
  
  -- Configurações pessoais
  preferences JSONB DEFAULT '{
    "theme": "aviation-blue",
    "language": "pt",
    "timezone": "Africa/Luanda",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "dashboard": {
      "default_view": "overview",
      "show_tutorial": true
    }
  }'::jsonb,
  
  -- Dados de acesso
  last_login TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login TIMESTAMPTZ,
  account_locked_until TIMESTAMPTZ,
  
  -- Status e metadados
  status public.user_status DEFAULT 'active',
  is_verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  verification_code_expires_at TIMESTAMPTZ,
  
  -- Sync metadata para mobile
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  
  -- Timestamps obrigatórios
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_number ON public.user_profiles(employee_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON public.user_profiles(department);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON public.user_profiles(last_login);
CREATE INDEX IF NOT EXISTS idx_user_profiles_sync ON public.user_profiles(sync_version, last_synced);
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted ON public.user_profiles(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil de utilizador automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  employee_num TEXT;
BEGIN
  -- Gerar número de funcionário único
  employee_num := 'EMP' || extract(year from now()) || lpad(nextval('employee_number_seq')::text, 6, '0');
  
  -- Inserir perfil básico
  INSERT INTO public.user_profiles (
    id,
    employee_number,
    display_name,
    first_name,
    last_name,
    status
  ) VALUES (
    NEW.id,
    employee_num,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'pending_verification'
  );
  
  RETURN NEW;
END;
$$;

-- Criar sequência para números de funcionário
CREATE SEQUENCE IF NOT EXISTS employee_number_seq START 1000;

-- Trigger para criar perfil automaticamente quando utilizador se regista
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar último login
CREATE OR REPLACE FUNCTION public.update_last_login(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    last_login = public.now_utc(),
    last_activity = public.now_utc(),
    login_count = login_count + 1,
    failed_login_attempts = 0
  WHERE id = user_id;
END;
$$;

-- Função para registar tentativa de login falhada
CREATE OR REPLACE FUNCTION public.record_failed_login(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_attempts INTEGER;
  lockout_duration INTEGER;
BEGIN
  -- Obter configurações de lockout
  SELECT 
    (setting_value->>'max_failed_attempts')::integer,
    (setting_value->>'lockout_duration_minutes')::integer
  INTO max_attempts, lockout_duration
  FROM public.auth_settings
  WHERE setting_key = 'account_lockout';
  
  -- Atualizar tentativas falhadas
  UPDATE public.user_profiles
  SET 
    failed_login_attempts = failed_login_attempts + 1,
    last_failed_login = public.now_utc(),
    account_locked_until = CASE 
      WHEN failed_login_attempts + 1 >= max_attempts 
      THEN public.now_utc() + (lockout_duration || ' minutes')::interval
      ELSE NULL
    END
  WHERE id = user_id;
END;
$$;

-- Função para verificar se conta está bloqueada
CREATE OR REPLACE FUNCTION public.is_account_locked(user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  locked_until TIMESTAMPTZ;
BEGIN
  SELECT account_locked_until
  INTO locked_until
  FROM public.user_profiles
  WHERE id = user_id;
  
  RETURN (locked_until IS NOT NULL AND locked_until > public.now_utc());
END;
$$;

-- View para dados públicos do perfil (sem informações sensíveis)
CREATE OR REPLACE VIEW public.user_profiles_public AS
SELECT 
  id,
  employee_number,
  display_name,
  department,
  position,
  status,
  created_at
FROM public.user_profiles
WHERE deleted_at IS NULL AND status = 'active';

-- Políticas RLS básicas (serão expandidas nas próximas migrations)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: utilizadores podem ver o próprio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Política: utilizadores podem atualizar o próprio perfil
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Comentários
COMMENT ON TABLE public.user_profiles IS 'Perfis estendidos de utilizadores com dados específicos para Angola';
COMMENT ON COLUMN public.user_profiles.employee_number IS 'Número único de funcionário (auto-gerado)';
COMMENT ON COLUMN public.user_profiles.bi_number IS 'Número do Bilhete de Identidade angolano';
COMMENT ON COLUMN public.user_profiles.certifications IS 'Array de certificações profissionais';
COMMENT ON COLUMN public.user_profiles.preferences IS 'Configurações personalizadas do utilizador';
COMMENT ON COLUMN public.user_profiles.sync_version IS 'Versão para controlo de sincronização mobile';

COMMENT ON FUNCTION public.handle_new_user() IS 'Cria perfil automático quando novo utilizador se regista';
COMMENT ON FUNCTION public.update_last_login(UUID) IS 'Atualiza timestamp do último login e reset tentativas falhadas';
COMMENT ON FUNCTION public.record_failed_login(UUID) IS 'Regista tentativa de login falhada e aplica lockout se necessário';
COMMENT ON FUNCTION public.is_account_locked(UUID) IS 'Verifica se conta está bloqueada devido a tentativas falhadas';

COMMENT ON VIEW public.user_profiles_public IS 'View pública com dados não-sensíveis dos perfis';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000003_user_profiles.sql aplicada com sucesso';
  RAISE NOTICE 'Tabela user_profiles criada com validações para Angola';
  RAISE NOTICE 'Triggers para criação automática de perfis configurados';
  RAISE NOTICE 'Funções de segurança de login implementadas';
  RAISE NOTICE 'Políticas RLS básicas aplicadas';
END $$;
