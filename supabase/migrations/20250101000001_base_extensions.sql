-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000001_base_extensions.sql
-- Descrição: Extensões PostgreSQL e configurações fundamentais
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Ativar extensões necessárias para o sistema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Configurar timezone para Angola
SET timezone = 'Africa/Luanda';

-- Criar schema para dados temporários se necessário
CREATE SCHEMA IF NOT EXISTS temp_data;

-- Função para gerar timestamps padronizados
CREATE OR REPLACE FUNCTION public.now_utc()
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT NOW() AT TIME ZONE 'UTC';
$$;

-- Função para atualizar campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = public.now_utc();
  RETURN NEW;
END;
$$;

-- Função para validar UUIDs
CREATE OR REPLACE FUNCTION public.is_valid_uuid(input_text text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Verificar se o texto corresponde ao formato UUID
  RETURN input_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;

-- Função para gerar códigos sequenciais
CREATE OR REPLACE FUNCTION public.generate_code(prefix text, sequence_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_val integer;
  code_length integer := 6;
BEGIN
  -- Obter próximo valor da sequência
  EXECUTE format('SELECT nextval(%L)', sequence_name) INTO next_val;
  
  -- Gerar código com padding de zeros
  RETURN prefix || lpad(next_val::text, code_length, '0');
END;
$$;

-- Comentários das extensões
COMMENT ON EXTENSION "uuid-ossp" IS 'Geração de UUIDs para chaves primárias únicas';
COMMENT ON EXTENSION "pgcrypto" IS 'Funções criptográficas para segurança de dados';
COMMENT ON EXTENSION "pg_stat_statements" IS 'Monitorização de performance de queries';

-- Comentários das funções
COMMENT ON FUNCTION public.now_utc() IS 'Retorna timestamp atual em UTC para padronização';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function para atualizar updated_at automaticamente';
COMMENT ON FUNCTION public.is_valid_uuid(text) IS 'Valida formato de UUID';
COMMENT ON FUNCTION public.generate_code(text, text) IS 'Gera códigos sequenciais com prefixo';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000001_base_extensions.sql aplicada com sucesso';
  RAISE NOTICE 'Extensões PostgreSQL configuradas';
  RAISE NOTICE 'Funções utilitárias criadas';
END $$;
