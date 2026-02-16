-- ============================================================
-- DEESSA Foundation — Conference Registration: Payment Columns
-- Migration: 017-conference-payment-columns.sql
-- Run in Supabase SQL Editor. Safe to run multiple times (IF NOT EXISTS).
-- ============================================================

-- ── 1. Add payment & expiry columns ──────────────────────────────────────────
ALTER TABLE conference_registrations
  ADD COLUMN IF NOT EXISTS payment_status           TEXT    DEFAULT 'unpaid',
  --  'unpaid' | 'paid' | 'failed' | 'review'
  ADD COLUMN IF NOT EXISTS payment_amount           DECIMAL(10, 2),
  --  Fee charged. Always populated server-side from conference settings.
  ADD COLUMN IF NOT EXISTS payment_currency         TEXT    DEFAULT 'NPR',
  ADD COLUMN IF NOT EXISTS payment_provider         TEXT,
  --  'stripe' | 'khalti' | 'esewa'
  ADD COLUMN IF NOT EXISTS payment_id               TEXT,
  --  Prefixed provider ref: 'stripe:cs_live_...' / 'khalti:pidx' / 'esewa:uuid'
  ADD COLUMN IF NOT EXISTS provider_ref             TEXT,
  ADD COLUMN IF NOT EXISTS stripe_session_id        TEXT,
  ADD COLUMN IF NOT EXISTS khalti_pidx              TEXT,
  ADD COLUMN IF NOT EXISTS esewa_transaction_uuid   TEXT,
  ADD COLUMN IF NOT EXISTS expires_at               TIMESTAMPTZ,
  --  Null for admin-created / manually confirmed rows.
  --  Set to now() + 24h on self-service form submission.
  ADD COLUMN IF NOT EXISTS payment_override_by      TEXT;
  --  Admin email who performed a manual payment override, for audit.

-- ── 2. Migrate legacy 'pending' → 'pending_payment' ─────────────────────────
-- Old records used status = 'pending'. New code uses 'pending_payment'.
-- We keep both values valid; application layer treats them identically.
-- No destructive update — both spellings continue to work.

-- ── 3. Performance indexes ────────────────────────────────────────────────────

-- Fast expiry cron (only scans pending_payment rows)
CREATE INDEX IF NOT EXISTS idx_conf_reg_expires
  ON conference_registrations (expires_at)
  WHERE status IN ('pending_payment', 'pending') AND payment_status = 'unpaid';

-- Webhook reconciliation — find registration by Stripe session
CREATE INDEX IF NOT EXISTS idx_conf_reg_stripe_session
  ON conference_registrations (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- Webhook reconciliation — find registration by Khalti pidx
CREATE INDEX IF NOT EXISTS idx_conf_reg_khalti_pidx
  ON conference_registrations (khalti_pidx)
  WHERE khalti_pidx IS NOT NULL;

-- Webhook reconciliation — find registration by eSewa uuid
CREATE INDEX IF NOT EXISTS idx_conf_reg_esewa_uuid
  ON conference_registrations (esewa_transaction_uuid)
  WHERE esewa_transaction_uuid IS NOT NULL;

-- Index for admin dashboard payment_status filters
CREATE INDEX IF NOT EXISTS idx_conf_reg_payment_status
  ON conference_registrations (payment_status);

-- ── 4. RLS — Allow public payment-link page to read own record ────────────────
-- The application ALWAYS queries with (id = $1 AND email = $2).
-- This dual-key check is enforced in application code, not RLS,
-- because RLS cannot inspect arbitrary query params for unauthenticated users.
-- The existing broad SELECT policy is therefore sufficient; we add a note here.

-- Existing policy: "Allow admin reads" — FOR SELECT USING (auth.role() = 'authenticated')
-- For unauthenticated public reads (payment link page), we use the service-role
-- client in the API route which bypasses RLS, with the (id, email) check in code.

-- ── 5. payment_events table — register conference_registration_id column ─────
-- The payment_events table already exists (from 009-payment-security-hardening.sql).
-- We add an optional conference_registration_id column to allow idempotency
-- checks to be scoped to conference payments as well.
ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS conference_registration_id UUID REFERENCES conference_registrations (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_events_conf_reg
  ON payment_events (conference_registration_id)
  WHERE conference_registration_id IS NOT NULL;
