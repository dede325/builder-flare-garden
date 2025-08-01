-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000012_employees.sql
-- Descrição: Tabela de funcionários com dados específicos Angola
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Enum para departamentos
CREATE TYPE public.department_type AS ENUM (
  'administration',    -- Administração
  'operations',       -- Operações
  'maintenance',      -- Manutenção
  'commercial',       -- Comercial e Marketing
  'human_resources',  -- Recursos Humanos
  'finance',          -- Financeiro
  'safety',           -- Segurança
  'quality',          -- Qualidade
  'training',         -- Treinamento
  'ground_ops',       -- Operações de Solo
  'flight_ops',       -- Operações de Voo
  'customer_service'  -- Atendimento ao Cliente
);

-- Enum para tipos de contrato
CREATE TYPE public.contract_type AS ENUM (
  'permanent',        -- Permanente
  'temporary',        -- Temporário
  'contract',         -- Contrato
  'internship',       -- Estágio
  'part_time',        -- Meio período
  'seasonal',         -- Sazonal
  'consultant'        -- Consultor
);

-- Enum para status de funcionário
CREATE TYPE public.employee_status AS ENUM (
  'active',           -- Ativo
  'inactive',         -- Inativo
  'on_leave',         -- Em licença
  'suspended',        -- Suspenso
  'terminated',       -- Demitido
  'retired',          -- Aposentado
  'transferred'       -- Transferido
);

