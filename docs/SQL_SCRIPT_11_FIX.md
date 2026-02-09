# SQL Script 11 - Fixed Version

## What Was the Error?

```
Error: Failed to run sql query: ERROR: 42710: policy "Admins can view receipt logs" 
for table "receipt_audit_log" already exists
```

This error occurred because the SQL script was run before, and the policies already existed.

---

## What's Fixed

The updated SQL script now:
1. **Drops existing policies** before creating new ones
2. **Drops existing storage policies** before creating new ones
3. Uses `DROP POLICY IF EXISTS` to safely remove old policies
4. Then creates the policies fresh

This means you can run the script multiple times without errors.

---

## How to Fix

### Option 1: Run the Fixed Script (Recommended)

1. Open Supabase: https://app.supabase.com
2. Go to: SQL Editor → New Query
3. Copy the script from: `SQL_SCRIPT_11_COPY_PASTE.md`
4. Paste into SQL Editor
5. Click "Run"

The fixed script will:
- Drop old policies
- Create new policies
- Complete successfully ✅

### Option 2: Manual Fix (If you want to understand what happened)

Run these commands in Supabase SQL Editor:

```sql
-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view receipt logs" ON receipt_audit_log;
DROP POLICY IF EXISTS "System can insert receipt logs" ON receipt_audit_log;

-- Drop storage policies
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;

-- Now run the full script from SQL_SCRIPT_11_COPY_PASTE.md
```

---

## Verification

After running the fixed script, you should see:

✅ All verification queries return results
✅ No errors in the output
✅ Receipt columns added to donations table
✅ receipt_audit_log table created
✅ Policies created successfully
✅ Storage bucket created

---

## Next Steps

1. ✅ Run the fixed SQL script
2. ✅ Configure Google Email (see: `docs/GOOGLE_EMAIL_SETUP.md`)
3. ✅ Set Organization Details (Admin > Settings > Organization)
4. ✅ Add to Payment Webhooks
5. ✅ Test with a sample donation

---

## Files Updated

- `scripts/011-receipt-system-complete.sql` - Fixed version
- `SQL_SCRIPT_11_COPY_PASTE.md` - Fixed version with DROP POLICY commands

---

**The error is now fixed!** 🎉

Just copy the script from `SQL_SCRIPT_11_COPY_PASTE.md` and run it again.
