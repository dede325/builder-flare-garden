-- Production Database Schema for AirPlus Aviation
-- Folhas de Limpeza de Aeronaves
-- ===============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- FUNCIONARIOS table
CREATE TABLE funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    funcao TEXT,
    numero_bilhete TEXT,
    codigo_plano TEXT,
    telefone TEXT,
    foto_url TEXT,
    email TEXT UNIQUE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USUARIOS table for authentication
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    funcionario_id UUID REFERENCES funcionarios(id),
    role TEXT CHECK (role IN ('admin', 'supervisor', 'operacional', 'cliente')) DEFAULT 'operacional',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AERONAVES table
CREATE TABLE aeronaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula TEXT NOT NULL UNIQUE,
    modelo TEXT NOT NULL,
    fabricante TEXT,
    proprietario TEXT,
    status TEXT CHECK (status IN ('ativa', 'manutencao', 'inativa')) DEFAULT 'ativa',
    horas_voo INTEGER DEFAULT 0,
    ultima_inspecao DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FOLHAS table (cleaning sheets)
CREATE TABLE folhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    data DATE NOT NULL,
    turno TEXT CHECK (turno IN ('manha', 'tarde', 'noite')) NOT NULL,
    local TEXT NOT NULL,
    aeronave_id UUID REFERENCES aeronaves(id) ON DELETE RESTRICT,
    tipos_intervencao JSONB DEFAULT '[]'::jsonb,
    observacoes TEXT,
    supervisor_id UUID REFERENCES funcionarios(id),
    cliente_confirmou BOOLEAN DEFAULT false,
    assinatura_supervisor TEXT, -- Base64 signature data
    assinatura_cliente TEXT, -- Base64 signature data
    qr_code_data TEXT,
    pdf_url TEXT,
    sync_status TEXT DEFAULT 'sincronizado' CHECK (sync_status IN ('pendente', 'sincronizado', 'erro')),
    status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'em_andamento', 'concluida', 'aprovada')),
    version INTEGER DEFAULT 1,
    change_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FOLHA_FUNCIONARIOS table (many-to-many relationship)
CREATE TABLE folha_funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folha_id UUID REFERENCES folhas(id) ON DELETE CASCADE,
    funcionario_id UUID REFERENCES funcionarios(id) ON DELETE RESTRICT,
    tarefa TEXT,
    hora_inicio TIME,
    hora_fim TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FOTOS table for photo evidence
CREATE TABLE fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folha_id UUID REFERENCES folhas(id) ON DELETE CASCADE,
    tipo TEXT CHECK (tipo IN ('antes', 'depois')) NOT NULL,
    categoria TEXT CHECK (categoria IN ('exterior', 'interior', 'detalhes')) NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    legenda TEXT,
    tamanho_arquivo INTEGER,
    resolucao JSONB, -- {width: number, height: number}
    gps_coordinates JSONB, -- {lat: number, lng: number}
    metadata JSONB DEFAULT '{}'::jsonb,
    upload_status TEXT DEFAULT 'pendente' CHECK (upload_status IN ('pendente', 'enviando', 'enviado', 'erro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR_CODES table for QR code management
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folha_id UUID REFERENCES folhas(id) ON DELETE CASCADE,
    form_code TEXT NOT NULL,
    qr_data TEXT NOT NULL,
    qr_url TEXT,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AUDIT_LOG table for tracking changes
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_funcionarios_email ON funcionarios(email);
CREATE INDEX idx_funcionarios_ativo ON funcionarios(ativo);
CREATE INDEX idx_funcionarios_codigo_plano ON funcionarios(codigo_plano);

CREATE INDEX idx_usuarios_funcionario ON usuarios(funcionario_id);
CREATE INDEX idx_usuarios_role ON usuarios(role);

CREATE INDEX idx_aeronaves_matricula ON aeronaves(matricula);
CREATE INDEX idx_aeronaves_status ON aeronaves(status);

CREATE INDEX idx_folhas_codigo ON folhas(codigo);
CREATE INDEX idx_folhas_data ON folhas(data);
CREATE INDEX idx_folhas_aeronave ON folhas(aeronave_id);
CREATE INDEX idx_folhas_supervisor ON folhas(supervisor_id);
CREATE INDEX idx_folhas_status ON folhas(status);
CREATE INDEX idx_folhas_sync_status ON folhas(sync_status);

CREATE INDEX idx_folha_funcionarios_folha ON folha_funcionarios(folha_id);
CREATE INDEX idx_folha_funcionarios_funcionario ON folha_funcionarios(funcionario_id);

CREATE INDEX idx_fotos_folha ON fotos(folha_id);
CREATE INDEX idx_fotos_tipo ON fotos(tipo);
CREATE INDEX idx_fotos_upload_status ON fotos(upload_status);

CREATE INDEX idx_qr_codes_folha ON qr_codes(folha_id);
CREATE INDEX idx_qr_codes_form_code ON qr_codes(form_code);

CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON funcionarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aeronaves_updated_at BEFORE UPDATE ON aeronaves FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folhas_updated_at BEFORE UPDATE ON folhas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), auth.uid());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create audit triggers for important tables
CREATE TRIGGER audit_folhas AFTER INSERT OR UPDATE OR DELETE ON folhas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_funcionarios AFTER INSERT OR UPDATE OR DELETE ON funcionarios FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_aeronaves AFTER INSERT OR UPDATE OR DELETE ON aeronaves FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Enable Row Level Security (RLS)
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeronaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE folhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE folha_funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Funcionarios: Authenticated users can read all, but only admins can modify
CREATE POLICY "Funcionarios - Read for authenticated" ON funcionarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Funcionarios - Admin full access" ON funcionarios FOR ALL USING (
    EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'supervisor')
    )
);

