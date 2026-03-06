-- Payment Architecture V2: Performance Indexes
-- Adds indexes on donations and payment_events for common query patterns

-- Donations table indexes for payment processing queries
CREATE INDEX IF NOT EXISTS idx_donations_payment_status ON donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_provider_ref ON donations(provider_ref);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);

-- Additional indexes for provider-specific lookups (if not already created in 009-payment-security-hardening.sql)
-- These support fast lookups by provider reference in webhook/callback handlers
CREATE INDEX IF NOT EXISTS idx_donations_stripe_session ON donations(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_khalti_pidx ON donations(khalti_pidx) WHERE khalti_pidx IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_esewa_uuid ON donations(esewa_transaction_uuid) WHERE esewa_transaction_uuid IS NOT NULL;

-- Payment events indexes for audit and reconciliation queries
CREATE INDEX IF NOT EXISTS idx_payment_events_donation ON payment_events(donation_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_created ON payment_events(created_at DESC);

-- Composite index for finding stuck donations (pending + old)
CREATE INDEX IF NOT EXISTS idx_donations_stuck ON donations(payment_status, created_at) 
  WHERE payment_status = 'pending';

-- Composite index for review queue monitoring
CREATE INDEX IF NOT EXISTS idx_donations_review ON donations(payment_status, created_at) 
  WHERE payment_status = 'review';

-- Add comments for documentation
COMMENT ON INDEX idx_donations_payment_status IS 'Supports queries filtering by payment status';
COMMENT ON INDEX idx_donations_provider_ref IS 'Supports lookups by provider reference';
COMMENT ON INDEX idx_donations_stuck IS 'Optimizes queries for stuck pending donations (reconciliation)';
COMMENT ON INDEX idx_donations_review IS 'Optimizes queries for donations requiring manual review';
