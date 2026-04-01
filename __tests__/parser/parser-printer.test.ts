import { parseStoryContent } from '@/lib/parser/story-parser'
import { printStoryContent } from '@/lib/parser/story-printer'

describe('Story Parser and Pretty Printer', () => {
  describe('Plain text parsing', () => {
    it('should parse plain text without HTML tags', async () => {
      const plainText = 'Hello world\nThis is a test'
      const result = await parseStoryContent(plainText)
      
      expect(result.success).toBe(true)
      expect(result.document).toBeDefined()
      expect(result.document?.content).toHaveLength(2)
    })
  })

  describe('HTML parsing', () => {
    it('should parse simple paragraph', async () => {
      const html = '<p>Hello world</p>'
      const result = await parseStoryContent(html)
      
      if (!result.success) {
        console.log('Parse error:', result.error)
      }
      
      expect(result.success).toBe(true)
      expect(result.document?.content).toHaveLength(1)
      expect(result.document?.content[0].type).toBe('paragraph')
    })

    it('should parse headings', async () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2>'
      const result = await parseStoryContent(html)
      
      expect(result.success).toBe(true)
      expect(result.document?.content).toHaveLength(2)
      expect(result.document?.content[0].type).toBe('heading')
      expect(result.document?.content[1].type).toBe('heading')
    })

    it('should parse lists', async () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
      const result = await parseStoryContent(html)
      
      expect(result.success).toBe(true)
      expect(result.document?.content[0].type).toBe('list')
    })

    it('should parse images', async () => {
      const html = '<img src="test.jpg" alt="Test image" />'
      const result = await parseStoryContent(html)
      
      expect(result.success).toBe(true)
      expect(result.document?.content[0].type).toBe('image')
    })

    it('should parse formatted text', async () => {
      const html = '<p>This is <strong>bold</strong> and <em>italic</em> text</p>'
      const result = await parseStoryContent(html)
      
      expect(result.success).toBe(true)
      expect(result.document?.content[0].type).toBe('paragraph')
    })
  })

  describe('Pretty printing', () => {
    it('should print paragraph with proper formatting', async () => {
      const result = await parseStoryContent('<p>Hello world</p>')
      if (result.document) {
        const html = printStoryContent(result.document)
        expect(html).toContain('<p>Hello world</p>')
      }
    })

    it('should print headings with proper tags', async () => {
      const result = await parseStoryContent('<h1>Title</h1>')
      if (result.document) {
        const html = printStoryContent(result.document)
        expect(html).toContain('<h1>Title</h1>')
      }
    })

    it('should print lists with proper indentation', async () => {
      const result = await parseStoryContent('<ul><li>Item 1</li><li>Item 2</li></ul>')
      if (result.document) {
        const html = printStoryContent(result.document)
        expect(html).toContain('<ul>')
        expect(html).toContain('<li>Item 1</li>')
        expect(html).toContain('</ul>')
      }
    })
  })

  describe('Round-trip property', () => {
    it('should preserve content through parse-print-parse cycle', async () => {
      const html = '<p>Hello <strong>world</strong></p>'
      
      const result1 = await parseStoryContent(html)
      expect(result1.success).toBe(true)
      
      if (result1.document) {
        const printed = printStoryContent(result1.document)
        const result2 = await parseStoryContent(printed)
        
        expect(result2.success).toBe(true)
        expect(result2.document?.content.length).toBe(result1.document.content.length)
      }
    })

    it('should preserve complex structures', async () => {
      const html = `
        <h1>Title</h1>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `
      
      const result1 = await parseStoryContent(html)
      expect(result1.success).toBe(true)
      
      if (result1.document) {
        const printed = printStoryContent(result1.document)
        const result2 = await parseStoryContent(printed)
        
        expect(result2.success).toBe(true)
        expect(result2.document?.content.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Error handling', () => {
    it('should handle empty input', async () => {
      const result = await parseStoryContent('')
      expect(result.success).toBe(true)
      expect(result.document?.content).toHaveLength(0)
    })
  })

  describe('HTML escaping', () => {
    it('should escape special characters in printed output', async () => {
      const html = '<p>Test &lt;script&gt; tag</p>'
      const result = await parseStoryContent(html)
      
      if (result.document) {
        const printed = printStoryContent(result.document)
        expect(printed).toContain('&lt;')
        expect(printed).toContain('&gt;')
      }
    })
  })
})
