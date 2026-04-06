import type {
  DocumentNode,
  ContentNode,
  InlineNode,
  ParagraphNode,
  HeadingNode,
  ListNode,
  BlockquoteNode,
  ImageNode,
  VideoNode,
  LayoutNode,
  DividerNode,
  FormattedTextNode,
  LinkNode
} from './story-parser'

/**
 * Formats a structured document object into valid, readable HTML
 */
export function printStoryContent(document: DocumentNode): string {
  const lines: string[] = []
  
  for (const node of document.content) {
    const html = printContentNode(node, 0)
    if (html) {
      lines.push(html)
    }
  }
  
  return lines.join('\n')
}

/**
 * Prints a content node with proper indentation
 */
function printContentNode(node: ContentNode, indent: number): string {
  const indentStr = '  '.repeat(indent)
  
  switch (node.type) {
    case 'paragraph':
      return printParagraph(node, indent)
    
    case 'heading':
      return printHeading(node, indent)
    
    case 'list':
      return printList(node, indent)
    
    case 'blockquote':
      return printBlockquote(node, indent)
    
    case 'image':
      return printImage(node, indent)
    
    case 'video':
      return printVideo(node, indent)
    
    case 'layout':
      return printLayout(node, indent)
    
    case 'divider':
      return `${indentStr}<hr />`
    
    case 'text':
      // Standalone text node (shouldn't normally happen, but handle it)
      return `${indentStr}<p>${escapeHtml(node.text)}</p>`
    
    default:
      return ''
  }
}

/**
 * Prints a paragraph node
 */
function printParagraph(node: ParagraphNode, indent: number): string {
  const indentStr = '  '.repeat(indent)
  const content = printInlineNodes(node.content)
  
  if (!content.trim()) {
    return `${indentStr}<p></p>`
  }
  
  return `${indentStr}<p>${content}</p>`
}

/**
 * Prints a heading node
 */
function printHeading(node: HeadingNode, indent: number): string {
  const indentStr = '  '.repeat(indent)
  const content = printInlineNodes(node.content)
  return `${indentStr}<h${node.level}>${content}</h${node.level}>`
}

/**
 * Prints a list node
 */
function printList(node: ListNode, indent: number): string {
  const indentStr = '  '.repeat(indent)
  const tag = node.ordered ? 'ol' : 'ul'
  const lines: string[] = []
  
  lines.push(`${indentStr}<${tag}>`)
  
  for (const item of node.items) {
    const content = printInlineNodes(item.content)
    lines.push(`${indentStr}  <li>${content}</li>`)
  }
  
  lines.push(`${indentStr}</${tag}>`)
  
  return lines.join('\n')
}

/**
 * Prints a blockquote node
 */
function printBlockquote(node: BlockquoteNode, indent: number): string {
  const indentStr = '  '.repeat(indent)
  const lines: string[] = []
  
  lines.push(`${indentStr}<blockquote>`)
  
  for (const child of node.content) {
    lines.push(printContentNode(child, indent + 1))
  }
  
  lines.push(`${indentStr}</blockquote>`)
  
  return lines.join('\n')
}

/**
 * Prints an image node
 */
function printImage(node: ImageNode, indent: number): string {
  const indentStr = '  '.repeat(indent)
  
  // If no caption, alignment, or width, use simple img tag
  if (!node.caption && !node.align && !node.width) {
    const alt = node.alt ? ` alt="${escapeHtml(node.alt)}"` : ''
    return `${indentStr}<img src="${escapeHtml(node.src)}"${alt} />`
  }
  
  // Use figure for images with metadata
  const lines: string[] = []
  const attrs: string[] = ['class="image-wrapper"']
  
  if (node.align) {
    attrs.push(`data-align="${node.align}"`)
  }
  if (node.width) {
    attrs.push(`data-width="${node.width}"`)
  }
  
  lines.push(`${indentStr}<figure ${attrs.join(' ')}>`)
  
  const alt = node.alt ? ` alt="${escapeHtml(node.alt)}"` : ''
  lines.push(`${indentStr}  <img src="${escapeHtml(node.src)}"${alt} />`)
  
  if (node.caption) {
    lines.push(`${indentStr}  <figcaption>${escapeHtml(node.caption)}</figcaption>`)
  }
  
  lines.push(`${indentStr}</figure>`)
  
  return lines.join('\n')
}

