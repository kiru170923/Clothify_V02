-- QR Codes Feature Schema
-- Run this in Supabase SQL Editor

-- 1. QR Codes Table
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- QR Identifier
  code VARCHAR(255) UNIQUE NOT NULL,  -- Unique code for QR (used in URL)
  name VARCHAR(255),                   -- User-friendly name for the QR
  
  -- Clothing Image Info
  clothing_image_url TEXT NOT NULL,    -- URL of the clothing image
  wardrobe_item_id UUID,               -- Optional: if created from wardrobe
  
  -- Usage Tracking
  total_scans INTEGER DEFAULT 0,
  successful_tryons INTEGER DEFAULT 0,
  tokens_spent INTEGER DEFAULT 0,
  
  -- Limits & Status
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER,                    -- Optional: max number of uses
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional: expiry date
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  CONSTRAINT valid_max_uses CHECK (max_uses IS NULL OR max_uses > 0)
);

-- 2. QR Scan History Table
CREATE TABLE IF NOT EXISTS qr_scan_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE NOT NULL,
  
  -- Result Info
  user_image_url TEXT,                 -- Image uploaded by scanner
  result_image_url TEXT,               -- Try-on result URL
  
  -- Tracking
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),              -- IPv4 or IPv6
  user_agent TEXT,
  success BOOLEAN DEFAULT false,       -- Whether try-on was successful
  error_message TEXT                   -- If failed, store error
);

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_code ON qr_codes(code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON qr_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_qr_scan_history_qr_code_id ON qr_scan_history(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_history_scanned_at ON qr_scan_history(scanned_at DESC);

-- 4. Row Level Security (RLS)
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qr_codes

-- Users can view their own QR codes
CREATE POLICY "Users can view own QR codes"
  ON qr_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own QR codes
CREATE POLICY "Users can create own QR codes"
  ON qr_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own QR codes
CREATE POLICY "Users can update own QR codes"
  ON qr_codes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own QR codes
CREATE POLICY "Users can delete own QR codes"
  ON qr_codes FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view active QR codes (for scanning)
CREATE POLICY "Public can view active QR codes"
  ON qr_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- RLS Policies for qr_scan_history

-- QR code owners can view scan history
CREATE POLICY "QR owners can view scan history"
  ON qr_scan_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM qr_codes 
      WHERE qr_codes.id = qr_scan_history.qr_code_id 
      AND qr_codes.user_id = auth.uid()
    )
  );

-- Service role can insert scan history (for public API)
CREATE POLICY "Service role can insert scan history"
  ON qr_scan_history FOR INSERT
  WITH CHECK (true);  -- This will be restricted by service role key

-- 5. Functions

-- Function to generate unique QR code
CREATE OR REPLACE FUNCTION generate_unique_qr_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-character alphanumeric code
    new_code := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM qr_codes WHERE code = new_code) INTO code_exists;
    
    -- If unique, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update qr_codes.updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment scan count
CREATE OR REPLACE FUNCTION increment_qr_scan(qr_code_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE qr_codes
  SET 
    total_scans = total_scans + 1,
    last_scanned_at = NOW()
  WHERE id = qr_code_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to increment successful try-on count
CREATE OR REPLACE FUNCTION increment_successful_tryon(qr_code_id_param UUID, tokens_used INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE qr_codes
  SET 
    successful_tryons = successful_tryons + 1,
    tokens_spent = tokens_spent + tokens_used
  WHERE id = qr_code_id_param;
END;
$$ LANGUAGE plpgsql;

-- 6. Sample Data (for testing - remove in production)
-- Uncomment to insert test data
/*
INSERT INTO qr_codes (user_id, code, name, clothing_image_url, is_active)
VALUES (
  auth.uid(),
  generate_unique_qr_code(),
  'Áo polo test',
  'https://example.com/sample-clothing.jpg',
  true
);
*/

-- 7. Useful Views

-- View: QR Codes with Analytics
CREATE OR REPLACE VIEW qr_codes_with_analytics AS
SELECT 
  qc.*,
  COUNT(DISTINCT qsh.id) as total_history_records,
  COUNT(DISTINCT qsh.id) FILTER (WHERE qsh.success = true) as successful_scans,
  ROUND(
    CASE 
      WHEN qc.total_scans > 0 
      THEN (qc.successful_tryons::numeric / qc.total_scans::numeric * 100)
      ELSE 0 
    END::numeric, 
    2
  ) as success_rate_percent,
  CASE
    WHEN qc.max_uses IS NOT NULL AND qc.total_scans >= qc.max_uses THEN 'max_uses_reached'
    WHEN qc.expires_at IS NOT NULL AND qc.expires_at < NOW() THEN 'expired'
    WHEN qc.is_active = false THEN 'disabled'
    ELSE 'active'
  END as status
FROM qr_codes qc
LEFT JOIN qr_scan_history qsh ON qc.id = qsh.qr_code_id
GROUP BY qc.id;

-- Grant permissions on view
GRANT SELECT ON qr_codes_with_analytics TO authenticated;

COMMENT ON TABLE qr_codes IS 'Stores QR codes generated by users for virtual try-on';
COMMENT ON TABLE qr_scan_history IS 'Tracks all QR code scans and try-on attempts';
COMMENT ON FUNCTION generate_unique_qr_code IS 'Generates a unique 8-character alphanumeric code for QR';
COMMENT ON FUNCTION increment_qr_scan IS 'Increments scan count when QR is scanned';
COMMENT ON FUNCTION increment_successful_tryon IS 'Increments successful try-on count and tokens spent';

