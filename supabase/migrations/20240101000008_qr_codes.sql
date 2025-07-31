-- Create QR codes table for storing QR code metadata
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_code TEXT NOT NULL UNIQUE,
    form_id UUID NOT NULL,
    qr_data TEXT NOT NULL, -- Base64 encoded QR code image
    qr_url TEXT, -- URL embedded in the QR code
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_qr_codes_form_code ON qr_codes (form_code);
CREATE INDEX idx_qr_codes_form_id ON qr_codes (form_id);
CREATE INDEX idx_qr_codes_generated_at ON qr_codes (generated_at);
CREATE INDEX idx_qr_codes_is_active ON qr_codes (is_active);

-- Create RLS policies
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view active QR codes
CREATE POLICY "Users can view active QR codes" ON qr_codes
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND is_active = true
    );

-- Policy: Users can insert QR codes
CREATE POLICY "Users can insert QR codes" ON qr_codes
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Policy: Users can update QR codes they have access to
CREATE POLICY "Users can update QR codes" ON qr_codes
    FOR UPDATE
    USING (
        auth.role() = 'authenticated'
    )
    WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_qr_codes_updated_at
    BEFORE UPDATE ON qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_qr_codes_updated_at();

-- Function to increment access count when QR code is accessed
CREATE OR REPLACE FUNCTION increment_qr_access(qr_form_code TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE qr_codes 
    SET 
        access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE form_code = qr_form_code AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Add foreign key constraint to cleaning_forms if the table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cleaning_forms') THEN
        ALTER TABLE qr_codes 
        ADD CONSTRAINT fk_qr_codes_form_id 
        FOREIGN KEY (form_id) REFERENCES cleaning_forms(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Function to generate unique form codes
CREATE OR REPLACE FUNCTION generate_form_code(
    p_location TEXT DEFAULT NULL,
    p_shift TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT := 'AP-PS';
    v_series TEXT := 'SNR';
    v_sequence TEXT;
    v_timestamp TEXT;
    v_code TEXT;
    v_exists BOOLEAN;
    v_attempt INTEGER := 0;
    v_max_attempts INTEGER := 10;
BEGIN
    -- Generate timestamp in format DDMMAAHHMMSS
    v_timestamp := TO_CHAR(NOW(), 'DDMMYYHH24MISS');
    
    LOOP
        v_attempt := v_attempt + 1;
        
        -- Generate sequence number (01-99)
        v_sequence := LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 99 + 1)::TEXT, 2, '0');
        
        -- Construct the code
        v_code := v_prefix || '-' || v_series || v_sequence || '-' || v_timestamp;
        
        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM cleaning_forms WHERE code = v_code
        ) INTO v_exists;
        
        -- If code doesn't exist or we've tried too many times, return it
        IF NOT v_exists OR v_attempt >= v_max_attempts THEN
            EXIT;
        END IF;
        
        -- Wait a bit to ensure different timestamp
        PERFORM PG_SLEEP(0.001);
    END LOOP;
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Add comments to the table and columns
COMMENT ON TABLE qr_codes IS 'Stores QR code metadata for cleaning forms';
COMMENT ON COLUMN qr_codes.form_code IS 'Unique form code in format AP-PS-SNR##-DDMMAAHHMMSS';
COMMENT ON COLUMN qr_codes.qr_data IS 'Base64 encoded QR code image data';
COMMENT ON COLUMN qr_codes.qr_url IS 'URL that the QR code points to';
COMMENT ON COLUMN qr_codes.access_count IS 'Number of times this QR code has been scanned';
COMMENT ON COLUMN qr_codes.last_accessed_at IS 'Timestamp of last QR code scan';

-- Create a view for active QR codes with form information
CREATE VIEW active_qr_codes AS
SELECT 
    qc.id,
    qc.form_code,
    qc.form_id,
    qc.qr_url,
    qc.generated_at,
    qc.access_count,
    qc.last_accessed_at,
    cf.date as form_date,
    cf.location as form_location,
    cf.status as form_status
FROM qr_codes qc
LEFT JOIN cleaning_forms cf ON qc.form_id = cf.id
WHERE qc.is_active = true
ORDER BY qc.generated_at DESC;

-- Grant appropriate permissions
GRANT SELECT ON active_qr_codes TO authenticated;
