-- Payment security hardening migration
-- Adds strict provider references to donations and an idempotency ledger for provider events.

-- 1) Extend donations with strict provider reference columns
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_ref TEXT,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS khalti_pidx TEXT,
  ADD COLUMN IF NOT EXISTS esewa_transaction_uuid TEXT,
  ADD COLUMN IF NOT EXISTS esewa_transaction_code TEXT;

-- Helpful indexes / uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS donations_stripe_session_id_uq
  ON donations (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS donations_stripe_subscription_id_uq
  ON donations (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS donations_khalti_pidx_uq
  ON donations (khalti_pidx)
  WHERE khalti_pidx IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS donations_esewa_transaction_uuid_uq
  ON donations (esewa_transaction_uuid)
  WHERE esewa_transaction_uuid IS NOT NULL;

CREATE INDEX IF NOT EXISTS donations_provider_ref_idx
  ON donations (provider, provider_ref);

-- 2) Payment events ledger for replay/idempotency protection
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_events_provider_event_id_uq
  ON payment_events (provider, event_id);

CREATE INDEX IF NOT EXISTS payment_events_donation_id_idx
  ON payment_events (donation_id);


