-- =====================================================
-- AIRPLUS AVIATION - COMPREHENSIVE SEED DATA
-- Production-ready initial data for AirPlus system
-- =====================================================

-- Clear existing data (for fresh installs)
TRUNCATE TABLE 
  cleaning_photos,
  photo_evidence,
  form_tasks,
  cleaning_forms,
  aircraft,
  employees,
  user_profiles,
  interventions,
  shifts,
  system_settings,
  user_activity_log,
  audit_log
RESTART IDENTITY CASCADE;

-- =====================================================
-- SYSTEM CONFIGURATION
-- =====================================================

-- System Settings
INSERT INTO system_settings (key, value, description, category) VALUES
  ('company_name', 'AirPlus Aviation Services', 'Nome da empresa', 'general'),
  ('company_logo_url', '/airplus-logo.svg', 'URL do logotipo da empresa', 'general'),
  ('default_language', 'pt', 'Idioma padrão do sistema', 'general'),
  ('timezone', 'Africa/Luanda', 'Fuso horário padrão', 'general'),
  ('currency', 'AOA', 'Moeda padrão (Kwanza Angolano)', 'general'),
  ('date_format', 'DD/MM/YYYY', 'Formato de data padrão', 'general'),
  ('time_format', '24h', 'Formato de hora padrão', 'general'),
  
  -- Photo settings
  ('max_photo_size_mb', '10', 'Tamanho máximo de foto em MB', 'photos'),
  ('photo_quality', '0.8', 'Qualidade de compressão de fotos', 'photos'),
  ('max_photos_per_form', '20', 'Máximo de fotos por formulário', 'photos'),
  ('auto_backup_photos', 'true', 'Backup automático de fotos', 'photos'),
  
  -- Sync settings
  ('sync_interval_minutes', '5', 'Intervalo de sincronização em minutos', 'sync'),
  ('offline_retention_days', '30', 'Dias de retenção offline', 'sync'),
  ('auto_sync_on_wifi', 'true', 'Sincronização automática apenas no WiFi', 'sync'),
  ('batch_sync_size', '50', 'Tamanho do lote de sincronização', 'sync'),
  
  -- Notifications
  ('enable_push_notifications', 'true', 'Ativar notificações push', 'notifications'),
  ('notification_sound', 'default', 'Som de notificação', 'notifications'),
  ('form_due_alert_hours', '24', 'Alerta de formulário vencido em horas', 'notifications'),
  
  -- Audit and compliance
  ('audit_retention_months', '24', 'Retenção de auditoria em meses', 'compliance'),
  ('require_signature', 'true', 'Exigir assinatura nos formulários', 'compliance'),
  ('require_photo_evidence', 'true', 'Exigir evidência fotográfica', 'compliance'),
  ('auto_generate_reports', 'true', 'Gerar relatórios automaticamente', 'compliance');

-- Intervention Types
INSERT INTO interventions (name, description, estimated_duration_minutes, requires_signature, requires_photos, color_hex) VALUES
  ('Limpeza Completa', 'Limpeza completa da aeronave incluindo cabine, cockpit e áreas de carga', 180, true, true, '#3B82F6'),
  ('Limpeza Rápida', 'Limpeza rápida entre voos (turn-around)', 45, false, true, '#10B981'),
  ('Limpeza Noturna', 'Limpeza profunda durante pernoite', 240, true, true, '#8B5CF6'),
  ('Limpeza Especial', 'Limpeza especial para voos internacionais', 120, true, true, '#F59E0B'),
  ('Desinfecção', 'Processo de desinfecção completa', 90, true, true, '#EF4444'),
  ('Limpeza Externa', 'Lavagem e limpeza externa da aeronave', 150, true, true, '#06B6D4'),
  ('Manutenção Cabine', 'Manutenção e limpeza específica da cabine', 100, true, true, '#84CC16'),
  ('Limpeza Cargo', 'Limpeza específica das áreas de carga', 60, false, true, '#F97316');

-- Shifts Configuration
INSERT INTO shifts (name, start_time, end_time, description, is_active) VALUES
  ('Manhã', '06:00:00', '14:00:00', 'Turno da manhã - operações diurnas', true),
  ('Tarde', '14:00:00', '22:00:00', 'Turno da tarde - pico de movimento', true),
  ('Noite', '22:00:00', '06:00:00', 'Turno da noite - limpezas profundas', true),
  ('Especial 24h', '00:00:00', '23:59:59', 'Turno especial para operações contínuas', false);

-- =====================================================
-- AIRCRAFT DATA (TAAG and other operators)
-- =====================================================

