import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

export interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean
  message?: string
}

export function useUnsavedChanges({
  hasUnsavedChanges,
  message = "You have unsaved changes. Are you sure you want to leave?",
}: UseUnsavedChangesOptions) {
  const router = useRouter()

  // Handle browser navigation (back button, close tab, etc.)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault()
        // Modern browsers require returnValue to be set
        event.returnValue = message
        return message
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasUnsavedChanges, message])

  // Handle Next.js router navigation
  useEffect(() => {
    if (!hasUnsavedChanges) return

    // Store original push and replace methods
    const originalPush = router.push
    const originalReplace = router.replace
    const originalBack = router.back

    // Override router methods to show confirmation
    const confirmNavigation = (callback: () => void) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(message)
        if (confirmed) {
          callback()
        }
      } else {
        callback()
      }
    }

    // @ts-expect-error - Overriding router methods
    router.push = (...args) => {
      confirmNavigation(() => originalPush.apply(router, args))
    }

    // @ts-expect-error - Overriding router methods
    router.replace = (...args) => {
      confirmNavigation(() => originalReplace.apply(router, args))
    }

    // @ts-expect-error - Overriding router methods
    router.back = () => {
      confirmNavigation(() => originalBack.apply(router))
    }

    return () => {
      // Restore original methods
      router.push = originalPush
      router.replace = originalReplace
      router.back = originalBack
    }
  }, [hasUnsavedChanges, message, router])

  // Provide a manual check function for custom navigation
  const checkUnsavedChanges = useCallback(() => {
    if (hasUnsavedChanges) {
      return window.confirm(message)
    }
    return true
  }, [hasUnsavedChanges, message])

  return { checkUnsavedChanges }
}
