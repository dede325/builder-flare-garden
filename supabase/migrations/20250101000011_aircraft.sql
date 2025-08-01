-- =========================================================================
-- AirPlus Aviation Management System
-- Migration: 20250101000011_aircraft.sql
-- Descrição: Tabela de aeronaves com dados específicos para operações Angola
-- Autor: AirPlus Aviation Development Team
-- Data: 2025-01-01
-- =========================================================================

-- Enum para status de aeronave
CREATE TYPE public.aircraft_status AS ENUM (
  'active',           -- Ativa e operacional
  'maintenance',      -- Em manutenção
  'inspection',       -- Em inspeção
  'grounded',        -- Aterrada por problemas
  'retired',         -- Retirada de serviço
  'sold',            -- Vendida
  'leased_out',      -- Arrendada para terceiros
  'leased_in'        -- Arrendada de terceiros
);

-- Enum para categoria de aeronave
CREATE TYPE public.aircraft_category AS ENUM (
  'airplane',         -- Avião
  'helicopter',       -- Helicóptero
  'glider',          -- Planador
  'balloon',         -- Balão
  'airship',         -- Dirigível
  'ultralight',      -- Ultraleve
  'drone'            -- Drone/UAV
);

-- Enum para classe de operação
CREATE TYPE public.operation_class AS ENUM (
  'commercial',       -- Comercial
  'private',         -- Privada
  'training',        -- Treinamento
  'cargo',           -- Carga
  'emergency',       -- Emergência
  'government',      -- Governamental
  'military'         -- Militar
);

