-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000005_permissions_system.sql
-- Descrição: Sistema de permissões granulares por recurso e ação
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Enum para tipos de permissão
CREATE TYPE public.permission_type AS ENUM (
  'resource',    -- Permissão sobre um recurso específico
  'action',      -- Permissão para ação específica
  'system',      -- Permissão de sistema
  'special'      -- Permissão especial/custom
);

-- Enum para ações padrão
CREATE TYPE public.permission_action AS ENUM (
  'create',
  'read',
  'update',
  'delete',
  'list',
  'export',
  'import',
  'approve',
  'reject',
  'assign',
  'unassign',
  'archive',
  'restore',
  'manage',
  'admin'
);

-- Tabela de permissões
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação da permissão
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Categorização
  resource_name TEXT NOT NULL, -- aircraft, employees, tasks, etc.
  action_name public.permission_action NOT NULL,
  permission_type public.permission_type DEFAULT 'resource',
  
  -- Hierarquia e dependências
  parent_permission_id UUID REFERENCES public.permissions(id),
  required_permissions TEXT[], -- Array de permissões obrigatórias
  
  -- Configurações
  is_active BOOLEAN DEFAULT true,
  is_system_permission BOOLEAN DEFAULT false,
  
  -- Restrições de contexto
  context_restrictions JSONB DEFAULT '{}'::jsonb,
  field_restrictions JSONB DEFAULT '{}'::jsonb,
  
  -- Metadados
  category TEXT DEFAULT 'general',
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Sync metadata para mobile
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  
  -- Timestamps obrigatórios
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_permissions_name ON public.permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource_name);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action_name);
CREATE INDEX IF NOT EXISTS idx_permissions_type ON public.permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_permissions_parent ON public.permissions(parent_permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON public.permissions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_risk ON public.permissions(risk_level);
CREATE INDEX IF NOT EXISTS idx_permissions_sync ON public.permissions(sync_version, last_synced);
CREATE INDEX IF NOT EXISTS idx_permissions_deleted ON public.permissions(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar nome de permissão
CREATE OR REPLACE FUNCTION public.generate_permission_name(
  resource TEXT,
  action TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN lower(resource) || '.' || lower(action);
END;
$$;

-- Função para verificar dependências de permissões
CREATE OR REPLACE FUNCTION public.check_permission_dependencies()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  required_perm TEXT;
BEGIN
  -- Verificar se permissões obrigatórias existem
  IF NEW.required_permissions IS NOT NULL THEN
    FOREACH required_perm IN ARRAY NEW.required_permissions
    LOOP
      IF NOT EXISTS (SELECT 1 FROM public.permissions WHERE name = required_perm) THEN
        RAISE EXCEPTION 'Required permission "%" does not exist', required_perm;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para validar dependências
CREATE TRIGGER check_permission_dependencies_trigger
  BEFORE INSERT OR UPDATE ON public.permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_permission_dependencies();

-- Função para obter permissões herdadas
CREATE OR REPLACE FUNCTION public.get_inherited_permissions(permission_id UUID)
RETURNS TABLE(perm_id UUID, perm_name TEXT)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE perm_tree AS (
    -- Base case: permissão atual
    SELECT id, name, parent_permission_id, 0 as depth
    FROM public.permissions
    WHERE id = permission_id
    AND deleted_at IS NULL
    
    UNION ALL
    
    -- Recursive case: permissões pai
    SELECT p.id, p.name, p.parent_permission_id, pt.depth + 1
    FROM public.permissions p
    INNER JOIN perm_tree pt ON p.id = pt.parent_permission_id
    WHERE p.deleted_at IS NULL
    AND pt.depth < 10 -- Prevent infinite recursion
  )
  SELECT id, name
  FROM perm_tree
  WHERE depth > 0; -- Excluir a permissão original
END;
$$;

-- Função para verificar se utilizador tem permissão
CREATE OR REPLACE FUNCTION public.user_has_permission(
  user_id UUID,
  permission_name TEXT
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  has_perm boolean := false;
BEGIN
  -- Verificar permissão direta através de roles
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    INNER JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_has_permission.user_id
    AND p.name = permission_name
    AND p.is_active = true
    AND p.deleted_at IS NULL
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$;

-- Função para obter todas as permissões de um utilizador
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id UUID)
RETURNS TABLE(
  permission_name TEXT,
  resource_name TEXT,
  action_name TEXT,
  via_role TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.name,
    p.resource_name,
    p.action_name::TEXT,
    r.name as role_name
  FROM public.user_roles ur
  INNER JOIN public.roles r ON ur.role_id = r.id
  INNER JOIN public.role_permissions rp ON r.id = rp.role_id
  INNER JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = get_user_permissions.user_id
  AND r.is_active = true
  AND r.deleted_at IS NULL
  AND p.is_active = true
  AND p.deleted_at IS NULL
  ORDER BY p.resource_name, p.action_name::TEXT;
END;
$$;

-- View para permissões ativas agrupadas por recurso
CREATE OR REPLACE VIEW public.permissions_by_resource AS
SELECT 
  resource_name,
  action_name::TEXT as action,
  array_agg(
    json_build_object(
      'id', id,
      'name', name,
      'display_name', display_name,
      'description', description,
      'risk_level', risk_level
    ) ORDER BY action_name, display_name
  ) as permissions
FROM public.permissions
WHERE is_active = true AND deleted_at IS NULL
GROUP BY resource_name, action_name
ORDER BY resource_name, action_name;

-- View para matriz de permissões (recursos vs ações)
CREATE OR REPLACE VIEW public.permissions_matrix AS
SELECT 
  resource_name,
  bool_or(action_name = 'create') as can_create,
  bool_or(action_name = 'read') as can_read,
  bool_or(action_name = 'update') as can_update,
  bool_or(action_name = 'delete') as can_delete,
  bool_or(action_name = 'list') as can_list,
  bool_or(action_name = 'export') as can_export,
  bool_or(action_name = 'import') as can_import,
  bool_or(action_name = 'approve') as can_approve,
  bool_or(action_name = 'manage') as can_manage,
  bool_or(action_name = 'admin') as can_admin,
  count(*) as total_permissions
FROM public.permissions
WHERE is_active = true AND deleted_at IS NULL
GROUP BY resource_name
ORDER BY resource_name;

-- Políticas RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ver permissões ativas
CREATE POLICY "Anyone can view active permissions" ON public.permissions
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Política: apenas super admins podem modificar permissões de sistema
CREATE POLICY "Only super admins can modify system permissions" ON public.permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
      AND r.level <= 10
    )
  );

-- Comentários
COMMENT ON TABLE public.permissions IS 'Sistema granular de permissões por recurso e ação';
COMMENT ON COLUMN public.permissions.resource_name IS 'Nome do recurso (aircraft, employees, tasks, etc.)';
COMMENT ON COLUMN public.permissions.action_name IS 'Ação específica (create, read, update, delete, etc.)';
COMMENT ON COLUMN public.permissions.required_permissions IS 'Array de permissões obrigatórias para esta permissão';
COMMENT ON COLUMN public.permissions.context_restrictions IS 'Restrições de contexto em formato JSON';
COMMENT ON COLUMN public.permissions.field_restrictions IS 'Restrições de campos específicos em formato JSON';
COMMENT ON COLUMN public.permissions.risk_level IS 'Nível de risco da permissão (low, medium, high, critical)';

COMMENT ON FUNCTION public.generate_permission_name(TEXT, TEXT) IS 'Gera nome padronizado de permissão (recurso.ação)';
COMMENT ON FUNCTION public.get_inherited_permissions(UUID) IS 'Retorna permissões herdadas através da hierarquia';
COMMENT ON FUNCTION public.user_has_permission(UUID, TEXT) IS 'Verifica se utilizador tem permissão específica';
COMMENT ON FUNCTION public.get_user_permissions(UUID) IS 'Retorna todas as permissões de um utilizador';

COMMENT ON VIEW public.permissions_by_resource IS 'Permissões agrupadas por recurso para visualização';
COMMENT ON VIEW public.permissions_matrix IS 'Matriz de permissões (recursos vs ações) para análise';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000005_permissions_system.sql aplicada com sucesso';
  RAISE NOTICE 'Sistema granular de permissões criado';
  RAISE NOTICE 'Funções de verificação de permissões implementadas';
  RAISE NOTICE 'Views de análise de permissões criadas';
  RAISE NOTICE 'Políticas RLS configuradas';
END $$;
