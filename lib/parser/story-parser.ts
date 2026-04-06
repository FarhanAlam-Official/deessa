// Lazy import jsdom to avoid issues with Jest
let JSDOM: any = null
async function getJSDOM() {
  if (!JSDOM) {
    const jsdomModule = await import('jsdom')
    JSDOM = jsdomModule.JSDOM
  }
  return JSDOM
}

// Type definitions for the structured document
export interface ParseResult {
  success: boolean
  document?: DocumentNode
  error?: string
}

export interface DocumentNode {
  type: 'document'
  content: ContentNode[]
}

export type ContentNode =
  | ParagraphNode
  | HeadingNode
  | ListNode
  | BlockquoteNode
  | ImageNode
  | VideoNode
  | LayoutNode
  | DividerNode
  | TextNode

export interface ParagraphNode {
  type: 'paragraph'
  content: InlineNode[]
}

export interface HeadingNode {
  type: 'heading'
  level: 1 | 2 | 3 | 4
  content: InlineNode[]
}

export interface ListNode {
  type: 'list'
  ordered: boolean
  items: ListItemNode[]
}

export interface ListItemNode {
  type: 'listItem'
  content: InlineNode[]
}

export interface BlockquoteNode {
  type: 'blockquote'
  content: ContentNode[]
}

export interface ImageNode {
  type: 'image'
  src: string
  alt?: string
  caption?: string
  align?: 'left' | 'center' | 'right'
  width?: 'small' | 'medium' | 'full'
}

export interface VideoNode {
  type: 'video'
  src: string
  platform: 'youtube'
}

export interface LayoutNode {
  type: 'layout'
  layoutType: 'two-column' | 'callout' | 'highlight-quote' | 'divider'
  attributes?: Record<string, string>
  content?: ContentNode[]
  leftContent?: ContentNode[]
  rightContent?: ContentNode[]
}

export interface DividerNode {
  type: 'divider'
}

export interface TextNode {
  type: 'text'
  text: string
}

export type InlineNode = TextNode | FormattedTextNode | LinkNode | LineBreakNode

export interface FormattedTextNode {
  type: 'text'
  text: string
  marks?: Array<'bold' | 'italic' | 'underline' | 'strikethrough'>
}

export interface LinkNode {
  type: 'link'
  href: string
  content: InlineNode[]
}

export interface LineBreakNode {
  type: 'lineBreak'
}

/**
 * Parses HTML story content into a structured document object
 */
export async function parseStoryContent(html: string): Promise<ParseResult> {
  try {
    // Detect plain text (no HTML tags)
    if (!/<[a-z][\s\S]*>/i.test(html)) {
      return parsePlainText(html)
    }

    // Parse HTML using jsdom
    try {
      const JSDOMClass = await getJSDOM()
      const dom = new JSDOMClass(html)
      const body = dom.window.document.body

      const content: ContentNode[] = []
      
      for (const child of Array.from(body.childNodes)) {
        const node = parseNode(child as Element | Text)
        if (node) {
          content.push(node)
        }
      }

      return {
        success: true,
        document: {
          type: 'document',
          content
        }
      }
    } catch (jsdomError) {
      return {
        success: false,
        error: `JSDOM error: ${jsdomError instanceof Error ? jsdomError.message : String(jsdomError)}`
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse HTML'
    }
  }
}

/**
 * Parses plain text content (legacy stories)
 */
function parsePlainText(text: string): ParseResult {
  const lines = text.split('\n')
  const content: ContentNode[] = []

  for (const line of lines) {
    if (line.trim()) {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: line }]
      })
    } else {
      // Empty line becomes line break
      content.push({
        type: 'paragraph',
        content: [{ type: 'lineBreak' }]
      })
    }
  }

  return {
    success: true,
    document: {
      type: 'document',
      content
    }
  }
}

/**
 * Parses a DOM node into a ContentNode
 */
