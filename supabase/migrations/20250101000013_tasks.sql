-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000013_tasks.sql
-- Descrição: Sistema de tarefas de manutenção e operações
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Enum para tipos de tarefa
CREATE TYPE public.task_type AS ENUM (
  'maintenance',      -- Manutenção
  'inspection',       -- Inspeção
  'repair',           -- Reparo
  'cleaning',         -- Limpeza
  'service',          -- Serviço
  'installation',     -- Instalação
  'modification',     -- Modificação
  'testing',          -- Teste
  'certification',    -- Certificação
  'documentation',    -- Documentação
  'training',         -- Treinamento
  'audit'            -- Auditoria
);

-- Enum para prioridade
CREATE TYPE public.task_priority AS ENUM (
  'critical',         -- Crítica
  'high',            -- Alta
  'medium',          -- Média
  'low',             -- Baixa
  'routine'          -- Rotina
);

-- Enum para status da tarefa
CREATE TYPE public.task_status AS ENUM (
  'pending',          -- Pendente
  'assigned',         -- Atribuída
  'in_progress',      -- Em andamento
  'on_hold',          -- Em espera
  'completed',        -- Concluída
  'cancelled',        -- Cancelada
  'overdue',          -- Atrasada
  'requires_approval' -- Requer aprovação
);

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  task_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Classificação
  task_type public.task_type NOT NULL,
  priority public.task_priority DEFAULT 'medium',
  status public.task_status DEFAULT 'pending',
  
  -- Associações
  aircraft_id UUID REFERENCES public.aircraft(id),
  assigned_to UUID REFERENCES public.employees(id),
  created_by UUID REFERENCES public.employees(id),
  approved_by UUID REFERENCES public.employees(id),
  
  -- Datas e prazos
  created_at_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_hours NUMERIC(6,2),
  actual_hours NUMERIC(6,2),
  
  -- Localização e contexto
  location TEXT DEFAULT 'Luanda',
  work_order_ref TEXT,
  maintenance_program_ref TEXT,
  
  -- Recursos necessários
  required_tools JSONB DEFAULT '[]'::jsonb,
  required_parts JSONB DEFAULT '[]'::jsonb,
  required_certifications JSONB DEFAULT '[]'::jsonb,
  
  -- Execução
  instructions TEXT,
  safety_notes TEXT,
  completion_notes TEXT,
  quality_check_passed BOOLEAN,
  
  -- Documentação
  attachments JSONB DEFAULT '[]'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  signatures JSONB DEFAULT '{}'::jsonb,
  
  -- Aprovação
  requires_approval BOOLEAN DEFAULT false,
  approval_notes TEXT,
  approved_at TIMESTAMPTZ,
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  parent_task_id UUID REFERENCES public.tasks(id),
  
  -- Metadados
  tags JSONB DEFAULT '[]'::jsonb,
  external_refs JSONB DEFAULT '{}'::jsonb,
  
  -- Sync metadata para mobile
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  
  -- Timestamps obrigatórios
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tasks_task_number ON public.tasks(task_number);
CREATE INDEX IF NOT EXISTS idx_tasks_aircraft ON public.tasks(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON public.tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_location ON public.tasks(location);
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON public.tasks(is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_tasks_approval ON public.tasks(requires_approval, approved_at);
CREATE INDEX IF NOT EXISTS idx_tasks_sync ON public.tasks(sync_version, last_synced);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON public.tasks(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para auditoria
CREATE TRIGGER tasks_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Função para gerar número de tarefa
CREATE OR REPLACE FUNCTION public.generate_task_number(task_type_code TEXT DEFAULT 'TSK')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_code TEXT;
  sequence_num INTEGER;
  task_num TEXT;
BEGIN
  year_code := extract(year from NOW())::TEXT;
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN task_number ~ ('^' || task_type_code || year_code || '[0-9]{6}$')
      THEN substring(task_number from length(task_type_code || year_code) + 1)::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_num
  FROM public.tasks
  WHERE task_number LIKE task_type_code || year_code || '%'
  AND deleted_at IS NULL;
  
  task_num := task_type_code || year_code || lpad(sequence_num::TEXT, 6, '0');
  RETURN task_num;
END;
$$;

-- Função para atualizar status automaticamente
CREATE OR REPLACE FUNCTION public.update_task_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Marcar como atrasada se passou da data limite
  IF NEW.due_date IS NOT NULL 
     AND NEW.due_date < CURRENT_DATE 
     AND NEW.status NOT IN ('completed', 'cancelled') THEN
    NEW.status := 'overdue';
  END IF;
  
  -- Atualizar timestamps baseado no status
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    NEW.started_at := public.now_utc();
  END IF;
  
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at := public.now_utc();
  END IF;
  
  -- Verificar se requer aprovação ao completar
  IF NEW.status = 'completed' AND NEW.requires_approval AND NEW.approved_by IS NULL THEN
    NEW.status := 'requires_approval';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar status
CREATE TRIGGER update_task_status_trigger
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_status();

-- View para tarefas pendentes
CREATE OR REPLACE VIEW public.pending_tasks AS
SELECT 
  t.id,
  t.task_number,
  t.title,
  t.task_type,
  t.priority,
  t.status,
  t.due_date,
  a.registration as aircraft_registration,
  e.full_name as assigned_to_name,
  t.location,
  CASE 
    WHEN t.due_date < CURRENT_DATE THEN 'overdue'
    WHEN t.due_date <= CURRENT_DATE + interval '3 days' THEN 'due_soon'
    ELSE 'normal'
  END as urgency
FROM public.tasks t
LEFT JOIN public.aircraft a ON t.aircraft_id = a.id
LEFT JOIN public.employees e ON t.assigned_to = e.id
WHERE t.status IN ('pending', 'assigned', 'in_progress', 'overdue')
AND t.deleted_at IS NULL
ORDER BY 
  CASE t.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    WHEN 'routine' THEN 5
  END,
  t.due_date NULLS LAST;

-- View para estatísticas de tarefas
CREATE OR REPLACE VIEW public.task_statistics AS
SELECT 
  task_type,
  status,
  priority,
  COUNT(*) as task_count,
  AVG(actual_hours) as avg_hours,
  COUNT(CASE WHEN due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled') THEN 1 END) as overdue_count,
  COUNT(CASE WHEN requires_approval AND approved_at IS NULL THEN 1 END) as pending_approval_count
FROM public.tasks
WHERE deleted_at IS NULL
AND created_at > CURRENT_DATE - interval '30 days'
GROUP BY task_type, status, priority
ORDER BY task_type, status, priority;

-- Políticas RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Política: utilizadores podem ver tarefas relacionadas
CREATE POLICY "Users can view related tasks" ON public.tasks
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      assigned_to IN (
        SELECT e.id FROM public.employees e
        INNER JOIN public.user_profiles up ON e.employee_number = up.employee_number
        WHERE up.id = auth.uid()
      ) OR
      created_by IN (
        SELECT e.id FROM public.employees e
        INNER JOIN public.user_profiles up ON e.employee_number = up.employee_number
        WHERE up.id = auth.uid()
      ) OR
      public.user_has_permission(auth.uid(), 'tasks.read')
    )
  );

-- Política: apenas utilizadores autorizados podem modificar
CREATE POLICY "Only authorized users can modify tasks" ON public.tasks
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'tasks.manage') OR
    public.user_has_permission(auth.uid(), 'tasks.admin')
  );

-- Comentários
COMMENT ON TABLE public.tasks IS 'Sistema de tarefas de manutenção e operações';
COMMENT ON COLUMN public.tasks.task_number IS 'Número único da tarefa (auto-gerado)';
COMMENT ON COLUMN public.tasks.required_tools IS 'Ferramentas necessárias em formato JSON';
COMMENT ON COLUMN public.tasks.recurrence_pattern IS 'Padrão de recorrência em formato JSON';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000013_tasks.sql aplicada com sucesso';
  RAISE NOTICE 'Sistema de tarefas implementado';
END $$;
