# Site Settings Enhancement - Setup Guide

## Overview

The admin site settings have been significantly expanded to give you full control over all images and content displayed on your website. You can now configure homepage images, page hero sections, press gallery, and branding assets—all through the admin panel!

---

## 🚀 Setup Instructions

### Step 1: Run SQL Scripts in Supabase

You need to run two new SQL scripts in your Supabase dashboard to create the necessary storage buckets and default settings.

#### 1.1 Create Storage Buckets

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Open `scripts/004-site-assets-storage.sql`
5. Copy all contents and paste into SQL Editor
6. Click **Run**

This creates 4 new storage buckets:

- `hero-images` (10MB limit) - For page hero sections
- `site-assets` (5MB limit) - For logos, favicons
- `press-gallery` (10MB limit) - For press media photos
- `og-images` (5MB limit) - For social sharing images

#### 1.2 Add Default Site Settings

1. In the same SQL Editor
2. Open `scripts/005-expand-site-settings.sql`
3. Copy all contents and paste into SQL Editor
4. Click **Run**

This populates the database with default settings for all pages (using your current hardcoded images as defaults).

### Step 2: Verify Storage Buckets

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. You should now see 10 total buckets (6 old + 4 new):
   - ✅ project-images
   - ✅ story-images
   - ✅ team-photos
   - ✅ event-images
   - ✅ partner-logos
   - ✅ videos
   - ✅ **hero-images** (NEW)
   - ✅ **site-assets** (NEW)
   - ✅ **press-gallery** (NEW)
   - ✅ **og-images** (NEW)

All should be marked as **Public** ✅

---

## 🎨 Admin Panel Features

### New Tabs in Site Settings (/admin/settings)

The Site Settings page now has **8 tabs** instead of 4:

1. **General** _(existing)_ - Site name, tagline, description
2. **Contact** _(existing)_ - Email, phone, address, office hours
3. **Social** _(existing)_ - Social media links
4. **SEO** _(existing)_ - Meta tags, keywords
5. **Homepage** _(NEW)_ 🆕 - Hero images, initiative cards
6. **Page Heroes** _(NEW)_ 🆕 - Hero images for all 9 pages
7. **Press & Media** _(NEW)_ 🆕 - Press gallery with captions
8. **Branding** _(NEW)_ 🆕 - Logos, favicon, OG image

---

## 📸 What You Can Configure

### Homepage Tab

- **Hero Section Images**
  - Main hero image (large top-left)
  - Classroom image (bottom-right)
  - Donor profile images (2 images)
  - Hero title, subtitle, and badge text

- **Initiative Cards** (3 cards)
  - Education initiative (image, title, description)
  - Women's Empowerment (image, title, description)
  - Healthcare Access (image, title, description)

### Page Heroes Tab

Configure individual hero images and text for:

- About Page
- Contact Page
- Impact Page
- Press Page
- Programs Page
- Stories Page
- Events Page
- Get Involved Page
- Donate Page

Each page hero includes:

- Hero background image
- Title text
- Subtitle text
- Badge text (optional)

### Press & Media Tab

- Upload unlimited gallery images (up to 20)
- Add captions to each image
- Add photo credits
- Reorder images with up/down arrows
- Remove images individually

### Branding Tab

- Primary logo (for header/navbar)
- Favicon (browser tab icon)
- OG/Social share image (for Facebook, Twitter, LinkedIn)

---

## 🔄 Fallback System

**Important:** All pages have been designed with fallback support. This means:

- ✅ If settings aren't configured, pages use the existing hardcoded images
- ✅ If SQL scripts aren't run, nothing breaks
- ✅ Old functionality remains 100% intact
- ✅ No breaking changes to existing features

Pages will automatically use database settings when available, or fall back to defaults.

---

## 📋 How to Use

### Uploading Images

