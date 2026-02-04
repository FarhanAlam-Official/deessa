-- ============================================================================
-- RECEIPT SYSTEM - COMPLETE SQL SETUP SCRIPT (FIXED VERSION)
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor and run it
-- This version safely handles re-running the script
-- ============================================================================

-- ============================================================================
-- PART 1: EXTEND DONATIONS TABLE WITH RECEIPT COLUMNS
-- ============================================================================

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS receipt_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_download_count INTEGER DEFAULT 0;

-- Create indexes for receipt lookups
CREATE INDEX IF NOT EXISTS donations_receipt_number_idx
  ON donations (receipt_number)
  WHERE receipt_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS donations_receipt_generated_idx
  ON donations (receipt_generated_at)
  WHERE receipt_generated_at IS NOT NULL;

-- ============================================================================
-- PART 2: CREATE RECEIPT AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS receipt_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS receipt_audit_log_donation_id_idx
  ON receipt_audit_log (donation_id);

CREATE INDEX IF NOT EXISTS receipt_audit_log_action_idx
  ON receipt_audit_log (action);

CREATE INDEX IF NOT EXISTS receipt_audit_log_created_at_idx
  ON receipt_audit_log (created_at DESC);

-- ============================================================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE receipt_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: DROP EXISTING POLICIES (if they exist) AND CREATE NEW ONES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view receipt logs" ON receipt_audit_log;
DROP POLICY IF EXISTS "System can insert receipt logs" ON receipt_audit_log;

-- Create policy: Admins can view receipt logs
CREATE POLICY "Admins can view receipt logs" ON receipt_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create policy: System can insert receipt logs
CREATE POLICY "System can insert receipt logs" ON receipt_audit_log
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PART 5: CONFIGURE ORGANIZATION DETAILS IN SITE SETTINGS
-- ============================================================================

-- Insert default organization settings (only if not exists)
INSERT INTO site_settings (key, value)
VALUES (
  'organization_details',
  jsonb_build_object(
    'name', 'Dessa Foundation',
    'vat_registration_number', '',
    'pan_number', '',
    'swc_registration_number', '',
    'address', '',
    'phone', '',
    'email', '',
    'logo_url', '',
    'receipt_prefix', 'RCP',
    'receipt_number_start', 1000
  )
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- PART 6: VERIFY INSTALLATION
-- ============================================================================

-- Check that all columns were added to donations table
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'donations' 
AND column_name LIKE 'receipt%'
ORDER BY column_name;

-- Check that receipt_audit_log table exists
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_name = 'receipt_audit_log';

-- Check that organization_details setting exists
SELECT 
  key, 
  value 
FROM site_settings 
WHERE key = 'organization_details';

-- ============================================================================
-- PART 7: CREATE STORAGE BUCKET FOR RECEIPTS
-- ============================================================================

-- Create receipts storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;

-- Create policy for public read access to receipts
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');

-- Create policy for authenticated users to upload receipts
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts');

-- ============================================================================
-- PART 8: VERIFY STORAGE SETUP
-- ============================================================================

-- Check that receipts bucket exists
SELECT 
  id, 
  name, 
  public 
FROM storage.buckets 
WHERE name = 'receipts';

-- ============================================================================
-- INSTALLATION COMPLETE
-- ============================================================================
-- 
-- If you see all verification queries return results above, the installation
-- was successful. You can now proceed with:
--
-- 1. Configure environment variables (.env.local)
-- 2. Set organization details in Admin > Settings > Organization
-- 3. Integrate receipt generation with payment webhooks
-- 4. Test with a sample donation
--
-- ============================================================================
