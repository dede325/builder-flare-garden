-- =========================================================================
-- AirPlus Aviation Management System
-- Migrations 21-30: Relacionamentos e Constraints (Fase 3)
-- Consolidadas para eficiência
-- =========================================================================

-- Migration 21: Foreign Keys Aircraft Relations
ALTER TABLE public.tasks ADD CONSTRAINT fk_tasks_aircraft 
  FOREIGN KEY (aircraft_id) REFERENCES public.aircraft(id) ON DELETE SET NULL;

ALTER TABLE public.cleaning_forms ADD CONSTRAINT fk_cleaning_forms_aircraft 
  FOREIGN KEY (aircraft_id) REFERENCES public.aircraft(id) ON DELETE CASCADE;

ALTER TABLE public.flight_sheets ADD CONSTRAINT fk_flight_sheets_aircraft 
  FOREIGN KEY (aircraft_id) REFERENCES public.aircraft(id) ON DELETE CASCADE;

-- Migration 22: Foreign Keys Employee Relations  
ALTER TABLE public.tasks ADD CONSTRAINT fk_tasks_assigned_to 
  FOREIGN KEY (assigned_to) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.tasks ADD CONSTRAINT fk_tasks_created_by 
  FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.cleaning_forms ADD CONSTRAINT fk_cleaning_forms_supervisor 
  FOREIGN KEY (supervisor_id) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.flight_sheets ADD CONSTRAINT fk_flight_sheets_pilot 
  FOREIGN KEY (pilot_in_command_id) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.flight_sheets ADD CONSTRAINT fk_flight_sheets_copilot 
  FOREIGN KEY (copilot_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- Migration 23: User Profile Relations
ALTER TABLE public.user_profiles ADD CONSTRAINT fk_user_profiles_auth_user 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Migration 24: Validation Constraints
ALTER TABLE public.aircraft ADD CONSTRAINT chk_aircraft_year_valid 
  CHECK (year_manufactured > 1900 AND year_manufactured <= extract(year from NOW()) + 2);

ALTER TABLE public.aircraft ADD CONSTRAINT chk_aircraft_capacity_positive 
  CHECK (passenger_capacity >= 0 AND cargo_capacity_kg >= 0);

ALTER TABLE public.employees ADD CONSTRAINT chk_employees_hire_date_reasonable 
  CHECK (hire_date >= '1950-01-01' AND hire_date <= CURRENT_DATE + interval '1 year');

ALTER TABLE public.tasks ADD CONSTRAINT chk_tasks_hours_positive 
  CHECK (estimated_hours >= 0 AND (actual_hours IS NULL OR actual_hours >= 0));

-- Migration 25: Data Integrity Constraints
ALTER TABLE public.cleaning_forms ADD CONSTRAINT chk_cleaning_completion_valid 
  CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

ALTER TABLE public.cleaning_forms ADD CONSTRAINT chk_cleaning_quality_valid 
  CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5));

ALTER TABLE public.flight_sheets ADD CONSTRAINT chk_flight_passenger_count_valid 
  CHECK (passenger_count >= 0);

-- Migration 26: Temporal Constraints
ALTER TABLE public.user_sessions ADD CONSTRAINT chk_session_times_logical 
  CHECK (expires_at > login_at);

ALTER TABLE public.security_tokens ADD CONSTRAINT chk_token_times_logical 
  CHECK (expires_at > created_at);

ALTER TABLE public.tasks ADD CONSTRAINT chk_task_completion_after_start 
  CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at);

-- Migration 27: Business Rules Constraints
ALTER TABLE public.employees ADD CONSTRAINT chk_employee_supervisor_not_self 
  CHECK (supervisor_id != id);

ALTER TABLE public.tasks ADD CONSTRAINT chk_task_dates_logical 
  CHECK (due_date IS NULL OR due_date >= created_at_date);

-- Migration 28: Mobile Sync Constraints
ALTER TABLE public.aircraft ADD CONSTRAINT chk_aircraft_sync_version_positive 
  CHECK (sync_version > 0);

ALTER TABLE public.employees ADD CONSTRAINT chk_employees_sync_version_positive 
  CHECK (sync_version > 0);

ALTER TABLE public.tasks ADD CONSTRAINT chk_tasks_sync_version_positive 
  CHECK (sync_version > 0);

ALTER TABLE public.cleaning_forms ADD CONSTRAINT chk_cleaning_forms_sync_version_positive 
  CHECK (sync_version > 0);

-- Migration 29: Security Constraints
ALTER TABLE public.user_sessions ADD CONSTRAINT chk_risk_score_range 
  CHECK (risk_score >= 0 AND risk_score <= 100);

ALTER TABLE public.security_tokens ADD CONSTRAINT chk_token_uses_valid 
  CHECK (max_uses > 0 AND current_uses >= 0 AND current_uses <= max_uses);

-- Migration 30: File System Constraints
ALTER TABLE public.file_attachments ADD CONSTRAINT chk_file_size_reasonable 
  CHECK (file_size_bytes > 0 AND file_size_bytes <= 1073741824); -- Max 1GB

ALTER TABLE public.file_attachments ADD CONSTRAINT chk_version_number_positive 
  CHECK (version_number > 0);

-- Add database-level functions for complex validations
CREATE OR REPLACE FUNCTION public.validate_angola_business_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar regras específicas de Angola
  IF TG_TABLE_NAME = 'aircraft' THEN
    IF NEW.registration IS NOT NULL AND NOT public.validate_angola_registration(NEW.registration) THEN
      RAISE EXCEPTION 'Invalid Angola aircraft registration format: %', NEW.registration;
    END IF;
  END IF;
  
  IF TG_TABLE_NAME = 'employees' THEN
    IF NEW.bi_number IS NOT NULL AND NOT public.is_valid_angola_document(NEW.bi_number) THEN
      RAISE EXCEPTION 'Invalid Angola BI number format: %', NEW.bi_number;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply business rules triggers
CREATE TRIGGER aircraft_business_rules_trigger
  BEFORE INSERT OR UPDATE ON public.aircraft
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_angola_business_rules();

CREATE TRIGGER employees_business_rules_trigger
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_angola_business_rules();

-- Log
DO $$ 
BEGIN 
  RAISE NOTICE '=== FASE 3 (Relacionamentos e Constraints) CONCLUÍDA ===';
  RAISE NOTICE 'Migrations 21-30 aplicadas com sucesso';
  RAISE NOTICE 'Foreign keys, constraints e validações implementadas';
END $$;