-- Usuarios: Users can read their own record, admins can read all
CREATE POLICY "Usuarios - Own record" ON usuarios FOR ALL USING (id = auth.uid());
CREATE POLICY "Usuarios - Admin read all" ON usuarios FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'supervisor')
    )
);

-- Aeronaves: All authenticated users can read, admins can modify
CREATE POLICY "Aeronaves - Read for authenticated" ON aeronaves FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Aeronaves - Admin modify" ON aeronaves FOR INSERT OR UPDATE OR DELETE USING (
    EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'supervisor')
    )
);

-- Folhas: Users can read/modify their own or their supervised folhas
CREATE POLICY "Folhas - User access" ON folhas FOR ALL USING (
    auth.role() = 'authenticated' AND (
        -- User created the folha
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() 
            AND u.funcionario_id IN (
                SELECT ff.funcionario_id FROM folha_funcionarios ff WHERE ff.folha_id = folhas.id
            )
        )
        -- User is supervisor
        OR supervisor_id = (SELECT funcionario_id FROM usuarios WHERE id = auth.uid())
        -- User is admin
        OR EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'supervisor')
        )
    )
);

-- Folha_funcionarios: Access follows folha access
CREATE POLICY "Folha_funcionarios - Follow folha access" ON folha_funcionarios FOR ALL USING (
    EXISTS (
        SELECT 1 FROM folhas f 
        WHERE f.id = folha_funcionarios.folha_id 
        -- RLS will automatically apply folha policies
    )
);

-- Fotos: Access follows folha access
CREATE POLICY "Fotos - Follow folha access" ON fotos FOR ALL USING (
    EXISTS (
        SELECT 1 FROM folhas f 
        WHERE f.id = fotos.folha_id
        -- RLS will automatically apply folha policies
    )
);

-- QR_codes: Read access for all, write access follows folha access
CREATE POLICY "QR_codes - Read for all" ON qr_codes FOR SELECT USING (true);
CREATE POLICY "QR_codes - Write follow folha access" ON qr_codes FOR INSERT OR UPDATE OR DELETE USING (
    EXISTS (
        SELECT 1 FROM folhas f 
        WHERE f.id = qr_codes.folha_id
        -- RLS will automatically apply folha policies
    )
);

-- Audit_log: Admins can read all, users can read their own actions
CREATE POLICY "Audit_log - Admin read all" ON audit_log FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);
CREATE POLICY "Audit_log - User read own" ON audit_log FOR SELECT USING (user_id = auth.uid());
