-- Currency Support Enhancement
-- This migration ensures proper currency handling for donations

-- Add currency column if it doesn't exist (for backwards compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donations' AND column_name = 'currency'
  ) THEN
    ALTER TABLE donations ADD COLUMN currency TEXT DEFAULT 'NPR';
  END IF;
END $$;

-- Update the default to 'NPR' for existing NULL values
UPDATE donations SET currency = 'NPR' WHERE currency IS NULL;

-- Add an index on currency for better query performance
CREATE INDEX IF NOT EXISTS idx_donations_currency ON donations(currency);

-- Create a view for multi-currency donation statistics
CREATE OR REPLACE VIEW donation_stats_by_currency AS
SELECT 
  currency,
  COUNT(*) as total_donations,
  SUM(amount) as total_amount,
  COUNT(CASE WHEN is_monthly THEN 1 END) as monthly_donations,
  COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_donations,
  SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as completed_amount
FROM donations
GROUP BY currency;

-- Create a function to get currency symbol
CREATE OR REPLACE FUNCTION get_currency_symbol(currency_code TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE currency_code
    WHEN 'USD' THEN '$'
    WHEN 'NPR' THEN '₨'
    WHEN 'INR' THEN '₹'
    WHEN 'EUR' THEN '€'
    WHEN 'GBP' THEN '£'
    ELSE currency_code
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a comment to the currency column
COMMENT ON COLUMN donations.currency IS 'Currency code (e.g., USD, NPR, INR) for the donation amount';

-- Grant select on the view to authenticated users (optional, adjust based on your RLS needs)
GRANT SELECT ON donation_stats_by_currency TO authenticated;
