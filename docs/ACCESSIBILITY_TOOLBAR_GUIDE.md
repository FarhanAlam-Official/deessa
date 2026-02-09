# Accessibility Toolbar - Quick Start Guide

## 📍 Location

The accessibility toolbar appears at the top of podcast pages (can be added to any page).

## 🎯 Features

### 1. Text Size Adjustment
- **Normal**: Default 16px base font size
- **Large**: 18px base font size (increases all text proportionally)
- **X-Large**: 20px base font size (maximum enlargement)

**How to use**: Click the "Type" icon button repeatedly to cycle through sizes.

**What it affects**:
- Body text increases
- Headings scale proportionally
- Button text and labels
- All readable content

### 2. High Contrast Mode
Enhances readability with stronger color contrasts:
- Pure black text on white backgrounds
- Thicker borders
- Bold font weights for links and buttons
- Underlined links for clarity
- Increased image contrast

**How to use**: Click the "Contrast" icon to toggle on/off.

**Best for**: Users with visual impairments or low vision.

### 3. Transcript Toggle (Podcast Detail Pages Only)
Shows/hides the full episode transcript.

**How to use**: Click the "FileText" icon to toggle transcript visibility.

**Features**:
- Searchable transcript text
- Clickable timestamps
- Highlighted search results

### 4. Persistent Settings
All accessibility preferences are:
- ✅ Saved automatically
- ✅ Applied across all pages
- ✅ Persistent across browser sessions
- ✅ Specific to your device

### 5. Minimize/Show
- Click the "X" to minimize the toolbar to a floating button
- Click the floating button to restore full toolbar

## 🎨 Design Integration

### Ocean Blue Theme
The toolbar uses your brand colors:
- Active states: Ocean Blue (#3FABDE)
- Hover effects: Deep Ocean (#0B5F8A)
- Consistent with site design

### Mobile Responsive
- Full labels on desktop
- Icon-only on mobile
- Touch-friendly button sizes
- Sticky positioning

## 🔧 Technical Details

### Implementation
```tsx
import AccessibilityToolbar from '@/components/accessibility-toolbar'

// Basic usage (all pages)
<AccessibilityToolbar />

// With transcript toggle (podcast detail pages)
<AccessibilityToolbar 
  showTranscriptToggle={true}
  onTranscriptToggle={(show) => {
    // Handle transcript visibility
  }}
/>
```

### CSS Classes Applied
```css
/* Text sizes */
body.text-normal  // Default
body.text-large   // 18px base
body.text-xlarge  // 20px base

/* High contrast */
body.high-contrast
```

### Browser Support
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## 📱 Adding to Other Pages

To add the accessibility toolbar to any page:

### Option 1: Per-Page Basis
```tsx
// In your page component
import AccessibilityToolbar from '@/components/accessibility-toolbar'

export default function MyPage() {
  return (
    <>
      <AccessibilityToolbar />
      {/* Rest of your page */}
    </>
  )
}
```

### Option 2: Site-Wide (Recommended)
Add to your layout file:

```tsx
// app/(public)/layout.tsx
import AccessibilityToolbar from '@/components/accessibility-toolbar'

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <AccessibilityToolbar />
      {children}
      <Footer />
    </>
  )
}
```

## 🎯 User Benefits

### For Users with Visual Impairments
- ✅ Larger text reduces eye strain
- ✅ High contrast improves readability
- ✅ All features keyboard accessible

### For Dyslexic Users
- ✅ Comic Neue font (dyslexia-friendly)
- ✅ Adjustable spacing via text size
- ✅ High contrast reduces visual noise

### For Senior Users
- ✅ Larger touch targets
- ✅ Clear, simple controls
- ✅ Immediate visual feedback

### For All Users
- ✅ Personal reading preferences
- ✅ No account needed
- ✅ Works instantly

## ⚡ Performance

- **Initial load**: ~2KB gzipped
- **Minimal re-renders**: Uses React state efficiently
- **No external dependencies**: Pure React + Tailwind
- **Optimized**: CSS changes only affect necessary elements

## ♿ WCAG Compliance

The toolbar helps achieve:
- **WCAG 2.1 Level AA** compliance
- **Section 508** requirements
- **ADA** digital accessibility standards

Specific criteria met:
- ✅ 1.4.3 Contrast (Minimum) - High contrast mode
- ✅ 1.4.4 Resize Text - Text size adjustment
- ✅ 1.4.8 Visual Presentation - User control over presentation
- ✅ 2.1.1 Keyboard - All controls keyboard accessible

## 🚀 Future Enhancements

Possible additions:
- [ ] Font family switcher (serif/sans-serif/dyslexic)
- [ ] Line height adjustment
- [ ] Letter spacing control
- [ ] Color scheme switcher (light/dark/sepia)
- [ ] Reading mode (focus current paragraph)
- [ ] Text-to-speech integration

## 📞 Support

If users report accessibility issues:
1. Verify browser compatibility
2. Check localStorage is enabled
3. Clear browser cache if settings not persisting
4. Test in incognito mode
5. Check console for errors

---

**Pro Tip**: The toolbar's first-time help message only shows once per user. Users can dismiss it with "Got it" button.