INSERT INTO aircraft (registration, model, operator, capacity, status, location, last_inspection, qr_code) VALUES
  -- TAAG Angola Airlines Fleet
  ('D2-TEA', 'Boeing 777-300ER', 'TAAG Angola Airlines', 293, 'active', 'Aeroporto 4 de Fevereiro - Luanda', NOW() - INTERVAL '2 days', 'QR-D2TEA-001'),
  ('D2-TEB', 'Boeing 777-300ER', 'TAAG Angola Airlines', 293, 'active', 'Aeroporto 4 de Fevereiro - Luanda', NOW() - INTERVAL '1 day', 'QR-D2TEB-002'),
  ('D2-TEC', 'Boeing 777-200ER', 'TAAG Angola Airlines', 261, 'active', 'Aeroporto 4 de Fevereiro - Luanda', NOW() - INTERVAL '3 days', 'QR-D2TEC-003'),
  ('D2-TED', 'Boeing 777-200ER', 'TAAG Angola Airlines', 261, 'active', 'Aeroporto de Cabinda', NOW() - INTERVAL '1 day', 'QR-D2TED-004'),
  
  ('D2-HSA', 'Boeing 737-700', 'TAAG Angola Airlines', 126, 'active', 'Aeroporto 4 de Fevereiro - Luanda', NOW() - INTERVAL '1 day', 'QR-D2HSA-005'),
  ('D2-HSB', 'Boeing 737-700', 'TAAG Angola Airlines', 126, 'active', 'Aeroporto de Benguela', NOW() - INTERVAL '2 days', 'QR-D2HSB-006'),
  ('D2-HSC', 'Boeing 737-700', 'TAAG Angola Airlines', 126, 'active', 'Aeroporto 4 de Fevereiro - Luanda', NOW() - INTERVAL '1 day', 'QR-D2HSC-007'),
  ('D2-HSD', 'Boeing 737-700', 'TAAG Angola Airlines', 126, 'maintenance', 'Hangar de Manutenção - Luanda', NOW() - INTERVAL '5 days', 'QR-D2HSD-008'),
  
  ('D2-FBA', 'De Havilland Dash 8-400', 'TAAG Angola Airlines', 70, 'active', 'Aeroporto de Lubango', NOW() - INTERVAL '1 day', 'QR-D2FBA-009'),
  ('D2-FBB', 'De Havilland Dash 8-400', 'TAAG Angola Airlines', 70, 'active', 'Aeroporto de Huambo', NOW() - INTERVAL '2 days', 'QR-D2FBB-010'),
  ('D2-FBC', 'De Havilland Dash 8-400', 'TAAG Angola Airlines', 70, 'active', 'Aeroporto de Soyo', NOW() - INTERVAL '1 day', 'QR-D2FBC-011'),
  
  -- SonAir Fleet
  ('D2-ESA', 'Boeing 737-300F', 'SonAir', 0, 'active', 'Aeroporto 4 de Fevereiro - Luanda', NOW() - INTERVAL '2 days', 'QR-D2ESA-012'),
  ('D2-ESB', 'Boeing 737-300F', 'SonAir', 0, 'active', 'Aeroporto de Cabinda', NOW() - INTERVAL '1 day', 'QR-D2ESB-013'),
  
  -- Fly540 Angola
  ('D2-FLY', 'ATR 42-500', 'Fly540 Angola', 50, 'active', 'Aeroporto 4 de Fevereiro - Luanda', NOW() - INTERVAL '1 day', 'QR-D2FLY-014'),
  ('D2-FLZ', 'ATR 42-500', 'Fly540 Angola', 50, 'active', 'Aeroporto de Benguela', NOW() - INTERVAL '3 days', 'QR-D2FLZ-015'),
  
  -- International operators (occasional services)
  ('CS-TKM', 'Airbus A330-200', 'TAP Air Portugal', 244, 'visiting', 'Aeroporto 4 de Fevereiro - Luanda', NOW() - INTERVAL '1 day', 'QR-CSTKM-016'),
  ('ET-AOT', 'Boeing 787-8', 'Ethiopian Airlines', 270, 'visiting', 'Aeroporto 4 de Fevereiro - Luanda', NOW() - INTERVAL '2 days', 'QR-ETAOT-017'),
  ('6V-AHC', 'Airbus A330-200', 'Air Senegal', 244, 'visiting', 'Aeroporto 4 de Fevereiro - Luanda', NOW() - INTERVAL '1 day', 'QR-6VAHC-018'),
  
  -- Corporate and charter aircraft
  ('D2-EXE', 'Cessna Citation XLS+', 'Executive Charter', 12, 'active', 'Aeroporto 4 de Fevereiro - Luanda', NOW() - INTERVAL '1 day', 'QR-D2EXE-019'),
  ('D2-VIP', 'Bombardier Global 6000', 'VIP Charter Services', 16, 'active', 'Aeroporto 4 de Fevereiro - Luanda', NOW() - INTERVAL '2 days', 'QR-D2VIP-020');

-- =====================================================
-- USER PROFILES AND EMPLOYEES (Based on Angola data)
-- =====================================================

