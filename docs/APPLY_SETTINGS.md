# Apply Site Settings to Database

## ⚠️ Important: Run SQL Scripts First

Your homepage is now connected to the database settings, but you need to populate the database first.

## Steps to Apply

### 1. Run Storage Setup Script

Go to your Supabase dashboard → SQL Editor and run:

```
scripts/004-site-assets-storage.sql
```

This creates the storage buckets for hero images, site assets, press gallery, and OG images.

### 2. Run Default Settings Script

Then run:

```
scripts/005-expand-site-settings.sql
```

This populates the `site_settings` table with all your current hardcoded URLs as defaults.

### 3. Verify Settings

After running both scripts:

1. Go to your admin panel: `/admin/settings`
2. You should see all the default images loaded
3. Now you can update any image and it will reflect on the homepage!

## What's Changed

✅ **Homepage Hero Section** - Now uses database settings for:

- Main hero image
- Classroom image  
- Hero title, subtitle, badge
- Donor avatars

✅ **Initiative Cards** - Now uses database settings for:

- Education initiative (title, description, image)
- Women's Empowerment (title, description, image)
- Healthcare Access (title, description, image)

## Troubleshooting

**If images still don't show after updating:**

1. Check browser console for errors
2. Verify the SQL scripts ran successfully
3. Clear your browser cache (Ctrl+Shift+Delete)
4. Check Supabase storage buckets have correct RLS policies
5. Verify the image URLs are accessible in Supabase dashboard

**Database connection:**

- Settings are cached by Next.js for performance
- After updating in admin, the page will automatically revalidate
- If you don't see changes, try refreshing the page

## Next Steps

You can now update other pages (About, Contact, Events, etc.) to use their hero settings from the database using the `getPageHeroSettings()` function!
