-- Payment Architecture V2: Receipts Table
-- Separates receipt metadata from donation data
-- Enables receipt regeneration and tracks access patterns

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_url TEXT NOT NULL, -- Supabase Storage path
  pdf_url TEXT, -- Cached PDF path (optional)
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ, -- Email sent timestamp
  download_count INT NOT NULL DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_donation_receipt UNIQUE (donation_id)
);

-- Index on donation_id for fast lookup by donation
CREATE INDEX IF NOT EXISTS idx_receipts_donation ON receipts(donation_id);

-- Index on receipt_number for receipt lookup by number
CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);

-- Index on generated_at for time-based queries and reporting
CREATE INDEX IF NOT EXISTS idx_receipts_generated_at ON receipts(generated_at DESC);

-- Add comments for documentation
COMMENT ON TABLE receipts IS 'Stores receipt metadata separate from donation records to enable regeneration and track access';
COMMENT ON COLUMN receipts.receipt_number IS 'Unique receipt identifier in format RCP-YYYY-NNNNN (5-digit sequence, resets yearly)';
COMMENT ON COLUMN receipts.receipt_url IS 'Path to receipt HTML in Supabase Storage';
COMMENT ON COLUMN receipts.pdf_url IS 'Path to cached PDF version (optional optimization)';
COMMENT ON COLUMN receipts.download_count IS 'Number of times receipt has been downloaded for analytics';
