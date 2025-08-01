-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000006_role_permissions.sql
-- Descrição: Relacionamento entre roles e permissões com metadados
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Tabela de relacionamento roles-permissões
CREATE TABLE IF NOT EXISTS public.role_permissions (
  -- Chaves estrangeiras
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  
  -- Chave primária composta
  PRIMARY KEY (role_id, permission_id),
  
  -- Metadados da atribuição
  granted_by UUID REFERENCES public.user_profiles(id),
  granted_at TIMESTAMPTZ DEFAULT public.now_utc(),
  
  -- Configurações específicas da atribuição
  is_inherited BOOLEAN DEFAULT false,
  inherited_from UUID REFERENCES public.roles(id),
  
  -- Restrições específicas desta atribuição
  conditions JSONB DEFAULT '{}'::jsonb,
  restrictions JSONB DEFAULT '{}'::jsonb,
  
  -- Temporal: permissão temporária
  valid_from TIMESTAMPTZ DEFAULT public.now_utc(),
  valid_until TIMESTAMPTZ,
  
  -- Metadados
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Sync metadata para mobile
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  
  -- Timestamps obrigatórios
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_granted_by ON public.role_permissions(granted_by);
CREATE INDEX IF NOT EXISTS idx_role_permissions_inherited ON public.role_permissions(is_inherited, inherited_from);
CREATE INDEX IF NOT EXISTS idx_role_permissions_active ON public.role_permissions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_role_permissions_temporal ON public.role_permissions(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_role_permissions_sync ON public.role_permissions(sync_version, last_synced);
CREATE INDEX IF NOT EXISTS idx_role_permissions_deleted ON public.role_permissions(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para validar atribuição de permissão
CREATE OR REPLACE FUNCTION public.validate_role_permission()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  role_rec public.roles%ROWTYPE;
  perm_rec public.permissions%ROWTYPE;
BEGIN
  -- Obter dados do role e permissão
  SELECT * INTO role_rec FROM public.roles WHERE id = NEW.role_id;
  SELECT * INTO perm_rec FROM public.permissions WHERE id = NEW.permission_id;
  
  -- Verificar se role e permissão existem e estão ativos
  IF NOT FOUND OR NOT role_rec.is_active THEN
    RAISE EXCEPTION 'Role is not active or does not exist';
  END IF;
  
  IF NOT perm_rec.is_active THEN
    RAISE EXCEPTION 'Permission is not active';
  END IF;
  
  -- Verificar datas de validade
  IF NEW.valid_until IS NOT NULL AND NEW.valid_until <= NEW.valid_from THEN
    RAISE EXCEPTION 'valid_until must be after valid_from';
  END IF;
  
  -- Se é herança, verificar se role pai tem a permissão
  IF NEW.is_inherited AND NEW.inherited_from IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.role_permissions 
      WHERE role_id = NEW.inherited_from 
      AND permission_id = NEW.permission_id
      AND is_active = true
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Inherited permission not found in parent role';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para validar atribuição
CREATE TRIGGER validate_role_permission_trigger
  BEFORE INSERT OR UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_permission();

-- Função para herdar permissões de role pai
CREATE OR REPLACE FUNCTION public.inherit_parent_permissions(child_role_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  parent_role_id UUID;
  perm_record RECORD;
BEGIN
  -- Obter role pai
  SELECT parent_role_id INTO parent_role_id
  FROM public.roles 
  WHERE id = child_role_id AND inherit_permissions = true;
  
  -- Se não tem pai ou não herda permissões, sair
  IF parent_role_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Copiar permissões do pai que ainda não existem no filho
  FOR perm_record IN
    SELECT rp.permission_id, rp.conditions, rp.restrictions
    FROM public.role_permissions rp
    WHERE rp.role_id = parent_role_id
    AND rp.is_active = true
    AND rp.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.role_permissions 
      WHERE role_id = child_role_id 
      AND permission_id = rp.permission_id
      AND deleted_at IS NULL
    )
  LOOP
    INSERT INTO public.role_permissions (
      role_id,
      permission_id,
      is_inherited,
      inherited_from,
      conditions,
      restrictions
    ) VALUES (
      child_role_id,
      perm_record.permission_id,
      true,
      parent_role_id,
      perm_record.conditions,
      perm_record.restrictions
    );
  END LOOP;
  
  RAISE NOTICE 'Inherited permissions for role % from parent %', child_role_id, parent_role_id;
END;
$$;

-- Função para remover permissões herdadas órfãs
CREATE OR REPLACE FUNCTION public.cleanup_inherited_permissions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remover permissões herdadas onde o pai não tem mais a permissão
  UPDATE public.role_permissions
  SET deleted_at = public.now_utc()
  WHERE is_inherited = true
  AND inherited_from IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.role_permissions parent
    WHERE parent.role_id = role_permissions.inherited_from
    AND parent.permission_id = role_permissions.permission_id
    AND parent.is_active = true
    AND parent.deleted_at IS NULL
  );
  
  RAISE NOTICE 'Cleanup of orphaned inherited permissions completed';
END;
$$;

-- Função para obter permissões efetivas de um role (incluindo herdadas)
CREATE OR REPLACE FUNCTION public.get_role_effective_permissions(target_role_id UUID)
RETURNS TABLE(
  permission_id UUID,
  permission_name TEXT,
  resource_name TEXT,
  action_name TEXT,
  is_inherited BOOLEAN,
  inherited_from_role TEXT,
  conditions JSONB,
  restrictions JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE role_hierarchy AS (
    -- Role atual
    SELECT r.id, r.name, r.parent_role_id, 0 as depth
    FROM public.roles r
    WHERE r.id = target_role_id
    AND r.deleted_at IS NULL
    
    UNION ALL
    
    -- Roles pai (se herda permissões)
    SELECT r.id, r.name, r.parent_role_id, rh.depth + 1
    FROM public.roles r
    INNER JOIN role_hierarchy rh ON r.id = rh.parent_role_id
    WHERE r.inherit_permissions = true
    AND r.deleted_at IS NULL
    AND rh.depth < 10
  )
  SELECT DISTINCT
    p.id as permission_id,
    p.name as permission_name,
    p.resource_name,
    p.action_name::TEXT,
    (rh.depth > 0) as is_inherited,
    CASE WHEN rh.depth > 0 THEN rh.name ELSE NULL END as inherited_from_role,
    rp.conditions,
    rp.restrictions
  FROM role_hierarchy rh
  INNER JOIN public.role_permissions rp ON rh.id = rp.role_id
  INNER JOIN public.permissions p ON rp.permission_id = p.id
  WHERE rp.is_active = true
  AND rp.deleted_at IS NULL
  AND p.is_active = true
  AND p.deleted_at IS NULL
  AND (rp.valid_until IS NULL OR rp.valid_until > public.now_utc())
  ORDER BY p.resource_name, p.action_name::TEXT;
END;
$$;

-- View para análise de atribuições de permissões
CREATE OR REPLACE VIEW public.role_permission_analysis AS
SELECT 
  r.name as role_name,
  r.display_name as role_display_name,
  r.level as role_level,
  COUNT(rp.permission_id) as total_permissions,
  COUNT(CASE WHEN rp.is_inherited THEN 1 END) as inherited_permissions,
  COUNT(CASE WHEN NOT rp.is_inherited THEN 1 END) as direct_permissions,
  COUNT(CASE WHEN rp.valid_until IS NOT NULL THEN 1 END) as temporary_permissions,
  array_agg(DISTINCT p.resource_name ORDER BY p.resource_name) as resources
FROM public.roles r
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id 
  AND rp.is_active = true 
  AND rp.deleted_at IS NULL
LEFT JOIN public.permissions p ON rp.permission_id = p.id
WHERE r.is_active = true AND r.deleted_at IS NULL
GROUP BY r.id, r.name, r.display_name, r.level
ORDER BY r.level, r.name;

-- View para permissões expiradas ou a expirar
CREATE OR REPLACE VIEW public.expiring_role_permissions AS
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.resource_name,
  p.action_name::TEXT as action,
  rp.valid_until,
  CASE 
    WHEN rp.valid_until < public.now_utc() THEN 'expired'
    WHEN rp.valid_until < public.now_utc() + interval '7 days' THEN 'expiring_soon'
    ELSE 'valid'
  END as status,
  rp.granted_by,
  rp.granted_at
FROM public.role_permissions rp
INNER JOIN public.roles r ON rp.role_id = r.id
INNER JOIN public.permissions p ON rp.permission_id = p.id
WHERE rp.valid_until IS NOT NULL
AND rp.is_active = true
AND rp.deleted_at IS NULL
ORDER BY rp.valid_until;

-- Políticas RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Política: admins podem ver todas as atribuições
CREATE POLICY "Admins can view all role permissions" ON public.role_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
      AND r.level <= 20
    )
  );

-- Política: apenas super admins podem modificar atribuições
CREATE POLICY "Only super admins can modify role permissions" ON public.role_permissions
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
COMMENT ON TABLE public.role_permissions IS 'Relacionamento entre roles e permissões com metadados de atribuição';
COMMENT ON COLUMN public.role_permissions.is_inherited IS 'Indica se a permissão foi herdada de um role pai';
COMMENT ON COLUMN public.role_permissions.inherited_from IS 'Role do qual esta permissão foi herdada';
COMMENT ON COLUMN public.role_permissions.conditions IS 'Condições específicas para esta atribuição de permissão';
COMMENT ON COLUMN public.role_permissions.restrictions IS 'Restrições específicas desta atribuição';
COMMENT ON COLUMN public.role_permissions.valid_until IS 'Data de expiração para permissões temporárias';

COMMENT ON FUNCTION public.validate_role_permission() IS 'Valida atribuição de permissão a role';
COMMENT ON FUNCTION public.inherit_parent_permissions(UUID) IS 'Herda permissões do role pai';
COMMENT ON FUNCTION public.cleanup_inherited_permissions() IS 'Remove permissões herdadas órfãs';
COMMENT ON FUNCTION public.get_role_effective_permissions(UUID) IS 'Retorna todas as permissões efetivas de um role';

COMMENT ON VIEW public.role_permission_analysis IS 'Análise estatística de atribuições de permissões por role';
COMMENT ON VIEW public.expiring_role_permissions IS 'Permissões expiradas ou próximas do vencimento';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000006_role_permissions.sql aplicada com sucesso';
  RAISE NOTICE 'Relacionamento roles-permissões criado';
  RAISE NOTICE 'Sistema de herança de permissões implementado';
  RAISE NOTICE 'Funções de gestão de permissões criadas';
  RAISE NOTICE 'Views de análise configuradas';
END $$;
