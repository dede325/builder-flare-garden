-- =========================================================================
-- Migration: 20250101000017_flight_sheets.sql
-- Descrição: Sistema de fichas de voo
-- =========================================================================

CREATE TYPE public.flight_status AS ENUM ('scheduled', 'boarding', 'departed', 'in_flight', 'arrived', 'completed', 'cancelled', 'delayed');
CREATE TYPE public.flight_type AS ENUM ('commercial', 'charter', 'cargo', 'training', 'maintenance', 'positioning', 'emergency');

CREATE TABLE IF NOT EXISTS public.flight_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_number TEXT UNIQUE NOT NULL,
  aircraft_id UUID NOT NULL REFERENCES public.aircraft(id),
  pilot_in_command_id UUID REFERENCES public.employees(id),
  copilot_id UUID REFERENCES public.employees(id),
  
  flight_type public.flight_type DEFAULT 'commercial',
  status public.flight_status DEFAULT 'scheduled',
  
  -- Origem e destino
  departure_airport TEXT NOT NULL, -- Código ICAO
  departure_airport_name TEXT,
  arrival_airport TEXT NOT NULL, -- Código ICAO
  arrival_airport_name TEXT,
  
  -- Datas e horários (todos em UTC)
  scheduled_departure TIMESTAMPTZ NOT NULL,
  actual_departure TIMESTAMPTZ,
  scheduled_arrival TIMESTAMPTZ NOT NULL,
  actual_arrival TIMESTAMPTZ,
  
  -- Dados do voo
  flight_duration_minutes INTEGER,
  distance_km INTEGER,
  altitude_feet INTEGER,
  route TEXT,
  
  -- Passageiros e carga
  passenger_count INTEGER DEFAULT 0,
  cargo_weight_kg NUMERIC(8,2) DEFAULT 0,
  fuel_consumed_liters NUMERIC(8,2),
  
  -- Condições operacionais
  weather_departure JSONB,
  weather_arrival JSONB,
  crew_notes TEXT,
  maintenance_notes TEXT,
  
  -- Documentação
  flight_plan_ref TEXT,
  weight_balance_ref TEXT,
  
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_flight_sheets_aircraft ON public.flight_sheets(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_flight_sheets_pilot ON public.flight_sheets(pilot_in_command_id);
CREATE INDEX IF NOT EXISTS idx_flight_sheets_status ON public.flight_sheets(status);
CREATE INDEX IF NOT EXISTS idx_flight_sheets_departure ON public.flight_sheets(scheduled_departure);

-- Trigger para updated_at
CREATE TRIGGER update_flight_sheets_updated_at
  BEFORE UPDATE ON public.flight_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.flight_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view flight sheets" ON public.flight_sheets
  FOR SELECT USING (auth.uid() IS NOT NULL);

COMMENT ON TABLE public.flight_sheets IS 'Sistema de fichas de voo';

-- Log
DO $$ BEGIN RAISE NOTICE 'Migration 20250101000017_flight_sheets.sql aplicada com sucesso'; END $$;
