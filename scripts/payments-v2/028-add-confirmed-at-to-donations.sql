-- Payment Architecture V2: Add confirmed_at to donations table
-- 
-- PaymentService.confirmDonation() records when a payment was confirmed.
-- This column was missing from donations (it only existed on conference_registrations),
-- causing the V2 UPDATE to fail with "column confirmed_at does not exist".

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Index for reconciliation queries (find confirmed donations within a date range)
CREATE INDEX IF NOT EXISTS idx_donations_confirmed_at
  ON donations (confirmed_at DESC)
  WHERE confirmed_at IS NOT NULL;

COMMENT ON COLUMN donations.confirmed_at IS 'Timestamp when payment was confirmed by PaymentService V2';