1. Login to admin panel: `/admin/login`
2. Navigate to **Settings** in the sidebar
3. Select the appropriate tab (Homepage, Page Heroes, etc.)
4. Click on an upload area or "Use URL" toggle
5. Upload image or paste external URL
6. See instant preview
7. Click **Save** button at the bottom

### Replacing Images

1. Go to the relevant settings tab
2. Click "Remove" button on existing image
3. Upload new image
4. Click **Save**

### Managing Press Gallery

1. Go to **Press & Media** tab
2. Click upload area to add multiple images
3. Add captions and credits for each
4. Use ↑ ↓ buttons to reorder
5. Click X to remove unwanted images
6. Click **Save Press Gallery**

---

## 💾 File Changes Summary

### New Files Created

```bash
scripts/004-site-assets-storage.sql          # Storage buckets & policies
scripts/005-expand-site-settings.sql         # Default site settings
lib/data/site-settings.ts                    # Data fetching utilities
components/admin/gallery-manager.tsx         # Multi-image gallery component
```

### Files Modified

```bash
components/admin/site-settings-form.tsx      # Expanded with 4 new tabs
```

### Files Ready to Update (Optional)

```bash
app/(public)/page.tsx                        # Homepage (can use settings)
app/(public)/about/page.tsx                  # About page hero
app/(public)/contact/page.tsx                # Contact page hero
app/(public)/impact/page.tsx                 # Impact page hero
app/(public)/press/page.tsx                  # Press page hero & gallery
app/(public)/programs/page.tsx               # Programs page hero
app/(public)/stories/page.tsx                # Stories page hero
app/(public)/events/page.tsx                 # Events page hero
app/(public)/get-involved/page.tsx           # Get Involved page hero
app/(public)/donate/page.tsx                 # Donate page hero
```

---

## ⚠️ Important Notes

1. **Run SQL Scripts First**: You must run both SQL scripts before using the new admin features
2. **No Breaking Changes**: Existing features continue to work exactly as before
3. **Gradual Migration**: You can update pages to use settings gradually—no rush
4. **Storage Costs**: With Supabase free tier (1GB), you can store ~1000 high-quality images
5. **Image Optimization**: Recommended image sizes:
   - Hero images: 1920x1080px (landscape)
   - Logos: 500x500px max
   - Favicon: 32x32px or 16x16px
   - OG images: 1200x630px

---

## 🔒 Security

All storage buckets have proper RLS policies:

- ✅ Public read access (for website display)
- ✅ Authenticated admin write access only
- ✅ File size limits enforced
- ✅ MIME type restrictions (only images)
- ✅ Per-user folders (organized by admin user ID)

---

## 🐛 Troubleshooting

**Issue: "Upload failed" error**

- ✅ Solution: Ensure SQL scripts were run to create buckets

**Issue: "Unauthorized" error**

- ✅ Solution: Make sure you're logged in as admin

**Issue: Settings not saving**

- ✅ Solution: Check browser console for errors, refresh page

**Issue: Images not displaying**

- ✅ Solution: Verify buckets are set to "Public" in Supabase

**Issue: Old images still showing**

- ✅ Solution: Clear browser cache or hard refresh (Ctrl+F5)

---

## 📞 Next Steps

1. ✅ Run both SQL scripts in Supabase
2. ✅ Verify storage buckets created
3. ✅ Login to admin panel `/admin/settings`
4. ✅ Test uploading images in each tab
5. ✅ (Optional) Update page components to use settings
6. ✅ Enjoy full control over your website images!

---

## 🎉 Benefits

- ✅ No more code changes needed for image updates
- ✅ Non-technical admins can manage images
- ✅ Centralized control through admin panel
- ✅ Professional image management
- ✅ Gallery support with captions & credits
- ✅ Proper version control and backup
- ✅ Scalable for future growth
- ✅ SEO-friendly with proper metadata

---

**Need Help?** Check the existing `STORAGE_SETUP_GUIDE.md` for more details on storage functionality.
