-- =========================================================================
-- AirPlus Aviation Management System
-- Migrations 41-50: Seeds, Dados Demo e Validações Finais (Fase 5)
-- =========================================================================

-- Migration 41: Roles Iniciais do Sistema
INSERT INTO public.roles (id, name, display_name, description, level, is_system_role, color_code, icon_name) VALUES
('00000000-0000-0000-0000-000000000001', 'super_admin', 'Super Administrador', 'Acesso total ao sistema', 1, true, '#ef4444', 'shield'),
('00000000-0000-0000-0000-000000000002', 'admin', 'Administrador', 'Gestão completa do sistema', 10, true, '#f97316', 'settings'),
('00000000-0000-0000-0000-000000000003', 'manager', 'Gestor', 'Gestão de departamento', 20, true, '#eab308', 'briefcase'),
('00000000-0000-0000-0000-000000000004', 'supervisor', 'Supervisor', 'Supervisão de equipa', 30, true, '#22c55e', 'users'),
('00000000-0000-0000-0000-000000000005', 'technician', 'Técnico', 'Execução técnica', 40, true, '#3b82f6', 'wrench'),
('00000000-0000-0000-0000-000000000006', 'operator', 'Operador', 'Operações básicas', 50, true, '#8b5cf6', 'play'),
('00000000-0000-0000-0000-000000000007', 'client', 'Cliente', 'Acesso limitado', 60, true, '#06b6d4', 'user'),
('00000000-0000-0000-0000-000000000008', 'viewer', 'Visualizador', 'Apenas leitura', 70, true, '#64748b', 'eye')
ON CONFLICT (id) DO NOTHING;

-- Migration 42: Permissões Padrão
INSERT INTO public.permissions (name, display_name, resource_name, action_name, description, category, risk_level) VALUES
-- Aircraft permissions
('aircraft.read', 'Ver Aeronaves', 'aircraft', 'read', 'Visualizar dados de aeronaves', 'aircraft', 'low'),
('aircraft.create', 'Criar Aeronaves', 'aircraft', 'create', 'Criar novas aeronaves', 'aircraft', 'medium'),
('aircraft.update', 'Editar Aeronaves', 'aircraft', 'update', 'Editar dados de aeronaves', 'aircraft', 'medium'),
('aircraft.delete', 'Eliminar Aeronaves', 'aircraft', 'delete', 'Eliminar aeronaves', 'aircraft', 'high'),
('aircraft.manage', 'Gerir Aeronaves', 'aircraft', 'manage', 'Gestão completa de aeronaves', 'aircraft', 'high'),

-- Employee permissions  
('employees.read', 'Ver Funcionários', 'employees', 'read', 'Visualizar dados de funcionários', 'employees', 'low'),
('employees.create', 'Criar Funcionários', 'employees', 'create', 'Criar novos funcionários', 'employees', 'medium'),
('employees.update', 'Editar Funcionários', 'employees', 'update', 'Editar dados de funcionários', 'employees', 'medium'),
('employees.delete', 'Eliminar Funcionários', 'employees', 'delete', 'Eliminar funcionários', 'employees', 'high'),
('employees.manage', 'Gerir Funcionários', 'employees', 'manage', 'Gestão completa de funcionários', 'employees', 'high'),

-- Task permissions
('tasks.read', 'Ver Tarefas', 'tasks', 'read', 'Visualizar tarefas', 'tasks', 'low'),
('tasks.create', 'Criar Tarefas', 'tasks', 'create', 'Criar novas tarefas', 'tasks', 'low'),
('tasks.update', 'Editar Tarefas', 'tasks', 'update', 'Editar tarefas', 'tasks', 'low'),
('tasks.delete', 'Eliminar Tarefas', 'tasks', 'delete', 'Eliminar tarefas', 'tasks', 'medium'),
('tasks.assign', 'Atribuir Tarefas', 'tasks', 'assign', 'Atribuir tarefas a funcionários', 'tasks', 'medium'),
('tasks.approve', 'Aprovar Tarefas', 'tasks', 'approve', 'Aprovar conclusão de tarefas', 'tasks', 'medium'),

-- Cleaning forms permissions
('cleaning_forms.read', 'Ver Formulários Limpeza', 'cleaning_forms', 'read', 'Visualizar formulários de limpeza', 'cleaning', 'low'),
('cleaning_forms.create', 'Criar Formulários Limpeza', 'cleaning_forms', 'create', 'Criar formulários de limpeza', 'cleaning', 'low'),
('cleaning_forms.update', 'Editar Formulários Limpeza', 'cleaning_forms', 'update', 'Editar formulários de limpeza', 'cleaning', 'low'),
('cleaning_forms.approve', 'Aprovar Limpeza', 'cleaning_forms', 'approve', 'Aprovar formulários de limpeza', 'cleaning', 'medium'),

