# Story Print Feature

> **Version:** 1.0.0  
> **Last Updated:** April 4, 2026  
> **Status:** ✅ Implemented

---

## Overview

The print feature allows users to print stories in a clean, professional format optimized for paper. The feature is available on the public story detail page.

---

## Features

### ✅ Implemented

1. **Print Button**
   - Located in the sidebar "Share" section
   - One-click printing
   - Uses browser's native print dialog

2. **Print-Optimized Layout**
   - Clean, professional formatting
   - Removes navigation, sidebars, and decorative elements
   - Optimized for A4 paper size
   - Proper margins (1.5cm)

3. **Print Header**
   - DEESSA Foundation logo
   - Website URL
   - Only visible when printing

4. **Story Metadata**
   - Title
   - Published date
   - Category
   - Read time
   - Excerpt
   - Only visible when printing

5. **Content Formatting**
   - Proper typography for print
   - Page break management
   - Image optimization
   - Link URLs shown in parentheses
   - Clean blockquotes and lists

6. **Hidden Elements**
   - Navigation bars
   - Sidebars
   - Buttons
   - Videos (can't be printed)
   - Decorative backgrounds

---

## User Guide

### How to Print a Story (Public Page)

1. **Navigate to a story:**
   - Go to any published story page
   - Example: `https://deessafoundation.org/stories/story-slug`

2. **Click the Print button:**
   - Located in the right sidebar
   - Under the "Share" section
   - Icon: 🖨️ Printer

3. **Print dialog opens:**
   - Browser's native print dialog
   - Preview the print layout
   - Adjust settings if needed

4. **Print or Save as PDF:**
   - Click "Print" to send to printer
   - Or "Save as PDF" to create a PDF file

### How to Print a Story (Admin Page) ✨ NEW

1. **Navigate to story editor:**
   - Go to `/admin/stories/[id]`
   - Open any story for editing

2. **Click "Print Draft" button:**
   - Located in bottom action bar
   - Next to Preview and Save buttons
   - Icon: 🖨️ Printer

3. **Print dialog opens:**
   - Shows story with metadata
   - **DRAFT watermark** for unpublished stories
   - Clean layout for review

4. **Use cases:**
   - Offline proofreading
   - Editorial review meetings
   - Approval workflows
   - Archiving drafts

### Print Settings Recommendations

**For best results:**
- **Paper size:** A4 or Letter
- **Orientation:** Portrait
- **Margins:** Default (or 1.5cm)
- **Scale:** 100%
- **Background graphics:** Off (not needed)
- **Headers and footers:** Optional

---

## Technical Implementation

### Files Created

1. **Print Button Component**
   - Location: `components/ui/print-button.tsx`
   - Reusable component
   - Can be used anywhere

2. **Print Styles**
   - Location: `app/print-styles.css`
   - Media query: `@media print`
   - Comprehensive print formatting

3. **Updated Story Page**
   - Location: `app/(public)/stories/[slug]/page.tsx`
   - Added print button
   - Added print-only metadata
   - Added print-only header

4. **Updated Admin Story Form** ✨ NEW
   - Location: `components/admin/story-form.tsx`
   - Added "Print Draft" button
   - Added DRAFT watermark for unpublished stories
   - Added print-only metadata section
   - Hides form controls when printing

### Print Button Component

```tsx
import { PrintButton } from "@/components/ui/print-button"

// Basic usage
<PrintButton />

// Custom variant
<PrintButton variant="outline" />

// Custom size
<PrintButton size="sm" />

// Custom text
<PrintButton>Print Story</PrintButton>
```

### Print Styles Overview

The print styles handle:

- **Layout:** Single column, no sidebars
- **Typography:** Optimized font sizes (12pt body, 24pt title)
- **Colors:** Black text on white background
- **Images:** Max width 100%, proper spacing
- **Page breaks:** Avoid breaking headings, paragraphs
- **Links:** Show URLs after link text
- **Videos:** Hidden (can't print)
- **Layout blocks:** Simplified for print

---

## Browser Compatibility

### ✅ Fully Supported

- **Chrome/Edge:** Excellent print preview and PDF export
- **Firefox:** Good print support
- **Safari:** Good print support

### Print Dialog Features

| Browser | Print Preview | Save as PDF | Page Setup |
|---------|--------------|-------------|------------|
| Chrome  | ✅ Excellent  | ✅ Yes      | ✅ Yes     |
| Firefox | ✅ Good       | ✅ Yes      | ✅ Yes     |
| Safari  | ✅ Good       | ✅ Yes      | ✅ Yes     |
| Edge    | ✅ Excellent  | ✅ Yes      | ✅ Yes     |

---

## Print Layout

### What's Included

✅ **Printed:**
- DEESSA Foundation header
- Story title
- Published date, category, read time
- Story excerpt
- Full story content
- Images (optimized)
- Text formatting (bold, italic, headings, lists)
- Blockquotes
- Layout blocks (simplified)

❌ **Not Printed:**
- Navigation bars
- Sidebars
- Buttons
- Share buttons
- Related stories section
- Videos (replaced with note)
- Decorative backgrounds
- Gradients and shadows

### Page Layout

```
┌─────────────────────────────────────┐
│  DEESSA Foundation                  │
│  www.deessafoundation.org           │
├─────────────────────────────────────┤
│                                     │
│  Story Title                        │
│  Published: Date | Category | Time │
│  Excerpt text...                    │
│                                     │
│  Story content starts here...       │
│  Paragraphs, headings, images...    │
│                                     │
│  [Image with caption]               │
│                                     │
│  More content...                    │
│                                     │
└─────────────────────────────────────┘
```

---

## Future Enhancements

### Potential Improvements

1. **Custom Print Layout Options**
   - Choose what to include/exclude
   - Font size adjustment
   - Include/exclude images

2. **Print Statistics**
   - Track how many times stories are printed
   - Popular stories for printing

3. **PDF Download Button**
   - Direct PDF download without print dialog
   - Pre-generated PDFs for popular stories

4. **Print-Friendly Sharing**
   - Email PDF version
   - Download as Word document

5. **Admin Print Features**
   - Print draft stories for review
   - Print with edit notes
   - Batch print multiple stories

---

## Troubleshooting

### Common Issues

**Print button doesn't work:**
- Check if JavaScript is enabled
- Try refreshing the page
- Use browser's print function (Ctrl+P / Cmd+P)

**Layout looks wrong in print preview:**
- Check browser zoom is at 100%
- Try different paper size (A4 vs Letter)
- Update browser to latest version

**Images don't print:**
- Check "Background graphics" setting
- Some browsers hide images by default
- Try "Save as PDF" instead

**Text is cut off:**
- Adjust margins in print settings
- Try landscape orientation for wide content
- Reduce scale to 90% or 80%

**Videos show as blank:**
- This is expected (videos can't be printed)
- Videos are automatically hidden in print view

---

## Testing Checklist

### Before Deployment

- [ ] Print button appears on story page
- [ ] Print button triggers print dialog
- [ ] Print preview shows clean layout
- [ ] Story title and metadata visible
- [ ] Content is readable and well-formatted
- [ ] Images are included and sized properly
- [ ] Navigation and sidebars are hidden
- [ ] Page breaks work correctly
- [ ] Links show URLs in print
- [ ] Videos are hidden
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test "Save as PDF" functionality
- [ ] Test with different paper sizes
- [ ] Test with long stories (multiple pages)
- [ ] Test with stories containing images
- [ ] Test with stories containing layout blocks

---

## Related Documentation

- **User Guide:** [Admin User Guide](admin-user-guide.md)
- **Developer Docs:** [Developer Documentation](developer-documentation.md)
- **Back to:** [Documentation Index](README.md)

---

**Last Updated:** April 4, 2026  
**Version:** 1.0.0  
**Status:** ✅ Ready for use
