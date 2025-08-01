-- =========================================================================
-- AirPlus Aviation Management System  
-- Migrations 31-40: Performance e Otimizações (Fase 4)
-- Consolidadas para eficiência
-- =========================================================================

-- Migration 31-32: Índices Primários e Compostos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aircraft_status_location ON public.aircraft(status, location) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_department_status ON public.employees(department, status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_aircraft_status ON public.tasks(aircraft_id, status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cleaning_forms_date_status ON public.cleaning_forms(cleaning_date, status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flight_sheets_date_aircraft ON public.flight_sheets(scheduled_departure, aircraft_id) WHERE deleted_at IS NULL;

-- Migration 33-34: Triggers de Auditoria e Timestamp
CREATE OR REPLACE FUNCTION public.sync_updated_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = public.now_utc();
  NEW.sync_version = OLD.sync_version + 1;
  RETURN NEW;
END;
$$;

-- Apply to all tables that need sync
CREATE TRIGGER sync_aircraft_timestamp BEFORE UPDATE ON public.aircraft
  FOR EACH ROW EXECUTE FUNCTION public.sync_updated_timestamp();
CREATE TRIGGER sync_employees_timestamp BEFORE UPDATE ON public.employees  
  FOR EACH ROW EXECUTE FUNCTION public.sync_updated_timestamp();
CREATE TRIGGER sync_tasks_timestamp BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.sync_updated_timestamp();
CREATE TRIGGER sync_cleaning_forms_timestamp BEFORE UPDATE ON public.cleaning_forms
  FOR EACH ROW EXECUTE FUNCTION public.sync_updated_timestamp();

-- Migration 35-36: Functions de Utilidade
CREATE OR REPLACE FUNCTION public.get_entity_display_name(entity_type TEXT, entity_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  CASE entity_type
    WHEN 'aircraft' THEN
      RETURN (SELECT registration || ' (' || model || ')' FROM public.aircraft WHERE id = entity_id);
    WHEN 'employees' THEN  
      RETURN (SELECT full_name || ' (' || position || ')' FROM public.employees WHERE id = entity_id);
    WHEN 'tasks' THEN
      RETURN (SELECT title FROM public.tasks WHERE id = entity_id);
    WHEN 'cleaning_forms' THEN
      RETURN (SELECT form_code FROM public.cleaning_forms WHERE id = entity_id);
    ELSE
      RETURN entity_id::TEXT;
  END CASE;
END;
$$;

-- Migration 37-38: Views Otimizadas
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_summary AS
SELECT 
  'aircraft' as metric_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
  NOW() as last_updated
FROM public.aircraft WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'employees' as metric_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
  NOW() as last_updated  
FROM public.employees WHERE deleted_at IS NULL
UNION ALL
SELECT
  'tasks' as metric_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status IN ('pending', 'in_progress') THEN 1 END) as active_count,
  NOW() as last_updated
FROM public.tasks WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX ON public.dashboard_summary(metric_type);

-- Migration 39-40: RLS Políticas Otimizadas
-- Política otimizada para aircraft
DROP POLICY IF EXISTS "Authenticated users can view aircraft" ON public.aircraft;
CREATE POLICY "Optimized aircraft access" ON public.aircraft
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    deleted_at IS NULL AND (
      is_available = true OR
      public.user_has_permission(auth.uid(), 'aircraft.read_all')
    )
  );

-- Política otimizada para employees  
DROP POLICY IF EXISTS "Users can view basic employee data" ON public.employees;
CREATE POLICY "Optimized employee access" ON public.employees
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    deleted_at IS NULL AND
    status = 'active'
  );

-- Função para refresh das materialized views
CREATE OR REPLACE FUNCTION public.refresh_dashboard_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_summary;
END;
$$;

-- Schedule para refresh automático (seria configurado via pg_cron se disponível)
-- SELECT cron.schedule('refresh-dashboard', '*/15 * * * *', 'SELECT public.refresh_dashboard_data();');

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Log
DO $$ 
BEGIN 
  RAISE NOTICE '=== FASE 4 (Performance e Otimizações) CONCLUÍDA ===';
  RAISE NOTICE 'Migrations 31-40 aplicadas com sucesso';
  RAISE NOTICE 'Índices, triggers e views otimizadas implementadas';
END $$;
