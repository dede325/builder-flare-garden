-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000004_roles_system.sql
-- Descrição: Sistema hierárquico de roles com 8 níveis de acesso
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Enum para tipos de roles
CREATE TYPE public.role_type AS ENUM (
  'system',      -- Roles do sistema (não editáveis)
  'custom',      -- Roles personalizados
  'temporary'    -- Roles temporários
);

-- Tabela de roles do sistema
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação do role
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Hierarquia e tipo
  level INTEGER NOT NULL DEFAULT 100,
  parent_role_id UUID REFERENCES public.roles(id),
  role_type public.role_type DEFAULT 'custom',
  
  -- Configurações
  is_active BOOLEAN DEFAULT true,
  is_system_role BOOLEAN DEFAULT false,
  max_users INTEGER, -- Limite de utilizadores com este role
  
  -- Permissões herdadas
  inherit_permissions BOOLEAN DEFAULT true,
  
  -- Configurações específicas
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Metadados
  color_code TEXT DEFAULT '#3b82f6',
  icon_name TEXT DEFAULT 'user',
  
  -- Sync metadata para mobile
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  
  -- Timestamps obrigatórios
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_level ON public.roles(level);
CREATE INDEX IF NOT EXISTS idx_roles_parent ON public.roles(parent_role_id);
CREATE INDEX IF NOT EXISTS idx_roles_active ON public.roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_roles_system ON public.roles(is_system_role);
CREATE INDEX IF NOT EXISTS idx_roles_sync ON public.roles(sync_version, last_synced);
CREATE INDEX IF NOT EXISTS idx_roles_deleted ON public.roles(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar hierarquia de roles
CREATE OR REPLACE FUNCTION public.check_role_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se parent role existe e não cria loop
  IF NEW.parent_role_id IS NOT NULL THEN
    -- Verificar se parent existe
    IF NOT EXISTS (SELECT 1 FROM public.roles WHERE id = NEW.parent_role_id) THEN
      RAISE EXCEPTION 'Parent role does not exist';
    END IF;
    
    -- Verificar se não cria loop (simplified check)
    IF NEW.parent_role_id = NEW.id THEN
      RAISE EXCEPTION 'Role cannot be its own parent';
    END IF;
    
    -- Verificar nível hierárquico
    IF EXISTS (
      SELECT 1 FROM public.roles 
      WHERE id = NEW.parent_role_id 
      AND level >= NEW.level
    ) THEN
      RAISE EXCEPTION 'Parent role must have lower level (higher authority)';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para validar hierarquia
CREATE TRIGGER check_role_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_role_hierarchy();

-- Função para obter roles filhos
CREATE OR REPLACE FUNCTION public.get_child_roles(parent_role_id UUID)
RETURNS TABLE(role_id UUID, role_name TEXT, role_level INTEGER)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE role_tree AS (
    -- Base case: direct children
    SELECT id, name, level, 1 as depth
    FROM public.roles
    WHERE parent_role_id = get_child_roles.parent_role_id
    AND deleted_at IS NULL
    
    UNION ALL
    
    -- Recursive case: children of children
    SELECT r.id, r.name, r.level, rt.depth + 1
    FROM public.roles r
    INNER JOIN role_tree rt ON r.parent_role_id = rt.id
    WHERE r.deleted_at IS NULL
    AND rt.depth < 10 -- Prevent infinite recursion
  )
  SELECT id, name, level
  FROM role_tree
  ORDER BY level, name;
END;
$$;

-- Função para verificar se role A pode gerir role B
CREATE OR REPLACE FUNCTION public.can_manage_role(manager_role_id UUID, target_role_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  manager_level INTEGER;
  target_level INTEGER;
BEGIN
  -- Obter níveis dos roles
  SELECT level INTO manager_level FROM public.roles WHERE id = manager_role_id;
  SELECT level INTO target_level FROM public.roles WHERE id = target_role_id;
  
  -- Roles com nível menor (mais autoridade) podem gerir roles com nível maior
  RETURN manager_level < target_level;
END;
$$;

-- Função para obter role mais alto de um utilizador
CREATE OR REPLACE FUNCTION public.get_user_highest_role(user_id UUID)
RETURNS TABLE(role_id UUID, role_name TEXT, role_level INTEGER)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.name, r.level
  FROM public.roles r
  INNER JOIN public.user_roles ur ON r.id = ur.role_id
  WHERE ur.user_id = get_user_highest_role.user_id
  AND r.is_active = true
  AND r.deleted_at IS NULL
  ORDER BY r.level ASC
  LIMIT 1;
END;
$$;

-- View para roles ativos
CREATE OR REPLACE VIEW public.roles_active AS
SELECT 
  id,
  name,
  display_name,
  description,
  level,
  parent_role_id,
  role_type,
  color_code,
  icon_name,
  settings,
  created_at
FROM public.roles
WHERE is_active = true AND deleted_at IS NULL
ORDER BY level, display_name;

-- View para hierarquia de roles
CREATE OR REPLACE VIEW public.roles_hierarchy AS
WITH RECURSIVE role_tree AS (
  -- Root roles (sem parent)
  SELECT 
    id,
    name,
    display_name,
    level,
    parent_role_id,
    0 as depth,
    ARRAY[name] as path,
    name as root_role
  FROM public.roles
  WHERE parent_role_id IS NULL
  AND deleted_at IS NULL
  
  UNION ALL
  
  -- Child roles
  SELECT 
    r.id,
    r.name,
    r.display_name,
    r.level,
    r.parent_role_id,
    rt.depth + 1,
    rt.path || r.name,
    rt.root_role
  FROM public.roles r
  INNER JOIN role_tree rt ON r.parent_role_id = rt.id
  WHERE r.deleted_at IS NULL
)
SELECT 
  id,
  name,
  display_name,
  level,
  parent_role_id,
  depth,
  path,
  root_role,
  repeat('  ', depth) || display_name as indented_name
FROM role_tree
ORDER BY root_role, level, display_name;

-- Políticas RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ver roles ativos
CREATE POLICY "Anyone can view active roles" ON public.roles
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Política: apenas admins podem modificar roles de sistema
CREATE POLICY "Only admins can modify system roles" ON public.roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
      AND r.level <= 20
    )
  );

