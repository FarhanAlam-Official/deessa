/**
 * Detects if content is plain text (legacy format) or rich HTML
 * @param content - The story content to check
 * @returns True if content is plain text, false if it contains HTML tags
 */
export function isPlainText(content: string | null | undefined): boolean {
  if (!content) return true
  
  // Check if content contains HTML tags
  // This regex matches opening HTML tags like <p>, <div>, <h1>, etc.
  const htmlTagPattern = /<[a-z][\s\S]*>/i
  
  return !htmlTagPattern.test(content)
}

/**
 * Converts plain text content to HTML by replacing line breaks with <br /> tags
 * @param content - The plain text content to convert
 * @returns HTML string with line breaks converted to <br /> tags
 */
export function convertPlainTextToHtml(content: string): string {
  if (!content) return ""
  
  // Replace newline characters with <br /> tags
  // Also wrap the content in paragraph tags for better formatting
  const lines = content.split("\n").filter(line => line.trim().length > 0)
  
  if (lines.length === 0) return ""
  
  // Wrap each non-empty line in a paragraph tag
  return lines.map(line => `<p>${line.trim()}</p>`).join("\n")
}

/**
 * Processes story content for display, handling both legacy plain text and rich HTML
 * @param content - The story content (plain text or HTML)
 * @returns Processed HTML ready for rendering
 */
export function processStoryContent(content: string | null | undefined): string {
  if (!content) return ""
  
  if (isPlainText(content)) {
    return convertPlainTextToHtml(content)
  }
  
  return content
}
