"use client"

import { useEffect, useRef } from "react"

interface UseSecretKeyOptions {
  keyword: string
  redirectPath: string
  enabled?: boolean
  timeout?: number // Time in ms to reset the key buffer
  openInNewTab?: boolean // Whether to open in a new tab
}

/**
 * Hook to detect a secret keyword typed by the user and redirect to a path
 * @param options Configuration options
 */
export function useSecretKey({
  keyword,
  redirectPath,
  enabled = true,
  timeout = 2000,
  openInNewTab = false,
}: UseSecretKeyOptions) {
  const keyBufferRef = useRef<string>("")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      // Add the key to the buffer
      keyBufferRef.current += event.key.toLowerCase()

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout to reset buffer
      timeoutRef.current = setTimeout(() => {
        keyBufferRef.current = ""
      }, timeout)

      // Check if the buffer contains the keyword
      if (keyBufferRef.current.includes(keyword.toLowerCase())) {
        keyBufferRef.current = ""
        if (openInNewTab) {
          window.open(redirectPath, "_blank", "noopener,noreferrer")
        } else {
          window.location.href = redirectPath
        }
      }

      // Keep buffer size reasonable
      if (keyBufferRef.current.length > keyword.length * 2) {
        keyBufferRef.current = keyBufferRef.current.slice(-keyword.length)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [keyword, redirectPath, enabled, timeout, openInNewTab])
}