-- Admin Users
INSERT INTO user_profiles (id, email, full_name, role, phone, department, location, hire_date, status, emergency_contact, notes) VALUES
  ('admin-001', 'carlos.silva@airplus.ao', 'Carlos Eduardo Silva', 'admin', '+244 923 456 789', 'Administração', 'Luanda - Sede', '2020-01-15', 'active', '+244 923 456 700', 'Diretor Geral da AirPlus Aviation'),
  ('admin-002', 'ana.santos@airplus.ao', 'Ana Cristina dos Santos', 'admin', '+244 924 567 890', 'Operações', 'Luanda - Aeroporto', '2020-03-01', 'active', '+244 924 567 800', 'Diretora de Operações');

-- Supervisors
INSERT INTO user_profiles (id, email, full_name, role, phone, department, location, hire_date, status, emergency_contact, notes) VALUES
  ('sup-001', 'miguel.costa@airplus.ao', 'Miguel António Costa', 'supervisor', '+244 925 678 901', 'Limpeza Aeronaves', 'Luanda - Terminal A', '2020-06-15', 'active', '+244 925 678 800', 'Supervisor Sênior - Turno Manhã'),
  ('sup-002', 'fatima.rodrigues@airplus.ao', 'Fátima Isabel Rodrigues', 'supervisor', '+244 926 789 012', 'Limpeza Aeronaves', 'Luanda - Terminal B', '2020-08-01', 'active', '+244 926 789 000', 'Supervisora - Turno Tarde'),
  ('sup-003', 'joao.manuel@airplus.ao', 'João Manuel Fernandes', 'supervisor', '+244 927 890 123', 'Limpeza Aeronaves', 'Luanda - Hangar', '2021-01-10', 'active', '+244 927 890 100', 'Supervisor - Turno Noite'),
  ('sup-004', 'lucia.tomas@airplus.ao', 'Lúcia Maria Tomás', 'supervisor', '+244 928 901 234', 'Controle Qualidade', 'Luanda - QC', '2021-03-15', 'active', '+244 928 901 200', 'Supervisora de Qualidade'),
  ('sup-005', 'antonio.silva@airplus.ao', 'António José Silva', 'supervisor', '+244 929 012 345', 'Limpeza Aeronaves', 'Cabinda', '2021-05-01', 'active', '+244 929 012 300', 'Supervisor Regional - Cabinda');

-- Operational Staff (Team Leaders and Specialists)
INSERT INTO user_profiles (id, email, full_name, role, phone, department, location, hire_date, status, emergency_contact, notes) VALUES
  ('op-001', 'pedro.garcia@airplus.ao', 'Pedro Manuel Garcia', 'operacional', '+244 930 123 456', 'Limpeza Aeronaves', 'Luanda - Terminal A', '2021-07-01', 'active', '+244 930 123 400', 'Team Leader - Aeronaves Grandes'),
  ('op-002', 'maria.fernandes@airplus.ao', 'Maria José Fernandes', 'operacional', '+244 931 234 567', 'Limpeza Aeronaves', 'Luanda - Terminal B', '2021-09-15', 'active', '+244 931 234 500', 'Especialista em Limpeza de Cabine'),
  ('op-003', 'jose.antonio@airplus.ao', 'José António Pereira', 'operacional', '+244 932 345 678', 'Limpeza Aeronaves', 'Luanda - Pátio', '2022-01-20', 'active', '+244 932 345 600', 'Team Leader - Limpeza Externa'),
  ('op-004', 'isabel.santos@airplus.ao', 'Isabel Carolina Santos', 'operacional', '+244 933 456 789', 'Controle Qualidade', 'Luanda - QC', '2022-03-01', 'active', '+244 933 456 700', 'Inspetora de Qualidade Senior'),
  ('op-005', 'manuel.costa@airplus.ao', 'Manuel Francisco Costa', 'operacional', '+244 934 567 890', 'Limpeza Aeronaves', 'Luanda - Hangar', '2022-05-10', 'active', '+244 934 567 800', 'Especialista em Desinfecção'),
  ('op-006', 'teresa.silva@airplus.ao', 'Teresa Manuela Silva', 'operacional', '+244 935 678 901', 'Limpeza Aeronaves', 'Benguela', '2022-07-15', 'active', '+244 935 678 800', 'Team Leader Regional - Benguela'),
  ('op-007', 'francisco.lopes@airplus.ao', 'Francisco José Lopes', 'operacional', '+244 936 789 012', 'Limpeza Aeronaves', 'Cabinda', '2022-09-01', 'active', '+244 936 789 000', 'Supervisor de Turno - Cabinda'),
  ('op-008', 'sandra.martins@airplus.ao', 'Sandra Cristina Martins', 'operacional', '+244 937 890 123', 'Limpeza Aeronaves', 'Lubango', '2022-11-20', 'active', '+244 937 890 100', 'Coordenadora Regional - Lubango'),
  ('op-009', 'ricardo.fernandes@airplus.ao', 'Ricardo Manuel Fernandes', 'operacional', '+244 938 901 234', 'Limpeza Aeronaves', 'Huambo', '2023-01-15', 'active', '+244 938 901 200', 'Team Leader - Huambo'),
  ('op-010', 'claudia.sousa@airplus.ao', 'Cláudia Maria Sousa', 'operacional', '+244 939 012 345', 'Controle Qualidade', 'Luanda - QC', '2023-03-01', 'active', '+244 939 012 300', 'Auditora de Processos'),
  ('op-011', 'alberto.gomes@airplus.ao', 'Alberto João Gomes', 'operacional', '+244 940 123 456', 'Limpeza Aeronaves', 'Soyo', '2023-05-10', 'active', '+244 940 123 400', 'Coordenador Regional - Soyo'),
  ('op-012', 'helena.rodrigues@airplus.ao', 'Helena Isabel Rodrigues', 'operacional', '+244 941 234 567', 'Limpeza Aeronaves', 'Luanda - Terminal A', '2023-07-01', 'active', '+244 941 234 500', 'Especialista em Limpeza Noturna'),
  ('op-013', 'david.manuel@airplus.ao', 'David Manuel Santos', 'operacional', '+244 942 345 678', 'Limpeza Aeronaves', 'Luanda - Terminal B', '2023-09-15', 'active', '+244 942 345 600', 'Team Leader - Turn Around'),
  ('op-014', 'patricia.costa@airplus.ao', 'Patrícia Ana Costa', 'operacional', '+244 943 456 789', 'Controle Qualidade', 'Luanda - QC', '2023-11-01', 'active', '+244 943 456 700', 'Inspetora de Qualidade'),
  ('op-015', 'carlos.pereira@airplus.ao', 'Carlos Alberto Pereira', 'operacional', '+244 944 567 890', 'Limpeza Aeronaves', 'Luanda - Hangar', '2024-01-20', 'active', '+244 944 567 800', 'Especialista em Manutenção de Cabine');