/**
 * Prints a video node
 */
function printVideo(node: VideoNode, indent: number): string {
  const indentStr = '  '.repeat(indent)
  const lines: string[] = []
  
  lines.push(`${indentStr}<div class="video-embed">`)
  lines.push(`${indentStr}  <iframe`)
  lines.push(`${indentStr}    src="${escapeHtml(node.src)}"`)
  lines.push(`${indentStr}    frameborder="0"`)
  lines.push(`${indentStr}    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`)
  lines.push(`${indentStr}    allowfullscreen`)
  lines.push(`${indentStr}    sandbox="allow-scripts allow-same-origin allow-presentation">`)
  lines.push(`${indentStr}  </iframe>`)
  lines.push(`${indentStr}</div>`)
  
  return lines.join('\n')
}

/**
 * Prints a layout node
 */
function printLayout(node: LayoutNode, indent: number): string {
  const indentStr = '  '.repeat(indent)
  
  switch (node.layoutType) {
    case 'two-column': {
      const lines: string[] = []
      lines.push(`${indentStr}<div class="two-column-layout">`)
      
      lines.push(`${indentStr}  <div class="column-left">`)
      if (node.leftContent) {
        for (const child of node.leftContent) {
          lines.push(printContentNode(child, indent + 2))
        }
      }
      lines.push(`${indentStr}  </div>`)
      
      lines.push(`${indentStr}  <div class="column-right">`)
      if (node.rightContent) {
        for (const child of node.rightContent) {
          lines.push(printContentNode(child, indent + 2))
        }
      }
      lines.push(`${indentStr}  </div>`)
      
      lines.push(`${indentStr}</div>`)
      return lines.join('\n')
    }
    
    case 'callout': {
      const lines: string[] = []
      const type = node.attributes?.type || 'info'
      lines.push(`${indentStr}<div class="callout" data-type="${type}">`)
      
      if (node.content) {
        for (const child of node.content) {
          lines.push(printContentNode(child, indent + 1))
        }
      }
      
      lines.push(`${indentStr}</div>`)
      return lines.join('\n')
    }
    
    case 'highlight-quote': {
      const lines: string[] = []
      lines.push(`${indentStr}<div class="highlight-quote">`)
      
      if (node.content) {
        for (const child of node.content) {
          lines.push(printContentNode(child, indent + 1))
        }
      }
      
      lines.push(`${indentStr}</div>`)
      return lines.join('\n')
    }
    
    case 'divider':
      return `${indentStr}<hr />`
    
    default:
      return ''
  }
}

/**
 * Prints inline nodes (text, formatting, links)
 */
function printInlineNodes(nodes: InlineNode[]): string {
  return nodes.map(node => printInlineNode(node)).join('')
}

/**
 * Prints a single inline node
 */
function printInlineNode(node: InlineNode): string {
  switch (node.type) {
    case 'text': {
      const formatted = node as FormattedTextNode
      let text = escapeHtml(formatted.text)
      
      if (formatted.marks && formatted.marks.length > 0) {
        // Apply marks in consistent order
        const marks = [...formatted.marks].sort()
        
        for (const mark of marks) {
          switch (mark) {
            case 'bold':
              text = `<strong>${text}</strong>`
              break
            case 'italic':
              text = `<em>${text}</em>`
              break
            case 'underline':
              text = `<u>${text}</u>`
              break
            case 'strikethrough':
              text = `<s>${text}</s>`
              break
          }
        }
      }
      
      return text
    }
    
    case 'link': {
      const link = node as LinkNode
      const content = printInlineNodes(link.content)
      return `<a href="${escapeHtml(link.href)}">${content}</a>`
    }
    
    case 'lineBreak':
      return '<br />'
    
    default:
      return ''
  }
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  
  return text.replace(/[&<>"']/g, char => map[char] || char)
}
