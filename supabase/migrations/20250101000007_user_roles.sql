-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000007_user_roles.sql
-- Descrição: Atribuição de roles aos utilizadores com metadados e auditoria
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Tabela de atribuição de roles aos utilizadores
CREATE TABLE IF NOT EXISTS public.user_roles (
  -- Chaves estrangeiras
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  
  -- Chave primária composta
  PRIMARY KEY (user_id, role_id),
  
  -- Metadados da atribuição
  assigned_by UUID REFERENCES public.user_profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT public.now_utc(),
  assignment_reason TEXT,
  
  -- Aprovação (para roles sensíveis)
  approved_by UUID REFERENCES public.user_profiles(id),
  approved_at TIMESTAMPTZ,
  approval_status TEXT DEFAULT 'approved' CHECK (
    approval_status IN ('pending', 'approved', 'rejected', 'revoked')
  ),
  
  -- Temporal: atribuição temporária
  valid_from TIMESTAMPTZ DEFAULT public.now_utc(),
  valid_until TIMESTAMPTZ,
  
  -- Configurações específicas
  is_primary_role BOOLEAN DEFAULT false,
  context_restrictions JSONB DEFAULT '{}'::jsonb,
  
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
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON public.user_roles(assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_approved_by ON public.user_roles(approved_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_approval_status ON public.user_roles(approval_status);
CREATE INDEX IF NOT EXISTS idx_user_roles_primary ON public.user_roles(is_primary_role) WHERE is_primary_role = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_temporal ON public.user_roles(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_user_roles_sync ON public.user_roles(sync_version, last_synced);
CREATE INDEX IF NOT EXISTS idx_user_roles_deleted ON public.user_roles(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para validar atribuição de role
CREATE OR REPLACE FUNCTION public.validate_user_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  role_rec public.roles%ROWTYPE;
  user_rec public.user_profiles%ROWTYPE;
  existing_primary_count INTEGER;
BEGIN
  -- Obter dados do role e utilizador
  SELECT * INTO role_rec FROM public.roles WHERE id = NEW.role_id;
  SELECT * INTO user_rec FROM public.user_profiles WHERE id = NEW.user_id;
  
  -- Verificar se role e utilizador existem e estão ativos
  IF NOT role_rec.is_active THEN
    RAISE EXCEPTION 'Role is not active';
  END IF;
  
  IF user_rec.status != 'active' THEN
    RAISE EXCEPTION 'User is not active';
  END IF;
  
  -- Verificar limite máximo de utilizadores para o role
  IF role_rec.max_users IS NOT NULL THEN
    IF (
      SELECT COUNT(*) 
      FROM public.user_roles 
      WHERE role_id = NEW.role_id 
      AND is_active = true 
      AND deleted_at IS NULL
      AND (NEW.user_id IS NULL OR user_id != NEW.user_id) -- Excluir update do mesmo utilizador
    ) >= role_rec.max_users THEN
      RAISE EXCEPTION 'Role has reached maximum user limit of %', role_rec.max_users;
    END IF;
  END IF;
  
  -- Verificar datas de validade
  IF NEW.valid_until IS NOT NULL AND NEW.valid_until <= NEW.valid_from THEN
    RAISE EXCEPTION 'valid_until must be after valid_from';
  END IF;
  
  -- Validar role primário (apenas um por utilizador)
  IF NEW.is_primary_role THEN
    SELECT COUNT(*) INTO existing_primary_count
    FROM public.user_roles
    WHERE user_id = NEW.user_id
    AND is_primary_role = true
    AND is_active = true
    AND deleted_at IS NULL
    AND (TG_OP = 'INSERT' OR role_id != NEW.role_id);
    
    IF existing_primary_count > 0 THEN
      RAISE EXCEPTION 'User already has a primary role';
    END IF;
  END IF;
  
  -- Verificar aprovação para roles sensíveis (nível <= 30)
  IF role_rec.level <= 30 AND NEW.approval_status = 'pending' THEN
    RAISE NOTICE 'Role assignment requires approval for sensitive role: %', role_rec.name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para validar atribuição
CREATE TRIGGER validate_user_role_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_role();

-- Função para atribuir role padrão a novo utilizador
CREATE OR REPLACE FUNCTION public.assign_default_role(user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  default_role_id UUID;
BEGIN
  -- Obter role padrão (viewer - nível mais baixo)
  SELECT id INTO default_role_id
  FROM public.roles
  WHERE name = 'viewer'
  AND is_active = true
  AND deleted_at IS NULL;
  
  -- Se encontrou role padrão, atribuir
  IF default_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (
      user_id,
      role_id,
      is_primary_role,
      assignment_reason
    ) VALUES (
      user_id,
      default_role_id,
      true,
      'Default role assignment for new user'
    );
    
    RAISE NOTICE 'Default role assigned to user %', user_id;
  END IF;
END;
$$;

-- Função para promover/despromover utilizador
CREATE OR REPLACE FUNCTION public.change_user_role(
  target_user_id UUID,
  new_role_id UUID,
  assigned_by_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_role_id UUID;
  new_role_level INTEGER;
  assigner_max_level INTEGER;
BEGIN
  -- Obter role atual do utilizador
  SELECT role_id INTO current_role_id
  FROM public.user_roles
  WHERE user_id = target_user_id
  AND is_primary_role = true
  AND is_active = true
  AND deleted_at IS NULL;
  
  -- Obter nível do novo role
  SELECT level INTO new_role_level
  FROM public.roles
  WHERE id = new_role_id;
  
  -- Verificar se o utilizador que está a atribuir tem autoridade
  SELECT MIN(r.level) INTO assigner_max_level
  FROM public.user_roles ur
  INNER JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = assigned_by_user_id
  AND ur.is_active = true
  AND ur.deleted_at IS NULL;
  
  -- Verificar autoridade (nível menor = mais autoridade)
  IF assigner_max_level >= new_role_level THEN
    RAISE EXCEPTION 'Insufficient authority to assign this role';
  END IF;
  
  -- Desativar role atual
  IF current_role_id IS NOT NULL THEN
    UPDATE public.user_roles
    SET 
      is_active = false,
      deleted_at = public.now_utc(),
      notes = COALESCE(notes, '') || ' | Replaced by role change on ' || public.now_utc()
    WHERE user_id = target_user_id
    AND role_id = current_role_id;
  END IF;
  
  -- Atribuir novo role
  INSERT INTO public.user_roles (
    user_id,
    role_id,
    assigned_by,
    assignment_reason,
    is_primary_role
  ) VALUES (
    target_user_id,
    new_role_id,
    assigned_by_user_id,
    COALESCE(reason, 'Role change'),
    true
  );
  
  RAISE NOTICE 'User % role changed to %', target_user_id, new_role_id;
END;
$$;

-- Função para obter roles efetivos de um utilizador
CREATE OR REPLACE FUNCTION public.get_user_effective_roles(target_user_id UUID)
RETURNS TABLE(
  role_id UUID,
  role_name TEXT,
  role_display_name TEXT,
  role_level INTEGER,
  is_primary BOOLEAN,
  valid_until TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.display_name,
    r.level,
    ur.is_primary_role,
    ur.valid_until,
    ur.assigned_at
  FROM public.user_roles ur
  INNER JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = target_user_id
  AND ur.is_active = true
  AND ur.deleted_at IS NULL
  AND ur.approval_status = 'approved'
  AND (ur.valid_until IS NULL OR ur.valid_until > public.now_utc())
  AND r.is_active = true
  AND r.deleted_at IS NULL
  ORDER BY ur.is_primary_role DESC, r.level ASC;
END;
$$;

-- View para análise de atribuições de roles
CREATE OR REPLACE VIEW public.user_role_assignments AS
SELECT 
  up.employee_number,
  up.display_name as user_name,
  up.department,
  r.name as role_name,
  r.display_name as role_display_name,
  r.level as role_level,
  ur.is_primary_role,
  ur.assigned_at,
  ur.valid_until,
  ur.approval_status,
  assigned_by.display_name as assigned_by_name,
  CASE 
    WHEN ur.valid_until IS NOT NULL AND ur.valid_until < public.now_utc() THEN 'expired'
    WHEN ur.valid_until IS NOT NULL AND ur.valid_until < public.now_utc() + interval '7 days' THEN 'expiring_soon'
    WHEN ur.approval_status = 'pending' THEN 'pending_approval'
    WHEN ur.is_active = false THEN 'inactive'
    ELSE 'active'
  END as status
FROM public.user_roles ur
INNER JOIN public.user_profiles up ON ur.user_id = up.id
INNER JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.user_profiles assigned_by ON ur.assigned_by = assigned_by.id
WHERE ur.deleted_at IS NULL
ORDER BY up.display_name, r.level;

-- View para utilizadores sem roles ativos
CREATE OR REPLACE VIEW public.users_without_roles AS
SELECT 
  up.id,
  up.employee_number,
  up.display_name,
  up.department,
  up.status,
  up.created_at
FROM public.user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = up.id
  AND ur.is_active = true
  AND ur.deleted_at IS NULL
  AND ur.approval_status = 'approved'
)
AND up.status = 'active'
AND up.deleted_at IS NULL
ORDER BY up.created_at DESC;

-- Políticas RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política: utilizadores podem ver os próprios roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Política: admins podem ver todas as atribuições
CREATE POLICY "Admins can view all user roles" ON public.user_roles
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

-- Política: apenas admins podem modificar atribuições
CREATE POLICY "Only admins can modify user roles" ON public.user_roles
  FOR ALL USING (
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

-- Comentários
COMMENT ON TABLE public.user_roles IS 'Atribuição de roles aos utilizadores com auditoria e aprovação';
COMMENT ON COLUMN public.user_roles.is_primary_role IS 'Indica se este é o role principal do utilizador';
COMMENT ON COLUMN public.user_roles.approval_status IS 'Status de aprovação para roles sensíveis';
COMMENT ON COLUMN public.user_roles.context_restrictions IS 'Restrições específicas de contexto para esta atribuição';
COMMENT ON COLUMN public.user_roles.valid_until IS 'Data de expiração para atribuições temporárias';

COMMENT ON FUNCTION public.validate_user_role() IS 'Valida atribuição de role a utilizador';
COMMENT ON FUNCTION public.assign_default_role(UUID) IS 'Atribui role padrão a novo utilizador';
COMMENT ON FUNCTION public.change_user_role(UUID, UUID, UUID, TEXT) IS 'Promove/despromove utilizador com verificação de autoridade';
COMMENT ON FUNCTION public.get_user_effective_roles(UUID) IS 'Retorna todos os roles efetivos de um utilizador';

COMMENT ON VIEW public.user_role_assignments IS 'Vista completa de atribuições de roles com metadados';
COMMENT ON VIEW public.users_without_roles IS 'Utilizadores ativos sem roles atribuídos';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000007_user_roles.sql aplicada com sucesso';
  RAISE NOTICE 'Sistema de atribuição de roles criado';
  RAISE NOTICE 'Validações e aprovações implementadas';
  RAISE NOTICE 'Funções de gestão de roles criadas';
  RAISE NOTICE 'Views de análise configuradas';
END $$;