-- Tabela principal de aeronaves
CREATE TABLE IF NOT EXISTS public.aircraft (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação oficial
  registration TEXT UNIQUE NOT NULL, -- Matrícula (e.g., PT-ABC)
  serial_number TEXT UNIQUE, -- Número de série do fabricante
  
  -- Informações técnicas básicas
  manufacturer TEXT NOT NULL, -- Boeing, Airbus, Cessna, etc.
  model TEXT NOT NULL, -- 737-800, A320, 172, etc.
  variant TEXT, -- Variante específica do modelo
  
  -- Classificação
  aircraft_category public.aircraft_category DEFAULT 'airplane',
  operation_class public.operation_class DEFAULT 'commercial',
  
  -- Especificações técnicas
  year_manufactured INTEGER CHECK (year_manufactured > 1900 AND year_manufactured <= extract(year from NOW()) + 2),
  mtow_kg INTEGER, -- Maximum Take-off Weight em kg
  passenger_capacity INTEGER DEFAULT 0,
  cargo_capacity_kg INTEGER DEFAULT 0,
  fuel_capacity_liters INTEGER,
  
  -- Motorização
  engine_type TEXT, -- Turbofan, Turboprop, Piston, etc.
  engine_count INTEGER DEFAULT 1,
  engine_manufacturer TEXT,
  engine_model TEXT,
  
  -- Status operacional
  status public.aircraft_status DEFAULT 'active',
  location TEXT DEFAULT 'Luanda', -- Localização atual
  base_airport TEXT DEFAULT 'FNLU', -- Aeroporto base (código ICAO)
  
  -- Histórico operacional
  total_flight_hours NUMERIC(10,2) DEFAULT 0,
  total_cycles INTEGER DEFAULT 0, -- Ciclos de voo (decolagem-pouso)
  last_flight_date DATE,
  
  -- Manutenção e inspeções
  last_inspection_date DATE,
  next_inspection_due DATE,
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  maintenance_provider TEXT,
  
  -- Certificações e documentação
  airworthiness_certificate TEXT, -- Certificado de aeronavegabilidade
  certificate_expiry_date DATE,
  insurance_policy TEXT,
  insurance_expiry_date DATE,
  
  -- Propriedade e operação
  owner_name TEXT,
  operator_name TEXT DEFAULT 'AirPlus Aviation',
  lease_agreement_ref TEXT,
  lease_expiry_date DATE,
  
  -- Configuração específica
  cabin_configuration JSONB DEFAULT '{}'::jsonb, -- Layout da cabine
  avionics_package JSONB DEFAULT '{}'::jsonb, -- Pacote de aviônicos
  special_equipment JSONB DEFAULT '[]'::jsonb, -- Equipamentos especiais
  
  -- Dados financeiros
  acquisition_cost NUMERIC(15,2),
  acquisition_date DATE,
  current_value NUMERIC(15,2),
  last_valuation_date DATE,
  
  -- Configurações operacionais
  is_available BOOLEAN DEFAULT true, -- Disponível para operação
  requires_type_rating BOOLEAN DEFAULT false, -- Requer habilitação de tipo
  minimum_crew INTEGER DEFAULT 2, -- Tripulação mínima
  
  -- Metadados
  notes TEXT,
  photos JSONB DEFAULT '[]'::jsonb, -- Array de URLs de fotos
  documents JSONB DEFAULT '[]'::jsonb, -- Array de documentos
  
  -- Sync metadata para mobile
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  
  -- Timestamps obrigatórios
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_aircraft_registration ON public.aircraft(registration);
CREATE INDEX IF NOT EXISTS idx_aircraft_manufacturer ON public.aircraft(manufacturer);
CREATE INDEX IF NOT EXISTS idx_aircraft_model ON public.aircraft(model);
CREATE INDEX IF NOT EXISTS idx_aircraft_status ON public.aircraft(status);
CREATE INDEX IF NOT EXISTS idx_aircraft_category ON public.aircraft(aircraft_category);
CREATE INDEX IF NOT EXISTS idx_aircraft_operation_class ON public.aircraft(operation_class);
CREATE INDEX IF NOT EXISTS idx_aircraft_location ON public.aircraft(location);
CREATE INDEX IF NOT EXISTS idx_aircraft_available ON public.aircraft(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_aircraft_maintenance_due ON public.aircraft(next_maintenance_due) WHERE next_maintenance_due IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aircraft_inspection_due ON public.aircraft(next_inspection_due) WHERE next_inspection_due IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aircraft_certificate_expiry ON public.aircraft(certificate_expiry_date) WHERE certificate_expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aircraft_sync ON public.aircraft(sync_version, last_synced);
CREATE INDEX IF NOT EXISTS idx_aircraft_deleted ON public.aircraft(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_aircraft_updated_at
  BEFORE UPDATE ON public.aircraft
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para auditoria automática
CREATE TRIGGER aircraft_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.aircraft
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Função para validar matrícula Angola
CREATE OR REPLACE FUNCTION public.validate_angola_registration(registration TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Formato Angola: PT-XXX (PT seguido de hífen e 3 caracteres)
  RETURN registration ~ '^PT-[A-Z]{3}$';
END;
$$;

-- Função para calcular próxima manutenção
CREATE OR REPLACE FUNCTION public.calculate_next_maintenance(
  aircraft_id UUID,
  maintenance_interval_hours INTEGER DEFAULT 100,
  maintenance_interval_cycles INTEGER DEFAULT 50
)
RETURNS DATE
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  aircraft_rec public.aircraft%ROWTYPE;
  hours_since_maintenance NUMERIC;
  cycles_since_maintenance INTEGER;
  next_by_hours DATE;
  next_by_cycles DATE;
BEGIN
  -- Obter dados da aeronave
  SELECT * INTO aircraft_rec FROM public.aircraft WHERE id = aircraft_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Calcular baseado em horas de voo
  IF aircraft_rec.last_maintenance_date IS NOT NULL THEN
    -- Assumir média de 8 horas de voo por dia operacional
    next_by_hours := aircraft_rec.last_maintenance_date + 
      (maintenance_interval_hours / 8.0)::INTEGER;
  ELSE
    next_by_hours := CURRENT_DATE + 30; -- Default 30 dias se sem histórico
  END IF;
  
  -- Calcular baseado em ciclos
  IF aircraft_rec.last_maintenance_date IS NOT NULL THEN
    -- Assumir média de 4 ciclos por dia operacional
    next_by_cycles := aircraft_rec.last_maintenance_date + 
      (maintenance_interval_cycles / 4.0)::INTEGER;
  ELSE
    next_by_cycles := CURRENT_DATE + 30;
  END IF;
  
  -- Retornar o mais próximo (mais conservador)
  RETURN LEAST(next_by_hours, next_by_cycles);
END;
$$;

-- Função para atualizar status de disponibilidade
CREATE OR REPLACE FUNCTION public.update_aircraft_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Automaticamente marcar como indisponível se status não for 'active'
  IF NEW.status != 'active' THEN
    NEW.is_available := false;
  END IF;
  
  -- Verificar vencimentos de certificados
  IF NEW.certificate_expiry_date IS NOT NULL AND NEW.certificate_expiry_date <= CURRENT_DATE THEN
    NEW.is_available := false;
    NEW.status := 'grounded';
  END IF;
  
  -- Verificar vencimento de seguro
  IF NEW.insurance_expiry_date IS NOT NULL AND NEW.insurance_expiry_date <= CURRENT_DATE THEN
    NEW.is_available := false;
    NEW.status := 'grounded';
  END IF;
  
  -- Verificar manutenção vencida
  IF NEW.next_maintenance_due IS NOT NULL AND NEW.next_maintenance_due <= CURRENT_DATE THEN
    NEW.is_available := false;
    IF NEW.status = 'active' THEN
      NEW.status := 'maintenance';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar disponibilidade automaticamente
CREATE TRIGGER update_aircraft_availability_trigger
  BEFORE INSERT OR UPDATE ON public.aircraft
  FOR EACH ROW
  EXECUTE FUNCTION public.update_aircraft_availability();

-- View para aeronaves disponíveis
CREATE OR REPLACE VIEW public.available_aircraft AS
SELECT 
  id,
  registration,
  manufacturer,
  model,
  aircraft_category,
  operation_class,
  passenger_capacity,
  location,
  total_flight_hours,
  last_flight_date,
  next_maintenance_due,
  certificate_expiry_date
FROM public.aircraft
WHERE status = 'active'
AND is_available = true
AND deleted_at IS NULL
AND (certificate_expiry_date IS NULL OR certificate_expiry_date > CURRENT_DATE)
AND (insurance_expiry_date IS NULL OR insurance_expiry_date > CURRENT_DATE)
ORDER BY registration;

-- View para aeronaves que requerem atenção
CREATE OR REPLACE VIEW public.aircraft_requiring_attention AS
SELECT 
  id,
  registration,
  manufacturer,
  model,
  status,
  CASE 
    WHEN certificate_expiry_date <= CURRENT_DATE THEN 'certificate_expired'
    WHEN certificate_expiry_date <= CURRENT_DATE + interval '30 days' THEN 'certificate_expiring'
    WHEN insurance_expiry_date <= CURRENT_DATE THEN 'insurance_expired'
    WHEN insurance_expiry_date <= CURRENT_DATE + interval '30 days' THEN 'insurance_expiring'
    WHEN next_maintenance_due <= CURRENT_DATE THEN 'maintenance_overdue'
    WHEN next_maintenance_due <= CURRENT_DATE + interval '7 days' THEN 'maintenance_due_soon'
    WHEN next_inspection_due <= CURRENT_DATE THEN 'inspection_overdue'
    WHEN next_inspection_due <= CURRENT_DATE + interval '7 days' THEN 'inspection_due_soon'
    WHEN status != 'active' THEN 'not_operational'
    ELSE 'other'
  END as attention_reason,
  certificate_expiry_date,
  insurance_expiry_date,
  next_maintenance_due,
  next_inspection_due,
  location
FROM public.aircraft
WHERE deleted_at IS NULL
AND (
  certificate_expiry_date <= CURRENT_DATE + interval '30 days' OR
  insurance_expiry_date <= CURRENT_DATE + interval '30 days' OR
  next_maintenance_due <= CURRENT_DATE + interval '7 days' OR
  next_inspection_due <= CURRENT_DATE + interval '7 days' OR
  status != 'active'
)
ORDER BY 
  CASE attention_reason
    WHEN 'certificate_expired' THEN 1
    WHEN 'insurance_expired' THEN 2
    WHEN 'maintenance_overdue' THEN 3
    WHEN 'inspection_overdue' THEN 4
    WHEN 'certificate_expiring' THEN 5
    WHEN 'insurance_expiring' THEN 6
    WHEN 'maintenance_due_soon' THEN 7
    WHEN 'inspection_due_soon' THEN 8
    WHEN 'not_operational' THEN 9
    ELSE 10
  END,
  registration;

-- View para estatísticas da frota
CREATE OR REPLACE VIEW public.fleet_statistics AS
SELECT 
  COUNT(*) as total_aircraft,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_aircraft,
  COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as in_maintenance,
  COUNT(CASE WHEN is_available THEN 1 END) as available_aircraft,
  COUNT(CASE WHEN aircraft_category = 'airplane' THEN 1 END) as airplanes,
  COUNT(CASE WHEN aircraft_category = 'helicopter' THEN 1 END) as helicopters,
  AVG(total_flight_hours) as avg_flight_hours,
  SUM(passenger_capacity) as total_passenger_capacity,
  array_agg(DISTINCT manufacturer ORDER BY manufacturer) as manufacturers,
  array_agg(DISTINCT location ORDER BY location) as locations
FROM public.aircraft
WHERE deleted_at IS NULL;

-- Políticas RLS
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;

-- Política: todos os utilizadores autenticados podem ver aeronaves
CREATE POLICY "Authenticated users can view aircraft" ON public.aircraft
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política: apenas utilizadores com permissão podem modificar
CREATE POLICY "Only authorized users can modify aircraft" ON public.aircraft
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'aircraft.manage') OR
    public.user_has_permission(auth.uid(), 'aircraft.admin')
  );

-- Comentários
COMMENT ON TABLE public.aircraft IS 'Tabela principal de aeronaves com dados completos para operações Angola';
COMMENT ON COLUMN public.aircraft.registration IS 'Matrícula oficial da aeronave (formato PT-XXX para Angola)';
COMMENT ON COLUMN public.aircraft.mtow_kg IS 'Maximum Take-off Weight em quilogramas';
COMMENT ON COLUMN public.aircraft.total_cycles IS 'Número total de ciclos de voo (decolagem-pouso)';
COMMENT ON COLUMN public.aircraft.cabin_configuration IS 'Configuração da cabine em formato JSON';
COMMENT ON COLUMN public.aircraft.avionics_package IS 'Pacote de aviônicos e equipamentos em formato JSON';
COMMENT ON COLUMN public.aircraft.requires_type_rating IS 'Indica se requer habilitação de tipo específica';

COMMENT ON FUNCTION public.validate_angola_registration(TEXT) IS 'Valida formato de matrícula angolana (PT-XXX)';
COMMENT ON FUNCTION public.calculate_next_maintenance(UUID, INTEGER, INTEGER) IS 'Calcula próxima data de manutenção baseada em horas e ciclos';

COMMENT ON VIEW public.available_aircraft IS 'Aeronaves disponíveis para operação';
COMMENT ON VIEW public.aircraft_requiring_attention IS 'Aeronaves que requerem atenção por vencimentos ou problemas';
COMMENT ON VIEW public.fleet_statistics IS 'Estatísticas gerais da frota';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250101000011_aircraft.sql aplicada com sucesso';
  RAISE NOTICE 'Tabela aircraft criada com validações Angola';
  RAISE NOTICE 'Funções de cálculo e validação implementadas';
  RAISE NOTICE 'Views operacionais configuradas';
  RAISE NOTICE 'Políticas RLS aplicadas';
END $$;
