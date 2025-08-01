-- =========================================================================
-- Migration: 20250101000016_cleaning_form_employees.sql
-- Descrição: Relacionamento funcionários com formulários de limpeza
-- =========================================================================

CREATE TYPE public.employee_role_in_cleaning AS ENUM ('supervisor', 'technician', 'assistant', 'inspector', 'quality_checker');

CREATE TABLE IF NOT EXISTS public.cleaning_form_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cleaning_form_id UUID NOT NULL REFERENCES public.cleaning_forms(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  role_in_cleaning public.employee_role_in_cleaning NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT public.now_utc(),
  started_work_at TIMESTAMPTZ,
  finished_work_at TIMESTAMPTZ,
  hours_worked NUMERIC(6,2),
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
  notes TEXT,
  signature_data JSONB,
  signed_at TIMESTAMPTZ,
  is_present BOOLEAN DEFAULT true,
  absence_reason TEXT,
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(cleaning_form_id, employee_id, role_in_cleaning)
);

CREATE INDEX IF NOT EXISTS idx_cleaning_form_employees_form ON public.cleaning_form_employees(cleaning_form_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_form_employees_employee ON public.cleaning_form_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_form_employees_role ON public.cleaning_form_employees(role_in_cleaning);

-- Trigger para updated_at
CREATE TRIGGER update_cleaning_form_employees_updated_at
  BEFORE UPDATE ON public.cleaning_form_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cleaning_form_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view related employee assignments" ON public.cleaning_form_employees
  FOR SELECT USING (auth.uid() IS NOT NULL);

COMMENT ON TABLE public.cleaning_form_employees IS 'Atribuição de funcionários a formulários de limpeza';

-- View para equipes de limpeza
CREATE OR REPLACE VIEW public.cleaning_teams AS
SELECT 
  cf.id as form_id,
  cf.form_code,
  cf.cleaning_date,
  a.registration as aircraft,
  array_agg(
    json_build_object(
      'employee_name', e.full_name,
      'role', cfe.role_in_cleaning,
      'hours_worked', cfe.hours_worked
    ) ORDER BY cfe.role_in_cleaning
  ) as team_members
FROM public.cleaning_forms cf
INNER JOIN public.aircraft a ON cf.aircraft_id = a.id
LEFT JOIN public.cleaning_form_employees cfe ON cf.id = cfe.cleaning_form_id
LEFT JOIN public.employees e ON cfe.employee_id = e.id
WHERE cf.deleted_at IS NULL
GROUP BY cf.id, cf.form_code, cf.cleaning_date, a.registration;

-- Log
DO $$ BEGIN RAISE NOTICE 'Migration 20250101000016_cleaning_form_employees.sql aplicada com sucesso'; END $$;