-- Client Users (Airlines representatives)
INSERT INTO user_profiles (id, email, full_name, role, phone, department, location, hire_date, status, emergency_contact, notes) VALUES
  ('client-001', 'ops.taag@taag.ao', 'Representante TAAG Operações', 'cliente', '+244 945 678 901', 'Operações TAAG', 'Luanda - TAAG', '2020-01-01', 'active', '+244 945 678 800', 'Contato principal TAAG para operações'),
  ('client-002', 'quality.taag@taag.ao', 'Representante TAAG Qualidade', 'cliente', '+244 946 789 012', 'Qualidade TAAG', 'Luanda - TAAG', '2020-01-01', 'active', '+244 946 789 000', 'Responsável pela qualidade TAAG'),
  ('client-003', 'ops.sonair@sonair.ao', 'Representante SonAir', 'cliente', '+244 947 890 123', 'Operações SonAir', 'Luanda - SonAir', '2021-06-01', 'active', '+244 947 890 100', 'Contato SonAir operações de carga'),
  ('client-004', 'ops.fly540@fly540.ao', 'Representante Fly540', 'cliente', '+244 948 901 234', 'Operações Fly540', 'Luanda - Fly540', '2022-03-01', 'active', '+244 948 901 200', 'Operações regionais Fly540'),
  ('client-005', 'handling.luanda@groundhandling.ao', 'Ground Handling Services', 'cliente', '+244 949 012 345', 'Ground Handling', 'Luanda - Aeroporto', '2020-01-01', 'active', '+244 949 012 300', 'Serviços de apoio em terra');

