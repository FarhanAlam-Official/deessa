-- ==========================================================
-- DEESSA Foundation — Conference Registrations Table
-- Run this in the Supabase SQL Editor for your project.
-- This is SEPARATE from the existing event_registrations table.
-- ==========================================================

CREATE TABLE IF NOT EXISTS conference_registrations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ DEFAULT now(),

  -- Step 1: Personal Details
  full_name        TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  organization     TEXT,

  -- Step 2: Participation Details
  role             TEXT,          -- 'attendee' | 'speaker' | 'panelist' | 'volunteer' | 'sponsor'
  attendance_mode  TEXT,          -- 'in-person' | 'online'
  workshops        TEXT[],        -- selected workshop titles

  -- Step 3: Additional Info & Accessibility
  dietary_preference        TEXT,      -- 'none' | 'vegetarian' | 'vegan' | 'gluten-free' | 'other'
  tshirt_size               TEXT,      -- 'S' | 'M' | 'L' | 'XL' | 'XXL'
  heard_via                 TEXT[],    -- 'social' | 'newsletter' | 'friend' | 'website'
  emergency_contact_name    TEXT,
  emergency_contact_phone   TEXT,

  -- Consent
  consent_terms      BOOLEAN DEFAULT false,
  consent_newsletter BOOLEAN DEFAULT false,

  -- Registration status
  status         TEXT DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'cancelled'
  notes          TEXT,

  -- Useful indices
  CONSTRAINT conference_registrations_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for quick lookups by email and status
CREATE INDEX IF NOT EXISTS idx_conference_reg_email   ON conference_registrations(email);
CREATE INDEX IF NOT EXISTS idx_conference_reg_status  ON conference_registrations(status);
CREATE INDEX IF NOT EXISTS idx_conference_reg_created ON conference_registrations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE conference_registrations ENABLE ROW LEVEL SECURITY;

-- Public users can INSERT their own registration (no auth required)
CREATE POLICY "Allow public inserts" ON conference_registrations
  FOR INSERT WITH CHECK (true);

-- Admin users (authenticated) can read all registrations
CREATE POLICY "Allow admin reads" ON conference_registrations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin users can update status / notes
CREATE POLICY "Allow admin updates" ON conference_registrations
  FOR UPDATE USING (auth.role() = 'authenticated');
