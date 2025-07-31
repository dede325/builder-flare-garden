-- Production Seed Data for AirPlus Aviation
-- Real Employee Data and Sample Aircraft
-- =====================================

-- Insert real AirPlus employees
INSERT INTO funcionarios (nome, funcao, numero_bilhete, codigo_plano, telefone, email, ativo) VALUES
('AUGUSTO TOMÁS', 'TÉCNICO AUXILIAR DE PLACA', '000862944ME035', 'PL001', '923000001', 'augusto.tomas@airplus.co', true),
('AMIZANGUEL DA SILVA', 'DIRECTOR', '001023626BA037', 'PL002', '923000002', 'amizanguel.silva@airplus.co', true),
('CELESTINO DOMINGOS', 'TÉCNICO AUXILIAR DE PLACA', '000951540HA036', 'PL003', '923000003', 'celestino.domingos@airplus.co', true),
('DANIEL SEGUNDA', 'TÉCNICO AUXILIAR DE PLACA', '003557571HO034', 'PL004', '923000004', 'daniel.segunda@airplus.co', true),
('EVANDRA DOS SANTOS', 'D. COMERCIAL E MARKETING', '005280783LA047', 'PL005', '923000005', 'evandra.santos@airplus.co', true),
('JAIME DA GRAÇA', 'DIRECTOR', '000821215LA035', 'PL006', '923000006', 'jaime.graca@airplus.co', true),
('JOAQUIM CUMBANDO JOÃO', 'TÉCNICO AUXILIAR DE PLACA', '001141347LA031', 'PL007', '923000007', 'joaquim.joao@airplus.co', true),
('JOSÉ GARRIDO', 'TÉCNICO AUXILIAR DE PLACA', '003588004ME037', 'PL008', '923000008', 'jose.garrido@airplus.co', true),
('JOSÉ JOÃO', 'TÉCNICO AUXILIAR DE PLACA', '000040089LA035', 'PL009', '923000009', 'jose.joao@airplus.co', true),
('LILIANA DOS SANTOS', 'D. RECURSOS HUMANOS', '005259127LA042', 'PL010', '923000010', 'liliana.santos@airplus.co', true),
('MANUEL COELHO', 'TÉCNICO AUXILIAR DE PLACA', '000650503LN039', 'PL011', '923000011', 'manuel.coelho@airplus.co', true),
('MÁRIO QUILUANGE', 'TÉCNICO AUXILIAR DE PLACA', '000062106LA017', 'PL012', '923000012', 'mario.quiluange@airplus.co', true),
('REGINALDO GOLVEIA', 'TÉCNICO AUXILIAR DE PLACA', '000195323LA017', 'PL013', '923000013', 'reginaldo.golveia@airplus.co', true),
('WILSON HONGOLO', 'TÉCNICO AUXILIAR DE PLACA', '000161916LA015', 'PL014', '923000014', 'wilson.hongolo@airplus.co', true);

-- Insert sample aircraft for testing
INSERT INTO aeronaves (matricula, modelo, fabricante, proprietario, status, horas_voo) VALUES
('D2-ABC', 'Boeing 737-800', 'Boeing', 'TAAG Angola Airlines', 'ativa', 15420),
('D2-XYZ', 'Airbus A320', 'Airbus', 'Sonair', 'ativa', 8750),
('D2-123', 'Embraer E190', 'Embraer', 'Fly Angola', 'ativa', 5230),
('D2-456', 'ATR 72-600', 'ATR', 'SonAir Regional', 'ativa', 3680),
('D2-789', 'Cessna Citation CJ4', 'Cessna', 'Private Owner', 'ativa', 1240),
('D2-VIP', 'Gulfstream G650', 'Gulfstream', 'Executive Aviation', 'ativa', 890),
('D2-DEF', 'Boeing 737-700', 'Boeing', 'TAAG Angola Airlines', 'manutencao', 18930),
('D2-GHI', 'Bombardier Dash 8 Q400', 'Bombardier', 'SonAir', 'ativa', 7120);

-- Create admin user for the director
-- Note: This will need to be linked to actual auth.users after user signup
-- UPDATE usuarios SET funcionario_id = (SELECT id FROM funcionarios WHERE email = 'amizanguel.silva@airplus.co'), role = 'admin' WHERE id = 'USER_UUID_FROM_AUTH';

