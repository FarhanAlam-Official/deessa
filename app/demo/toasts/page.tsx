"use client"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { notifications } from "@/lib/notifications"
import { useState } from "react"
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Loader2,
  Sparkles,
  Copy,
  Check
} from "lucide-react"

export default function ToastsDemo() {
  const [customTitle, setCustomTitle] = useState("Custom Title")
  const [customDescription, setCustomDescription] = useState("This is a custom notification message")
  const [duration, setDuration] = useState(2500)
  const [copied, setCopied] = useState(false)

  const handlePromiseExample = () => {
    const mockApiCall = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve({ filename: "document.pdf" }) : reject(new Error("Upload failed"))
      }, 3000)
    })

    notifications.promise(mockApiCall, {
      loading: "Uploading file...",
      success: (data: any) => `File uploaded: ${data.filename}`,
      error: (err: any) => `Upload failed: ${err.message}`,
    })
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const codeExamples = {
    success: `notifications.showSuccess({
  title: 'Success!',
  description: 'Your changes have been saved.',
})`,
    error: `notifications.showError({
  title: 'Error',
  description: 'Something went wrong. Please try again.',
})`,
    warning: `notifications.showWarning({
  title: 'Warning',
  description: 'This action cannot be undone.',
})`,
    info: `notifications.showInfo({
  title: 'Info',
  description: 'New updates are available.',
})`,
    promise: `notifications.promise(apiCall, {
  loading: 'Processing...',
  success: (data) => \`Success: \${data.message}\`,
  error: (err) => \`Error: \${err.message}\`,
})`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Toast & Notifications</h1>
              <p className="text-muted-foreground mt-1">Beautiful animated toast notifications with progress bars</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-12">

        {/* Quick Examples */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Quick Examples</h2>
            <p className="text-muted-foreground">Click to see each notification type in action</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200 dark:border-green-800" 
                  onClick={() => notifications.showSuccess({ 
                    title: 'Success!', 
                    description: 'Your changes have been saved successfully.' 
                  })}>
              <CardContent className="p-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-1">Success</h3>
                <p className="text-sm text-muted-foreground">Positive feedback</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-200 dark:border-red-800" 
                  onClick={() => notifications.showError({ 
                    title: 'Error', 
                    description: 'Something went wrong. Please try again.' 
                  })}>
              <CardContent className="p-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold mb-1">Error</h3>
                <p className="text-sm text-muted-foreground">Error messages</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-yellow-200 dark:border-yellow-800" 
                  onClick={() => notifications.showWarning({ 
                    title: 'Warning', 
                    description: 'This action cannot be undone.' 
                  })}>
              <CardContent className="p-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="font-semibold mb-1">Warning</h3>
                <p className="text-sm text-muted-foreground">Cautionary alerts</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 dark:border-blue-800" 
                  onClick={() => notifications.showInfo({ 
                    title: 'Info', 
                    description: 'New updates are available!' 
                  })}>
              <CardContent className="p-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold mb-1">Info</h3>
                <p className="text-sm text-muted-foreground">Informational</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Custom Toast Builder */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Custom Toast Builder</h2>
            <p className="text-muted-foreground">Build and test your own custom notifications</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Enter toast title..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (ms)</Label>
                    <Input 
                      id="duration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      placeholder="2500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Enter toast description..."
                    rows={3}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="default"
                    onClick={() => notifications.showSuccess({ 
                      title: customTitle, 
                      description: customDescription,
                      duration
                    })}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Show Success
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => notifications.showError({ 
                      title: customTitle, 
                      description: customDescription,
                      duration
                    })}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Show Error
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => notifications.showWarning({ 
                      title: customTitle, 
                      description: customDescription,
                      duration
                    })}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Show Warning
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => notifications.showInfo({ 
                      title: customTitle, 
                      description: customDescription,
                      duration
                    })}
                  >
                    <Info className="mr-2 h-4 w-4" />
                    Show Info
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Promise-based Notifications */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Promise-based Notifications</h2>
            <p className="text-muted-foreground">Automatically update toasts based on async operations</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Perfect for API calls, file uploads, or any async operation. The toast will automatically
                  update based on the promise state (loading → success/error).
                </p>
                <div className="flex gap-3">
                  <Button onClick={handlePromiseExample}>
                    <Loader2 className="mr-2 h-4 w-4" />
                    Simulate File Upload
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const mockSave = new Promise((resolve) => setTimeout(resolve, 2000))
                      notifications.promise(mockSave, {
                        loading: "Saving changes...",
                        success: "Changes saved successfully!",
                        error: "Failed to save changes",
                      })
                    }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Simulate Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Code Examples */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Code Examples</h2>
            <p className="text-muted-foreground">Copy and use these examples in your code</p>
          </div>

          <div className="space-y-4">
            {Object.entries(codeExamples).map(([key, code]) => (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">{key}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyCode(code)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm font-mono">{code}</code>
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Features</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gradient Styling</CardTitle>
                <CardDescription>Beautiful gradient backgrounds and icons</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Bars</CardTitle>
                <CardDescription>Animated progress bars show time remaining</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Smooth Animations</CardTitle>
                <CardDescription>Enter and exit animations with easing</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dark Mode</CardTitle>
                <CardDescription>Fully supports light and dark themes</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promise Support</CardTitle>
                <CardDescription>Automatic updates for async operations</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customizable</CardTitle>
                <CardDescription>Custom duration, position, and content</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Toast Notification System • Powered by Sonner</p>
        </div>
      </div>
    </div>
  )
}
