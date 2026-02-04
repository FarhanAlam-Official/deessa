-- Receipt System Migration
-- Adds receipt generation, storage, and organization details support

-- 1) Extend donations table with receipt-related columns
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS receipt_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_download_count INTEGER DEFAULT 0;

-- Create index for receipt lookups
CREATE INDEX IF NOT EXISTS donations_receipt_number_idx
  ON donations (receipt_number)
  WHERE receipt_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS donations_receipt_generated_idx
  ON donations (receipt_generated_at)
  WHERE receipt_generated_at IS NOT NULL;

-- 2) Ensure site_settings table exists and add organization details
-- (site_settings table should already exist from 002-admin-schema.sql)
-- Insert default organization settings if not exists
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

-- 3) Create receipts audit log table for tracking
CREATE TABLE IF NOT EXISTS receipt_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'generated', 'sent', 'downloaded', 'resent'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS receipt_audit_log_donation_id_idx
  ON receipt_audit_log (donation_id);

CREATE INDEX IF NOT EXISTS receipt_audit_log_action_idx
  ON receipt_audit_log (action);

-- 4) Enable RLS on new tables
ALTER TABLE receipt_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for receipt_audit_log
CREATE POLICY "Admins can view receipt logs" ON receipt_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "System can insert receipt logs" ON receipt_audit_log
  FOR INSERT WITH CHECK (true);
