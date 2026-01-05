# Currency Handling Documentation

## Overview

This document explains how multi-currency donations are handled in the Deesha Foundation platform, particularly for Stripe (USD) and local payment gateways (NPR).

## Problem Statement

Previously, when donations were made through Stripe in USD (e.g., $250), they were being stored in the database correctly with `currency: "USD"`, but the admin dashboard was displaying them as "Rs 250" (Indian Rupees) because it was hardcoding the currency symbol for all donations.

## Solution

We've implemented a comprehensive multi-currency system that:

1. **Properly stores currency information** in the database
2. **Displays correct currency symbols** ($ for USD, ₨ for NPR, ₹ for INR)
3. **Supports multiple currencies** in the admin dashboard
4. **Provides utility functions** for consistent currency formatting across the app

## Changes Made

### 1. Database Schema Enhancement

**File:** `scripts/008-currency-support.sql`

- Ensures `currency` column exists on the `donations` table
- Sets default currency to 'NPR' for backwards compatibility
- Creates a database view `donation_stats_by_currency` for aggregated statistics
- Adds a PostgreSQL function `get_currency_symbol()` for database-level formatting
- Creates an index on the currency column for better performance

To apply this migration:

```sql
-- Run in your Supabase SQL Editor
\i scripts/008-currency-support.sql
```

### 2. Currency Utility Functions

**File:** `lib/utils/currency.ts`

A comprehensive set of utility functions for currency handling:

- `getCurrencySymbol()` - Get symbol for a currency code
- `formatCurrency()` - Format amount with symbol and options
- `formatCurrencyLocale()` - Format using Intl.NumberFormat
- `parseCurrency()` - Parse currency string to number
- `convertCurrency()` - Mock conversion between currencies
- `formatMultiCurrencyTotal()` - Display multiple currency totals

**Supported Currencies:**

- USD (US Dollar) - $
- NPR (Nepali Rupee) - ₨
- INR (Indian Rupee) - ₹
- EUR (Euro) - €
- GBP (British Pound) - £

### 3. Admin Dashboard Updates

**File:** `app/admin/donations/page.tsx`

- Updated `getDonationStats()` to aggregate donations by currency
- Modified the "Total Donations" card to show totals for each currency
- Updated the donations table to display amounts with correct currency symbols
- Imported and integrated the `formatCurrency()` utility

**Before:**

```tsx
₹{donation.amount.toLocaleString()}
```

**After:**

```tsx
{formatCurrency(donation.amount, donation.currency, { showCode: true })}
// Displays: $250.00 USD or ₨250.00 NPR
```

### 4. Success Page Updates

**File:** `app/(public)/donate/success/success-content.tsx`

- Integrated currency formatting utility
- Removed hardcoded currency symbols
- Now correctly displays the currency based on the donation record

## How It Works

### Donation Flow

1. **User selects payment provider:**
   - Stripe → Currency: USD
   - Khalti → Currency: NPR
   - eSewa → Currency: NPR

2. **Donation record is created:**

   ```typescript
   const currency = provider === "stripe" 
     ? settings.defaultCurrency || "USD" 
     : "NPR"
   
   await supabase.from("donations").insert({
     amount: input.amount,
     currency, // USD or NPR
     // ... other fields
   })
   ```

3. **Display in admin dashboard:**

   ```typescript
   formatCurrency(donation.amount, donation.currency, { showCode: true })
   // Results:
   // Stripe: $250.00 USD
   // Khalti: ₨250.00 NPR
   // eSewa: ₨250.00 NPR
   ```

### Multi-Currency Totals

The admin dashboard now shows separate totals for each currency:

```bash
Total Donations
$5,250.00 USD
₨125,000.00 NPR
```

This prevents mixing currencies and provides clear visibility into donations by currency.

## Usage Examples

### Format a simple amount

