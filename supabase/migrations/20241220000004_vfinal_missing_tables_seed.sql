-- =========================================================================
-- AirPlus Aviation - DADOS DE SEED PARA TABELAS EM FALTA
-- Migration: 20241220000004_vfinal_missing_tables_seed.sql
-- Version: VFINAL
-- Description: Dados iniciais para as tabelas que faltavam no sistema
-- =========================================================================

-- =========================================================================
-- TIPOS DE INTERVENÇÃO
-- =========================================================================

INSERT INTO public.intervention_types (id, name, description, is_active, "order") VALUES
('10000000-0000-0000-0000-000000000001', 'Limpeza Exterior', 'Limpeza completa da parte externa da aeronave', true, 1),
('10000000-0000-0000-0000-000000000002', 'Limpeza Interior', 'Limpeza completa da cabine e interior da aeronave', true, 2),
('10000000-0000-0000-0000-000000000003', 'Polimento', 'Polimento da fuselagem e superfícies metálicas', true, 3),
('10000000-0000-0000-0000-000000000004', 'Lavagem Profunda Durante a Manutenção de Base', 'Limpeza detalhada realizada durante check de manutenção', true, 4),
('10000000-0000-0000-0000-000000000005', 'Limpeza de Emergência', 'Limpeza rápida em situações de emergência', true, 5),
('10000000-0000-0000-0000-000000000006', 'Desinfecção', 'Processo de desinfecção completa da aeronave', true, 6),
('10000000-0000-0000-0000-000000000007', 'Limpeza Pós-Voo', 'Limpeza de rotina após cada voo', true, 7),
('10000000-0000-0000-0000-000000000008', 'Preparação para Inspeção', 'Limpeza especializada para inspeções técnicas', true, 8)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    "order" = EXCLUDED."order",
    updated_at = NOW();

-- =========================================================================
-- CONFIGURAÇÕES DE TURNOS
-- =========================================================================

INSERT INTO public.shift_configs (id, name, display_name, start_time, end_time, is_active, "order") VALUES
('20000000-0000-0000-0000-000000000001', 'morning', 'Turno da Manhã', '06:00:00', '14:00:00', true, 1),
('20000000-0000-0000-0000-000000000002', 'afternoon', 'Turno da Tarde', '14:00:00', '22:00:00', true, 2),
('20000000-0000-0000-0000-000000000003', 'night', 'Turno da Noite', '22:00:00', '06:00:00', true, 3),
('20000000-0000-0000-0000-000000000004', 'extended_morning', 'Manhã Estendida', '05:00:00', '15:00:00', true, 4),
('20000000-0000-0000-0000-000000000005', 'extended_night', 'Noite Estendida', '20:00:00', '08:00:00', true, 5),
('20000000-0000-0000-0000-000000000006', 'weekend_day', 'Fim de Semana - Dia', '08:00:00', '20:00:00', true, 6),
('20000000-0000-0000-0000-000000000007', 'emergency', 'Plantão Emergência', '00:00:00', '23:59:00', true, 7)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    is_active = EXCLUDED.is_active,
    "order" = EXCLUDED."order",
    updated_at = NOW();

-- =========================================================================
-- CONFIGURAÇÕES DE LOCALIZAÇÃO
-- =========================================================================

