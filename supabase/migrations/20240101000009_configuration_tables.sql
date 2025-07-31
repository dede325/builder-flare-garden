-- Configuration management tables for dynamic system configuration

-- Intervention Types table
CREATE TABLE intervention_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shift configurations table
CREATE TABLE shift_configs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location configurations table
CREATE TABLE location_configs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_intervention_types_active ON intervention_types(is_active);
CREATE INDEX idx_intervention_types_order ON intervention_types("order");
CREATE INDEX idx_shift_configs_active ON shift_configs(is_active);
CREATE INDEX idx_shift_configs_order ON shift_configs("order");
CREATE INDEX idx_location_configs_active ON location_configs(is_active);
CREATE INDEX idx_location_configs_order ON location_configs("order");

-- Create triggers for updated_at
CREATE TRIGGER update_intervention_types_updated_at 
    BEFORE UPDATE ON intervention_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_configs_updated_at 
    BEFORE UPDATE ON shift_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_configs_updated_at 
    BEFORE UPDATE ON location_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default intervention types
INSERT INTO intervention_types (id, name, description, is_active, "order") VALUES
('1', 'Limpeza Exterior', 'Limpeza completa da parte externa da aeronave', true, 1),
('2', 'Limpeza Interior', 'Limpeza completa da cabine e interior da aeronave', true, 2),
('3', 'Polimento', 'Polimento da fuselagem e superfícies metálicas', true, 3),
('4', 'Lavagem Profunda Durante a Manutenção de Base', 'Limpeza detalhada realizada durante check de manutenção', true, 4);

-- Insert default shift configurations
INSERT INTO shift_configs (id, name, display_name, start_time, end_time, is_active, "order") VALUES
('morning', 'morning', 'Manhã', '06:00:00', '14:00:00', true, 1),
('afternoon', 'afternoon', 'Tarde', '14:00:00', '22:00:00', true, 2),
('night', 'night', 'Noite', '22:00:00', '06:00:00', true, 3);

-- Insert default location configurations
INSERT INTO location_configs (id, name, description, is_active, "order") VALUES
('1', 'Hangar Principal', 'Hangar principal para manutenção e limpeza', true, 1),
('2', 'Pátio de Aeronaves', 'Área externa para estacionamento de aeronaves', true, 2),
('3', 'Terminal de Passageiros', 'Área próxima ao terminal para limpeza rápida', true, 3),
('4', 'Área de Manutenção', 'Área específica para manutenção programada', true, 4),
('5', 'Rampa Norte', 'Rampa norte do aeroporto', true, 5),
('6', 'Rampa Sul', 'Rampa sul do aeroporto', true, 6),
('7', 'Hangar de Manutenção', 'Hangar específico para manutenção pesada', true, 7),
('8', 'Estacionamento VIP', 'Área reservada para aeronaves VIP', true, 8);

-- Enable Row Level Security (RLS)
ALTER TABLE intervention_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users on intervention_types" 
    ON intervention_types FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on shift_configs" 
    ON shift_configs FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on location_configs" 
    ON location_configs FOR ALL 
    USING (auth.role() = 'authenticated');

-- Create view for active configurations only
CREATE VIEW active_intervention_types AS
SELECT * FROM intervention_types WHERE is_active = true ORDER BY "order";

CREATE VIEW active_shift_configs AS
SELECT * FROM shift_configs WHERE is_active = true ORDER BY "order";

CREATE VIEW active_location_configs AS
SELECT * FROM location_configs WHERE is_active = true ORDER BY "order";

-- Grant permissions on views
GRANT SELECT ON active_intervention_types TO authenticated;
GRANT SELECT ON active_shift_configs TO authenticated;
GRANT SELECT ON active_location_configs TO authenticated;