-- Comentários
COMMENT ON TABLE public.roles IS 'Sistema hierárquico de roles com 8 níveis de acesso';
COMMENT ON COLUMN public.roles.level IS 'Nível hierárquico (menor = mais autoridade): 1=SuperAdmin, 10=Admin, 20=Manager, etc.';
COMMENT ON COLUMN public.roles.parent_role_id IS 'Role pai para herança hierárquica';
COMMENT ON COLUMN public.roles.inherit_permissions IS 'Se deve herdar permissões do role pai';
COMMENT ON COLUMN public.roles.max_users IS 'Limite máximo de utilizadores com este role';
COMMENT ON COLUMN public.roles.settings IS 'Configurações específicas do role em JSON';

COMMENT ON FUNCTION public.check_role_hierarchy() IS 'Valida hierarquia de roles para evitar loops e inconsistências';
COMMENT ON FUNCTION public.get_child_roles(UUID) IS 'Retorna todos os roles filhos (recursivo) de um role pai';
COMMENT ON FUNCTION public.can_manage_role(UUID, UUID) IS 'Verifica se um role pode gerir outro baseado na hierarquia';
COMMENT ON FUNCTION public.get_user_highest_role(UUID) IS 'Retorna o role de maior autoridade de um utilizador';

COMMENT ON VIEW public.roles_active IS 'View de todos os roles ativos ordenados por nível';
COMMENT ON VIEW public.roles_hierarchy IS 'View hierárquica de roles com indentação visual';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000004_roles_system.sql aplicada com sucesso';
  RAISE NOTICE 'Sistema hierárquico de roles criado';
  RAISE NOTICE 'Funções de gestão de hierarquia implementadas';
  RAISE NOTICE 'Views para visualização de roles criadas';
  RAISE NOTICE 'Políticas RLS básicas aplicadas';
END $$;
