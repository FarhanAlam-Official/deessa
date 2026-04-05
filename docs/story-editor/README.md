# Story Editor Modernization — Documentation

> **Version:** 1.0.0  
> **Last Updated:** April 4, 2026  
> **Documentation Suite**: Complete User & Technical Reference

---

## 📚 Documentation Index

This comprehensive documentation suite covers the DEESSA Foundation Story Editor Modernization from user guides to technical implementation details.

### Quick Navigation by Role

**✍️ For Content Editors & Admin Users**
- Start here: [**Admin User Guide**](admin-user-guide.md)
- Key tasks: Creating stories, formatting content, uploading images, using layout blocks

**👨‍💻 For Developers**
- Start here: [**Developer Documentation**](developer-documentation.md)
- Key resources: Architecture, component structure, extension points, testing

**🔧 For Support Staff**
- Start here: [**Troubleshooting Guide**](troubleshooting-guide.md)
- Key tasks: Resolving common issues, error recovery, browser compatibility

---

## 📖 Complete Documentation Files

### [Admin User Guide](admin-user-guide.md)
**Audience**: Content editors, admin users, story managers

- Getting started with the rich text editor
- Text formatting options (bold, italic, headings, lists)
- Link management
- Image upload and embedding
- Layout blocks (two-column, callouts, quotes, dividers)
- Video embeds (YouTube)
- Autosave and preview features
- Publishing workflow
- Keyboard shortcuts reference

**Read this if**: You're creating or editing stories in the admin panel.

---

### [Troubleshooting Guide](troubleshooting-guide.md)
**Audience**: Support staff, admin users, operations team

- Common issues and solutions
- Error messages and recovery steps
- Browser compatibility information
- Performance tips
- Network connectivity issues
- Image upload problems
- Autosave failures
- Content recovery procedures

**Read this if**: You're experiencing issues or helping users troubleshoot problems.

---

### [Developer Documentation](developer-documentation.md)
**Audience**: Developers, technical architects, DevOps engineers

- System architecture overview
- Component structure and hierarchy
- Tiptap extensions and custom nodes
- Content sanitization and security
- Parser and pretty printer utilities
- Testing strategy
- Deployment procedures
- Extension points for future enhancements
- Performance optimization guidelines

**Read this if**: You're developing, maintaining, or extending the story editor.

---

## 🚀 Quick Start

### For New Content Editors

1. Read [Admin User Guide](admin-user-guide.md) sections 1-3
2. Log in to admin panel: `https://deessa.org/admin/stories`
3. Click "Add Story" to create your first story
4. Practice using formatting toolbar
5. Try uploading an image
6. Use Preview to see how your story will look
7. Save as draft or publish when ready

### For Developers

1. Read [Developer Documentation](developer-documentation.md) sections 1-2
2. Review the spec files in `.kiro/specs/story-editor-modernization/`
3. Check component structure in `components/admin/rich-text-editor/`
4. Review sanitization logic in `lib/sanitize/story-content.ts`
5. Test the editor locally: `npm run dev` → navigate to `/admin/stories/new`

### For Support Staff

1. Read [Troubleshooting Guide](troubleshooting-guide.md) completely
2. Bookmark common solutions for quick reference
3. Test the editor in different browsers
4. Familiarize yourself with error messages
5. Know how to recover unsaved content from local storage

---

## 🎯 Common Tasks

### Content Editors

| Task | Documentation |
|------|---------------|
| Format text with bold/italic | [Admin User Guide](admin-user-guide.md) - Section 2.1 |
| Add headings and lists | [Admin User Guide](admin-user-guide.md) - Section 2.2 |
| Insert links | [Admin User Guide](admin-user-guide.md) - Section 3 |
| Upload images | [Admin User Guide](admin-user-guide.md) - Section 4 |
| Create two-column layouts | [Admin User Guide](admin-user-guide.md) - Section 5.1 |
| Add callout boxes | [Admin User Guide](admin-user-guide.md) - Section 5.2 |
| Embed YouTube videos | [Admin User Guide](admin-user-guide.md) - Section 6 |
| Preview before publishing | [Admin User Guide](admin-user-guide.md) - Section 8 |
| Recover unsaved content | [Troubleshooting Guide](troubleshooting-guide.md) - Section 5 |

### Developers

