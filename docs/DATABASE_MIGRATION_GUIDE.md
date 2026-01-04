# 🗄️ Database Migration Guide

## Run This First! ⚠️

Before using the new Homepage Content Management System, you **MUST** run this database migration.

---

## Option 1: Supabase Dashboard (Recommended)

### Steps

1. **Open Supabase Dashboard**
   - Go to: <https://supabase.com/dashboard>
   - Select your project: "Deesha Foundation"

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New Query"

3. **Copy Migration SQL**
   - Open file: `scripts/006-media-assets.sql`
   - Copy ALL content (Ctrl+A, Ctrl+C)

4. **Paste and Run**
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - Wait for "Success" message

5. **Verify**
   - Check for success message: "Success. No rows returned"
   - Or check the "Database" section for new `media_assets` table

---

## Option 2: Supabase CLI

### Prerequisites

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login
```

### Run Migration

```bash
# From project root directory
cd "d:\Web Codes\Projects\Deesha Foundation"

# Link to your project (first time only)
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push

# Or apply specific migration
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/006-media-assets.sql
```

---

## Option 3: Local PostgreSQL

If running locally for testing:

```bash
# Connect to your local database
psql -U postgres -d deesha_foundation

# Run the migration
\i scripts/006-media-assets.sql

# Verify table was created
\dt media_assets
```

---

## ✅ Verification Steps

After running the migration, verify it worked:

### 1. Check Table Exists

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'media_assets';
```

Expected result: 1 row showing "media_assets"

### 2. Check Columns

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'media_assets';
```

Expected result: 15 columns (id, filename, bucket, url, etc.)

### 3. Check Indexes

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'media_assets';
```

Expected result: 5-6 indexes

### 4. Check Policies

```sql
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'media_assets';
```

Expected result: 4 policies (view, insert, update, delete)

---

## 🐛 Troubleshooting

### **Error: "relation already exists"**

**Solution**: Table already created. You're good to go!

### **Error: "permission denied"**

**Solution**: Make sure you're logged in as database owner or admin

### **Error: "function gen_random_uuid() does not exist"**

**Solution**: Run this first:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### **Error: "cannot execute CREATE TABLE in a read-only transaction"**

**Solution**: You're connected to a read-only replica. Connect to primary database.

---

## 📊 What Gets Created

### **Tables**

- `media_assets` - Main table for tracking all media files

### **Indexes** (5 indexes for fast queries)

- `idx_media_assets_type` - Filter by type (image/video)
- `idx_media_assets_bucket` - Filter by bucket
- `idx_media_assets_uploaded_by` - Filter by uploader
- `idx_media_assets_created_at` - Sort by date
- `idx_media_assets_is_deleted` - Filter non-deleted
- `idx_media_assets_search` - Full-text search

### **Functions**

- `update_media_assets_updated_at()` - Auto-update timestamp

### **Triggers**

- `media_assets_updated_at` - Runs on every update

### **Policies** (Row Level Security)

- "Admins can view all media"
- "Admins can insert media"
- "Admins can update media"
- "Admins can delete media"

---

## 🔒 Security Notes

✅ **Row Level Security (RLS)** is enabled  
✅ Only authenticated admins can access  
✅ Policies enforce permission checks  
✅ Soft delete prevents accidental data loss  

---

## 📝 Migration Details

**File**: `scripts/006-media-assets.sql`  
**Lines**: ~150  
**Time**: < 1 second  
**Destructive**: No (only creates, doesn't modify existing tables)  
**Reversible**: Yes (can drop table if needed)  

---

## ⏮️ Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Drop table (WARNING: This deletes all data!)
DROP TABLE IF EXISTS media_assets CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_media_assets_updated_at() CASCADE;
```

**Note**: Only do this if absolutely necessary!

---

## ✅ After Migration

Once migration is complete:

1. ✅ Restart your Next.js dev server
2. ✅ Go to `/admin/media`
3. ✅ Try uploading a file
4. ✅ Check it appears in the table:

   ```sql
   SELECT * FROM media_assets LIMIT 5;
   ```

---

## 🎉 Success

If you see this, you're ready:

- ✅ Table `media_assets` exists
- ✅ 15 columns present
- ✅ 5+ indexes created
- ✅ 4 RLS policies active
- ✅ Trigger function working

**You can now use the Homepage Content Management System!**

Go to: [Quick Start Guide](./QUICK_START_HOMEPAGE_CMS.md)

---

**Need Help?** Check the [Full Documentation](./HOMEPAGE_CONTENT_MANAGEMENT.md)