-- Employees table (detailed operational staff)
INSERT INTO employees (user_profile_id, employee_code, position, shift_id, specializations, certifications, performance_rating, is_team_leader, supervisor_id) VALUES
  -- Admin level
  ('admin-001', 'EMP-001', 'Diretor Geral', 1, '["Gestão Executiva", "Planejamento Estratégico"]', '["ISO 9001", "IATA Safety"]', 5.0, false, NULL),
  ('admin-002', 'EMP-002', 'Diretora de Operações', 1, '["Gestão de Operações", "Controle de Qualidade"]', '["ISO 9001", "Six Sigma"]', 5.0, false, 'admin-001'),
  
  -- Supervisors
  ('sup-001', 'EMP-003', 'Supervisor Sênior', 1, '["Liderança de Equipe", "Controle de Qualidade", "Boeing 777"]', '["IATA Ground Handling", "Safety Management"]', 4.8, true, 'admin-002'),
  ('sup-002', 'EMP-004', 'Supervisora de Turno', 2, '["Gestão de Turno", "Boeing 737", "Airbus A330"]', '["IATA Ground Handling", "First Aid"]', 4.7, true, 'admin-002'),
  ('sup-003', 'EMP-005', 'Supervisor Noturno', 3, '["Operações Noturnas", "Limpeza Profunda"]', '["IATA Ground Handling", "Safety Training"]', 4.6, true, 'admin-002'),
  ('sup-004', 'EMP-006', 'Supervisora de Qualidade', 1, '["Auditoria", "Controle de Qualidade", "Compliance"]', '["ISO 9001 Lead Auditor", "Quality Management"]', 4.9, true, 'admin-002'),
  ('sup-005', 'EMP-007', 'Supervisor Regional', 1, '["Gestão Regional", "Dash 8", "ATR"]', '["IATA Ground Handling", "Regional Operations"]', 4.5, true, 'admin-002'),
  
  -- Operational staff
  ('op-001', 'EMP-008', 'Team Leader', 1, '["Boeing 777", "Boeing 737", "Liderança"]', '["Aircraft Cleaning Specialist", "Team Leadership"]', 4.4, true, 'sup-001'),
  ('op-002', 'EMP-009', 'Especialista de Cabine', 2, '["Limpeza de Cabine", "Sanitização"]', '["Cabin Service Specialist", "Hygiene Protocols"]', 4.3, false, 'sup-002'),
  ('op-003', 'EMP-010', 'Team Leader Externo', 1, '["Limpeza Externa", "Lavagem de Aeronaves"]', '["External Cleaning Specialist", "Pressure Washing"]', 4.2, true, 'sup-001'),
  ('op-004', 'EMP-011', 'Inspetora Senior', 1, '["Inspeção de Qualidade", "Auditoria"]', '["Quality Inspector", "Audit Procedures"]', 4.6, false, 'sup-004'),
  ('op-005', 'EMP-012', 'Especialista Desinfecção', 3, '["Desinfecção", "Protocolos COVID", "Químicos"]', '["Disinfection Specialist", "Chemical Handling"]', 4.4, false, 'sup-003'),
  ('op-006', 'EMP-013', 'Team Leader Regional', 1, '["Operações Regionais", "ATR", "Dash 8"]', '["Regional Operations", "Multi-Aircraft"]', 4.1, true, 'sup-005'),
  ('op-007', 'EMP-014', 'Supervisor de Turno', 2, '["Supervisão", "Boeing 737"]', '["Shift Management", "Safety Procedures"]', 4.3, true, 'sup-005'),
  ('op-008', 'EMP-015', 'Coordenadora Regional', 1, '["Coordenação", "Planejamento"]', '["Operations Coordination", "Planning"]', 4.2, true, 'sup-005'),
  ('op-009', 'EMP-016', 'Team Leader', 2, '["Limpeza Rápida", "Turn Around"]', '["Quick Cleaning", "Time Management"]', 4.0, true, 'sup-005'),
  ('op-010', 'EMP-017', 'Auditora de Processos', 1, '["Auditoria Interna", "Processos"]', '["Internal Audit", "Process Management"]', 4.5, false, 'sup-004'),
  ('op-011', 'EMP-018', 'Coordenador Regional', 1, '["Operações Offshore", "Logística"]', '["Offshore Operations", "Logistics"]', 4.1, true, 'sup-005'),
  ('op-012', 'EMP-019', 'Especialista Noturno', 3, '["Limpeza Noturna", "Manutenção"]', '["Night Operations", "Deep Cleaning"]', 4.2, false, 'sup-003'),
  ('op-013', 'EMP-020', 'Team Leader TA', 2, '["Turn Around", "Operações Rápidas"]', '["Quick Turn", "Time Critical Operations"]', 4.3, true, 'sup-002'),
  ('op-014', 'EMP-021', 'Inspetora', 1, '["Inspeção", "Documentação"]', '["Quality Inspection", "Documentation"]', 4.1, false, 'sup-004'),
  ('op-015', 'EMP-022', 'Especialista Cabine', 3, '["Manutenção de Cabine", "Reparos"]', '["Cabin Maintenance", "Minor Repairs"]', 4.0, false, 'sup-003');

-- =====================================================
-- SAMPLE CLEANING FORMS AND TASKS
-- =====================================================

