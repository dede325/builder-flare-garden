-- =========================================================================
-- Migration: 20250101000015_cleaning_tasks.sql
-- Descrição: Tarefas específicas de limpeza
-- =========================================================================

CREATE TYPE public.cleaning_task_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');

CREATE TABLE IF NOT EXISTS public.cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cleaning_form_id UUID NOT NULL REFERENCES public.cleaning_forms(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_description TEXT,
  area_category TEXT, -- 'exterior', 'interior', 'safety'
  sequence_order INTEGER DEFAULT 1,
  status public.cleaning_task_status DEFAULT 'pending',
  assigned_employee_id UUID REFERENCES public.employees(id),
  estimated_minutes INTEGER DEFAULT 30,
  actual_minutes INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  photo_evidence JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  requires_supervisor_check BOOLEAN DEFAULT false,
  supervisor_checked BOOLEAN DEFAULT false,
  supervisor_notes TEXT,
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_form ON public.cleaning_tasks(cleaning_form_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_status ON public.cleaning_tasks(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_assigned ON public.cleaning_tasks(assigned_employee_id);

-- Trigger para updated_at
CREATE TRIGGER update_cleaning_tasks_updated_at
  BEFORE UPDATE ON public.cleaning_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cleaning_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view related cleaning tasks" ON public.cleaning_tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);

COMMENT ON TABLE public.cleaning_tasks IS 'Tarefas específicas de limpeza dentro de formulários';

-- Log
DO $$ BEGIN RAISE NOTICE 'Migration 20250101000015_cleaning_tasks.sql aplicada com sucesso'; END $$;
