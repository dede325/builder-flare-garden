-- =========================================================================
-- Migration: 20250101000020_change_log.sql
-- Descrição: Histórico detalhado de alterações
-- =========================================================================

CREATE TYPE public.change_action AS ENUM ('insert', 'update', 'delete', 'restore', 'merge');

CREATE TABLE IF NOT EXISTS public.change_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Referência da alteração
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Ação realizada
  action public.change_action NOT NULL,
  
  -- Dados da alteração
  old_values JSONB,
  new_values JSONB,
  changed_fields JSONB, -- Array dos campos alterados
  
  -- Contexto da alteração
  change_reason TEXT,
  change_source TEXT DEFAULT 'manual', -- 'manual', 'automatic', 'import', 'sync'
  
  -- Utilizador responsável
  changed_by UUID REFERENCES public.user_profiles(id),
  ip_address INET,
  user_agent TEXT,
  
  -- Metadados
  transaction_id TEXT, -- Para agrupar alterações relacionadas
  parent_change_id UUID REFERENCES public.change_log(id),
  
  -- Aprovação (para alterações sensíveis)
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.user_profiles(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_change_log_entity ON public.change_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_log_action ON public.change_log(action);
CREATE INDEX IF NOT EXISTS idx_change_log_changed_by ON public.change_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_change_log_created ON public.change_log(created_at);
CREATE INDEX IF NOT EXISTS idx_change_log_transaction ON public.change_log(transaction_id);

-- Trigger para updated_at
CREATE TRIGGER update_change_log_updated_at
  BEFORE UPDATE ON public.change_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para registar alteração
CREATE OR REPLACE FUNCTION public.log_entity_change(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action public.change_action,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  changed_fields JSONB := '[]'::jsonb;
  field_key TEXT;
BEGIN
  -- Calcular campos alterados
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    FOR field_key IN SELECT jsonb_object_keys(p_new_values) LOOP
      IF p_old_values ? field_key THEN
        IF p_old_values->field_key != p_new_values->field_key THEN
          changed_fields := changed_fields || to_jsonb(field_key);
        END IF;
      ELSE
        changed_fields := changed_fields || to_jsonb(field_key);
      END IF;
    END LOOP;
  END IF;
  
  -- Inserir log
  log_id := uuid_generate_v4();
  
  INSERT INTO public.change_log (
    id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    changed_fields,
    change_reason,
    changed_by
  ) VALUES (
    log_id,
    p_entity_type,
    p_entity_id,
    p_action,
    p_old_values,
    p_new_values,
    changed_fields,
    p_reason,
    auth.uid()
  );
  
  RETURN log_id;
END;
$$;

-- View para histórico recente
CREATE OR REPLACE VIEW public.recent_changes AS
SELECT 
  cl.id,
  cl.entity_type,
  cl.entity_id,
  cl.action,
  cl.changed_fields,
  cl.change_reason,
  up.display_name as changed_by_name,
  cl.created_at,
  CASE cl.entity_type
    WHEN 'aircraft' THEN (SELECT registration FROM public.aircraft WHERE id = cl.entity_id)
    WHEN 'employees' THEN (SELECT full_name FROM public.employees WHERE id = cl.entity_id)
    WHEN 'tasks' THEN (SELECT title FROM public.tasks WHERE id = cl.entity_id)
    ELSE cl.entity_id::TEXT
  END as entity_name
FROM public.change_log cl
LEFT JOIN public.user_profiles up ON cl.changed_by = up.id
WHERE cl.created_at > NOW() - interval '7 days'
AND cl.deleted_at IS NULL
ORDER BY cl.created_at DESC
LIMIT 100;

ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view change log" ON public.change_log
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'system.audit') OR
    public.user_has_permission(auth.uid(), 'system.admin')
  );

COMMENT ON TABLE public.change_log IS 'Histórico detalhado de alterações no sistema';

-- Log
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration 20250101000020_change_log.sql aplicada com sucesso';
  RAISE NOTICE '=== FASE 2 (Entidades Operacionais) CONCLUÍDA ===';
END $$;
