-- =========================================================================
-- Migration: 20250101000018_file_attachments.sql
-- Descrição: Sistema de anexos de ficheiros
-- =========================================================================

CREATE TYPE public.file_category AS ENUM ('document', 'photo', 'signature', 'certificate', 'manual', 'report', 'other');
CREATE TYPE public.file_access_level AS ENUM ('public', 'internal', 'restricted', 'confidential');

CREATE TABLE IF NOT EXISTS public.file_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Referência genérica
  entity_type TEXT NOT NULL, -- 'aircraft', 'employee', 'task', 'cleaning_form', etc.
  entity_id UUID NOT NULL,
  
  -- Dados do ficheiro
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  file_hash TEXT, -- Para detecção de duplicados
  
  -- Categoria e acesso
  category public.file_category DEFAULT 'document',
  access_level public.file_access_level DEFAULT 'internal',
  
  -- Storage (Supabase Storage)
  storage_bucket TEXT DEFAULT 'attachments',
  storage_path TEXT NOT NULL,
  public_url TEXT,
  
  -- Metadados
  title TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Upload info
  uploaded_by UUID REFERENCES public.employees(id),
  upload_source TEXT DEFAULT 'web', -- 'web', 'mobile', 'api'
  
  -- Processamento
  is_processed BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  preview_available BOOLEAN DEFAULT false,
  
  -- Versionamento
  version_number INTEGER DEFAULT 1,
  parent_file_id UUID REFERENCES public.file_attachments(id),
  
  -- Expiração
  expires_at TIMESTAMPTZ,
  
  sync_version INTEGER DEFAULT 1,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT public.now_utc(),
  updated_at TIMESTAMPTZ DEFAULT public.now_utc(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_file_attachments_entity ON public.file_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_category ON public.file_attachments(category);
CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_by ON public.file_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_attachments_hash ON public.file_attachments(file_hash);

-- Trigger para updated_at
CREATE TRIGGER update_file_attachments_updated_at
  BEFORE UPDATE ON public.file_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view accessible file attachments" ON public.file_attachments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      access_level IN ('public', 'internal') OR
      public.user_has_permission(auth.uid(), 'files.admin')
    )
  );

COMMENT ON TABLE public.file_attachments IS 'Sistema de anexos de ficheiros com Supabase Storage';

-- Log
DO $$ BEGIN RAISE NOTICE 'Migration 20250101000018_file_attachments.sql aplicada com sucesso'; END $$;