function parseNode(node: Node): ContentNode | null {
  // Text nodes
  if (node.nodeType === 3) { // TEXT_NODE
    const text = node.textContent?.trim()
    if (text) {
      return {
        type: 'paragraph',
        content: [{ type: 'text', text }]
      }
    }
    return null
  }

  if (node.nodeType !== 1) return null // Only process ELEMENT_NODE

  const element = node as Element
  const tagName = element.tagName.toLowerCase()

  // Paragraphs
  if (tagName === 'p') {
    return {
      type: 'paragraph',
      content: parseInlineNodes(element)
    }
  }

  // Headings
  if (/^h[1-4]$/.test(tagName)) {
    const level = parseInt(tagName[1]) as 1 | 2 | 3 | 4
    return {
      type: 'heading',
      level,
      content: parseInlineNodes(element)
    }
  }

  // Lists
  if (tagName === 'ul' || tagName === 'ol') {
    const items: ListItemNode[] = []
    for (const li of Array.from(element.children)) {
      if (li.tagName.toLowerCase() === 'li') {
        items.push({
          type: 'listItem',
          content: parseInlineNodes(li)
        })
      }
    }
    return {
      type: 'list',
      ordered: tagName === 'ol',
      items
    }
  }

  // Blockquote
  if (tagName === 'blockquote') {
    const content: ContentNode[] = []
    for (const child of Array.from(element.childNodes)) {
      const node = parseNode(child as Element | Text)
      if (node) content.push(node)
    }
    return {
      type: 'blockquote',
      content
    }
  }

  // Images
  if (tagName === 'img') {
    return {
      type: 'image',
      src: element.getAttribute('src') || '',
      alt: element.getAttribute('alt') || undefined,
      caption: undefined,
      align: undefined,
      width: undefined
    }
  }

  // Figure with image
  if (tagName === 'figure') {
    const img = element.querySelector('img')
    const figcaption = element.querySelector('figcaption')
    if (img) {
      return {
        type: 'image',
        src: img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || undefined,
        caption: figcaption?.textContent || undefined,
        align: (element.getAttribute('data-align') as any) || undefined,
        width: (element.getAttribute('data-width') as any) || undefined
      }
    }
  }

  // Iframe (video embeds)
  if (tagName === 'iframe') {
    const src = element.getAttribute('src') || ''
    if (src.includes('youtube.com') || src.includes('youtu.be')) {
      return {
        type: 'video',
        src,
        platform: 'youtube'
      }
    }
  }

  // Divider
  if (tagName === 'hr') {
    return {
      type: 'divider'
    }
  }

  // Layout blocks
  if (tagName === 'div') {
    const className = element.className

    // Two-column layout
    if (className.includes('two-column-layout')) {
      const leftCol = element.querySelector('.column-left')
      const rightCol = element.querySelector('.column-right')
      
      return {
        type: 'layout',
        layoutType: 'two-column',
        leftContent: leftCol ? parseChildren(leftCol) : [],
        rightContent: rightCol ? parseChildren(rightCol) : []
      }
    }

    // Callout
    if (className.includes('callout')) {
      return {
        type: 'layout',
        layoutType: 'callout',
        attributes: {
          type: element.getAttribute('data-type') || 'info'
        },
        content: parseChildren(element)
      }
    }

    // Highlight quote
    if (className.includes('highlight-quote')) {
      return {
        type: 'layout',
        layoutType: 'highlight-quote',
        content: parseChildren(element)
      }
    }

    // Video embed wrapper
    if (className.includes('video-embed')) {
      const iframe = element.querySelector('iframe')
      if (iframe) {
        const src = iframe.getAttribute('src') || ''
        return {
          type: 'video',
          src,
          platform: 'youtube'
        }
      }
    }
  }

  // Fallback: try to parse children
  const children = parseChildren(element)
  if (children.length === 1) {
    return children[0]
  } else if (children.length > 1) {
    return {
      type: 'paragraph',
      content: children.flatMap(child => {
        if (child.type === 'paragraph') {
          return child.content
        }
        return [{ type: 'text', text: '' }]
      })
    }
  }

  return null
}

/**
 * Parses child nodes of an element
 */
function parseChildren(element: Element): ContentNode[] {
  const content: ContentNode[] = []
  for (const child of Array.from(element.childNodes)) {
    const node = parseNode(child as Element | Text)
    if (node) content.push(node)
  }
  return content
}

/**
 * Parses inline content (text with formatting, links, etc.)
 */
function parseInlineNodes(element: Element): InlineNode[] {
  const nodes: InlineNode[] = []

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === 3) { // TEXT_NODE
      const text = child.textContent || ''
      if (text) {
        nodes.push({ type: 'text', text })
      }
    } else if (child.nodeType === 1) { // ELEMENT_NODE
      const el = child as Element
      const tagName = el.tagName.toLowerCase()

      // Line break
      if (tagName === 'br') {
        nodes.push({ type: 'lineBreak' })
        continue
      }

      // Link
      if (tagName === 'a') {
        nodes.push({
          type: 'link',
          href: el.getAttribute('href') || '',
          content: parseInlineNodes(el)
        })
        continue
      }

      // Formatted text
      const marks: Array<'bold' | 'italic' | 'underline' | 'strikethrough'> = []
      let currentEl: Element | null = el

      while (currentEl) {
        const tag = currentEl.tagName.toLowerCase()
        if (tag === 'strong' || tag === 'b') marks.push('bold')
        if (tag === 'em' || tag === 'i') marks.push('italic')
        if (tag === 'u') marks.push('underline')
        if (tag === 's' || tag === 'strike') marks.push('strikethrough')
        
        // Check if there's a single child element to continue checking
        if (currentEl.children.length === 1) {
          currentEl = currentEl.children[0] as Element
        } else {
          break
        }
      }

      const text = el.textContent || ''
      if (text) {
        if (marks.length > 0) {
          nodes.push({ type: 'text', text, marks })
        } else {
          nodes.push({ type: 'text', text })
        }
      }
    }
  }

  return nodes
}
