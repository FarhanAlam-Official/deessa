"use client"

import GenericErrorPage from "@/components/error-pages/GenericErrorPage"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return <GenericErrorPage error={error} reset={reset} />
}