INSERT INTO public.location_configs (id, name, description, is_active, "order") VALUES
('30000000-0000-0000-0000-000000000001', 'Hangar 1', 'Hangar principal para manutenção e limpeza pesada', true, 1),
('30000000-0000-0000-0000-000000000002', 'Hangar 2', 'Hangar secundário para operações de limpeza', true, 2),
('30000000-0000-0000-0000-000000000003', 'Hangar 3', 'Hangar de apoio para limpeza menor', true, 3),
('30000000-0000-0000-0000-000000000004', 'Rampa A', 'Rampa Norte do aeroporto', true, 4),
('30000000-0000-0000-0000-000000000005', 'Rampa B', 'Rampa Central do aeroporto', true, 5),
('30000000-0000-0000-0000-000000000006', 'Rampa C', 'Rampa Sul do aeroporto', true, 6),
('30000000-0000-0000-0000-000000000007', 'Terminal', 'Área próxima ao terminal de passageiros', true, 7),
('30000000-0000-0000-0000-000000000008', 'Zona de Manutenção', 'Área específica para manutenção programada', true, 8),
('30000000-0000-0000-0000-000000000009', 'Pátio VIP', 'Área reservada para aeronaves VIP', true, 9),
('30000000-0000-0000-0000-000000000010', 'Hangar de Manutenção', 'Hangar especializado em manutenção pesada', true, 10),
('30000000-0000-0000-0000-000000000011', 'Estacionamento Remoto', 'Área de estacionamento distante do terminal', true, 11),
('30000000-0000-0000-0000-000000000012', 'Zona de Carga', 'Área dedicada a aeronaves de carga', true, 12)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    "order" = EXCLUDED."order",
    updated_at = NOW();

-- =========================================================================
-- PERMISSÕES DO SISTEMA
-- =========================================================================

INSERT INTO public.permissions (id, name, resource, action, description) VALUES
-- Aircraft permissions
('40000000-0000-0000-0000-000000000001', 'aircraft_read', 'aircraft', 'read', 'Visualizar aeronaves'),
('40000000-0000-0000-0000-000000000002', 'aircraft_create', 'aircraft', 'create', 'Criar aeronaves'),
('40000000-0000-0000-0000-000000000003', 'aircraft_update', 'aircraft', 'update', 'Atualizar aeronaves'),
('40000000-0000-0000-0000-000000000004', 'aircraft_delete', 'aircraft', 'delete', 'Excluir aeronaves'),

-- Employee permissions
('40000000-0000-0000-0000-000000000005', 'employees_read', 'employees', 'read', 'Visualizar funcionários'),
('40000000-0000-0000-0000-000000000006', 'employees_create', 'employees', 'create', 'Criar funcionários'),
('40000000-0000-0000-0000-000000000007', 'employees_update', 'employees', 'update', 'Atualizar funcionários'),
('40000000-0000-0000-0000-000000000008', 'employees_delete', 'employees', 'delete', 'Excluir funcionários'),

-- Cleaning forms permissions
('40000000-0000-0000-0000-000000000009', 'cleaning_forms_read', 'cleaning_forms', 'read', 'Visualizar formulários de limpeza'),
('40000000-0000-0000-0000-000000000010', 'cleaning_forms_create', 'cleaning_forms', 'create', 'Criar formulários de limpeza'),
('40000000-0000-0000-0000-000000000011', 'cleaning_forms_update', 'cleaning_forms', 'update', 'Atualizar formulários de limpeza'),
('40000000-0000-0000-0000-000000000012', 'cleaning_forms_delete', 'cleaning_forms', 'delete', 'Excluir formulários de limpeza'),

-- Tasks permissions
('40000000-0000-0000-0000-000000000013', 'tasks_read', 'tasks', 'read', 'Visualizar tarefas'),
('40000000-0000-0000-0000-000000000014', 'tasks_create', 'tasks', 'create', 'Criar tarefas'),
('40000000-0000-0000-0000-000000000015', 'tasks_update', 'tasks', 'update', 'Atualizar tarefas'),
('40000000-0000-0000-0000-000000000016', 'tasks_delete', 'tasks', 'delete', 'Excluir tarefas'),

-- System configuration permissions
('40000000-0000-0000-0000-000000000017', 'system_config', 'system', 'configure', 'Configurar sistema'),
('40000000-0000-0000-0000-000000000018', 'users_manage', 'users', 'manage', 'Gerenciar usuários e permissões'),
('40000000-0000-0000-0000-000000000019', 'reports_generate', 'reports', 'generate', 'Gerar relatórios'),
('40000000-0000-0000-0000-000000000020', 'logs_view', 'logs', 'view', 'Visualizar logs do sistema')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    description = EXCLUDED.description;