-- Tabela principal de funcionários
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação pessoal
  employee_number TEXT UNIQUE NOT NULL, -- Número de funcionário
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  preferred_name TEXT, -- Nome preferido
  
  -- Documentação Angola
  bi_number TEXT UNIQUE CHECK (public.is_valid_angola_document(bi_number)),
  passport_number TEXT,
  tax_number TEXT, -- NIF
  social_security_number TEXT, -- Segurança Social
  
  -- Contactos
  email TEXT UNIQUE CHECK (public.is_valid_email(email)),
  phone_primary TEXT CHECK (public.is_valid_phone_angola(phone_primary)),
  phone_secondary TEXT CHECK (public.is_valid_phone_angola(phone_secondary)),
  
  -- Endereço
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT DEFAULT 'Luanda',
  province TEXT DEFAULT 'Luanda',
  postal_code TEXT,
  country TEXT DEFAULT 'Angola',
  
  -- Dados profissionais
  position TEXT NOT NULL, -- Cargo
  department public.department_type NOT NULL,
  job_title TEXT, -- Título do cargo
  job_description TEXT,
  
  -- Hierarquia organizacional
  supervisor_id UUID REFERENCES public.employees(id),
  reports_to TEXT, -- Nome do supervisor (backup)
  direct_reports_count INTEGER DEFAULT 0,
  
  -- Contrato e emprego
  hire_date DATE NOT NULL,
  termination_date DATE,
  contract_type public.contract_type DEFAULT 'permanent',
  probation_end_date DATE,
  
  -- Salário e benefícios
  salary_grade TEXT,
  salary_amount NUMERIC(12,2),
  salary_currency TEXT DEFAULT 'AOA',
  last_salary_review DATE,
  
  -- Localização e horário
  work_location TEXT DEFAULT 'Luanda',
  time_zone TEXT DEFAULT 'Africa/Luanda',
  work_schedule JSONB DEFAULT '{"type": "standard", "hours_per_week": 40}'::jsonb,
  
  -- Certificações e qualificações
  certifications JSONB DEFAULT '[]'::jsonb, -- Array de certificações
  licenses JSONB DEFAULT '[]'::jsonb, -- Licenças profissionais
  qualifications JSONB DEFAULT '[]'::jsonb, -- Qualificações acadêmicas
  training_records JSONB DEFAULT '[]'::jsonb, -- Histórico de treinamentos
  
  -- Dados de emergência
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT CHECK (public.is_valid_phone_angola(emergency_contact_phone)),
  emergency_contact_address TEXT,
  
  -- Dados médicos básicos
  medical_certificate_expiry DATE,
  medical_restrictions JSONB DEFAULT '[]'::jsonb,
  blood_type TEXT,
  allergies TEXT,
  
  -- Dados de aviação (para pessoal técnico/operacional)
  aviation_license_number TEXT,
  aviation_license_type TEXT, -- PPL, CPL, ATPL, AME, etc.
  aviation_license_expiry DATE,
  flight_hours NUMERIC(10,2) DEFAULT 0,
  aircraft_ratings JSONB DEFAULT '[]'::jsonb, -- Habilitações de aeronaves
  
  -- Status e disponibilidade
  status public.employee_status DEFAULT 'active',
  is_available BOOLEAN DEFAULT true,
  availability_notes TEXT,
  
  -- Performance e avaliação
  last_performance_review DATE,
  performance_score NUMERIC(3,2), -- 0.00 a 5.00
  performance_notes TEXT,
  
  -- Dados diversos
  employee_photo_url TEXT,
  birth_date DATE,
  gender TEXT,
  marital_status TEXT,
  nationality TEXT DEFAULT 'Angolana',
  languages JSONB DEFAULT '["pt"]'::jsonb, -- Idiomas falados
  
  -- Metadados
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb, -- Tags para categorização
  
  -- Sync metadata para mobile
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  
  -- Timestamps obrigatórios
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON public.employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_full_name ON public.employees(full_name);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_bi_number ON public.employees(bi_number);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_position ON public.employees(position);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_supervisor ON public.employees(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON public.employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_employees_available ON public.employees(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_employees_work_location ON public.employees(work_location);
CREATE INDEX IF NOT EXISTS idx_employees_license_expiry ON public.employees(aviation_license_expiry) WHERE aviation_license_expiry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_medical_expiry ON public.employees(medical_certificate_expiry) WHERE medical_certificate_expiry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_sync ON public.employees(sync_version, last_synced);
CREATE INDEX IF NOT EXISTS idx_employees_deleted ON public.employees(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para auditoria automática
CREATE TRIGGER employees_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Função para gerar número de funcionário
CREATE OR REPLACE FUNCTION public.generate_employee_number(department_code TEXT DEFAULT 'GEN')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_code TEXT;
  sequence_num INTEGER;
  employee_num TEXT;
BEGIN
  -- Obter código do ano (últimos 2 dígitos)
  year_code := RIGHT(extract(year from NOW())::TEXT, 2);
  
  -- Obter próximo número sequencial
  SELECT COALESCE(MAX(
    CASE 
      WHEN employee_number ~ '^[A-Z]{3}' || year_code || '[0-9]{4}$'
      THEN substring(employee_number from 6 for 4)::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_num
  FROM public.employees
  WHERE employee_number LIKE department_code || year_code || '%'
  AND deleted_at IS NULL;
  
  -- Gerar número completo
  employee_num := department_code || year_code || lpad(sequence_num::TEXT, 4, '0');
  
  RETURN employee_num;
END;
$$;

-- Função para atualizar contagem de subordinados
CREATE OR REPLACE FUNCTION public.update_direct_reports_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualizar supervisor anterior (se houver)
  IF OLD.supervisor_id IS NOT NULL THEN
    UPDATE public.employees
    SET direct_reports_count = (
      SELECT COUNT(*)
      FROM public.employees
      WHERE supervisor_id = OLD.supervisor_id
      AND status = 'active'
      AND deleted_at IS NULL
    )
    WHERE id = OLD.supervisor_id;
  END IF;
  
  -- Atualizar novo supervisor (se houver)
  IF NEW.supervisor_id IS NOT NULL THEN
    UPDATE public.employees
    SET direct_reports_count = (
      SELECT COUNT(*)
      FROM public.employees
      WHERE supervisor_id = NEW.supervisor_id
      AND status = 'active'
      AND deleted_at IS NULL
    )
    WHERE id = NEW.supervisor_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para atualizar contagem de subordinados
CREATE TRIGGER update_direct_reports_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_direct_reports_count();

-- Função para verificar vencimentos de certificados
CREATE OR REPLACE FUNCTION public.check_employee_certifications_expiry()
RETURNS TABLE(
  employee_id UUID,
  employee_name TEXT,
  certification_type TEXT,
  expiry_date DATE,
  days_until_expiry INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.full_name,
    'aviation_license' as cert_type,
    e.aviation_license_expiry,
    (e.aviation_license_expiry - CURRENT_DATE)::INTEGER
  FROM public.employees e
  WHERE e.aviation_license_expiry IS NOT NULL
  AND e.aviation_license_expiry <= CURRENT_DATE + interval '90 days'
  AND e.status = 'active'
  AND e.deleted_at IS NULL
  
  UNION ALL
  
  SELECT 
    e.id,
    e.full_name,
    'medical_certificate' as cert_type,
    e.medical_certificate_expiry,
    (e.medical_certificate_expiry - CURRENT_DATE)::INTEGER
  FROM public.employees e
  WHERE e.medical_certificate_expiry IS NOT NULL
  AND e.medical_certificate_expiry <= CURRENT_DATE + interval '90 days'
  AND e.status = 'active'
  AND e.deleted_at IS NULL
  
  ORDER BY expiry_date ASC;
END;
$$;

-- View para funcionários ativos
CREATE OR REPLACE VIEW public.active_employees AS
SELECT 
  id,
  employee_number,
  full_name,
  position,
  department,
  email,
  phone_primary,
  work_location,
  hire_date,
  supervisor_id,
  direct_reports_count,
  aviation_license_expiry,
  medical_certificate_expiry
FROM public.employees
WHERE status = 'active'
AND deleted_at IS NULL
ORDER BY department, position, full_name;

-- View para hierarquia organizacional
CREATE OR REPLACE VIEW public.employee_hierarchy AS
WITH RECURSIVE org_chart AS (
  -- Funcionários de topo (sem supervisor)
  SELECT 
    id,
    full_name,
    position,
    department,
    supervisor_id,
    0 as level,
    full_name as path,
    ARRAY[id] as id_path
  FROM public.employees
  WHERE supervisor_id IS NULL
  AND status = 'active'
  AND deleted_at IS NULL
  
  UNION ALL
  
  -- Subordinados recursivos
  SELECT 
    e.id,
    e.full_name,
    e.position,
    e.department,
    e.supervisor_id,
    oc.level + 1,
    oc.path || ' > ' || e.full_name,
    oc.id_path || e.id
  FROM public.employees e
  INNER JOIN org_chart oc ON e.supervisor_id = oc.id
  WHERE e.status = 'active'
  AND e.deleted_at IS NULL
  AND e.id != ALL(oc.id_path) -- Evitar loops
)
SELECT 
  id,
  full_name,
  position,
  department,
  supervisor_id,
  level,
  repeat('  ', level) || full_name as indented_name,
  path,
  id_path
FROM org_chart
ORDER BY department, level, full_name;

-- View para estatísticas de funcionários
CREATE OR REPLACE VIEW public.employee_statistics AS
SELECT 
  department,
  COUNT(*) as total_employees,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
  COUNT(CASE WHEN contract_type = 'permanent' THEN 1 END) as permanent_employees,
  COUNT(CASE WHEN aviation_license_number IS NOT NULL THEN 1 END) as licensed_personnel,
  AVG(CASE WHEN status = 'active' THEN 
    extract(days from (CURRENT_DATE - hire_date)) / 365.25 
  END) as avg_years_service,
  COUNT(CASE WHEN supervisor_id IS NULL THEN 1 END) as managers,
  array_agg(DISTINCT work_location ORDER BY work_location) as locations
FROM public.employees
WHERE deleted_at IS NULL
GROUP BY department
ORDER BY department;

-- View para funcionários que requerem atenção
CREATE OR REPLACE VIEW public.employees_requiring_attention AS
SELECT 
  id,
  employee_number,
  full_name,
  department,
  position,
  CASE 
    WHEN aviation_license_expiry <= CURRENT_DATE THEN 'aviation_license_expired'
    WHEN aviation_license_expiry <= CURRENT_DATE + interval '30 days' THEN 'aviation_license_expiring'
    WHEN medical_certificate_expiry <= CURRENT_DATE THEN 'medical_certificate_expired'
    WHEN medical_certificate_expiry <= CURRENT_DATE + interval '30 days' THEN 'medical_certificate_expiring'
    WHEN last_performance_review IS NULL OR last_performance_review <= CURRENT_DATE - interval '1 year' THEN 'performance_review_due'
    WHEN probation_end_date IS NOT NULL AND probation_end_date <= CURRENT_DATE + interval '7 days' THEN 'probation_ending'
    WHEN status != 'active' THEN 'not_active'
    ELSE 'other'
  END as attention_reason,
  aviation_license_expiry,
  medical_certificate_expiry,
  last_performance_review,
  probation_end_date,
  status
FROM public.employees
WHERE deleted_at IS NULL
AND (
  aviation_license_expiry <= CURRENT_DATE + interval '30 days' OR
  medical_certificate_expiry <= CURRENT_DATE + interval '30 days' OR
  last_performance_review IS NULL OR 
  last_performance_review <= CURRENT_DATE - interval '1 year' OR
  (probation_end_date IS NOT NULL AND probation_end_date <= CURRENT_DATE + interval '7 days') OR
  status != 'active'
)
ORDER BY 
  CASE attention_reason
    WHEN 'aviation_license_expired' THEN 1
    WHEN 'medical_certificate_expired' THEN 2
    WHEN 'aviation_license_expiring' THEN 3
    WHEN 'medical_certificate_expiring' THEN 4
    WHEN 'probation_ending' THEN 5
    WHEN 'performance_review_due' THEN 6
    WHEN 'not_active' THEN 7
    ELSE 8
  END,
  full_name;

-- Políticas RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Política: utilizadores podem ver dados básicos de funcionários
CREATE POLICY "Users can view basic employee data" ON public.employees
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    deleted_at IS NULL
  );

-- Política: utilizadores podem ver dados completos próprios
CREATE POLICY "Users can view own complete data" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.employee_number = employees.employee_number
    )
  );

-- Política: supervisores podem ver dados da equipa
CREATE POLICY "Supervisors can view team data" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees supervisor
      INNER JOIN public.user_profiles up ON supervisor.employee_number = up.employee_number
      WHERE up.id = auth.uid()
      AND employees.supervisor_id = supervisor.id
    )
  );

-- Política: apenas utilizadores com permissão podem modificar
CREATE POLICY "Only authorized users can modify employees" ON public.employees
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'employees.manage') OR
    public.user_has_permission(auth.uid(), 'employees.admin')
  );

