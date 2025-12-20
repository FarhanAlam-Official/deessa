"use client"

import UnauthorizedErrorPage from "@/components/error-pages/UnauthorizedErrorPage"
import { AuthProvider } from "@/contexts/AuthContext"
import { ErrorProvider } from "@/contexts/ErrorContext"

export default function UnauthorizedDemo() {
  return (
    <AuthProvider>
      <ErrorProvider>
        <UnauthorizedErrorPage />
      </ErrorProvider>
    </AuthProvider>
  )
}
