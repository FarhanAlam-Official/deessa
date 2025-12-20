"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ServerCrash, WifiOff, ShieldX, FileQuestion, Copy, Check } from "lucide-react"
import Link from "next/link"
import { notifications } from "@/lib/notifications"

export default function ErrorsDemo() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    notifications.showSuccess("Code copied!")
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const errorPages = [
    {
      id: "404",
      title: "404 - Not Found",
      description: "Page doesn't exist",
      icon: FileQuestion,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      trigger: () => {
        window.location.href = "/this-page-does-not-exist"
      },
      file: "app/not-found.tsx",
    },
    {
      id: "error",
      title: "Generic Error",
      description: "Unexpected runtime error",
      icon: AlertCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      borderColor: "border-orange-200 dark:border-orange-800",
      trigger: () => {
        window.open("/demo/errors/generic", "_blank")
      },
      file: "app/error.tsx",
    },
    {
      id: "500",
      title: "500 - Server Error",
      description: "Internal server error",
      icon: ServerCrash,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      trigger: () => {
        window.open("/demo/errors/server", "_blank")
      },
      file: "app/global-error.tsx",
    },
    {
      id: "network",
      title: "Network Error",
      description: "No internet connection",
      icon: WifiOff,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800",
      trigger: () => {
        window.open("/demo/errors/network", "_blank")
      },
      file: "components/error-pages/NetworkErrorPage.tsx",
    },
    {
      id: "unauthorized",
      title: "Unauthorized",
      description: "Access denied",
      icon: ShieldX,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      trigger: () => {
        window.open("/demo/errors/unauthorized", "_blank")
      },
      file: "components/error-pages/UnauthorizedErrorPage.tsx",
    },
  ]

  const errorComponents = [
    {
      id: "generic",
      title: "Generic Error",
      description: "Unexpected runtime error",
      icon: AlertCircle,
      color: "text-orange-500",
      available: true,
      demo: "/demo/errors/generic",
    },
    {
      id: "server",
      title: "Server Error",
      description: "Internal server error (500)",
      icon: ServerCrash,
      color: "text-red-500",
      available: true,
      demo: "/demo/errors/server",
    },
    {
      id: "network",
      title: "Network Error",
      description: "No internet connection",
      icon: WifiOff,
      color: "text-purple-500",
      available: true,
      demo: "/demo/errors/network",
    },
    {
      id: "unauthorized",
      title: "Unauthorized",
      description: "Access denied",
      icon: ShieldX,
      color: "text-yellow-500",
      available: true,
      demo: "/demo/errors/unauthorized",
    },
  ]

  const notFoundCode = `// app/not-found.tsx
"use client"

import NotFoundErrorPage from "@/components/error-pages/NotFoundErrorPage"

export default NotFoundErrorPage

// NotFoundErrorPage features:
// - Floating draggable astronaut with spring physics
// - Gradient grid background
// - Floating animated orbs
// - Interactive drag & hover effects
// - Beautiful 404 typography
// - "Lost in Space" theme`

  const errorCode = `// app/error.tsx
"use client"

import GenericErrorPage from "@/components/error-pages/GenericErrorPage"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return <GenericErrorPage error={error} reset={reset} />
}

// GenericErrorPage features:
// - Receives error and reset props from Next.js
// - Expandable error details with stack trace
// - Copy error details to clipboard
// - Report issue via email
// - Beautiful card-based design
// - Dark mode support
// - Animated transitions`

  const globalErrorCode = `// app/global-error.tsx
"use client"

import ServerErrorPage from "@/components/error-pages/ServerErrorPage"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html>
      <body>
        <ServerErrorPage error={error} reset={reset} />
      </body>
    </html>
  )
}

// ServerErrorPage features:
// - Receives error and reset props from Next.js
// - Animated 500 number with letter-spacing animation
// - Mouse-tracking parallax effect on error card
// - Floating gradient orbs
// - Gradient grid background
// - ServerCrash icon from lucide-react
// - Try again (if reset available) or Go back buttons
// - Go home, Report problem buttons
// - Beautiful red theme with glass morphism`

  const usageCode = `// Trigger 404 error
// Just navigate to a non-existent page
<Link href="/non-existent-page">This will show 404</Link>

// Trigger runtime error
// Throw an error in a client component
"use client"

export default function MyComponent() {
  const triggerError = () => {
    throw new Error("Something went wrong!")
  }
  
  return <button onClick={triggerError}>Trigger Error</button>
}

// Handle errors in server actions
export async function myServerAction() {
  try {
    // Some code that might fail
    await riskyOperation()
  } catch (error) {
    // Error boundary will catch this
    throw error
  }
}`

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Error Pages</h1>
          <Badge variant="outline">System</Badge>
        </div>
        <p className="text-muted-foreground">
          Beautiful error pages with animations and helpful actions. Integrated into Next.js App Router.
        </p>
      </div>

      <Tabs defaultValue="examples" className="space-y-6">
        <TabsList>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Next.js Error Pages</CardTitle>
              <CardDescription>
                Special files that Next.js uses for error handling. Click the buttons to see them in action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {errorPages.map((page) => (
                  <Card
                    key={page.id}
                    className={`${page.borderColor} border-2 hover:shadow-lg transition-all`}
                  >
                    <CardContent className="pt-6 space-y-4">
                      <div className={`w-12 h-12 rounded-lg ${page.bgColor} flex items-center justify-center`}>
                        <page.icon className={`h-6 w-6 ${page.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{page.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{page.description}</p>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{page.file}</code>
                      </div>
                      <Button onClick={page.trigger} variant="outline" className="w-full">
                        Trigger {page.id}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Additional Error Components</CardTitle>
              <CardDescription>
                Reusable error components available in the components folder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {errorComponents.map((component) => (
                  <Card key={component.id}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <component.icon className={`h-5 w-5 ${component.color}`} />
                        <h3 className="font-semibold">{component.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{component.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {component.available && (
                          <Badge variant="secondary" className="text-xs">
                            Available in components/error-pages
                          </Badge>
                        )}
                        {component.demo && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={component.demo}>View Demo</Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Tab */}
        <TabsContent value="implementation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>404 - Not Found</CardTitle>
              <CardDescription>app/not-found.tsx</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => copyCode(notFoundCode, "not-found")}
                >
                  {copiedCode === "not-found" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{notFoundCode}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generic Error</CardTitle>
              <CardDescription>app/error.tsx</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => copyCode(errorCode, "error")}
                >
                  {copiedCode === "error" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{errorCode}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Global Error</CardTitle>
              <CardDescription>app/global-error.tsx</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => copyCode(globalErrorCode, "global")}
                >
                  {copiedCode === "global" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{globalErrorCode}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How to Use Error Pages</CardTitle>
              <CardDescription>
                Next.js automatically uses these special files for error handling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileQuestion className="h-4 w-4 text-blue-500" />
                    not-found.tsx
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Automatically shown when:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>User navigates to a non-existent route</li>
                    <li>You call <code className="bg-muted px-1 rounded">notFound()</code> in a Server Component</li>
                    <li>A dynamic route segment doesn't match</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    error.tsx
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Catches errors in:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Client Components (useState, useEffect, event handlers)</li>
                    <li>Server Components during rendering</li>
                    <li>Server Actions</li>
                    <li>Route Handlers</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <ServerCrash className="h-4 w-4 text-red-500" />
                    global-error.tsx
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Catches errors in:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Root layout.tsx</li>
                    <li>Root template.tsx</li>
                    <li>Global uncaught exceptions</li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <h3 className="font-semibold mb-3">Code Examples</h3>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => copyCode(usageCode, "usage")}
                  >
                    {copiedCode === "usage" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{usageCode}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features Included</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Framer Motion Animations</h4>
                    <p className="text-xs text-muted-foreground">Smooth transitions and interactions</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Gradient Backgrounds</h4>
                    <p className="text-xs text-muted-foreground">Beautiful visual design</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Floating Astronaut</h4>
                    <p className="text-xs text-muted-foreground">Draggable 404 character</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Error Details</h4>
                    <p className="text-xs text-muted-foreground">Copy and report functionality</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Dark Mode Support</h4>
                    <p className="text-xs text-muted-foreground">Works with theme toggle</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Toast Integration</h4>
                    <p className="text-xs text-muted-foreground">Uses notification system</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Back to Demo Hub */}
      <div className="mt-8">
        <Button asChild variant="outline">
          <Link href="/demo">← Back to Demo Hub</Link>
        </Button>
      </div>
    </div>
  )
}
