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
  Check,
  Leaf,
  GraduationCap,
  Droplet,
  Sparkles,
  Loader2,
  Mail
} from "lucide-react"
import { useState } from "react"

export default function BrandToolkitDemo() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedColor(label)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const brandColors = [
    { name: "Ocean Blue", var: "--brand-primary", rgb: "63 171 222", hex: "#3FABDE", desc: "Primary brand color - Trust & Hope", icon: Droplet },
    { name: "Deep Ocean", var: "--brand-primary-dark", rgb: "11 95 138", hex: "#0B5F8A", desc: "Hover states & emphasis", icon: Droplet },
  ]

  const pillarColors = [
    { name: "Empowerment", var: "--accent-empowerment", rgb: "214 51 108", hex: "#D6336C", desc: "Women & Community", icon: Heart },
    { name: "Environment", var: "--accent-environment", rgb: "149 193 31", hex: "#95C11F", desc: "Sustainability", icon: Leaf },
    { name: "Education", var: "--accent-education", rgb: "245 158 11", hex: "#F59E0B", desc: "Learning & Growth", icon: GraduationCap },
  ]

  const semanticColors = [
    { name: "Success", var: "--success", rgb: "22 163 74", hex: "#16A34A", desc: "Success messages & confirmations" },
    { name: "Warning", var: "--warning", rgb: "245 158 11", hex: "#F59E0B", desc: "Warnings & attention needed" },
    { name: "Danger", var: "--danger", rgb: "220 38 38", hex: "#DC2626", desc: "Errors & critical actions" },
    { name: "Info", var: "--info", rgb: "37 99 235", hex: "#2563EB", desc: "Informational content" },
  ]

  const neutralColors = [
    { name: "Background", var: "--background", value: "oklch(0.98 0.005 20)", hex: "#FAFAFA", desc: "Page background" },
    { name: "Foreground", var: "--foreground", value: "oklch(0.15 0.02 20)", hex: "#1A1A1A", desc: "Primary text" },
    { name: "Muted", var: "--muted", value: "oklch(0.97 0.005 20)", hex: "#F5F5F5", desc: "Muted backgrounds" },
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
              <p className="text-muted-foreground mt-1">deessa Foundation Design System</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download Assets
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-16">
        
        {/* Hero Section */}
        <section className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-brand-primary" />
            <span className="text-sm font-medium text-brand-primary-dark">Ocean Blue Theme</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">deessa Foundation Design System</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A refreshed identity that embodies trust, hope, and progress. 
            Our new color palette reflects our commitment to sustainable change.
          </p>
        </section>

        {/* Brand Colors */}
        <section id="brand-colors">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Primary Brand Colors</h2>
            <p className="text-muted-foreground">Our core ocean blue palette - representing trust, hope, and progress</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {brandColors.map((color) => {
              const Icon = color.icon
              return (
                <Card key={color.name} className="overflow-hidden hover:shadow-lg transition-all">
                  <div 
                    className="h-40 w-full relative group cursor-pointer flex items-center justify-center"
                    style={{ backgroundColor: `rgb(${color.rgb})` }}
                    onClick={() => copyToClipboard(color.rgb, color.name)}
                  >
                    <Icon className="h-16 w-16 text-white opacity-80" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      {copiedColor === color.name ? (
                        <Check className="h-8 w-8 text-white" />
                      ) : (
                        <Copy className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{color.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{color.desc}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Hex:</span>
                        <code className="font-mono font-semibold">{color.hex}</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">RGB:</span>
                        <code className="font-mono font-semibold">{color.rgb}</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">CSS Var:</span>
                        <code className="font-mono text-xs">{color.var}</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Pillar Colors */}
        <section id="pillar-colors">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Three Pillar Colors</h2>
            <p className="text-muted-foreground">Accent colors representing our core programs: Empowerment, Environment, Education</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillarColors.map((color) => {
              const Icon = color.icon
              return (
                <Card key={color.name} className="overflow-hidden hover:shadow-lg transition-all">
                  <div 
                    className="h-32 w-full relative group cursor-pointer flex items-center justify-center"
                    style={{ backgroundColor: `rgb(${color.rgb})` }}
                    onClick={() => copyToClipboard(color.rgb, color.name)}
                  >
                    <Icon className="h-12 w-12 text-white" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      {copiedColor === color.name ? (
                        <Check className="h-6 w-6 text-white" />
                      ) : (
                        <Copy className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold mb-1">{color.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{color.desc}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hex:</span>
                        <code className="font-mono font-semibold">{color.hex}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">RGB:</span>
                        <code className="font-mono">{color.rgb}</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Semantic Colors */}
        <section id="semantic-colors">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Semantic Colors</h2>
            <p className="text-muted-foreground">Functional colors for UI states and feedback</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {semanticColors.map((color) => (
              <Card key={color.name} className="overflow-hidden hover:shadow-lg transition-all">
                <div 
                  className="h-24 w-full relative group cursor-pointer"
                  style={{ backgroundColor: `rgb(${color.rgb})` }}
                  onClick={() => copyToClipboard(color.rgb, color.name)}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    {copiedColor === color.name ? (
                      <Check className="h-6 w-6 text-white" />
                    ) : (
                      <Copy className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{color.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{color.desc}</p>
                  <code className="text-xs font-mono">{color.hex}</code>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Neutral Colors */}
        <section id="neutral-colors">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Neutral Colors</h2>
            <p className="text-muted-foreground">Foundation colors for backgrounds, text, and borders</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {neutralColors.map((color) => (
              <Card key={color.name} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div 
                  className="h-20 w-full relative group cursor-pointer"
                  style={{ backgroundColor: `var(${color.var})` }}
                  onClick={() => copyToClipboard(color.value, color.name)}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                    {copiedColor === color.name ? (
                      <Check className="h-6 w-6 text-foreground" />
                    ) : (
                      <Copy className="h-6 w-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{color.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{color.desc}</p>
                  <code className="text-xs font-mono">{color.hex}</code>
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
            <p className="text-muted-foreground">Interactive elements with brand colors and various states</p>
          </div>

          <Tabs defaultValue="brand">
            <TabsList>
              <TabsTrigger value="brand">Brand Colors</TabsTrigger>
              <TabsTrigger value="pillars">Pillars</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="sizes">Sizes</TabsTrigger>
              <TabsTrigger value="states">States</TabsTrigger>
            </TabsList>

            <TabsContent value="brand" className="mt-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Primary Brand</h3>
                    <div className="flex flex-wrap gap-3">
                      <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white">
                        <Droplet className="h-4 w-4 mr-2" />
                        Ocean Blue
                      </Button>
                      <Button className="bg-brand-primary-dark hover:bg-brand-primary text-white">
                        Deep Ocean
                      </Button>
                      <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-primary-light">
                        Outline
                      </Button>
                      <Button variant="ghost" className="text-brand-primary hover:text-brand-primary-dark hover:bg-primary-light">
                        Ghost
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pillars" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-3">
                    <Button className="bg-empowerment hover:opacity-90 text-white">
                      <Heart className="h-4 w-4 mr-2" />
                      Empowerment
                    </Button>
                    <Button className="bg-environment hover:opacity-90 text-white">
                      <Leaf className="h-4 w-4 mr-2" />
                      Environment
                    </Button>
                    <Button className="bg-education hover:opacity-90 text-white">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Education
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

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
                    <Button size="sm" className="bg-brand-primary hover:bg-brand-primary-dark text-white">Small</Button>
                    <Button size="default" className="bg-brand-primary hover:bg-brand-primary-dark text-white">Default</Button>
                    <Button size="lg" className="bg-brand-primary hover:bg-brand-primary-dark text-white">Large</Button>
                    <Button size="icon" className="bg-brand-primary hover:bg-brand-primary-dark text-white">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="states" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white">Normal</Button>
                    <Button disabled className="bg-brand-primary text-white">Disabled</Button>
                    <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Gradients */}
        <section id="gradients">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Gradients</h2>
            <p className="text-muted-foreground">Pre-built gradient utilities for visual interest</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <div className="gradient-ocean h-48 flex items-center justify-center">
                <div className="text-white text-center">
                  <Droplet className="h-12 w-12 mx-auto mb-2 opacity-90" />
                  <h3 className="font-bold text-lg">Ocean Gradient</h3>
                  <code className="text-xs opacity-90">.gradient-ocean</code>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Primary to dark - perfect for hero sections and CTAs
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="gradient-pillars h-48 flex items-center justify-center">
                <div className="text-white text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-90" />
                  <h3 className="font-bold text-lg">Pillars Gradient</h3>
                  <code className="text-xs opacity-90">.gradient-pillars</code>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Empowerment → Environment → Education
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Badges */}
        <section id="badges">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Badges</h2>
            <p className="text-muted-foreground">Status indicators and labels with brand colors</p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">Brand Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-brand-primary text-white">Primary</Badge>
                  <Badge className="bg-brand-primary-dark text-white">Primary Dark</Badge>
                  <Badge variant="outline" className="border-brand-primary text-brand-primary">Outline</Badge>
                  <Badge className="bg-primary-light text-brand-primary-dark">Soft</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Pillar Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-empowerment text-white">
                    <Heart className="h-3 w-3 mr-1" />
                    Empowerment
                  </Badge>
                  <Badge className="bg-environment text-white">
                    <Leaf className="h-3 w-3 mr-1" />
                    Environment
                  </Badge>
                  <Badge className="bg-education text-white">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Education
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Semantic Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-green-500 text-white hover:bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Success
                  </Badge>
                  <Badge className="bg-blue-500 text-white hover:bg-blue-600">
                    <Info className="h-3 w-3 mr-1" />
                    Info
                  </Badge>
                  <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Warning
                  </Badge>
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Danger
                  </Badge>
                </div>
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
          <p>deessa Foundation Brand Toolkit • Design System v1.0</p>
        </div>
      </div>
    </div>
  )
}
