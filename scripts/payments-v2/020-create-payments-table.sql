-- Payment Architecture V2: Payments Table
-- Separates provider-specific payment details from donation metadata
-- Enables multiple payment attempts per donation and preserves raw provider data

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'stripe', 'khalti', 'esewa'
  transaction_id TEXT NOT NULL, -- Provider-specific transaction reference
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  verified_amount DECIMAL(10, 2), -- Amount verified from provider
  verified_currency TEXT, -- Currency verified from provider
  status TEXT NOT NULL, -- 'paid', 'pending', 'failed', 'refunded'
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB, -- Full provider response for debugging
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_donation_transaction UNIQUE (donation_id, transaction_id)
);

-- Index on donation_id for fast lookup by donation
CREATE INDEX IF NOT EXISTS idx_payments_donation ON payments(donation_id);

-- Index on provider and transaction_id for provider-specific lookups
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(provider, transaction_id);

-- Index on created_at for time-based queries and reporting
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE payments IS 'Stores provider-specific payment transaction details separate from donation records';
COMMENT ON COLUMN payments.transaction_id IS 'Provider-specific transaction reference (e.g., Stripe payment intent, Khalti pidx, eSewa transaction_uuid)';
COMMENT ON COLUMN payments.raw_payload IS 'Full provider response preserved for audit and debugging purposes';