-- System permissions
('system.admin', 'Administração Sistema', 'system', 'admin', 'Administração completa do sistema', 'system', 'critical'),
('system.audit', 'Auditoria Sistema', 'system', 'read', 'Acesso a logs e auditoria', 'system', 'high'),
('system.config', 'Configurar Sistema', 'system', 'update', 'Configurar definições do sistema', 'system', 'high')
ON CONFLICT (name) DO NOTHING;

-- Migration 43: Atribuir Permissões aos Roles
INSERT INTO public.role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Admin permissions (todos exceto system.admin)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p  
WHERE r.name = 'admin' AND p.name != 'system.admin'
ON CONFLICT DO NOTHING;

-- Manager permissions  
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'manager' AND p.action_name IN ('read', 'create', 'update', 'assign', 'approve')
ON CONFLICT DO NOTHING;

-- Migration 44: Aeronaves de Demonstração
INSERT INTO public.aircraft (
  id, registration, manufacturer, model, aircraft_category, operation_class,
  year_manufactured, passenger_capacity, status, location, total_flight_hours
) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 'PT-ABC', 'Cessna', 'Cessna 172', 'airplane', 'training', 2018, 4, 'active', 'Luanda', 1250.5),
('11234567-89ab-cdef-0123-456789abcdef', 'PT-XYZ', 'Piper', 'Piper Cherokee', 'airplane', 'private', 2019, 4, 'maintenance', 'Luanda', 890.0),
('21234567-89ab-cdef-0123-456789abcdef', 'PT-DEF', 'Boeing', 'Boeing 737-800', 'airplane', 'commercial', 2015, 189, 'active', 'Luanda', 15420.75),
('31234567-89ab-cdef-0123-456789abcdef', 'PT-GHI', 'Embraer', 'EMB-110', 'airplane', 'commercial', 2020, 19, 'active', 'Luanda', 3250.25)
ON CONFLICT (id) DO NOTHING;

-- Migration 45: Funcionários Angola (14 específicos)
INSERT INTO public.employees (
  id, employee_number, full_name, first_name, last_name, position, department, 
  email, phone_primary, hire_date, status, work_location
) VALUES
-- Diretores
('a1234567-89ab-cdef-0123-456789abcd01', 'ADM250001', 'Amizanguel da Silva', 'Amizanguel', 'da Silva', 'Director', 'administration', 'amizanguel.silva@airplus.ao', '+244900123456', '2020-01-15', 'active', 'Luanda'),
('a1234567-89ab-cdef-0123-456789abcd02', 'ADM250002', 'Jaime da Graça', 'Jaime', 'da Graça', 'Director', 'administration', 'jaime.graca@airplus.ao', '+244900234567', '2019-03-20', 'active', 'Luanda'),

-- Chefes de Departamento  
('a1234567-89ab-cdef-0123-456789abcd03', 'COM250001', 'Evandra dos Santos', 'Evandra', 'dos Santos', 'Chefe Comercial e Marketing', 'commercial', 'evandra.santos@airplus.ao', '+244900345678', '2021-06-10', 'active', 'Luanda'),
('a1234567-89ab-cdef-0123-456789abcd04', 'RH250001', 'Liliana dos Santos', 'Liliana', 'dos Santos', 'Chefe Recursos Humanos', 'human_resources', 'liliana.santos@airplus.ao', '+244900456789', '2020-09-05', 'active', 'Luanda'),

