# Story Editor — Developer Documentation

> **Version:** 1.0.0  
> **Last Updated:** April 4, 2026  
> **Audience:** Developers, technical architects, DevOps engineers

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component Structure](#2-component-structure)
3. [Tiptap Extensions](#3-tiptap-extensions)
4. [Content Sanitization](#4-content-sanitization)
5. [Parser & Pretty Printer](#5-parser--pretty-printer)
6. [Testing Strategy](#6-testing-strategy)
7. [Deployment](#7-deployment)
8. [Performance Optimization](#8-performance-optimization)
9. [Extension Points](#9-extension-points)
10. [Troubleshooting for Developers](#10-troubleshooting-for-developers)

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Panel (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Story Form     │────────▶│  Rich Text       │          │
│  │   Component      │         │  Editor          │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                            │                     │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Server Actions  │         │  Tiptap Core     │          │
│  │  (Form Submit)   │         │  + Extensions    │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                            │                     │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Supabase DB    │         │  HTML Output     │          │
│  │  (stories table) │◀────────│  (Serialized)    │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Public Site (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Story Detail    │────────▶│  Content         │          │
│  │  Page            │         │  Sanitizer       │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                            │                     │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Fetch Story    │         │  Safe HTML       │          │
│  │   from DB        │         │  Output          │          │
│  └──────────────────┘         └──────────────────┘          │
│                                        │                     │
│                                        │                     │
│                                        ▼                     │
│                              ┌──────────────────┐            │
│                              │  Render to       │            │
│                              │  Public Page     │            │
│                              └──────────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Next.js 14 | Server-side rendering, routing |
| **UI Library** | React 19 | Component-based UI |
| **Editor Core** | Tiptap 3.x | Rich text editing (ProseMirror wrapper) |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Database** | Supabase (PostgreSQL) | Story storage |
| **File Storage** | Supabase Storage | Image uploads |
| **Sanitization** | isomorphic-dompurify | XSS prevention |
| **HTML Parsing** | jsdom | Parser utility |

### 1.3 Data Flow

**Create/Edit Flow:**
```
User Input → Tiptap Editor → HTML Serialization → Hidden Form Field → 
Server Action → Database (stories.content)
```

**Image Upload Flow:**
```
File Selection → FileUpload Component → Supabase Storage → 
Public URL → Editor Image Node
```

**Public Rendering Flow:**
```
Database → Story Content (HTML) → Content Sanitizer → 
Safe HTML → Public Page Render
```

**Legacy Story Flow:**
```
Plain Text Content → Detect No HTML Tags → Convert \n to <br> → Render
```

---

## 2. Component Structure

### 2.1 Component Hierarchy

```
components/admin/
├── story-form.tsx                    # Main form container
└── rich-text-editor/
    ├── rich-text-editor.tsx          # Main editor component
    ├── toolbar.tsx                   # Formatting toolbar
    ├── slash-menu.tsx                # Slash command menu
    ├── bubble-toolbar.tsx            # Floating selection toolbar
    ├── extensions/
    │   ├── image-extension.ts        # Custom image node
    │   ├── two-column-extension.ts   # Two-column layout
    │   ├── callout-extension.ts      # Callout boxes
    │   ├── highlight-quote-extension.ts  # Highlight quotes
    │   └── divider-extension.ts      # Dividers
    ├── nodes/
    │   ├── image-node.tsx            # Image rendering component
    │   ├── two-column-node.tsx       # Two-column rendering
    │   ├── callout-node.tsx          # Callout rendering
    │   └── highlight-quote-node.tsx  # Quote rendering
    └── hooks/
        ├── use-autosave.ts           # Autosave logic
        └── use-unsaved-changes.ts    # Navigation guard
```

### 2.2 Key Components

#### RichTextEditor Component

**Location:** `components/admin/rich-text-editor.tsx`

**Props:**
```typescript
interface RichTextEditorProps {
  content: string                    // Initial HTML content
  onChange: (html: string) => void   // Callback when content changes
  onSave?: () => void                // Optional manual save callback
  placeholder?: string               // Placeholder text
  className?: string                 // Additional CSS classes
  editable?: boolean                 // Enable/disable editing
}
```

**Key Features:**
- Initializes Tiptap editor with extensions
- Manages editor state
- Handles content serialization
- Integrates autosave
- Provides toolbar and menus

**Usage:**
```tsx
<RichTextEditor
  content={story.content || ''}
  onChange={(html) => setContent(html)}
  placeholder="Start writing your story..."
  editable={true}
/>
```

#### Toolbar Component

**Location:** `components/admin/rich-text-editor/toolbar.tsx`

**Props:**
```typescript
interface ToolbarProps {
  editor: Editor | null  // Tiptap editor instance
}
```

**Features:**
- Text formatting buttons (bold, italic, etc.)
- Heading buttons (H1-H4)
- List buttons (bullet, ordered)
- Insert buttons (link, image, video, layout blocks)
- Undo/redo buttons

---

## 3. Tiptap Extensions

### 3.1 Built-in Extensions

| Extension | Purpose | Configuration |
|-----------|---------|---------------|
| **StarterKit** | Basic marks and nodes | Default config |
| **Link** | Hyperlink support | `openOnClick: false`, URL validation |
| **Image** | Image embedding | Custom attributes (align, width, caption) |
| **Youtube** | Video embeds | YouTube URL validation |
| **CharacterCount** | Word/character counting | No config needed |
| **Placeholder** | Empty state text | Custom placeholder text |
| **Underline** | Underline formatting | Default config |

### 3.2 Custom Extensions

#### Image Extension

**Location:** `components/admin/rich-text-editor/extensions/image-extension.ts`

**Custom Attributes:**
```typescript
{
  src: string           // Image URL
  alt: string           // Alt text
  caption?: string      // Optional caption
  align: 'left' | 'center' | 'right'
  width: 'small' | 'medium' | 'full'
}
```

**HTML Output:**
```html
<figure class="image-wrapper" data-align="center" data-width="medium">
  <img src="..." alt="..." />
  <figcaption>Caption text</figcaption>
</figure>
```

#### Two-Column Extension

**Location:** `components/admin/rich-text-editor/extensions/two-column-extension.ts`

**Structure:**
```typescript
{
  type: 'twoColumn'
  content: {
    left: JSONContent[]
    right: JSONContent[]
  }
}
```

**HTML Output:**
```html
<div class="two-column-layout">
  <div class="column-left">...</div>
  <div class="column-right">...</div>
</div>
```

#### Callout Extension

**Location:** `components/admin/rich-text-editor/extensions/callout-extension.ts`

**Types:**
- `info` (blue)
- `warning` (yellow)
- `success` (green)

**HTML Output:**
```html
<div class="callout" data-type="info">
  <p>Callout content</p>
</div>
```

### 3.3 Creating Custom Extensions

**Basic template:**
```typescript
import { Node } from '@tiptap/core'

export const CustomNode = Node.create({
  name: 'customNode',
  
  group: 'block',
  
  content: 'block+',
  
  addAttributes() {
    return {
      customAttr: {
        default: null,
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="custom"]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'custom', ...HTMLAttributes }, 0]
  },
  
  addCommands() {
    return {
      setCustomNode: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          content: [],
        })
      },
    }
  },
})
```

---

## 4. Content Sanitization

### 4.1 Sanitization Architecture

**Location:** `lib/sanitize/story-content.ts`

**Purpose:** Prevent XSS attacks by sanitizing HTML before public rendering

**Library:** isomorphic-dompurify (works in Node.js and browser)

### 4.2 Sanitization Configuration

```typescript
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeStoryContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's',
      'h1', 'h2', 'h3', 'h4',
      'ul', 'ol', 'li',
      'blockquote', 'cite',
      'a', 'img', 'figure', 'figcaption',
      'iframe',
      'div', 'span',
      'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title',
      'class', 'data-type', 'data-align', 'data-width',
      'width', 'height',
      'frameborder', 'allow', 'allowfullscreen', 'sandbox'
    ],
    ALLOW_DATA_ATTR: true,
    ADD_ATTR: ['rel'],
    FORBID_TAGS: ['script', 'style', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  })
}
```

### 4.3 Security Hooks

**External link security:**
```typescript
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href')
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      node.setAttribute('rel', 'noopener noreferrer')
    }
  }
})
```

**Iframe domain validation:**
```typescript
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IFRAME') {
    const src = node.getAttribute('src')
    if (src && !isAllowedIframeSrc(src)) {
      node.remove()
    }
  }
})

function isAllowedIframeSrc(src: string): boolean {
  const allowedDomains = [
    'youtube.com',
    'www.youtube.com',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com'
  ]
  
  try {
    const url = new URL(src)
    return allowedDomains.some(domain => 
      url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}
```

### 4.4 Usage in Public Rendering

```typescript
// app/(public)/stories/[slug]/page.tsx

import { sanitizeStoryContent } from '@/lib/sanitize/story-content'

export default async function StoryDetailPage({ params }: PageProps) {
  const story = await getStoryBySlug(params.slug)
  
  // Sanitize content before rendering
  const safeContent = story.content 
    ? sanitizeStoryContent(story.content)
    : ''
  
  return (
    <div dangerouslySetInnerHTML={{ __html: safeContent }} />
  )
}
```

---

## 5. Parser & Pretty Printer

### 5.1 Story Parser

**Location:** `lib/parser/story-parser.ts`

**Purpose:** Parse HTML into structured document object for testing and validation

**Key Functions:**
```typescript
// Main parsing function
export async function parseStoryContent(html: string): Promise<ParseResult>

// Type definitions
interface ParseResult {
  success: boolean
  document?: DocumentNode
  error?: string
}

interface DocumentNode {
  type: 'document'
  content: ContentNode[]
}
```

**Features:**
- Parses HTML using jsdom
- Handles legacy plain text content
- Extracts all semantic content
- Preserves formatting, images, links, layout blocks
- Error handling with descriptive messages

**Usage:**
```typescript
const result = await parseStoryContent('<p>Hello <strong>world</strong></p>')

if (result.success) {
  console.log(result.document)
} else {
  console.error(result.error)
}
```

### 5.2 Story Pretty Printer

**Location:** `lib/parser/story-printer.ts`

**Purpose:** Format structured document back to readable HTML

**Key Functions:**
```typescript
// Main printing function
export function printStoryContent(document: DocumentNode): string
```

**Features:**
- Consistent indentation (2 spaces)
- Proper tag nesting
- Semantic HTML output
- HTML entity escaping

**Usage:**
```typescript
const html = printStoryContent(document)
console.log(html)
// Output:
// <p>Hello <strong>world</strong></p>
```

### 5.3 Round-Trip Property

**Guarantee:** For any valid document:
```typescript
const doc1 = await parseStoryContent(html)
const printed = printStoryContent(doc1.document!)
const doc2 = await parseStoryContent(printed)

// doc1.document should equal doc2.document
expect(doc1.document).toEqual(doc2.document)
```

---

## 6. Testing Strategy

### 6.1 Test Types

| Test Type | Purpose | Location | Tools |
|-----------|---------|----------|-------|
| **Unit Tests** | Test individual functions | `__tests__/` | Jest |
| **Component Tests** | Test React components | `__tests__/components/` | Jest + React Testing Library |
| **Integration Tests** | Test workflows | `__tests__/integration/` | Jest |
| **E2E Tests** | Test full user flows | `__tests__/e2e/` | Playwright (future) |
| **Property Tests** | Test universal properties | `__tests__/properties/` | fast-check (optional) |

### 6.2 Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- story-parser.test.ts

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

### 6.3 Key Test Scenarios

**Editor functionality:**
- Text formatting (bold, italic, etc.)
- Link insertion and editing
- Image upload and embedding
- Layout block insertion
- Keyboard shortcuts

**Content sanitization:**
- XSS prevention
- Tag whitelist enforcement
- Attribute whitelist enforcement
- External link security
- Iframe domain validation

**Parser/Printer:**
- HTML parsing accuracy
- Plain text handling
- Round-trip preservation
- Error handling

**Autosave:**
- Debouncing
- Network error handling
- Local storage backup
- Recovery on page reload

---

## 7. Deployment

### 7.1 Deployment Checklist

**Pre-deployment:**
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Code reviewed
- [ ] Database schema verified (no changes needed)
- [ ] Environment variables configured
- [ ] Sanitization rules reviewed

**Deployment:**
- [ ] Deploy to staging first
- [ ] Test in staging environment
- [ ] Verify autosave works
- [ ] Test image uploads
- [ ] Check public rendering
- [ ] Test legacy story compatibility

**Post-deployment:**
- [ ] Monitor error logs
- [ ] Check autosave success rate
- [ ] Verify image upload success rate
- [ ] Test on different browsers
- [ ] Monitor performance metrics

### 7.2 Environment Variables

No new environment variables required. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 7.3 Database Considerations

**No schema changes required:**
- Uses existing `stories` table
- `content` field stores HTML string
- Backward compatible with plain text

**Indexes:**
- Existing indexes sufficient
- No new indexes needed

### 7.4 Rollback Procedure

If issues arise:

1. **Revert code deployment:**
   - Deploy previous version
   - Stories created with rich editor still render (HTML is backward compatible)

2. **No database rollback needed:**
   - No schema changes
   - HTML content works with old and new code

3. **Monitor:**
   - Check error rates
   - Verify stories display correctly

---

## 8. Performance Optimization

### 8.1 Editor Performance

**Optimization techniques:**
- Lazy load Tiptap extensions
- Debounce autosave (15 seconds)
- Virtualization for long content (future)
- Image lazy loading

**Performance targets:**
- Editor initialization: <1 second
- Typing latency: <100ms (even with 5000+ words)
- Image insertion: <500ms after upload
- Autosave: Non-blocking

### 8.2 Bundle Size

**Current bundle:**
- Tiptap core: ~50KB gzipped
- Extensions: ~30KB gzipped
- Total editor bundle: ~80KB gzipped

**Optimization opportunities:**
- Code splitting by route
- Lazy load extensions on demand
- Tree shaking unused code

### 8.3 Image Optimization

**Client-side:**
- Enforce 5MB limit
- Show upload progress
- Compress before upload (future)

**Server-side:**
- Supabase Storage handles optimization
- CDN caching
- Responsive image serving

### 8.4 Monitoring

**Key metrics:**
- Editor load time
- Typing latency
- Autosave success rate
- Image upload success rate
- Error rate

**Tools:**
- Vercel Analytics
- Supabase Dashboard
- Browser DevTools Performance tab

---

## 9. Extension Points

### 9.1 Adding New Formatting Options

**Example: Adding highlight/mark:**

1. **Install extension:**
```bash
npm install @tiptap/extension-highlight
```

2. **Add to editor:**
```typescript
import Highlight from '@tiptap/extension-highlight'

const editor = useEditor({
  extensions: [
    // ... other extensions
    Highlight,
  ],
})
```

3. **Add toolbar button:**
```tsx
<button
  onClick={() => editor.chain().focus().toggleHighlight().run()}
  className={editor.isActive('highlight') ? 'is-active' : ''}
>
  Highlight
</button>
```

### 9.2 Adding New Layout Blocks

**Steps:**

1. **Create extension file:**
   - `components/admin/rich-text-editor/extensions/my-block-extension.ts`

2. **Define node:**
```typescript
import { Node } from '@tiptap/core'

export const MyBlock = Node.create({
  name: 'myBlock',
  group: 'block',
  content: 'block+',
  
  addAttributes() {
    return {
      type: { default: 'default' },
    }
  },
  
  parseHTML() {
    return [{ tag: 'div[data-type="my-block"]' }]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'my-block', ...HTMLAttributes }, 0]
  },
})
```

3. **Create React component:**
   - `components/admin/rich-text-editor/nodes/my-block-node.tsx`

4. **Add to toolbar:**
```tsx
<button onClick={() => editor.chain().focus().insertContent({ type: 'myBlock' }).run()}>
  My Block
</button>
```

5. **Update sanitizer:**
```typescript
ALLOWED_TAGS: [...existingTags, 'div'],
ALLOWED_ATTR: [...existingAttrs, 'data-type'],
```

### 9.3 Adding New Keyboard Shortcuts

**In extension configuration:**
```typescript
addKeyboardShortcuts() {
  return {
    'Mod-Shift-h': () => this.editor.commands.toggleHighlight(),
  }
}
```

**Or globally:**
```typescript
const editor = useEditor({
  editorProps: {
    handleKeyDown: (view, event) => {
      if (event.key === 'Tab') {
        // Custom tab handling
        return true
      }
      return false
    },
  },
})
```

### 9.4 Customizing Sanitization

**Add new allowed tag:**
```typescript
ALLOWED_TAGS: [
  ...existingTags,
  'custom-tag',
],
```

**Add custom hook:**
```typescript
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'CUSTOM-TAG') {
    // Custom validation logic
  }
})
```

---

## 10. Troubleshooting for Developers

### 10.1 Common Development Issues

**Editor not initializing:**
- Check Tiptap version compatibility
- Verify all extensions are installed
- Check browser console for errors
- Ensure React version is compatible

**Autosave not working:**
- Check network tab for failed requests
- Verify server action is being called
- Check authentication status
- Verify database permissions

**Images not uploading:**
- Check Supabase Storage configuration
- Verify bucket permissions
- Check file size limits
- Verify CORS settings

**Sanitization too aggressive:**
- Review DOMPurify configuration
- Check ALLOWED_TAGS and ALLOWED_ATTR
- Test with specific HTML samples
- Add custom hooks if needed

### 10.2 Debugging Tips

**Enable Tiptap debug mode:**
```typescript
const editor = useEditor({
  enableInputRules: true,
  enablePasteRules: true,
  onUpdate: ({ editor }) => {
    console.log('Content:', editor.getHTML())
  },
})
```

**Log autosave events:**
```typescript
const { isSaving, lastSaved, error } = useAutosave({
  content,
  storyId,
  onSave: async (content) => {
    console.log('Autosaving:', content.length, 'chars')
    // ... save logic
  },
})
```

**Test sanitization:**
```typescript
const testHtml = '<script>alert("xss")</script><p>Safe content</p>'
const sanitized = sanitizeStoryContent(testHtml)
console.log('Sanitized:', sanitized)
// Should only show: <p>Safe content</p>
```

### 10.3 Performance Profiling

**React DevTools Profiler:**
1. Install React DevTools extension
2. Open Profiler tab
3. Start recording
4. Perform actions in editor
5. Stop recording and analyze

**Chrome Performance Tab:**
1. Open DevTools → Performance
2. Start recording
3. Type in editor, add images, etc.
4. Stop recording
5. Analyze flame graph for bottlenecks

---

## Related Documentation

- **Previous**: [Troubleshooting Guide](troubleshooting-guide.md)
- **See Also**: [Admin User Guide](admin-user-guide.md)
- **Back to**: [Documentation Index](README.md)

---

## Appendix: File Inventory

### Core Files

| File | Purpose | Auth Required |
|------|---------|---------------|
| `components/admin/rich-text-editor.tsx` | Main editor component | Admin |
| `components/admin/rich-text-editor/toolbar.tsx` | Formatting toolbar | Admin |
| `components/admin/rich-text-editor/slash-menu.tsx` | Slash commands | Admin |
| `components/admin/rich-text-editor/bubble-toolbar.tsx` | Selection toolbar | Admin |
| `lib/sanitize/story-content.ts` | Content sanitization | None (utility) |
| `lib/parser/story-parser.ts` | HTML parser | None (utility) |
| `lib/parser/story-printer.ts` | HTML pretty printer | None (utility) |
| `lib/actions/admin-stories.ts` | Server actions | Admin |
| `app/(public)/stories/[slug]/page.tsx` | Public story page | None |

### Extension Files

| File | Purpose |
|------|---------|
| `extensions/image-extension.ts` | Custom image node |
| `extensions/two-column-extension.ts` | Two-column layout |
| `extensions/callout-extension.ts` | Callout boxes |
| `extensions/highlight-quote-extension.ts` | Highlight quotes |
| `extensions/divider-extension.ts` | Dividers |

### Node Components

| File | Purpose |
|------|---------|
| `nodes/image-node.tsx` | Image rendering |
| `nodes/two-column-node.tsx` | Two-column rendering |
| `nodes/callout-node.tsx` | Callout rendering |
| `nodes/highlight-quote-node.tsx` | Quote rendering |

---

**Last Updated**: April 4, 2026  
**Version**: 1.0.0
