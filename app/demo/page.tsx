import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Palette, Bell, AlertCircle, CheckCircle2, Info, Zap } from "lucide-react"

export default function DemoIndex() {
  const demos = [
    {
      title: "Brand Toolkit",
      description: "Colors, typography, buttons, and all design system components",
      icon: Palette,
      href: "/demo/brand-toolkit",
      status: "ready"
    },
    {
      title: "Toast & Notifications",
      description: "Toast messages, alerts, and notification patterns",
      icon: Bell,
      href: "/demo/toasts",
      status: "ready"
    },
    {
      title: "Error States",
      description: "Error handling, validation, and error message patterns",
      icon: AlertCircle,
      href: "/demo/errors",
      status: "ready"
    },
    {
      title: "Success States",
      description: "Success messages, confirmations, and positive feedback",
      icon: CheckCircle2,
      href: "/demo/success",
      status: "coming-soon"
    },
    {
      title: "Loading States",
      description: "Skeletons, spinners, and loading indicators",
      icon: Zap,
      href: "/demo/loading",
      status: "coming-soon"
    },
    {
      title: "Info & Help",
      description: "Tooltips, popovers, and contextual help patterns",
      icon: Info,
      href: "/demo/info",
      status: "coming-soon"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">Design System Demos</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Explore interactive examples of all components, patterns, and design elements used in the Deesha Foundation website.
          </p>
        </div>
      </div>

      {/* Demo Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demos.map((demo) => {
            const Icon = demo.icon
            const isReady = demo.status === "ready"
            
            return (
              <Card 
                key={demo.href} 
                className={`relative overflow-hidden transition-all ${
                  isReady 
                    ? "hover:shadow-lg hover:border-primary cursor-pointer" 
                    : "opacity-60"
                }`}
              >
                {isReady ? (
                  <Link href={demo.href} className="block">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-xl">{demo.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {demo.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" size="sm" className="w-full">
                        View Demo →
                      </Button>
                    </CardContent>
                  </Link>
                ) : (
                  <>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                          Coming Soon
                        </span>
                      </div>
                      <CardTitle className="text-xl text-muted-foreground">{demo.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {demo.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" size="sm" className="w-full" disabled>
                        Coming Soon
                      </Button>
                    </CardContent>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Deesha Foundation Design System • v1.0</p>
        </div>
      </div>
    </div>
  )
}