| Task | Documentation |
|------|---------------|
| Add new formatting option | [Developer Documentation](developer-documentation.md) - Section 3.2 |
| Create custom layout block | [Developer Documentation](developer-documentation.md) - Section 3.3 |
| Modify sanitization rules | [Developer Documentation](developer-documentation.md) - Section 4 |
| Add new keyboard shortcut | [Developer Documentation](developer-documentation.md) - Section 3.4 |
| Optimize editor performance | [Developer Documentation](developer-documentation.md) - Section 8 |
| Deploy to production | [Developer Documentation](developer-documentation.md) - Section 7 |

---

## 📊 System Quick Facts

| Category | Details |
|----------|---------|
| **Technology** | Tiptap (ProseMirror), React, TypeScript, Next.js 14 |
| **Storage** | Supabase (PostgreSQL), Supabase Storage for images |
| **Content Format** | HTML (stored as string in database) |
| **Sanitization** | DOMPurify (isomorphic-dompurify) |
| **Supported Formats** | Bold, italic, underline, strikethrough, headings (H1-H4), lists, blockquotes, links, images, videos, layout blocks |
| **Image Upload** | Max 5MB, stored in Supabase Storage |
| **Video Support** | YouTube embeds only |
| **Autosave** | Every 15 seconds, with local storage backup |
| **Browser Support** | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| **Accessibility** | WCAG 2.1 AA compliant, keyboard navigable, screen reader friendly |

---

## 🔍 Key Features

### Text Formatting
- **Inline formatting**: Bold, italic, underline, strikethrough
- **Headings**: H1, H2, H3, H4
- **Lists**: Bullet lists, ordered lists
- **Blockquotes**: Standard and highlight quotes
- **Horizontal dividers**

### Media & Embeds
- **Images**: Upload or URL, with alt text, captions, alignment, and width controls
- **Videos**: YouTube embed support with URL validation

### Layout Blocks
- **Two-column layouts**: Side-by-side content sections
- **Callouts**: Info, warning, and success boxes
- **Highlight quotes**: Styled quote blocks with attribution
- **Dividers**: Visual section separators

### Authoring Experience
- **Toolbar**: Quick access to all formatting options
- **Slash commands**: Type "/" for quick block insertion
- **Bubble toolbar**: Inline formatting on text selection
- **Keyboard shortcuts**: Ctrl+B (bold), Ctrl+I (italic), Ctrl+Z (undo), etc.
- **Character/word count**: Real-time content metrics
- **Autosave**: Automatic draft saving every 15 seconds
- **Preview mode**: See how content will appear publicly
- **Unsaved changes warning**: Prevents accidental data loss

### Security & Compatibility
- **Content sanitization**: XSS prevention with whitelist approach
- **Legacy story support**: Plain text stories automatically converted
- **Backward compatibility**: No database migration required
- **Safe public rendering**: All content sanitized before display

---

## 📝 Documentation Maintenance

### When to Update This Documentation

| Trigger | Files to Update | Priority |
|---------|----------------|----------|
| **New formatting option added** | Admin User Guide, Developer Documentation | High |
| **New layout block added** | Admin User Guide, Developer Documentation | High |
| **Keyboard shortcut changed** | Admin User Guide | Medium |
| **New error message added** | Troubleshooting Guide | High |
| **Browser compatibility changed** | Troubleshooting Guide | High |
| **Architecture changed** | Developer Documentation | Critical |
| **Deployment procedure changed** | Developer Documentation | Critical |
| **Security vulnerability fixed** | Developer Documentation | Critical |

---

## 📞 Support & Contact

### For User Issues
- **Admin Support**: Contact DEESSA Foundation IT team
- **Content Questions**: Contact editorial team lead

### For Technical Issues
- **Developer Support**: Contact development partner
- **Hosting Issues**: [Vercel Support](https://vercel.com/support)
- **Database Issues**: [Supabase Support](https://supabase.com/support)

### For Documentation Issues
- Found outdated information? Contact development partner
- Suggest improvements? Create issue in project repository
- Need clarification? Check the glossary in Developer Documentation

---

## 📄 License & Copyright

**System**: Developed for DEESSA Foundation  
**Documentation**: © 2026 DEESSA Foundation  
**Maintainer**: Development Partner

This documentation is proprietary to DEESSA Foundation. Do not distribute without permission.

---

**Last Updated**: April 4, 2026  
**Documentation Version**: 1.0.0  
**System Version**: 1.0.0
