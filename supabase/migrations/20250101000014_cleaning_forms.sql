-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000014_cleaning_forms.sql
-- Descrição: Sistema de formulários de limpeza de aeronaves
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Enum para status do formulário
CREATE TYPE public.cleaning_form_status AS ENUM (
  'draft',            -- Rascunho
  'in_progress',      -- Em andamento
  'pending_review',   -- Pendente revisão
  'approved',         -- Aprovado
  'rejected',         -- Rejeitado
  'completed',        -- Concluído
  'archived'          -- Arquivado
);

-- Enum para turnos de trabalho
CREATE TYPE public.work_shift AS ENUM (
  'morning',          -- Manhã
  'afternoon',        -- Tarde
  'evening',          -- Noite
  'night',            -- Madrugada
  'full_day'          -- Dia completo
);

-- Tabela de formulários de limpeza
CREATE TABLE IF NOT EXISTS public.cleaning_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  form_code TEXT UNIQUE NOT NULL,
  form_title TEXT DEFAULT 'Formulário de Limpeza de Aeronave',
  
  -- Associações principais
  aircraft_id UUID NOT NULL REFERENCES public.aircraft(id),
  supervisor_id UUID REFERENCES public.employees(id),
  
  -- Data e turno
  cleaning_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift public.work_shift DEFAULT 'morning',
  start_time TIME,
  end_time TIME,
  
  -- Status e progresso
  status public.cleaning_form_status DEFAULT 'draft',
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Localização
  hangar_location TEXT,
  parking_position TEXT,
  
  -- Condições ambientais
  weather_conditions TEXT,
  temperature_celsius INTEGER,
  humidity_percentage INTEGER,
  
  -- Dados de voo (contexto)
  previous_flight_origin TEXT,
  previous_flight_destination TEXT,
  next_flight_destination TEXT,
  flight_hours_since_last_cleaning NUMERIC(6,2),
  
  -- Produtos e equipamentos utilizados
  cleaning_products_used JSONB DEFAULT '[]'::jsonb,
  equipment_used JSONB DEFAULT '[]'::jsonb,
  chemicals_used JSONB DEFAULT '[]'::jsonb,
  
  -- Áreas de limpeza (checklist)
  exterior_areas JSONB DEFAULT '{
    "fuselage": {"cleaned": false, "notes": "", "photo_evidence": []},
    "wings": {"cleaned": false, "notes": "", "photo_evidence": []},
    "engines": {"cleaned": false, "notes": "", "photo_evidence": []},
    "landing_gear": {"cleaned": false, "notes": "", "photo_evidence": []},
    "windows": {"cleaned": false, "notes": "", "photo_evidence": []},
    "lights": {"cleaned": false, "notes": "", "photo_evidence": []}
  }'::jsonb,
  
  interior_areas JSONB DEFAULT '{
    "cockpit": {"cleaned": false, "notes": "", "photo_evidence": []},
    "passenger_cabin": {"cleaned": false, "notes": "", "photo_evidence": []},
    "galley": {"cleaned": false, "notes": "", "photo_evidence": []},
    "lavatories": {"cleaned": false, "notes": "", "photo_evidence": []},
    "cargo_compartment": {"cleaned": false, "notes": "", "photo_evidence": []},
    "overhead_bins": {"cleaned": false, "notes": "", "photo_evidence": []}
  }'::jsonb,
  
  -- Verificações de segurança
  safety_checks JSONB DEFAULT '{
    "no_damage_found": false,
    "safety_equipment_intact": false,
    "emergency_exits_clear": false,
    "warning_placards_visible": false,
    "foreign_objects_removed": false
  }'::jsonb,
  
  -- Problemas encontrados
  issues_found JSONB DEFAULT '[]'::jsonb,
  damage_reported BOOLEAN DEFAULT false,
  damage_description TEXT,
  damage_photos JSONB DEFAULT '[]'::jsonb,
  
  -- Qualidade e inspeção
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  quality_notes TEXT,
  inspection_passed BOOLEAN,
  inspector_id UUID REFERENCES public.employees(id),
  inspection_date TIMESTAMPTZ,
  
  -- Assinaturas e aprovações
  supervisor_signature JSONB,
  supervisor_signed_at TIMESTAMPTZ,
  
  -- Próxima limpeza programada
  next_cleaning_scheduled DATE,
  next_cleaning_type TEXT,
  
  -- Metadados
  special_instructions TEXT,
  client_requirements TEXT,
  environmental_considerations TEXT,
  
  -- Documentação
  photos JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  
  -- Tempo total gasto
  total_labor_hours NUMERIC(6,2),
  cost_estimation NUMERIC(10,2),
  
  -- Sync metadata para mobile
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  
  -- Timestamps obrigatórios
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_code ON public.cleaning_forms(form_code);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_aircraft ON public.cleaning_forms(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_supervisor ON public.cleaning_forms(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_date ON public.cleaning_forms(cleaning_date);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_status ON public.cleaning_forms(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_shift ON public.cleaning_forms(shift);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_completion ON public.cleaning_forms(completion_percentage);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_quality ON public.cleaning_forms(quality_rating);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_inspection ON public.cleaning_forms(inspection_passed);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_sync ON public.cleaning_forms(sync_version, last_synced);
CREATE INDEX IF NOT EXISTS idx_cleaning_forms_deleted ON public.cleaning_forms(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_cleaning_forms_updated_at
  BEFORE UPDATE ON public.cleaning_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para auditoria
CREATE TRIGGER cleaning_forms_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.cleaning_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Função para gerar código do formulário
CREATE OR REPLACE FUNCTION public.generate_cleaning_form_code(aircraft_reg TEXT DEFAULT 'UNK')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  date_code TEXT;
  sequence_num INTEGER;
  form_code TEXT;
BEGIN
  date_code := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN form_code ~ ('^CF' || date_code || '[0-9]{3}$')
      THEN substring(form_code from 11 for 3)::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_num
  FROM public.cleaning_forms
  WHERE form_code LIKE 'CF' || date_code || '%'
  AND deleted_at IS NULL;
  
  form_code := 'CF' || date_code || lpad(sequence_num::TEXT, 3, '0');
  RETURN form_code;
END;
$$;

-- Função para calcular percentual de conclusão
CREATE OR REPLACE FUNCTION public.calculate_cleaning_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  exterior_completed INTEGER := 0;
  exterior_total INTEGER := 0;
  interior_completed INTEGER := 0;
  interior_total INTEGER := 0;
  safety_completed INTEGER := 0;
  safety_total INTEGER := 0;
  total_percentage INTEGER;
  area_key TEXT;
  area_value JSONB;
  check_key TEXT;
  check_value JSONB;
BEGIN
  -- Contar áreas exteriores concluídas
  FOR area_key, area_value IN SELECT * FROM jsonb_each(NEW.exterior_areas) LOOP
    exterior_total := exterior_total + 1;
    IF (area_value->>'cleaned')::BOOLEAN THEN
      exterior_completed := exterior_completed + 1;
    END IF;
  END LOOP;
  
  -- Contar áreas interiores concluídas
  FOR area_key, area_value IN SELECT * FROM jsonb_each(NEW.interior_areas) LOOP
    interior_total := interior_total + 1;
    IF (area_value->>'cleaned')::BOOLEAN THEN
      interior_completed := interior_completed + 1;
    END IF;
  END LOOP;
  
  -- Contar verificações de segurança concluídas
  FOR check_key, check_value IN SELECT * FROM jsonb_each(NEW.safety_checks) LOOP
    safety_total := safety_total + 1;
    IF check_value::BOOLEAN THEN
      safety_completed := safety_completed + 1;
    END IF;
  END LOOP;
  
  -- Calcular percentual total
  total_percentage := ROUND(
    (exterior_completed + interior_completed + safety_completed) * 100.0 / 
    (exterior_total + interior_total + safety_total)
  );
  
  NEW.completion_percentage := total_percentage;
  
  -- Atualizar status baseado na conclusão
  IF total_percentage = 100 AND NEW.status = 'in_progress' THEN
    NEW.status := 'pending_review';
  ELSIF total_percentage > 0 AND NEW.status = 'draft' THEN
    NEW.status := 'in_progress';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para calcular conclusão
CREATE TRIGGER calculate_cleaning_completion_trigger
  BEFORE UPDATE ON public.cleaning_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_cleaning_completion();

-- View para formulários ativos
CREATE OR REPLACE VIEW public.active_cleaning_forms AS
SELECT 
  cf.id,
  cf.form_code,
  cf.cleaning_date,
  cf.shift,
  cf.status,
  cf.completion_percentage,
  a.registration as aircraft_registration,
  a.model as aircraft_model,
  e.full_name as supervisor_name,
  cf.hangar_location,
  cf.quality_rating,
  cf.inspection_passed
FROM public.cleaning_forms cf
INNER JOIN public.aircraft a ON cf.aircraft_id = a.id
LEFT JOIN public.employees e ON cf.supervisor_id = e.id
WHERE cf.status IN ('draft', 'in_progress', 'pending_review')
AND cf.deleted_at IS NULL
ORDER BY cf.cleaning_date DESC, cf.created_at DESC;

-- View para estatísticas de limpeza
CREATE OR REPLACE VIEW public.cleaning_statistics AS
SELECT 
  DATE_TRUNC('month', cleaning_date) as month,
  COUNT(*) as total_forms,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_forms,
  AVG(completion_percentage) as avg_completion,
  AVG(quality_rating) as avg_quality,
  AVG(total_labor_hours) as avg_labor_hours,
  COUNT(CASE WHEN damage_reported THEN 1 END) as damage_reports,
  array_agg(DISTINCT aircraft_id) as aircraft_cleaned
FROM public.cleaning_forms
WHERE deleted_at IS NULL
AND cleaning_date >= CURRENT_DATE - interval '12 months'
GROUP BY DATE_TRUNC('month', cleaning_date)
ORDER BY month DESC;

-- Políticas RLS
ALTER TABLE public.cleaning_forms ENABLE ROW LEVEL SECURITY;

-- Política: utilizadores podem ver formulários relacionados
CREATE POLICY "Users can view related cleaning forms" ON public.cleaning_forms
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      supervisor_id IN (
        SELECT e.id FROM public.employees e
        INNER JOIN public.user_profiles up ON e.employee_number = up.employee_number
        WHERE up.id = auth.uid()
      ) OR
      public.user_has_permission(auth.uid(), 'cleaning_forms.read')
    )
  );

-- Política: apenas utilizadores autorizados podem modificar
CREATE POLICY "Only authorized users can modify cleaning forms" ON public.cleaning_forms
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'cleaning_forms.manage') OR
    public.user_has_permission(auth.uid(), 'cleaning_forms.admin')
  );

-- Comentários
COMMENT ON TABLE public.cleaning_forms IS 'Sistema de formulários de limpeza de aeronaves';
COMMENT ON COLUMN public.cleaning_forms.exterior_areas IS 'Checklist de áreas exteriores em formato JSON';
COMMENT ON COLUMN public.cleaning_forms.interior_areas IS 'Checklist de áreas interiores em formato JSON';
COMMENT ON COLUMN public.cleaning_forms.safety_checks IS 'Verificações de segurança em formato JSON';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000014_cleaning_forms.sql aplicada com sucesso';
  RAISE NOTICE 'Sistema de formulários de limpeza implementado';
END $$;