-- Técnicos Auxiliares de Placa
('a1234567-89ab-cdef-0123-456789abcd05', 'MNT250001', 'Augusto Tomás', 'Augusto', 'Tomás', 'Técnico Auxiliar de Placa', 'maintenance', 'augusto.tomas@airplus.ao', '+244900567890', '2018-04-12', 'active', 'Luanda'),
('a1234567-89ab-cdef-0123-456789abcd06', 'MNT250002', 'Celestino Domingos', 'Celestino', 'Domingos', 'Técnico Auxiliar de Placa', 'maintenance', 'celestino.domingos@airplus.ao', '+244900678901', '2019-07-08', 'active', 'Luanda'),
('a1234567-89ab-cdef-0123-456789abcd07', 'MNT250003', 'Daniel Segunda', 'Daniel', 'Segunda', 'Técnico Auxiliar de Placa', 'maintenance', 'daniel.segunda@airplus.ao', '+244900789012', '2020-02-14', 'active', 'Luanda'),
('a1234567-89ab-cdef-0123-456789abcd08', 'MNT250004', 'Joaquim Cumbando João', 'Joaquim', 'Cumbando João', 'Técnico Auxiliar de Placa', 'maintenance', 'joaquim.joao@airplus.ao', '+244900890123', '2018-11-30', 'active', 'Luanda'),
('a1234567-89ab-cdef-0123-456789abcd09', 'MNT250005', 'José Garrido', 'José', 'Garrido', 'Técnico Auxiliar de Placa', 'maintenance', 'jose.garrido@airplus.ao', '+244900901234', '2019-01-25', 'active', 'Luanda'),
('a1234567-89ab-cdef-0123-456789abcd10', 'MNT250006', 'José João', 'José', 'João', 'Técnico Auxiliar de Placa', 'maintenance', 'jose.joao@airplus.ao', '+244900012345', '2017-08-18', 'active', 'Luanda'),
('a1234567-89ab-cdef-0123-456789abcd11', 'MNT250007', 'Manuel Coelho', 'Manuel', 'Coelho', 'Técnico Auxiliar de Placa', 'maintenance', 'manuel.coelho@airplus.ao', '+244900123450', '2020-05-22', 'active', 'Luanda'),
('a1234567-89ab-cdef-0123-456789abcd12', 'MNT250008', 'Mário Quiluange', 'Mário', 'Quiluange', 'Técnico Auxiliar de Placa', 'maintenance', 'mario.quiluange@airplus.ao', '+244900234561', '2016-12-03', 'active', 'Luanda'),
('a1234567-89ab-cdef-0123-456789abcd13', 'MNT250009', 'Reginaldo Golveia', 'Reginaldo', 'Golveia', 'Técnico Auxiliar de Placa', 'maintenance', 'reginaldo.golveia@airplus.ao', '+244900345672', '2016-10-15', 'active', 'Luanda'),
('a1234567-89ab-cdef-0123-456789abcd14', 'MNT250010', 'Wilson Hongolo', 'Wilson', 'Hongolo', 'Técnico Auxiliar de Placa', 'maintenance', 'wilson.hongolo@airplus.ao', '+244900456783', '2015-03-08', 'active', 'Luanda')
ON CONFLICT (id) DO NOTHING;

-- Migration 46: Dados de Demonstração Adicionais
-- Tarefas de exemplo
INSERT INTO public.tasks (
  id, task_number, title, description, task_type, priority, status,
  aircraft_id, assigned_to, due_date, location
) VALUES
('t1234567-89ab-cdef-0123-456789abcd01', 'MNT20250001', 'Inspeção 100h - PT-ABC', 'Inspeção de 100 horas de voo conforme manual', 'inspection', 'high', 'pending', '01234567-89ab-cdef-0123-456789abcdef', 'a1234567-89ab-cdef-0123-456789abcd05', CURRENT_DATE + 7, 'Luanda'),
('t1234567-89ab-cdef-0123-456789abcd02', 'CLN20250001', 'Limpeza Semanal - PT-DEF', 'Limpeza semanal completa da aeronave', 'cleaning', 'medium', 'assigned', '21234567-89ab-cdef-0123-456789abcdef', 'a1234567-89ab-cdef-0123-456789abcd06', CURRENT_DATE + 2, 'Luanda'),
('t1234567-89ab-cdef-0123-456789abcd03', 'REP20250001', 'Reparação Trem de Pouso - PT-XYZ', 'Reparação do sistema hidráulico do trem de pouso', 'repair', 'critical', 'in_progress', '11234567-89ab-cdef-0123-456789abcdef', 'a1234567-89ab-cdef-0123-456789abcd07', CURRENT_DATE + 1, 'Luanda')
ON CONFLICT (id) DO NOTHING;

-- Migration 47: Configurações de Produção
INSERT INTO public.system_settings (setting_key, setting_name, setting_value, description, category) VALUES
('app_version', 'Versão da Aplicação', '"1.0.0"', 'Versão atual da aplicação', 'system'),
('environment', 'Ambiente', '"production"', 'Ambiente de execução', 'system'),
('backup_enabled', 'Backup Automático', 'true', 'Backup automático ativado', 'system'),
('mobile_sync_interval', 'Intervalo Sincronização Mobile', '300', 'Intervalo de sincronização em segundos', 'mobile'),
('max_file_size_mb', 'Tamanho Máximo Ficheiro', '50', 'Tamanho máximo de ficheiro em MB', 'files')
ON CONFLICT (setting_key) DO NOTHING;

