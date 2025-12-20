"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Heart, 
  Users, 
  Target, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  Info,
  XCircle,
  ArrowRight,
  Download,
  Copy,
  Check
} from "lucide-react"
import { useState } from "react"

export default function BrandToolkitDemo() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedColor(label)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const colors = [
    { name: "Primary", var: "--primary", value: "oklch(0.55 0.22 25)", hex: "#EA2A33", desc: "Main brand color - Vibrant Red" },
    { name: "Background", var: "--background", value: "oklch(0.98 0.005 20)", hex: "#FAFAFA", desc: "Page background" },
    { name: "Foreground", var: "--foreground", value: "oklch(0.15 0.02 20)", hex: "#1A1A1A", desc: "Primary text" },
    { name: "Secondary", var: "--secondary", value: "oklch(0.97 0.005 20)", hex: "#F5F5F5", desc: "Secondary backgrounds" },
    { name: "Muted", var: "--muted", value: "oklch(0.97 0.005 20)", hex: "#F5F5F5", desc: "Muted backgrounds" },
    { name: "Accent", var: "--accent", value: "oklch(0.97 0.005 20)", hex: "#F5F5F5", desc: "Accent elements" },
    { name: "Border", var: "--border", value: "oklch(0.93 0.005 20)", hex: "#E8E8E8", desc: "Borders and dividers" },
  ]

  const fonts = [
    { name: "Plus Jakarta Sans", weight: "400", sample: "The quick brown fox jumps over the lazy dog", class: "font-normal" },
    { name: "Plus Jakarta Sans", weight: "500", sample: "The quick brown fox jumps over the lazy dog", class: "font-medium" },
    { name: "Plus Jakarta Sans", weight: "600", sample: "The quick brown fox jumps over the lazy dog", class: "font-semibold" },
    { name: "Plus Jakarta Sans", weight: "700", sample: "The quick brown fox jumps over the lazy dog", class: "font-bold" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Brand Toolkit</h1>
              <p className="text-muted-foreground mt-1">Deesha Foundation Design System</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download Assets
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-16">
        
        {/* Color Palette */}
        <section id="colors">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Color Palette</h2>
            <p className="text-muted-foreground">Our brand colors using modern OKLCH color space for consistent, vibrant colors across all displays</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {colors.map((color) => (
              <Card key={color.name} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div 
                  className="h-32 w-full relative group cursor-pointer"
                  style={{ backgroundColor: `var(${color.var})` }}
                  onClick={() => copyToClipboard(color.value, color.name)}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                    {copiedColor === color.name ? (
                      <Check className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <Copy className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{color.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{color.desc}</p>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="text-muted-foreground">{color.var}</div>
                    <div className="text-muted-foreground">{color.value}</div>
                    <div className="text-muted-foreground">{color.hex}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section id="typography">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Typography</h2>
            <p className="text-muted-foreground">Plus Jakarta Sans - Modern, friendly, and highly readable sans-serif font</p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-8">
              {/* Font Weights */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Font Weights</h3>
                <div className="space-y-4">
                  {fonts.map((font, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-32">{font.weight} Weight</span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-sm text-muted-foreground">{font.class}</span>
                      </div>
                      <p className={`text-xl ${font.class}`}>{font.sample}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Type Scale */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Type Scale</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground font-mono">text-xs (12px)</span>
                    <p className="text-xs">The quick brown fox jumps over the lazy dog</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground font-mono">text-sm (14px)</span>
                    <p className="text-sm">The quick brown fox jumps over the lazy dog</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground font-mono">text-base (16px)</span>
                    <p className="text-base">The quick brown fox jumps over the lazy dog</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground font-mono">text-lg (18px)</span>
                    <p className="text-lg">The quick brown fox jumps over the lazy dog</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground font-mono">text-xl (20px)</span>
                    <p className="text-xl">The quick brown fox jumps over the lazy dog</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground font-mono">text-2xl (24px)</span>
                    <p className="text-2xl">The quick brown fox jumps over the lazy dog</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground font-mono">text-3xl (30px)</span>
                    <p className="text-3xl">The quick brown fox jumps over the lazy dog</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground font-mono">text-4xl (36px)</span>
                    <p className="text-4xl font-bold">The quick brown fox</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Buttons */}
        <section id="buttons">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Buttons</h2>
            <p className="text-muted-foreground">Interactive buttons with hover states and variants</p>
          </div>

          <Tabs defaultValue="variants">
            <TabsList>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="sizes">Sizes</TabsTrigger>
              <TabsTrigger value="states">States</TabsTrigger>
              <TabsTrigger value="icons">With Icons</TabsTrigger>
            </TabsList>

            <TabsContent value="variants" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-4">
                    <Button variant="default">Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sizes" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button size="icon-sm">
                      <Heart className="h-3 w-3" />
                    </Button>
                    <Button size="icon-lg">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="states" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-4">
                    <Button>Normal</Button>
                    <Button className="hover:bg-primary/90">Hover (hover over me)</Button>
                    <Button disabled>Disabled</Button>
                    <Button className="focus-visible:ring-2">Focused</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="icons" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-4">
                    <Button>
                      <Heart className="mr-2 h-4 w-4" />
                      With Icon
                    </Button>
                    <Button>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="secondary">
                      <Users className="mr-2 h-4 w-4" />
                      Team
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Badges */}
        <section id="badges">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Badges</h2>
            <p className="text-muted-foreground">Status indicators and labels</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge className="bg-green-500 text-white hover:bg-green-600">Success</Badge>
                <Badge className="bg-blue-500 text-white hover:bg-blue-600">Info</Badge>
                <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Warning</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Icons */}
        <section id="icons">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Icons</h2>
            <p className="text-muted-foreground">Lucide icons with consistent sizing and styling</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {[
                  { icon: Heart, label: "Heart" },
                  { icon: Users, label: "Users" },
                  { icon: Target, label: "Target" },
                  { icon: Award, label: "Award" },
                  { icon: CheckCircle2, label: "Success" },
                  { icon: AlertCircle, label: "Alert" },
                  { icon: Info, label: "Info" },
                  { icon: XCircle, label: "Error" },
                  { icon: ArrowRight, label: "Arrow" },
                  { icon: Download, label: "Download" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Form Elements */}
        <section id="forms">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Form Elements</h2>
            <p className="text-muted-foreground">Input fields and form controls</p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Input Field</label>
                <Input placeholder="Enter your email..." />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Input with Icon</label>
                <div className="relative">
                  <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="With icon..." />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Textarea</label>
                <Textarea placeholder="Enter your message..." rows={4} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Disabled Input</label>
                <Input disabled placeholder="Disabled field" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section id="cards">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Cards</h2>
            <p className="text-muted-foreground">Content containers with various styles</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>A simple card with header and content</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This is a basic card component that can contain any content you need.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Hover Card</CardTitle>
                <CardDescription>Card with hover effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Hover over this card to see the shadow effect.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Highlighted Card</CardTitle>
                <CardDescription>Card with primary border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This card uses the primary color for its border.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Spacing & Layout */}
        <section id="spacing">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Spacing & Layout</h2>
            <p className="text-muted-foreground">Consistent spacing using Tailwind's spacing scale</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium w-20">gap-1</span>
                  <div className="flex gap-1">
                    <div className="h-8 w-8 bg-primary rounded" />
                    <div className="h-8 w-8 bg-primary rounded" />
                    <div className="h-8 w-8 bg-primary rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium w-20">gap-2</span>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-primary rounded" />
                    <div className="h-8 w-8 bg-primary rounded" />
                    <div className="h-8 w-8 bg-primary rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium w-20">gap-4</span>
                  <div className="flex gap-4">
                    <div className="h-8 w-8 bg-primary rounded" />
                    <div className="h-8 w-8 bg-primary rounded" />
                    <div className="h-8 w-8 bg-primary rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium w-20">gap-6</span>
                  <div className="flex gap-6">
                    <div className="h-8 w-8 bg-primary rounded" />
                    <div className="h-8 w-8 bg-primary rounded" />
                    <div className="h-8 w-8 bg-primary rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium w-20">gap-8</span>
                  <div className="flex gap-8">
                    <div className="h-8 w-8 bg-primary rounded" />
                    <div className="h-8 w-8 bg-primary rounded" />
                    <div className="h-8 w-8 bg-primary rounded" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Border Radius */}
        <section id="radius">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Border Radius</h2>
            <p className="text-muted-foreground">Rounded corners for consistent visual harmony</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="h-20 w-20 bg-primary rounded-none" />
                  <span className="text-sm text-muted-foreground">rounded-none</span>
                </div>
                <div className="space-y-2">
                  <div className="h-20 w-20 bg-primary rounded-sm" />
                  <span className="text-sm text-muted-foreground">rounded-sm</span>
                </div>
                <div className="space-y-2">
                  <div className="h-20 w-20 bg-primary rounded-md" />
                  <span className="text-sm text-muted-foreground">rounded-md</span>
                </div>
                <div className="space-y-2">
                  <div className="h-20 w-20 bg-primary rounded-lg" />
                  <span className="text-sm text-muted-foreground">rounded-lg</span>
                </div>
                <div className="space-y-2">
                  <div className="h-20 w-20 bg-primary rounded-xl" />
                  <span className="text-sm text-muted-foreground">rounded-xl</span>
                </div>
                <div className="space-y-2">
                  <div className="h-20 w-20 bg-primary rounded-2xl" />
                  <span className="text-sm text-muted-foreground">rounded-2xl</span>
                </div>
                <div className="space-y-2">
                  <div className="h-20 w-20 bg-primary rounded-3xl" />
                  <span className="text-sm text-muted-foreground">rounded-3xl</span>
                </div>
                <div className="space-y-2">
                  <div className="h-20 w-20 bg-primary rounded-full" />
                  <span className="text-sm text-muted-foreground">rounded-full</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Shadows */}
        <section id="shadows">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Shadows</h2>
            <p className="text-muted-foreground">Elevation and depth through shadow effects</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <div className="h-24 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    <span className="text-sm font-medium">shadow-sm</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-24 bg-white rounded-lg shadow-md flex items-center justify-center">
                    <span className="text-sm font-medium">shadow-md</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-24 bg-white rounded-lg shadow-lg flex items-center justify-center">
                    <span className="text-sm font-medium">shadow-lg</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-24 bg-white rounded-lg shadow-xl flex items-center justify-center">
                    <span className="text-sm font-medium">shadow-xl</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-24 bg-white rounded-lg shadow-2xl flex items-center justify-center">
                    <span className="text-sm font-medium">shadow-2xl</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-24 bg-white rounded-lg editorial-shadow flex items-center justify-center">
                    <span className="text-sm font-medium">editorial-shadow</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>

      {/* Footer */}
      <div className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Deesha Foundation Brand Toolkit • Design System v1.0</p>
        </div>
      </div>
    </div>
  )
}
