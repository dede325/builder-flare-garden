-- =========================================================================
-- Migration: 20250101000019_system_settings.sql
-- Descrição: Configurações globais do sistema
-- =========================================================================

CREATE TYPE public.setting_data_type AS ENUM ('string', 'number', 'boolean', 'json', 'date', 'time');
CREATE TYPE public.setting_scope AS ENUM ('global', 'company', 'department', 'user');

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  setting_key TEXT UNIQUE NOT NULL,
  setting_name TEXT NOT NULL,
  description TEXT,
  
  -- Valor
  setting_value JSONB NOT NULL,
  default_value JSONB,
  data_type public.setting_data_type DEFAULT 'string',
  
  -- Escopo e acesso
  scope public.setting_scope DEFAULT 'global',
  is_public BOOLEAN DEFAULT false,
  is_readonly BOOLEAN DEFAULT false,
  requires_restart BOOLEAN DEFAULT false,
  
  -- Validação
  validation_rules JSONB, -- Regras de validação
  allowed_values JSONB, -- Valores permitidos
  
  -- Categoria
  category TEXT DEFAULT 'general',
  subcategory TEXT,
  display_order INTEGER DEFAULT 100,
  
  -- Metadados
  last_modified_by UUID REFERENCES public.user_profiles(id),
  
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_scope ON public.system_settings(scope);

-- Trigger para updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para obter configuração
CREATE OR REPLACE FUNCTION public.get_setting(setting_key TEXT, default_val JSONB DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT setting_value INTO result
  FROM public.system_settings
  WHERE system_settings.setting_key = get_setting.setting_key
  AND deleted_at IS NULL;
  
  RETURN COALESCE(result, default_val);
END;
$$;

-- Função para definir configuração
CREATE OR REPLACE FUNCTION public.set_setting(
  setting_key TEXT,
  setting_val JSONB,
  modified_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.system_settings (setting_key, setting_name, setting_value, last_modified_by)
  VALUES (setting_key, setting_key, setting_val, modified_by)
  ON CONFLICT (setting_key) 
  DO UPDATE SET 
    setting_value = setting_val,
    last_modified_by = modified_by,
    updated_at = public.now_utc();
  
  RETURN TRUE;
END;
$$;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view public settings" ON public.system_settings
  FOR SELECT USING (is_public = true OR auth.uid() IS NOT NULL);

COMMENT ON TABLE public.system_settings IS 'Configurações globais do sistema';

-- Inserir configurações padrão
INSERT INTO public.system_settings (setting_key, setting_name, setting_value, description, category, is_public) VALUES
('company_name', 'Nome da Empresa', '"AirPlus Aviation"', 'Nome oficial da empresa', 'company', true),
('company_country', 'País da Empresa', '"Angola"', 'País de operação principal', 'company', true),
('default_timezone', 'Fuso Horário Padrão', '"Africa/Luanda"', 'Fuso horário padrão do sistema', 'system', true),
('default_currency', 'Moeda Padrão', '"AOA"', 'Moeda padrão para valores monetários', 'system', true),
('maintenance_interval_hours', 'Intervalo de Manutenção (Horas)', '100', 'Intervalo padrão entre manutenções em horas de voo', 'maintenance', false),
('cleaning_frequency_days', 'Frequência de Limpeza (Dias)', '7', 'Frequência padrão de limpeza em dias', 'cleaning', false);

-- Log
DO $$ BEGIN RAISE NOTICE 'Migration 20250101000019_system_settings.sql aplicada com sucesso'; END $$;