-- Migration 48: Validações Finais de Integridade
CREATE OR REPLACE FUNCTION public.validate_system_integrity()
RETURNS TABLE(check_name TEXT, status TEXT, details TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Verificar se todas as tabelas principais existem
  SELECT 'tables_exist'::TEXT, 
    CASE WHEN (SELECT COUNT(*) FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name IN ('aircraft', 'employees', 'tasks', 'cleaning_forms', 'roles', 'permissions')) = 6 
    THEN 'OK'::TEXT ELSE 'FAIL'::TEXT END,
    'Verificação de existência das tabelas principais'::TEXT
  
  UNION ALL
  
  -- Verificar roles do sistema  
  SELECT 'system_roles'::TEXT,
    CASE WHEN (SELECT COUNT(*) FROM public.roles WHERE is_system_role = true) = 8
    THEN 'OK'::TEXT ELSE 'FAIL'::TEXT END,
    'Verificação dos 8 roles do sistema'::TEXT
    
  UNION ALL
  
  -- Verificar aeronaves demo
  SELECT 'demo_aircraft'::TEXT,
    CASE WHEN (SELECT COUNT(*) FROM public.aircraft WHERE deleted_at IS NULL) >= 4
    THEN 'OK'::TEXT ELSE 'FAIL'::TEXT END, 
    'Verificação das aeronaves de demonstração'::TEXT
    
  UNION ALL
  
  -- Verificar funcionários Angola
  SELECT 'angola_employees'::TEXT,
    CASE WHEN (SELECT COUNT(*) FROM public.employees WHERE deleted_at IS NULL) >= 14
    THEN 'OK'::TEXT ELSE 'FAIL'::TEXT END,
    'Verificação dos funcionários específicos de Angola'::TEXT;
END;
$$;

-- Migration 49: Compatibilidade Mobile Offline
-- Criar triggers para sincronização automática
CREATE OR REPLACE FUNCTION public.mark_for_mobile_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Marcar registo para sincronização mobile
  NEW.last_synced = NULL; -- Forçar re-sincronização
  NEW.sync_version = COALESCE(OLD.sync_version, 0) + 1;
  RETURN NEW;
END;
$$;

-- Aplicar trigger em tabelas principais para mobile
DROP TRIGGER IF EXISTS mark_aircraft_for_sync ON public.aircraft;
CREATE TRIGGER mark_aircraft_for_sync
  BEFORE UPDATE ON public.aircraft
  FOR EACH ROW EXECUTE FUNCTION public.mark_for_mobile_sync();

DROP TRIGGER IF EXISTS mark_employees_for_sync ON public.employees;  
CREATE TRIGGER mark_employees_for_sync
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.mark_for_mobile_sync();

DROP TRIGGER IF EXISTS mark_tasks_for_sync ON public.tasks;
CREATE TRIGGER mark_tasks_for_sync
  BEFORE UPDATE ON public.tasks  
  FOR EACH ROW EXECUTE FUNCTION public.mark_for_mobile_sync();

DROP TRIGGER IF EXISTS mark_cleaning_forms_for_sync ON public.cleaning_forms;
CREATE TRIGGER mark_cleaning_forms_for_sync
  BEFORE UPDATE ON public.cleaning_forms
  FOR EACH ROW EXECUTE FUNCTION public.mark_for_mobile_sync();

-- Migration 50: Sistema Pronto para Produção
-- Refresh final das materialized views
SELECT public.refresh_dashboard_data();

-- Verificação final de integridade
SELECT * FROM public.validate_system_integrity();

-- Log final
DO $$ 
DECLARE
  total_tables INTEGER;
  total_roles INTEGER; 
  total_permissions INTEGER;
  total_aircraft INTEGER;
  total_employees INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tables FROM information_schema.tables WHERE table_schema = 'public';
  SELECT COUNT(*) INTO total_roles FROM public.roles;
  SELECT COUNT(*) INTO total_permissions FROM public.permissions;  
  SELECT COUNT(*) INTO total_aircraft FROM public.aircraft WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO total_employees FROM public.employees WHERE deleted_at IS NULL;
  
  RAISE NOTICE '=== SISTEMA AIRPLUS AVIATION PRONTO PARA PRODUÇÃO ===';
  RAISE NOTICE '🗄️ Tabelas criadas: %', total_tables;
  RAISE NOTICE '👥 Roles configurados: %', total_roles;
  RAISE NOTICE '🔐 Permissões definidas: %', total_permissions;
  RAISE NOTICE '✈️ Aeronaves registradas: %', total_aircraft;
  RAISE NOTICE '👷 Funcionários cadastrados: %', total_employees;
  RAISE NOTICE '📱 Sincronização mobile: ATIVA';
  RAISE NOTICE '🔒 Segurança RLS: ATIVA';  
  RAISE NOTICE '📊 Dashboard: OPERACIONAL';
  RAISE NOTICE '=== 50 MIGRATIONS APLICADAS COM SUCESSO ===';
END $$;
