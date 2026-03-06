-- Admin Transaction Detail Page Schema
-- This migration adds tables and columns needed for the admin transaction detail page

-- ============================================================================
-- 1. Create review_notes table
-- ============================================================================
-- Stores multiple timestamped review notes for each donation
CREATE TABLE IF NOT EXISTS review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_notes_donation ON review_notes(donation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_notes_admin ON review_notes(admin_user_id);

-- Add comment for documentation
COMMENT ON TABLE review_notes IS 'Stores multiple timestamped review notes for donations';
COMMENT ON COLUMN review_notes.note_text IS 'Review note text, supports markdown formatting';

-- ============================================================================
-- 2. Create status_change_log table
-- ============================================================================
-- Audit log for all payment status changes made by admins
CREATE TABLE IF NOT EXISTS status_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_status_change_log_donation ON status_change_log(donation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_change_log_admin ON status_change_log(admin_user_id);

-- Add comment for documentation
COMMENT ON TABLE status_change_log IS 'Audit log of all payment status changes';
COMMENT ON COLUMN status_change_log.reason IS 'Mandatory reason for status change (min 10 characters)';

-- ============================================================================
-- 3. Add review_status column to donations table
-- ============================================================================
-- Separate review status from payment status for clean separation of concerns
ALTER TABLE donations ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'unreviewed';
ALTER TABLE donations ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES admin_users(id);

-- Add check constraint for valid review statuses
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_review_status'
  ) THEN
    ALTER TABLE donations ADD CONSTRAINT check_review_status 
      CHECK (review_status IN ('unreviewed', 'verified', 'flagged', 'refunded'));
  END IF;
END $$;

-- Create index for review status queries
CREATE INDEX IF NOT EXISTS idx_donations_review_status ON donations(review_status);

-- Add comments for documentation
COMMENT ON COLUMN donations.review_status IS 'Administrative review status (separate from payment_status)';
COMMENT ON COLUMN donations.reviewed_at IS 'Timestamp when donation was last reviewed';
COMMENT ON COLUMN donations.reviewed_by IS 'Admin user who last reviewed the donation';

-- ============================================================================
-- 4. Create additional indexes for transaction detail page performance
-- ============================================================================
-- These indexes optimize queries for the transaction detail page
CREATE INDEX IF NOT EXISTS idx_payment_events_donation_created ON payment_events(donation_id, created_at DESC);

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify tables were created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_notes') THEN
    RAISE EXCEPTION 'review_notes table was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'status_change_log') THEN
    RAISE EXCEPTION 'status_change_log table was not created';
  END IF;
  
  RAISE NOTICE 'Admin transaction detail schema migration completed successfully';
END $$;
