/**
 * Clipboard Utility
 * Handles copying text to clipboard with fallback support
 */

/**
 * Copy text to clipboard
 * Returns true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern Clipboard API (preferred)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // Fallback for older browsers or non-secure contexts
    return copyToClipboardFallback(text)
  } catch (error) {
    console.error("Failed to copy to clipboard:", error)
    return copyToClipboardFallback(text)
  }
}

/**
 * Fallback method using execCommand (deprecated but widely supported)
 */
function copyToClipboardFallback(text: string): boolean {
  try {
    // Create a temporary textarea element
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.left = "-999999px"
    textarea.style.top = "-999999px"
    document.body.appendChild(textarea)

    // Select and copy the text
    textarea.focus()
    textarea.select()

    const successful = document.execCommand("copy")
    document.body.removeChild(textarea)

    return successful
  } catch (error) {
    console.error("Fallback copy failed:", error)
    return false
  }
}

/**
 * Check if clipboard API is available
 */
export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && window.isSecureContext)
}
