# 🚀 Quick Start Guide - Homepage Content Management

## Step-by-Step Setup (5 Minutes)

### 1️⃣ **Run Database Migration** (2 min)

Open Supabase SQL Editor and run:

```sql
-- Copy all content from: scripts/006-media-assets.sql
-- Then execute it
```

✅ This creates the `media_assets` table with all necessary columns and indexes.

---

### 2️⃣ **Verify Everything Works** (3 min)

#### Test Media Library

1. Go to: `http://localhost:3000/admin/media`
2. Click "Upload Media"
3. Upload a test image
4. Verify it appears in the grid
5. Try search functionality
6. Click the three dots → Copy URL

#### Test Homepage Manager

1. Go to: `http://localhost:3000/admin/homepage`
2. Click "Hero Section" tab
3. Click "Add Video" button
4. Switch between tabs (Library, Upload, URL)
5. Click "Select Image" for Main Image
6. Browse library and select an image
7. Edit hero title and subtitle
8. Click "Save Hero Section"

#### Test from Site Settings

1. Go to: `http://localhost:3000/admin/settings`
2. See two new buttons at the top:
   - **Homepage Manager** (blue)
   - **Media Library** (purple)
3. Click them to navigate

---

## 🎯 Common Tasks

### **Upload and Use a Hero Video**

```
1. Admin → Media Library
2. Upload Media → Upload video file (MP4 recommended)
3. Admin → Homepage Manager
4. Hero Section tab → Add Video
5. Browse Library → Select your video
6. Configure settings:
   ✅ Autoplay: ON
   ✅ Loop: ON
   ✅ Muted: ON (required for autoplay)
   ✅ Controls: OFF
7. Add thumbnail image (optional)
8. Save Video Settings
9. Save Hero Section
```

### **Change Initiative Images**

```bash
1. Admin → Homepage Manager
2. Initiatives tab
3. Click "Select Image" for any initiative
4. Pick from library OR upload new
5. Edit title/description if needed
6. Save Initiatives
```

### **Organize Media Files**

```bash
1. Admin → Media Library
2. Use search to find files
3. Filter by Type (Images/Videos)
4. Filter by Bucket
5. Delete unused files (shows usage warning)
6. Copy URLs for use elsewhere
```

---

## ✅ Features at a Glance

| Feature | Location | What It Does |
|---------|----------|--------------|
| **Media Library** | `/admin/media` | Central hub for all media files |
| **Homepage Manager** | `/admin/homepage` | Edit homepage content visually |
| **Media Picker** | Various places | Select from existing or upload new |
| **Video Picker** | Homepage Manager | Configure hero videos |
| **Usage Tracking** | Media Library | See where files are used (coming soon) |

---

## 🎨 What You Can Now Do

✅ **Upload once, use everywhere** - No more re-uploading!  
✅ **Configure hero video** - With playback controls  
✅ **Select from library** - Browse all uploaded media  
✅ **Delete unused files** - Keep storage clean  
✅ **Professional UI** - Grid/list views, search, filters  
✅ **Track usage** - Know where media is used  
✅ **Bulk operations** - Select multiple files at once  

---

## 🔗 Important Links

- **Media Library**: [/admin/media](/admin/media)
- **Homepage Manager**: [/admin/homepage](/admin/homepage)
- **Site Settings**: [/admin/settings](/admin/settings)
- **Full Documentation**: [docs/HOMEPAGE_CONTENT_MANAGEMENT.md](HOMEPAGE_CONTENT_MANAGEMENT.md)

---

## 🛟 Need Help?

**Can't find uploaded files?**
→ Check filter settings (Type, Bucket)

**Upload fails?**
→ Check file size (Images: 10MB max, Videos: 50MB max)

**Video not playing?**
→ Use MP4 format with H.264 codec

**Changes not appearing?**
→ Hard refresh browser (Ctrl+Shift+R)

---

## 📱 Pro Tips

1. 💡 **Use WebP format** for images (smaller file size)
2. 🎬 **Compress videos** before upload (use HandBrake)
3. 🗂️ **Name files descriptively** for easier search
4. 🗑️ **Delete unused media** weekly to save storage
5. 📋 **Use Media Picker** instead of manual URLs

---

## 🎉 You're All Set

Your comprehensive Homepage Content Management System is ready to use!

**What's Next?**

- Start uploading your media files
- Configure your homepage hero section
- Customize initiative cards
- Explore the media library features

For detailed documentation, see: [HOMEPAGE_CONTENT_MANAGEMENT.md](HOMEPAGE_CONTENT_MANAGEMENT.md)

---

**Happy Managing! 🚀**
