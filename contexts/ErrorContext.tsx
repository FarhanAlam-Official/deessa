"use client"

import { createContext, useContext, ReactNode } from "react"

interface ErrorData {
  requiredRoles?: string[]
  requestedRole?: string
  requestedPath?: string
}

interface ErrorContextType {
  error: ErrorData | null
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: ReactNode }) {
  // For now, return null error - can be set when errors occur
  const error = null

  return (
    <ErrorContext.Provider value={{ error }}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error("useError must be used within an ErrorProvider")
  }
  return context
}
