import { useState, useEffect, useRef, useCallback } from "react"

export interface UseAutosaveOptions {
  content: string
  storyId?: string
  interval?: number // Default: 15000ms (15 seconds)
  onSave: (content: string) => Promise<void>
  enabled?: boolean // Default: true
}

export interface UseAutosaveReturn {
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
  forceSave: () => Promise<void>
}

const LOCAL_STORAGE_PREFIX = "story-autosave-"

export function useAutosave({
  content,
  storyId,
  interval = 15000,
  onSave,
  enabled = true,
}: UseAutosaveOptions): UseAutosaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const lastContentRef = useRef(content)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSaveRef = useRef(onSave)

  // Update onSave ref when it changes
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  // Store backup in local storage
  const storeBackup = useCallback((contentToStore: string) => {
    if (storyId && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `${LOCAL_STORAGE_PREFIX}${storyId}`,
          JSON.stringify({
            content: contentToStore,
            timestamp: new Date().toISOString(),
          })
        )
      } catch (err) {
        console.error("Failed to store backup in local storage:", err)
      }
    }
  }, [storyId])

  // Clear backup from local storage
  const clearBackup = useCallback(() => {
    if (storyId && typeof window !== "undefined") {
      try {
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${storyId}`)
      } catch (err) {
        console.error("Failed to clear backup from local storage:", err)
      }
    }
  }, [storyId])

  // Perform save operation
  const performSave = useCallback(async (contentToSave: string) => {
    if (!enabled) return

    setIsSaving(true)
    setError(null)

    try {
      await onSaveRef.current(contentToSave)
      setLastSaved(new Date())
      lastContentRef.current = contentToSave
      clearBackup()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save"
      setError(errorMessage)
      
      // Store backup on error
      storeBackup(contentToSave)

      // Retry after 5 seconds
      setTimeout(() => {
        if (lastContentRef.current !== contentToSave) {
          performSave(contentToSave)
        }
      }, 5000)
    } finally {
      setIsSaving(false)
    }
  }, [enabled, clearBackup, storeBackup])

  // Force save function
  const forceSave = useCallback(async () => {
    if (content !== lastContentRef.current) {
      await performSave(content)
    }
  }, [content, performSave])

  // Autosave effect
  useEffect(() => {
    if (!enabled) return

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Check if content has changed
    if (content !== lastContentRef.current) {
      // Store backup immediately
      storeBackup(content)

      // Schedule save after interval
      saveTimeoutRef.current = setTimeout(() => {
        performSave(content)
      }, interval)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, enabled, interval, performSave, storeBackup])

  return {
    isSaving,
    lastSaved,
    error,
    forceSave,
  }
}

// Helper function to get backup from local storage
export function getAutosaveBackup(storyId: string): { content: string; timestamp: string } | null {
  if (typeof window === "undefined") return null

  try {
    const backup = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${storyId}`)
    if (backup) {
      return JSON.parse(backup)
    }
  } catch (err) {
    console.error("Failed to retrieve backup from local storage:", err)
  }

  return null
}

// Helper function to clear backup from local storage
export function clearAutosaveBackup(storyId: string): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${storyId}`)
  } catch (err) {
    console.error("Failed to clear backup from local storage:", err)
  }
}
