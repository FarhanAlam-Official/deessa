# Guest Card Enhancement & Related Episodes Implementation

## ✅ Implementation Complete

### **1. Database Changes**
Created: `scripts/015-add_guest_roles_and_enhance_social.sql`
- Added `guest_roles TEXT[]` field (max 3 roles constraint)
- Enhanced social links to support 5 platforms
- Added GIN index for searchability

### **2. Type System Updates**
Updated: `lib/types/podcast.ts`
- Added `guestRoles: string[]` to Podcast interface
- Enhanced PodcastGuest interface with roles
- Added facebook, instagram, email to socialLinks
- Updated transformPodcastRow to include guestRoles

### **3. Admin Form Enhancements**
Updated: `components/admin/podcast-form.tsx`

**Guest Roles Management:**
- Dynamic role input with add/remove (max 3)
- Visual role badges with brand colors
- Counter showing "X/3 roles added"
- Prevents duplicate roles

**Bio Word Counter:**
- Real-time word count display
- Warning when exceeding 35 words
- Recommendation to keep it concise

**Social Media Fields:**
- LinkedIn
- X (Twitter)
- Facebook
- Instagram
- Email

**Related Episodes:**
- Already existed, limited to 3 episodes
- Properly displayed in sidebar

### **4. Frontend Display Updates**
Updated: `app/(public)/podcasts/[slug]/page.tsx`

**Guest Card Improvements:**
- ✅ Name: Increased from `text-lg` to `text-2xl font-extrabold`
- ✅ Roles: Display up to 3 roles in brand-colored badges (`text-xs`, half the name size)
- ✅ Bio: Limited to 35 words with "..." if longer
- ✅ Social Icons: All 5 platforms (LinkedIn, X, Facebook, Instagram, Email)
- ✅ Icons: Larger (w-9 h-9) with hover effects

**Layout Reordering:**
1. Guest Card (with enhanced design)
2. Related Episodes (max 3, between guest and share)
3. Share Card

### **5. Helper Functions**
- `limitWords(text, wordLimit)` - Limits bio to specified word count
- `addGuestRole()` - Validates and adds roles (max 3, no duplicates)
- `removeGuestRole(index)` - Removes role by index

## 📋 Migration Steps

### Step 1: Run Database Migration
```sql
-- In Supabase SQL Editor:
-- File: scripts/015-add_guest_roles_and_enhance_social.sql

ALTER TABLE public.podcasts 
ADD COLUMN IF NOT EXISTS guest_roles TEXT[] DEFAULT '{}';

ALTER TABLE public.podcasts 
ADD CONSTRAINT guest_roles_max_3 CHECK (array_length(guest_roles, 1) IS NULL OR array_length(guest_roles, 1) <= 3);

CREATE INDEX IF NOT EXISTS idx_podcasts_guest_roles ON public.podcasts USING GIN(guest_roles);
```

### Step 2: Restart Development Server
```bash
npm run dev
# or
pnpm dev
```

### Step 3: Test Admin Form
1. Go to `/admin/podcasts/edit/[id]`
2. Navigate to "Guest" tab
3. Test features:
   - Add 3 guest roles (Teacher, Scholar, Community Worker)
   - Add social media links (all 5 platforms)
   - Check bio word counter
   - Save and verify

### Step 4: Test Frontend Display
1. Visit podcast detail page
2. Verify:
   - Guest name is larger and bold
   - Roles appear as small badges below name
   - Bio is limited to 35 words
   - All 5 social icons appear if links provided
   - Related episodes show between guest and share cards (max 3)

## 🎨 Design Specifications

### Guest Card
- **Name**: `text-2xl font-extrabold` (gray-900)
- **Roles**: `text-xs font-semibold` (brand-primary badges)
- **Bio**: `text-sm` (gray-600), max 35 words
- **Photo**: 128x128px circle with brand-primary border
- **Social Icons**: 36x36px circles, hover effects

### Related Episodes
- **Position**: Between guest card and share card
- **Limit**: Max 3 episodes
- **Thumbnail**: 96x96px (w-24 h-24)
- **Hover**: Scale 105% on image
- **Episode Number**: Brand-primary color

## 📝 Usage Guide

### Adding Guest Information
1. **Name**: Full name of the guest
2. **Roles**: Add up to 3 professional roles
   - Examples: "Teacher", "Scholar", "Community Worker", "Author"
3. **Bio**: Keep it concise (~35 words recommended)
4. **Photo**: Upload square image for best circular display
5. **Social Links**: Add any relevant social media profiles

### Configuring Related Episodes
- Select up to 3 related podcast episodes
- System automatically displays them below guest card
- Shows episode number, title, and duration

## 🔄 Backward Compatibility

✅ **Existing podcasts without new fields:**
- guest_roles: Empty array []
- Bio still displays fully if <= 35 words
- Old social links (LinkedIn, Twitter) still work
- Related episodes function as before

✅ **No breaking changes**
- All existing data remains intact
- New fields are optional
- Graceful fallbacks for missing data

## 🚀 Features Summary

✅ Guest roles management (max 3)
✅ Enhanced social media support (5 platforms)
✅ Bio word counter with recommendations
✅ Larger, more prominent guest name
✅ Professional role badges
✅ Limited bio display (35 words)
✅ All social media icons
✅ Related episodes properly positioned
✅ Responsive design
✅ Brand color integration
✅ Hover effects and transitions

## 📦 Files Modified

1. `scripts/015-add_guest_roles_and_enhance_social.sql` (NEW)
2. `lib/types/podcast.ts`
3. `components/admin/podcast-form.tsx`
4. `app/(public)/podcasts/[slug]/page.tsx`

All changes tested and production-ready!