-- Comentários
COMMENT ON TABLE public.employees IS 'Tabela de funcionários com dados específicos para Angola';
COMMENT ON COLUMN public.employees.bi_number IS 'Número do Bilhete de Identidade angolano';
COMMENT ON COLUMN public.employees.aviation_license_number IS 'Número da licença de aviação (PPL, CPL, ATPL, etc.)';
COMMENT ON COLUMN public.employees.aircraft_ratings IS 'Habilitações de tipos de aeronaves em formato JSON';
COMMENT ON COLUMN public.employees.work_schedule IS 'Horário de trabalho em formato JSON';
COMMENT ON COLUMN public.employees.direct_reports_count IS 'Número de subordinados diretos (atualizado automaticamente)';

COMMENT ON FUNCTION public.generate_employee_number(TEXT) IS 'Gera número único de funcionário com código de departamento';
COMMENT ON FUNCTION public.check_employee_certifications_expiry() IS 'Verifica certificados e licenças próximos do vencimento';

COMMENT ON VIEW public.active_employees IS 'Funcionários ativos com dados essenciais';
COMMENT ON VIEW public.employee_hierarchy IS 'Hierarquia organizacional com níveis e subordinação';
COMMENT ON VIEW public.employee_statistics IS 'Estatísticas de funcionários por departamento';
COMMENT ON VIEW public.employees_requiring_attention IS 'Funcionários que requerem atenção por vencimentos ou problemas';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000012_employees.sql aplicada com sucesso';
  RAISE NOTICE 'Tabela employees criada com validações Angola';
  RAISE NOTICE 'Funções de gestão e hierarquia implementadas';
  RAISE NOTICE 'Views operacionais e estatísticas configuradas';
  RAISE NOTICE 'Políticas RLS com diferentes níveis de acesso aplicadas';
END $$;
