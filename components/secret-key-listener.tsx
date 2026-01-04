"use client"

import { useSecretKey } from "@/hooks/use-secret-key"

interface SecretKeyListenerProps {
  children?: React.ReactNode
}

/**
 * Client component that listens for secret keywords on the page
 */
export function SecretKeyListener({ children }: SecretKeyListenerProps) {
  // Listen for "admin" keyword to open admin panel in new tab
  useSecretKey({
    keyword: "admin",
    redirectPath: "/admin",
    enabled: true,
    openInNewTab: true,
  })

  return <>{children}</>
}