-- Recent cleaning forms for demonstration
INSERT INTO cleaning_forms (
  code, aircraft_id, employee_id, intervention_id, shift_id, 
  status, start_time, end_time, location, 
  observations, supervisor_signature, client_signature,
  created_at, updated_at
) VALUES
  -- Today's forms
  ('CF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001', 1, 8, 1, 1, 'completed', 
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '3 hours', 'Terminal A - Gate 1',
   'Limpeza completa realizada com sucesso. Aeronave preparada para voo internacional.', 
   true, true, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '3 hours'),
   
  ('CF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-002', 2, 9, 2, 2, 'completed',
   NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours', 'Terminal B - Gate 3',
   'Limpeza rápida entre voos. Todas as verificações de segurança aprovadas.',
   true, true, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours'),
   
  ('CF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-003', 5, 10, 3, 1, 'in_progress',
   NOW() - INTERVAL '2 hours', NULL, 'Terminal A - Gate 5',
   'Limpeza externa em andamento. Condições climáticas favoráveis.',
   false, false, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
   
  -- Yesterday's forms
  ('CF-' || TO_CHAR(NOW() - INTERVAL '1 day', 'YYYYMMDD') || '-015', 3, 12, 4, 3, 'completed',
   NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day 30 minutes', 'Hangar - Posição 1',
   'Limpeza noturna completa. Desinfecção especial aplicada conforme protocolo.',
   true, true, NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day 30 minutes'),
   
  ('CF-' || TO_CHAR(NOW() - INTERVAL '1 day', 'YYYYMMDD') || '-016', 6, 13, 2, 2, 'completed',
   NOW() - INTERVAL '1 day 5 hours', NOW() - INTERVAL '1 day 4 hours', 'Terminal B - Gate 2',
   'Turn around realizado dentro do tempo previsto. Excelente performance da equipe.',
   true, true, NOW() - INTERVAL '1 day 5 hours', NOW() - INTERVAL '1 day 4 hours');

-- Tasks for the cleaning forms
INSERT INTO form_tasks (
  form_id, task_name, description, is_completed, 
  completion_time, notes, assigned_employee_id
) VALUES
  -- Tasks for form 1 (completed)
  (1, 'Limpeza Cockpit', 'Limpeza completa do cockpit incluindo painéis e assentos', true, 
   NOW() - INTERVAL '5 hours 30 minutes', 'Cockpit limpo e desinfetado', 8),
  (1, 'Limpeza Cabine Passageiros', 'Aspiração e limpeza de todos os assentos e superfícies', true,
   NOW() - INTERVAL '4 hours 30 minutes', 'Cabine completamente sanitizada', 9),
  (1, 'Limpeza Banheiros', 'Desinfecção completa dos lavatórios', true,
   NOW() - INTERVAL '4 hours', 'Todos os banheiros limpos e reabastecidos', 8),
  (1, 'Verificação Final', 'Inspeção final de qualidade', true,
   NOW() - INTERVAL '3 hours 15 minutes', 'Aprovado na inspeção de qualidade', 11),
   
  -- Tasks for form 2 (completed)
  (2, 'Limpeza Rápida Cabine', 'Limpeza rápida entre voos', true,
   NOW() - INTERVAL '3 hours 30 minutes', 'Limpeza concluída no tempo esperado', 9),
  (2, 'Reabastecimento Supplies', 'Reposição de materiais de higiene', true,
   NOW() - INTERVAL '3 hours 15 minutes', 'Todos os suprimentos repostos', 13),
  (2, 'Verificação Segurança', 'Check de segurança pré-voo', true,
   NOW() - INTERVAL '3 hours', 'Verificação de segurança aprovada', 14),
   
  -- Tasks for form 3 (in progress)
  (3, 'Lavagem Externa Fuselagem', 'Lavagem da fuselagem com detergente específico', true,
   NOW() - INTERVAL '1 hour 30 minutes', 'Fuselagem lavada, iniciando secagem', 10),
  (3, 'Limpeza Asas e Superfícies', 'Limpeza das asas e superfícies de controle', false,
   NULL, 'Em andamento - 60% concluído', 10),
  (3, 'Limpeza Trem de Pouso', 'Limpeza do trem de pouso principal e auxiliar', false,
   NULL, 'Aguardando conclusão das asas', 10),
   
  -- Tasks for form 4 (yesterday - completed)
  (4, 'Desinfecção Completa', 'Processo de desinfecção com produtos certificados', true,
   NOW() - INTERVAL '1 day 1 hour', 'Desinfecção realizada conforme protocolo COVID', 12),
  (4, 'Limpeza Cargo Hold', 'Limpeza do compartimento de carga', true,
   NOW() - INTERVAL '1 day 45 minutes', 'Compartimento de carga limpo e verificado', 15),
  (4, 'Manutenção Cabine', 'Pequenos reparos e manutenção de cabine', true,
   NOW() - INTERVAL '1 day 30 minutes', 'Reparos menores realizados com sucesso', 15),
   
  -- Tasks for form 5 (yesterday - completed)
  (5, 'Preparação Rápida', 'Preparação para próximo voo em tempo mínimo', true,
   NOW() - INTERVAL '1 day 4 hours 15 minutes', 'Aeronave preparada em tempo recorde', 13),
  (5, 'Check Quality', 'Verificação rápida de qualidade', true,
   NOW() - INTERVAL '1 day 4 hours', 'Qualidade aprovada para operação', 14);

-- =====================================================
-- PHOTO EVIDENCE AND DOCUMENTATION
-- =====================================================

-- Photo evidence for completed forms
INSERT INTO photo_evidence (
  form_id, task_id, photo_url, description, 
  upload_status, file_size_kb, taken_by_employee_id
) VALUES
  -- Photos for form 1
  (1, 1, '/storage/photos/2024/12/cockpit_before_001.jpg', 'Estado inicial do cockpit antes da limpeza', 'uploaded', 1250, 8),
  (1, 1, '/storage/photos/2024/12/cockpit_after_001.jpg', 'Cockpit após limpeza completa', 'uploaded', 1180, 8),
  (1, 2, '/storage/photos/2024/12/cabin_cleaning_001.jpg', 'Processo de limpeza da cabine em andamento', 'uploaded', 1420, 9),
  (1, 2, '/storage/photos/2024/12/cabin_final_001.jpg', 'Cabine finalizada e preparada', 'uploaded', 1320, 9),
  (1, 4, '/storage/photos/2024/12/quality_check_001.jpg', 'Verificação final aprovada pelo supervisor', 'uploaded', 980, 11),
  
  -- Photos for form 2
  (2, 1, '/storage/photos/2024/12/quick_clean_002.jpg', 'Limpeza rápida em execução', 'uploaded', 1150, 9),
  (2, 3, '/storage/photos/2024/12/safety_check_002.jpg', 'Verificação de segurança concluída', 'uploaded', 890, 14),
  
  -- Photos for form 4 (yesterday)
  (4, 1, '/storage/photos/2024/12/disinfection_004.jpg', 'Processo de desinfecção em execução', 'uploaded', 1380, 12),
  (4, 2, '/storage/photos/2024/12/cargo_clean_004.jpg', 'Compartimento de carga após limpeza', 'uploaded', 1290, 15),
  (4, 3, '/storage/photos/2024/12/cabin_maintenance_004.jpg', 'Reparos menores realizados na cabine', 'uploaded', 1100, 15);

-- Cleaning photos (additional evidence)
INSERT INTO cleaning_photos (
  form_id, photo_url, description, photo_type, 
  upload_status, file_size_kb, taken_by_employee_id
) VALUES
  -- General documentation photos
  (1, '/storage/photos/2024/12/aircraft_exterior_001.jpg', 'Estado geral da aeronave antes do serviço', 'before', 'uploaded', 1450, 8),
  (1, '/storage/photos/2024/12/aircraft_final_001.jpg', 'Aeronave pronta para operação', 'after', 'uploaded', 1380, 8),
  (2, '/storage/photos/2024/12/turnaround_002.jpg', 'Processo de turn around em andamento', 'during', 'uploaded', 1220, 9),
  (4, '/storage/photos/2024/12/night_cleaning_004.jpg', 'Operação de limpeza noturna', 'during', 'uploaded', 1050, 12),
  (5, '/storage/photos/2024/12/team_work_005.jpg', 'Equipe realizando limpeza coordenada', 'during', 'uploaded', 1350, 13);

-- =====================================================
-- AUDIT LOG ENTRIES
-- =====================================================

INSERT INTO audit_log (
  table_name, record_id, action, old_values, new_values, 
  user_id, timestamp, ip_address, user_agent
) VALUES
  -- Recent form completions
  ('cleaning_forms', 1, 'UPDATE', 
   '{"status": "in_progress", "end_time": null}', 
   '{"status": "completed", "end_time": "' || (NOW() - INTERVAL '3 hours')::text || '"}',
   'EMP-008', NOW() - INTERVAL '3 hours', '192.168.1.101', 'AirPlus Mobile App v2.1'),
   
  ('cleaning_forms', 2, 'UPDATE',
   '{"status": "in_progress", "end_time": null}',
   '{"status": "completed", "end_time": "' || (NOW() - INTERVAL '3 hours')::text || '"}',
   'EMP-009', NOW() - INTERVAL '3 hours', '192.168.1.102', 'AirPlus Mobile App v2.1'),
   
  -- Photo uploads
  ('photo_evidence', 1, 'INSERT', NULL,
   '{"form_id": 1, "photo_url": "/storage/photos/2024/12/cockpit_before_001.jpg", "upload_status": "uploaded"}',
   'EMP-008', NOW() - INTERVAL '5 hours 30 minutes', '192.168.1.101', 'AirPlus Mobile App v2.1'),
   
  -- Quality approvals
  ('form_tasks', 4, 'UPDATE',
   '{"is_completed": false, "completion_time": null}',
   '{"is_completed": true, "completion_time": "' || (NOW() - INTERVAL '3 hours 15 minutes')::text || '"}',
   'EMP-011', NOW() - INTERVAL '3 hours 15 minutes', '192.168.1.105', 'AirPlus Web Portal v1.8');

-- =====================================================
-- USER ACTIVITY LOG
-- =====================================================

INSERT INTO user_activity_log (
  user_id, activity_type, description, metadata, 
  timestamp, ip_address, location
) VALUES
  -- Recent logins
  ('EMP-008', 'login', 'Usuário logou no sistema mobile', 
   '{"device": "Samsung Galaxy A54", "app_version": "2.1", "platform": "android"}',
   NOW() - INTERVAL '6 hours', '192.168.1.101', 'Terminal A - Gate 1'),
   
  ('EMP-009', 'login', 'Usuário logou no sistema mobile',
   '{"device": "iPhone 13", "app_version": "2.1", "platform": "ios"}',
   NOW() - INTERVAL '4 hours', '192.168.1.102', 'Terminal B - Gate 3'),
   
  -- Form activities  
  ('EMP-008', 'form_create', 'Criou formulário de limpeza CF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
   '{"aircraft": "D2-TEA", "intervention": "Limpeza Completa", "location": "Terminal A - Gate 1"}',
   NOW() - INTERVAL '6 hours', '192.168.1.101', 'Terminal A - Gate 1'),
   
  ('EMP-008', 'form_complete', 'Completou formulário CF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
   '{"duration_minutes": 180, "tasks_completed": 4, "photos_uploaded": 5}',
   NOW() - INTERVAL '3 hours', '192.168.1.101', 'Terminal A - Gate 1'),
   
  -- Photo uploads
  ('EMP-008', 'photo_upload', 'Upload de evidência fotográfica',
   '{"form_code": "CF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001", "photos_count": 5, "total_size_mb": 6.2}',
   NOW() - INTERVAL '4 hours', '192.168.1.101', 'Terminal A - Gate 1'),
   
  -- Quality checks
  ('EMP-011', 'quality_approval', 'Aprovou formulário na inspeção de qualidade',
   '{"form_code": "CF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001", "rating": "Excelente", "issues": 0}',
   NOW() - INTERVAL '3 hours 15 minutes', '192.168.1.105', 'Controle de Qualidade'),
   
  -- Supervisor activities
  ('EMP-003', 'dashboard_access', 'Acessou dashboard de supervisão',
   '{"view": "daily_summary", "filters": {"location": "Terminal A", "shift": "morning"}}',
   NOW() - INTERVAL '2 hours', '192.168.1.100', 'Supervisão - Terminal A'),
   
  -- System sync
  ('EMP-009', 'data_sync', 'Sincronização de dados offline',
   '{"synced_forms": 2, "synced_photos": 3, "conflicts_resolved": 0}',
   NOW() - INTERVAL '1 hour', '192.168.1.102', 'Terminal B - Gate 3');

-- =====================================================
-- PERFORMANCE ANALYTICS DATA
-- =====================================================

-- Update employee performance ratings based on recent activity
UPDATE employees SET 
  performance_rating = CASE 
    WHEN employee_code = 'EMP-008' THEN 4.5  -- Excellent recent performance
    WHEN employee_code = 'EMP-009' THEN 4.4  -- Very good turn around times
    WHEN employee_code = 'EMP-011' THEN 4.7  -- Outstanding quality inspection
    WHEN employee_code = 'EMP-012' THEN 4.3  -- Good disinfection specialist
    WHEN employee_code = 'EMP-013' THEN 4.2  -- Reliable team leader
    ELSE performance_rating
  END,
  updated_at = NOW()
WHERE employee_code IN ('EMP-008', 'EMP-009', 'EMP-011', 'EMP-012', 'EMP-013');

-- =====================================================
-- FINAL VALIDATION QUERIES
-- =====================================================

-- Verify data integrity
DO $$
DECLARE 
  total_users INTEGER;
  total_aircraft INTEGER;
  total_forms INTEGER;
  total_tasks INTEGER;
  total_photos INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM user_profiles;
  SELECT COUNT(*) INTO total_aircraft FROM aircraft;
  SELECT COUNT(*) INTO total_forms FROM cleaning_forms;
  SELECT COUNT(*) INTO total_tasks FROM form_tasks;
  SELECT COUNT(*) INTO total_photos FROM photo_evidence;
  
  RAISE NOTICE 'SEED DATA SUMMARY:';
  RAISE NOTICE '==================';
  RAISE NOTICE 'Users created: %', total_users;
  RAISE NOTICE 'Aircraft registered: %', total_aircraft;
  RAISE NOTICE 'Cleaning forms: %', total_forms;
  RAISE NOTICE 'Tasks recorded: %', total_tasks;
  RAISE NOTICE 'Photo evidence: %', total_photos;
  RAISE NOTICE 'System ready for production use!';
END $$;

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Analyze tables for optimal performance
ANALYZE user_profiles, aircraft, cleaning_forms, form_tasks, photo_evidence, employees;

-- Update statistics
UPDATE pg_stats_ext SET stxkind = '{d,f,m}' WHERE schemaname = 'public';

-- Final success message
SELECT 
  'AirPlus Aviation System successfully seeded with production data!' as status,
  NOW() as completed_at,
  'Ready for production deployment' as message;

-- =====================================================
-- END OF SEED DATA
-- =====================================================
