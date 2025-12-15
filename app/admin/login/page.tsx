"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { adminLogin } from "@/lib/actions/admin-auth"

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const urlError = searchParams.get("error")
  const setupSuccess = searchParams.get("setup") === "success"

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    const result = await adminLogin(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <span className="text-2xl font-bold">Deesha Foundation</span>
          </div>
          <CardTitle className="text-xl">Admin Panel</CardTitle>
          <CardDescription>Sign in to manage the website</CardDescription>
        </CardHeader>
        <CardContent>
          {setupSuccess && (
            <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Admin account created successfully! Please check your email to confirm your account, then sign in below.
              </AlertDescription>
            </Alert>
          )}

          {(error || urlError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || (urlError === "unauthorized" ? "You do not have admin access" : urlError)}
              </AlertDescription>
            </Alert>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@deeshafoundation.org"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
              Back to main website
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
