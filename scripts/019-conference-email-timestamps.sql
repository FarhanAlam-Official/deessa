-- ── Migration 019: Conference activity timestamps ────────────────────────────
-- Adds nullable TIMESTAMPTZ columns to track when key lifecycle events and
-- emails last occurred for each conference registration.
-- All columns are nullable — existing rows are unaffected.

ALTER TABLE conference_registrations
  -- Email tracking (last-sent; null = never sent / pre-feature)
  ADD COLUMN IF NOT EXISTS last_registration_email_sent_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_confirmation_email_sent_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_cancellation_email_sent_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_custom_email_sent_at        TIMESTAMPTZ,
  -- Payment lifecycle timestamps
  ADD COLUMN IF NOT EXISTS payment_initiated_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_paid_at                  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_failed_at                TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_review_at                TIMESTAMPTZ,
  -- Registration status timestamps
  ADD COLUMN IF NOT EXISTS confirmed_at                     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at                     TIMESTAMPTZ;

-- Email columns
COMMENT ON COLUMN conference_registrations.last_registration_email_sent_at
  IS 'Last time the registration-received email was sent (or re-sent) to the attendee.';
COMMENT ON COLUMN conference_registrations.last_confirmation_email_sent_at
  IS 'Last time the confirmation email was sent (or re-sent) to the attendee.';
COMMENT ON COLUMN conference_registrations.last_cancellation_email_sent_at
  IS 'Last time the cancellation email was sent to the attendee.';
COMMENT ON COLUMN conference_registrations.last_custom_email_sent_at
  IS 'Last time a custom or template email was sent to the attendee via admin.';

-- Payment lifecycle columns
COMMENT ON COLUMN conference_registrations.payment_initiated_at
  IS 'When the registrant first initiated payment (provider redirect started).';
COMMENT ON COLUMN conference_registrations.payment_paid_at
  IS 'When payment was verified as paid (webhook, verify API, or admin override).';
COMMENT ON COLUMN conference_registrations.payment_failed_at
  IS 'When payment was last confirmed as failed by the gateway or admin.';
COMMENT ON COLUMN conference_registrations.payment_review_at
  IS 'When the payment was flagged for admin review (amount/currency mismatch).';

-- Status timestamps
COMMENT ON COLUMN conference_registrations.confirmed_at
  IS 'When the registration status was set to confirmed.';
COMMENT ON COLUMN conference_registrations.cancelled_at
  IS 'When the registration was cancelled.';
