-- Payment Architecture V2: Enhance Payment Events Table
-- Adds event type classification, raw payload storage, and processing timestamp
-- Ensures unique constraint for idempotency

-- Add new columns to existing payment_events table
ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS event_type TEXT, -- 'webhook', 'callback', 'manual'
  ADD COLUMN IF NOT EXISTS raw_payload JSONB,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure unique constraint exists on (provider, event_id) for idempotency
-- Drop if exists and recreate to ensure consistency
DROP INDEX IF EXISTS payment_events_provider_event_id_uq;
CREATE UNIQUE INDEX payment_events_provider_event_id_uq
  ON payment_events (provider, event_id);

-- Ensure index on donation_id exists for audit queries
CREATE INDEX IF NOT EXISTS idx_payment_events_donation ON payment_events(donation_id);

-- Ensure index on created_at exists for time-based queries
CREATE INDEX IF NOT EXISTS idx_payment_events_created ON payment_events(created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN payment_events.event_type IS 'Classification of event source: webhook, callback, or manual';
COMMENT ON COLUMN payment_events.raw_payload IS 'Full provider event payload preserved for audit and debugging';
COMMENT ON COLUMN payment_events.processed_at IS 'Timestamp when event was processed by PaymentService';
