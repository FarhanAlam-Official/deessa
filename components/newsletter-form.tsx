"use client"

import type React from "react"

import { useState } from "react"
import { Send, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { subscribeToNewsletter } from "@/lib/actions/newsletter"

interface NewsletterFormProps {
  variant?: "inline" | "stacked"
  className?: string
}

export function NewsletterForm({ variant = "inline", className = "" }: NewsletterFormProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("Please enter your email address.")
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await subscribeToNewsletter(email)

    setIsLoading(false)

    if (result.success) {
      setIsSubmitted(true)
    } else {
      setError(result.message)
    }
  }

  if (isSubmitted) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle className="size-5" />
        <span className="text-sm font-medium">Thanks for subscribing!</span>
      </div>
    )
  }

  if (variant === "stacked") {
    return (
      <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }}
          required
          className="w-full h-11 px-4 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button type="submit" className="w-full rounded-lg" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Send className="size-4 mr-2" />
              Subscribe
            </>
          )}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="flex-1">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }}
          required
          className="w-full h-11 px-4 rounded-lg border border-border bg-surface text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <Button type="submit" className="rounded-lg h-11 px-6" disabled={isLoading}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      </Button>
    </form>
  )
}
