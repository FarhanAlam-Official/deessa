"use client"

import { createContext, useContext, ReactNode } from "react"

interface User {
  first_name?: string
  role?: string
}

interface AuthContextType {
  user: User | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // For now, return null user - can be connected to real auth later
  const user = null

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