```typescript
import { formatCurrency } from "@/lib/utils/currency"

// With currency code
formatCurrency(250, "USD") // "$250.00"
formatCurrency(250, "NPR") // "₨250.00"

// With options
formatCurrency(250, "USD", { showCode: true }) // "$250.00 USD"
formatCurrency(250.50, "NPR", { decimals: 0 }) // "₨251"
```

### Get currency symbol

```typescript
import { getCurrencySymbol } from "@/lib/utils/currency"

getCurrencySymbol("USD") // "$"
getCurrencySymbol("NPR") // "₨"
getCurrencySymbol("INR") // "₹"
getCurrencySymbol(null) // "₨" (default)
```

### Display multi-currency totals

```typescript
import { formatMultiCurrencyTotal } from "@/lib/utils/currency"

const totals = {
  USD: 5250,
  NPR: 125000
}

formatMultiCurrencyTotal(totals)
// "$5,250.00 USD + ₨125,000.00 NPR"

// With conversion display
formatMultiCurrencyTotal(totals, { 
  showConversion: true, 
  baseCurrency: "USD" 
})
// "$5,250.00 USD + ₨125,000.00 NPR (≈$943.40)"
```

## Testing

### Test Currency Display

1. **Make a Stripe donation in USD:**
   - Go to `/donate`
   - Select Stripe payment method
   - Enter amount (e.g., $250)
   - Complete payment
   - Check admin dashboard shows: `$250.00 USD`

2. **Make a Khalti donation in NPR:**
   - Go to `/donate`
   - Select Khalti payment method
   - Enter amount (e.g., 2500)
   - Complete payment
   - Check admin dashboard shows: `₨2,500.00 NPR`

3. **Check multi-currency totals:**
   - Admin dashboard should show separate totals for USD and NPR
   - Each should have the correct symbol and currency code

### Database Verification

```sql
-- Check currency distribution
SELECT currency, COUNT(*), SUM(amount)
FROM donations
WHERE payment_status = 'completed'
GROUP BY currency;

-- Use the stats view
SELECT * FROM donation_stats_by_currency;

-- Test the currency symbol function
SELECT id, amount, currency, get_currency_symbol(currency) as symbol
FROM donations
LIMIT 10;
```

## Migration Path

If you have existing donations without currency information:

1. Run the migration script: `scripts/008-currency-support.sql`
2. All NULL currency values will be set to 'NPR' (default)
3. The admin dashboard will automatically display them correctly

## Future Enhancements

1. **Real-time currency conversion:**
   - Integrate with exchange rate API (e.g., exchangerate-api.io)
   - Update `convertCurrency()` function to use live rates

2. **Multi-currency reporting:**
   - Add filters to view donations by currency
   - Export reports with currency breakdown
   - Charts showing donation trends by currency

3. **Currency preferences:**
   - Allow donors to see amounts in their preferred currency
   - Store conversion rate at time of donation
   - Display both original and converted amounts

## Troubleshooting

### Issue: Old donations showing wrong currency

**Solution:** Run the migration script to set default currency for existing records:

```sql
UPDATE donations SET currency = 'NPR' WHERE currency IS NULL;
```

### Issue: Wrong currency symbol displayed

**Solution:** Check that the currency code in the database matches supported currencies:

```sql
SELECT DISTINCT currency FROM donations;
```

### Issue: Totals not showing multiple currencies

**Solution:** Ensure you're using the updated `getDonationStats()` function that groups by currency.

## Related Files

- `lib/utils/currency.ts` - Currency utility functions
- `lib/actions/donation.ts` - Donation creation logic
- `app/admin/donations/page.tsx` - Admin dashboard
- `app/(public)/donate/success/success-content.tsx` - Success page
- `scripts/008-currency-support.sql` - Database migration
- `lib/payments/stripe.ts` - Stripe payment integration
- `lib/payments/khalti.ts` - Khalti payment integration
- `lib/payments/esewa.ts` - eSewa payment integration

## Support

If you encounter any issues with currency handling:

1. Check the database to verify currency is stored correctly
2. Review the browser console for any formatting errors
3. Ensure the migration script has been applied
4. Check that payment provider configuration matches expected currency
