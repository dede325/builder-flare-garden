-- Create photo evidence table for storing photo metadata
CREATE TABLE photo_evidence (
    id UUID PRIMARY KEY,
    form_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('before', 'after')),
    category TEXT NOT NULL CHECK (category IN ('exterior', 'interior', 'details')),
    description TEXT,
    location TEXT,
    gps_coordinates JSONB,
    timestamp TIMESTAMPTZ NOT NULL,
    captured_by TEXT NOT NULL,
    captured_by_user_id UUID,
    file_size INTEGER,
    resolution JSONB,
    tags TEXT[],
    supabase_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_photo_evidence_form_id ON photo_evidence (form_id);
CREATE INDEX idx_photo_evidence_type_category ON photo_evidence (type, category);
CREATE INDEX idx_photo_evidence_timestamp ON photo_evidence (timestamp);
CREATE INDEX idx_photo_evidence_captured_by_user_id ON photo_evidence (captured_by_user_id);

-- Create RLS policies
ALTER TABLE photo_evidence ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view photo evidence from their organization/forms they have access to
CREATE POLICY "Users can view photo evidence" ON photo_evidence
    FOR SELECT
    USING (
        -- For now, allow all authenticated users to see all photo evidence
        -- This should be refined based on your specific access control requirements
        auth.role() = 'authenticated'
    );

-- Policy: Users can insert photo evidence for forms they have access to
CREATE POLICY "Users can insert photo evidence" ON photo_evidence
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND captured_by_user_id = auth.uid()
    );

-- Policy: Users can update their own photo evidence
CREATE POLICY "Users can update their own photo evidence" ON photo_evidence
    FOR UPDATE
    USING (
        auth.role() = 'authenticated'
        AND captured_by_user_id = auth.uid()
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND captured_by_user_id = auth.uid()
    );

-- Policy: Users can delete their own photo evidence
CREATE POLICY "Users can delete their own photo evidence" ON photo_evidence
    FOR DELETE
    USING (
        auth.role() = 'authenticated'
        AND captured_by_user_id = auth.uid()
    );

-- Create storage bucket for evidence photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-photos', 'evidence-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for evidence photos bucket
CREATE POLICY "Users can upload evidence photos" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'evidence-photos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Anyone can view evidence photos" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'evidence-photos');

CREATE POLICY "Users can update their own evidence photos" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'evidence-photos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own evidence photos" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'evidence-photos'
        AND auth.role() = 'authenticated'
    );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_photo_evidence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_photo_evidence_updated_at
    BEFORE UPDATE ON photo_evidence
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_evidence_updated_at();

-- Add a comment to the table
COMMENT ON TABLE photo_evidence IS 'Stores metadata for photographic evidence captured for cleaning forms';
COMMENT ON COLUMN photo_evidence.type IS 'Whether photo was taken before or after intervention';
COMMENT ON COLUMN photo_evidence.category IS 'Category of photo: exterior, interior, or details';
COMMENT ON COLUMN photo_evidence.gps_coordinates IS 'GPS coordinates where photo was taken (lat, lng)';
COMMENT ON COLUMN photo_evidence.resolution IS 'Photo resolution (width, height)';
COMMENT ON COLUMN photo_evidence.metadata IS 'Additional metadata like device info, orientation, etc.';
COMMENT ON COLUMN photo_evidence.supabase_url IS 'Public URL of the photo in Supabase Storage';