-- =========================================================================
-- ASSOCIAR PERMISSÕES AOS ROLES
-- =========================================================================

-- Admin - Todas as permissões
INSERT INTO public.role_permissions (role_id, permission_id) 
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Supervisor - Permissões de leitura e gestão operacional
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'supervisor' 
AND p.name IN (
    'aircraft_read', 'aircraft_update',
    'employees_read', 'employees_update',
    'cleaning_forms_read', 'cleaning_forms_create', 'cleaning_forms_update',
    'tasks_read', 'tasks_create', 'tasks_update',
    'reports_generate'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Operacional - Permissões de operação básica
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'operacional' 
AND p.name IN (
    'aircraft_read',
    'employees_read',
    'cleaning_forms_read', 'cleaning_forms_create', 'cleaning_forms_update',
    'tasks_read', 'tasks_update'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Cliente - Apenas leitura limitada
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'cliente' 
AND p.name IN (
    'aircraft_read',
    'cleaning_forms_read',
    'tasks_read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =========================================================================
-- CONFIGURAÇÕES DO SISTEMA ADICIONAIS
-- =========================================================================

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public) VALUES
-- Configurações de evidência fotográfica
('photo_evidence_settings', '{"maxPhotosPerForm": 20, "maxFileSize": 10485760, "allowedTypes": ["jpg", "jpeg", "png"], "requireGPS": false, "autoUpload": true}', 'Configurações para evidência fotográfica', false),

-- Configurações de notificações
('notification_settings', '{"enabled": true, "emailNotifications": true, "pushNotifications": true, "reminderInterval": 24, "urgentTasksOnly": false}', 'Configurações do sistema de notificações', false),

-- Configurações de QR codes
('qr_code_settings', '{"enabled": true, "expirationDays": 30, "includeLogo": true, "errorCorrection": "M"}', 'Configurações para códigos QR', false),

-- Configurações de auditoria
('audit_settings', '{"enabled": true, "logRetentionDays": 365, "detailedLogging": true, "logUserActivity": true}', 'Configurações de auditoria e logs', false),

-- Configurações de sincronização
('sync_settings', '{"autoSync": true, "syncInterval": 300, "maxRetries": 3, "offlineMode": true}', 'Configurações de sincronização de dados', false)

ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    updated_at = NOW();

-- =========================================================================
-- DADOS DEMO PARA EVIDÊNCIA FOTOGRÁFICA (Opcional)
-- =========================================================================

-- Inserir evidências fotográficas para os formulários existentes
INSERT INTO public.photo_evidence (id, form_id, type, category, description, location, timestamp, captured_by, captured_by_user_id) VALUES
('50000000-0000-0000-0000-000000000001', '01234567-89ab-cdef-0123-456789abcd30', 'before', 'exterior', 'Estado inicial da fuselagem', 'Hangar 1', '2024-01-20T09:30:00Z', 'Ana Rodrigues', '01234567-89ab-cdef-0123-456789abcd03'),
('50000000-0000-0000-0000-000000000002', '01234567-89ab-cdef-0123-456789abcd30', 'after', 'exterior', 'Fuselagem após limpeza completa', 'Hangar 1', '2024-01-20T12:00:00Z', 'Ana Rodrigues', '01234567-89ab-cdef-0123-456789abcd03'),
('50000000-0000-0000-0000-000000000003', '01234567-89ab-cdef-0123-456789abcd31', 'before', 'interior', 'Cabine antes da limpeza', 'Rampa A', '2024-01-22T07:45:00Z', 'Lucia Costa', '01234567-89ab-cdef-0123-456789abcd06'),
('50000000-0000-0000-0000-000000000004', '01234567-89ab-cdef-0123-456789abcd32', 'before', 'details', 'Detalhes do trem de pouso', 'Zona de Manutenção', '2024-01-18T13:30:00Z', 'Carlos Lima', '01234567-89ab-cdef-0123-456789abcd02'),
('50000000-0000-0000-0000-000000000005', '01234567-89ab-cdef-0123-456789abcd32', 'after', 'details', 'Trem de pouso após tratamento anticorrosão', 'Zona de Manutenção', '2024-01-18T15:45:00Z', 'Carlos Lima', '01234567-89ab-cdef-0123-456789abcd02')
ON CONFLICT (id) DO UPDATE SET
    form_id = EXCLUDED.form_id,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    location = EXCLUDED.location,
    timestamp = EXCLUDED.timestamp,
    captured_by = EXCLUDED.captured_by,
    captured_by_user_id = EXCLUDED.captured_by_user_id,
    updated_at = NOW();

-- =========================================================================
-- ASSOCIAÇÕES DE FUNCIONÁRIOS EM FORMULÁRIOS
-- =========================================================================

INSERT INTO public.cleaning_form_employees (cleaning_form_id, employee_id, role_in_form) VALUES
-- Formulário LMP-001-2024
('01234567-89ab-cdef-0123-456789abcd30', '01234567-89ab-cdef-0123-456789abcd03', 'supervisor'),
('01234567-89ab-cdef-0123-456789abcd30', '01234567-89ab-cdef-0123-456789abcd06', 'technician'),
('01234567-89ab-cdef-0123-456789abcd30', 'a1234567-89ab-cdef-0123-456789abcd05', 'assistant'),

-- Formulário LMP-002-2024
('01234567-89ab-cdef-0123-456789abcd31', '01234567-89ab-cdef-0123-456789abcd03', 'supervisor'),
('01234567-89ab-cdef-0123-456789abcd31', '01234567-89ab-cdef-0123-456789abcd06', 'technician'),

-- Formulário LMP-003-2024
('01234567-89ab-cdef-0123-456789abcd32', '01234567-89ab-cdef-0123-456789abcd03', 'supervisor'),
('01234567-89ab-cdef-0123-456789abcd32', '01234567-89ab-cdef-0123-456789abcd06', 'technician'),
('01234567-89ab-cdef-0123-456789abcd32', '01234567-89ab-cdef-0123-456789abcd02', 'specialist')
ON CONFLICT (cleaning_form_id, employee_id) DO UPDATE SET
    role_in_form = EXCLUDED.role_in_form;

-- =========================================================================
-- CÓDIGOS QR PARA AERONAVES
-- =========================================================================

INSERT INTO public.qr_codes (id, entity_type, entity_id, qr_code, qr_data, is_active) VALUES
('60000000-0000-0000-0000-000000000001', 'aircraft', '01234567-89ab-cdef-0123-456789abcdef', 'QR-AIR-2024-123456', '{"registration": "PT-ABC", "model": "Cessna 172", "id": "01234567-89ab-cdef-0123-456789abcdef"}', true),
('60000000-0000-0000-0000-000000000002', 'aircraft', '11234567-89ab-cdef-0123-456789abcdef', 'QR-AIR-2024-234567', '{"registration": "PT-XYZ", "model": "Piper Cherokee", "id": "11234567-89ab-cdef-0123-456789abcdef"}', true),
('60000000-0000-0000-0000-000000000003', 'aircraft', '21234567-89ab-cdef-0123-456789abcdef', 'QR-AIR-2024-345678', '{"registration": "PT-DEF", "model": "Boeing 737-800", "id": "21234567-89ab-cdef-0123-456789abcdef"}', true),
('60000000-0000-0000-0000-000000000004', 'aircraft', '31234567-89ab-cdef-0123-456789abcdef', 'QR-AIR-2024-456789', '{"registration": "PT-GHI", "model": "Embraer EMB-110", "id": "31234567-89ab-cdef-0123-456789abcdef"}', true)
ON CONFLICT (id) DO UPDATE SET
    qr_code = EXCLUDED.qr_code,
    qr_data = EXCLUDED.qr_data,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- =========================================================================
-- NOTIFICAÇÕES DE EXEMPLO
-- =========================================================================

INSERT INTO public.notifications (id, user_id, title, message, type, priority) VALUES
('70000000-0000-0000-0000-000000000001', 'a1234567-89ab-cdef-0123-456789abcd01', 'Sistema Atualizado', 'O sistema foi atualizado com novas funcionalidades. Verifique as novidades.', 'info', 'normal'),
('70000000-0000-0000-0000-000000000002', 'a1234567-89ab-cdef-0123-456789abcd03', 'Tarefa Pendente', 'Você tem tarefas pendentes que precisam ser concluídas hoje.', 'warning', 'high'),
('70000000-0000-0000-0000-000000000003', 'a1234567-89ab-cdef-0123-456789abcd02', 'Inspeção Agendada', 'Inspeção de 100h agendada para PT-ABC na próxima semana.', 'info', 'normal')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    type = EXCLUDED.type,
    priority = EXCLUDED.priority;

-- =========================================================================
-- HISTÓRICO DE MIGRAÇÕES
-- =========================================================================

INSERT INTO public.migration_history (version, name, description, applied_at, success) VALUES
('20241220000001', 'Initial Production Schema', 'Schema inicial de produção com tabelas principais', '2024-12-20T00:00:01Z', true),
('20241220000002', 'Production Seed Data', 'Dados iniciais de produção baseados em dados reais', '2024-12-20T00:00:02Z', true),
('20241220000003', 'Missing Tables VFINAL', 'Adição de tabelas essenciais que faltavam no sistema', '2024-12-20T00:00:03Z', true),
('20241220000004', 'Missing Tables Seed Data', 'Dados iniciais para as tabelas que faltavam', NOW(), true)
ON CONFLICT (version) DO UPDATE SET
    applied_at = EXCLUDED.applied_at,
    success = EXCLUDED.success;

-- =========================================================================
-- VALIDAÇÃO FINAL
-- =========================================================================

DO $$
DECLARE 
    total_intervention_types INTEGER;
    total_shift_configs INTEGER;
    total_location_configs INTEGER;
    total_permissions INTEGER;
    total_role_permissions INTEGER;
    total_photo_evidence INTEGER;
    total_qr_codes INTEGER;
    total_notifications INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_intervention_types FROM public.intervention_types;
    SELECT COUNT(*) INTO total_shift_configs FROM public.shift_configs;
    SELECT COUNT(*) INTO total_location_configs FROM public.location_configs;
    SELECT COUNT(*) INTO total_permissions FROM public.permissions;
    SELECT COUNT(*) INTO total_role_permissions FROM public.role_permissions;
    SELECT COUNT(*) INTO total_photo_evidence FROM public.photo_evidence;
    SELECT COUNT(*) INTO total_qr_codes FROM public.qr_codes;
    SELECT COUNT(*) INTO total_notifications FROM public.notifications;
    
    RAISE NOTICE 'VFINAL MISSING TABLES SEED DATA LOADED:';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Intervention Types: %', total_intervention_types;
    RAISE NOTICE 'Shift Configs: %', total_shift_configs;
    RAISE NOTICE 'Location Configs: %', total_location_configs;
    RAISE NOTICE 'Permissions: %', total_permissions;
    RAISE NOTICE 'Role Permissions: %', total_role_permissions;
    RAISE NOTICE 'Photo Evidence: %', total_photo_evidence;
    RAISE NOTICE 'QR Codes: %', total_qr_codes;
    RAISE NOTICE 'Notifications: %', total_notifications;
    RAISE NOTICE 'Sistema completo pronto para produção!';
END $$;

-- Atualizar versão final dos dados de seed
INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
VALUES ('seed_data_version', '"vfinal_complete"', 'Versão completa dos dados de seed', false)
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = '"vfinal_complete"',
    updated_at = NOW();

SELECT 'VFINAL Missing Tables Seed Data Loaded Successfully - Sistema Completo!' as status;