-- Insert default configuration data
-- Intervention types (tipos de intervenção)
INSERT INTO intervention_types (id, name, description, is_active, "order") VALUES
('limpeza-exterior', 'Limpeza Exterior', 'Limpeza completa da fuselagem, asas e superfícies externas', true, 1),
('limpeza-interior', 'Limpeza Interior', 'Limpeza da cabine de passageiros, cockpit e compartimentos internos', true, 2),
('polimento-fuselagem', 'Polimento da Fuselagem', 'Polimento e enceramento das superfícies metálicas externas', true, 3),
('lavagem-manutencao', 'Lavagem Durante Manutenção', 'Limpeza profunda realizada durante check de manutenção programada', true, 4),
('desinfeccao-cabine', 'Desinfecção da Cabine', 'Desinfecção completa dos assentos, painéis e superfícies internas', true, 5),
('limpeza-janelas', 'Limpeza de Janelas', 'Limpeza especializada de todas as janelas e visores', true, 6),
('aspiracao-carpetes', 'Aspiração de Carpetes', 'Aspiração e limpeza profunda de carpetes e estofados', true, 7),
('limpeza-wc', 'Limpeza de WC', 'Limpeza e sanitização dos banheiros da aeronave', true, 8)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    "order" = EXCLUDED."order";

-- Location configurations
INSERT INTO location_configs (id, name, description, is_active, "order") VALUES
('hangar-principal', 'Hangar Principal', 'Hangar principal do aeroporto 4 de Fevereiro', true, 1),
('hangar-manutencao', 'Hangar de Manutenção', 'Hangar específico para manutenção programada', true, 2),
('patio-aeronaves', 'Pátio de Aeronaves', 'Área externa de estacionamento de aeronaves', true, 3),
('terminal-passageiros', 'Terminal de Passageiros', 'Área próxima ao terminal para limpeza rápida', true, 4),
('rampa-norte', 'Rampa Norte', 'Rampa norte do aeroporto', true, 5),
('rampa-sul', 'Rampa Sul', 'Rampa sul do aeroporto', true, 6),
('area-vip', 'Área VIP', 'Área reservada para aeronaves executivas e VIP', true, 7),
('area-carga', 'Área de Carga', 'Área específica para aeronaves de carga', true, 8)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    "order" = EXCLUDED."order";

-- Comments explaining the data structure
COMMENT ON TABLE funcionarios IS 'Employees of AirPlus Aviation with their roles and contact information';
COMMENT ON TABLE aeronaves IS 'Aircraft fleet managed by the system';
COMMENT ON TABLE folhas IS 'Cleaning sheets/forms for aircraft maintenance operations';
COMMENT ON TABLE folha_funcionarios IS 'Many-to-many relationship between cleaning sheets and employees';
COMMENT ON TABLE fotos IS 'Photo evidence captured during cleaning operations';
COMMENT ON TABLE qr_codes IS 'QR codes generated for each cleaning sheet for digital access';

-- Create view for active employees
CREATE VIEW funcionarios_ativos AS
SELECT 
    f.*,
    CASE 
        WHEN f.funcao LIKE '%DIRECTOR%' THEN 'supervisor'
        WHEN f.funcao LIKE '%RECURSOS HUMANOS%' THEN 'admin'
        WHEN f.funcao LIKE '%COMERCIAL%' THEN 'admin'
        ELSE 'operacional'
    END as suggested_role
FROM funcionarios f 
WHERE f.ativo = true 
ORDER BY f.nome;

-- Create view for aircraft summary
CREATE VIEW aeronaves_resumo AS
SELECT 
    a.*,
    COUNT(f.id) as total_folhas_limpeza,
    MAX(f.data) as ultima_limpeza
FROM aeronaves a
LEFT JOIN folhas f ON a.id = f.aeronave_id
GROUP BY a.id
ORDER BY a.matricula;

-- Grant permissions for the views
GRANT SELECT ON funcionarios_ativos TO authenticated;
GRANT SELECT ON aeronaves_resumo TO authenticated;
