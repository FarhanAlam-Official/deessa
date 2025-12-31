"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Loader2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Home,
  Image as ImageIcon,
  Newspaper,
  Palette,
  Search,
  BookOpen,
  Layout,
  HelpCircle,
  Check,
  X,
  Save,
  Settings,
} from "lucide-react"
import { updateSiteSetting } from "@/lib/actions/admin-settings"
import { FileUpload } from "./file-upload"
import { GalleryManager } from "./gallery-manager"
import { notifications } from "@/lib/notifications"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface SiteSettingsFormProps {
  settings: Record<string, Record<string, unknown>>
}

export function SiteSettingsForm({ settings }: SiteSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Get defaults from settings
  const general = (settings.general || {}) as Record<string, string>
  const contact = (settings.contact || {}) as Record<string, string>
  const social = (settings.social || {}) as Record<string, string>
  const seo = (settings.seo || {}) as Record<string, string>

  // Get new settings with safe defaults
  const homeHero = (settings.home_hero || {}) as any
  const homeInitiatives = (settings.home_initiatives || {}) as any
  const aboutHero = (settings.about_hero || {}) as any
  const contactHero = (settings.contact_hero || {}) as any
  const impactHero = (settings.impact_hero || {}) as any
  const pressHero = (settings.press_hero || {}) as any
  const programsHero = (settings.programs_hero || {}) as any
  const storiesHero = (settings.stories_hero || {}) as any
  const eventsHero = (settings.events_hero || {}) as any
  const getInvolvedHero = (settings.get_involved_hero || {}) as any
  const donateHero = (settings.donate_hero || {}) as any
  const pressGallery = (settings.press_gallery || { images: [] }) as any
  const branding = (settings.branding || {}) as any

  // State for image uploads
  const [homeHeroImages, setHomeHeroImages] = useState({
    mainImage: homeHero.mainImage || "",
    videoImage: homeHero.videoImage || "",
    classroomImage: homeHero.classroomImage || "",
    donorImage1: homeHero.donorImage1 || "",
    donorImage2: homeHero.donorImage2 || "",
  })

  const [initiativeImages, setInitiativeImages] = useState({
    education: homeInitiatives.education?.image || "",
    empowerment: homeInitiatives.empowerment?.image || "",
    health: homeInitiatives.health?.image || "",
  })

  const [pageHeroImages, setPageHeroImages] = useState({
    about: aboutHero.image || "",
    contact: contactHero.image || "",
    impact: impactHero.image || "",
    press: pressHero.image || "",
    programs: programsHero.image || "",
    stories: storiesHero.image || "",
    events: eventsHero.image || "",
    get_involved: getInvolvedHero.image || "",
    donate: donateHero.image || "",
  })

  const [galleryImages, setGalleryImages] = useState(pressGallery.images || [])

  const [brandingImages, setBrandingImages] = useState({
    primaryLogo: branding.primaryLogo || "",
    favicon: branding.favicon || "",
    ogImage: branding.ogImage || "",
  })

  async function handleSubmit(key: string, formData: FormData) {
    setIsLoading(true)

    const value: Record<string, unknown> = {}
    formData.forEach((v, k) => {
      if (k !== "settingKey") value[k] = v
    })

    const result = await updateSiteSetting(key, value)

    if (result?.error) {
      notifications.showError({
        title: "Failed to save settings",
        description: result.error,
      })
    } else {
      notifications.showSuccess({
        title: "Settings saved",
        description: `${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')} updated successfully`,
      })
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Site Settings</h1>
            <p className="text-muted-foreground">Configure global website settings</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all duration-200 hover:scale-105">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:!max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Image Upload Guidelines</DialogTitle>
              <DialogDescription>
                Follow these guidelines for optimal image quality and performance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Supported Formats
                </h3>
                <div className="grid grid-cols-2 gap-3 pl-7">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" /> JPEG (.jpg, .jpeg)
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" /> PNG (.png)
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" /> WebP (.webp)
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" /> SVG (.svg) - Logos only
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                  Recommended Sizes
                </h3>
                <div className="space-y-2 pl-7 text-sm">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="font-medium">Hero Images:</span>
                    <span className="text-muted-foreground">1920×1080px (16:9)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="font-medium">Initiative Cards:</span>
                    <span className="text-muted-foreground">800×600px (4:3)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="font-medium">Logos:</span>
                    <span className="text-muted-foreground">500×200px (SVG preferred)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="font-medium">Favicon:</span>
                    <span className="text-muted-foreground">32×32px or 16×16px</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="font-medium">Social Share (OG):</span>
                    <span className="text-muted-foreground">1200×630px</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-medium">Press Gallery:</span>
                    <span className="text-muted-foreground">1200×800px (3:2)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-orange-600" />
                  File Size Limits
                </h3>
                <div className="space-y-2 pl-7 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Hero & Page Images: <strong>Max 10MB</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Initiative Cards: <strong>Max 5MB</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Logos & Icons: <strong>Max 2MB</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Favicon: <strong>Max 1MB</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <X className="h-5 w-5 text-red-600" />
                  Not Supported
                </h3>
                <div className="space-y-2 pl-7 text-sm">
                  <div className="flex items-center gap-2 text-red-600">
                    <X className="h-4 w-4" />
                    Facebook/Instagram direct URLs (use upload instead)
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <X className="h-4 w-4" />
                    Password-protected images
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <X className="h-4 w-4" />
                    Animated GIFs (use video for animations)
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Pro Tips
                </h4>
                <ul className="space-y-1 text-sm text-blue-800 pl-6">
                  <li className="list-disc">Compress images before uploading for faster load times</li>
                  <li className="list-disc">Use WebP format when possible for better compression</li>
                  <li className="list-disc">Upload to Supabase storage instead of external URLs for reliability</li>
                  <li className="list-disc">Keep file sizes small to improve page performance</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        {/* Enhanced Tab Navigation with Scroll */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-sm pb-6 border-b border-border/50">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex h-auto gap-2 bg-transparent">
              <TabsTrigger 
                value="general" 
                className="relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[state=active]:scale-105 data-[state=active]:rounded-xl rounded-lg px-4 py-2.5 group"
              >
                <Globe className="h-4 w-4 mr-2 group-data-[state=active]:animate-pulse" />
                <span className="font-semibold">General</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-data-[state=active]:opacity-100 group-data-[state=active]:animate-shimmer pointer-events-none" />
              </TabsTrigger>
              <TabsTrigger 
                value="contact" 
                className="relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[state=active]:scale-105 data-[state=active]:rounded-xl rounded-lg px-4 py-2.5 group"
              >
                <Phone className="h-4 w-4 mr-2 group-data-[state=active]:animate-pulse" />
                <span className="font-semibold">Contact</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-data-[state=active]:opacity-100 group-data-[state=active]:animate-shimmer pointer-events-none" />
              </TabsTrigger>
              <TabsTrigger 
                value="social" 
                className="relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[state=active]:scale-105 data-[state=active]:rounded-xl rounded-lg px-4 py-2.5 group"
              >
                <Twitter className="h-4 w-4 mr-2 group-data-[state=active]:animate-pulse" />
                <span className="font-semibold">Social</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-data-[state=active]:opacity-100 group-data-[state=active]:animate-shimmer pointer-events-none" />
              </TabsTrigger>
              <TabsTrigger 
                value="seo" 
                className="relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[state=active]:scale-105 data-[state=active]:rounded-xl rounded-lg px-4 py-2.5 group"
              >
                <Search className="h-4 w-4 mr-2 group-data-[state=active]:animate-pulse" />
                <span className="font-semibold">SEO</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-data-[state=active]:opacity-100 group-data-[state=active]:animate-shimmer pointer-events-none" />
              </TabsTrigger>
              <TabsTrigger 
                value="homepage" 
                className="relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[state=active]:scale-105 data-[state=active]:rounded-xl rounded-lg px-4 py-2.5 group"
              >
                <Home className="h-4 w-4 mr-2 group-data-[state=active]:animate-pulse" />
                <span className="font-semibold">Homepage</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-data-[state=active]:opacity-100 group-data-[state=active]:animate-shimmer pointer-events-none" />
              </TabsTrigger>
              <TabsTrigger 
                value="page-heroes" 
                className="relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[state=active]:scale-105 data-[state=active]:rounded-xl rounded-lg px-4 py-2.5 group"
              >
                <Layout className="h-4 w-4 mr-2 group-data-[state=active]:animate-pulse" />
                <span className="font-semibold">Page Heroes</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-data-[state=active]:opacity-100 group-data-[state=active]:animate-shimmer pointer-events-none" />
              </TabsTrigger>
              <TabsTrigger 
                value="press" 
                className="relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[state=active]:scale-105 data-[state=active]:rounded-xl rounded-lg px-4 py-2.5 group"
              >
                <Newspaper className="h-4 w-4 mr-2 group-data-[state=active]:animate-pulse" />
                <span className="font-semibold">Press</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-data-[state=active]:opacity-100 group-data-[state=active]:animate-shimmer pointer-events-none" />
              </TabsTrigger>
              <TabsTrigger 
                value="branding" 
                className="relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[state=active]:scale-105 data-[state=active]:rounded-xl rounded-lg px-4 py-2.5 group"
              >
                <Palette className="h-4 w-4 mr-2 group-data-[state=active]:animate-pulse" />
                <span className="font-semibold">Branding</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-data-[state=active]:opacity-100 group-data-[state=active]:animate-shimmer pointer-events-none" />
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <TabsContent value="general" className="space-y-6">
          <form action={(formData) => handleSubmit("general", formData)}>
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  General Settings
                </CardTitle>
                <CardDescription className="text-base">Configure basic website information and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteName" className="text-sm font-semibold">Site Name</Label>
                    <Input 
                      id="siteName" 
                      name="siteName" 
                      defaultValue={general.siteName || "deessa Foundation"}
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">The name of your organization</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline" className="text-sm font-semibold">Tagline</Label>
                    <Input 
                      id="tagline" 
                      name="tagline" 
                      defaultValue={general.tagline || "Empowering Communities"}
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">Short descriptive tagline</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Site Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    rows={4} 
                    defaultValue={general.description || ""}
                    className="resize-none"
                    placeholder="Brief description of your organization..."
                  />
                  <p className="text-xs text-muted-foreground">Used in meta tags and site footer</p>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Branding Assets
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="logo" className="text-sm font-semibold">Logo URL</Label>
                      <Input
                        id="logo"
                        name="logo"
                        type="url"
                        defaultValue={general.logo || ""}
                        placeholder="https://..."
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">Primary logo for header</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favicon" className="text-sm font-semibold">Favicon URL</Label>
                      <Input
                        id="favicon"
                        name="favicon"
                        type="url"
                        defaultValue={general.favicon || ""}
                        placeholder="https://..."
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">Browser tab icon (32x32px)</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={isLoading} size="lg" className="min-w-[180px]">
                    {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Saving..." : "Save General Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <form action={(formData) => handleSubmit("contact", formData)}>
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  Contact Information
                </CardTitle>
                <CardDescription className="text-base">Contact details displayed on your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold">
                      <Mail className="h-4 w-4 text-blue-600" /> Email Address
                    </Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      defaultValue={contact.email || ""}
                      placeholder="contact@example.com"
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">Primary contact email</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold">
                      <Phone className="h-4 w-4 text-blue-600" /> Phone Number
                    </Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      defaultValue={contact.phone || ""}
                      placeholder="+1 (555) 123-4567"
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">Main contact number</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4 text-blue-600" /> Physical Address
                  </Label>
                  <Textarea 
                    id="address" 
                    name="address" 
                    rows={3} 
                    defaultValue={contact.address || ""}
                    placeholder="123 Street Name, City, Country"
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Office or mailing address</p>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Location & Hours
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="officeHours" className="text-sm font-semibold">Office Hours</Label>
                      <Input
                        id="officeHours"
                        name="officeHours"
                        defaultValue={contact.officeHours || ""}
                        placeholder="Mon-Fri: 9am-5pm"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">When you're available</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mapUrl" className="text-sm font-semibold">Google Maps URL</Label>
                      <Input
                        id="mapUrl"
                        name="mapUrl"
                        type="url"
                        defaultValue={contact.mapUrl || ""}
                        placeholder="https://maps.google.com/..."
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">Embed map on contact page</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={isLoading} size="lg" className="min-w-[180px]">
                    {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Saving..." : "Save Contact Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <form action={(formData) => handleSubmit("social", formData)}>
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Twitter className="h-5 w-5 text-purple-600" />
                  </div>
                  Social Media Links
                </CardTitle>
                <CardDescription className="text-base">Connect your social media accounts to display on your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="flex items-center gap-2 text-sm font-semibold">
                      <Facebook className="h-4 w-4 text-[#1877F2]" /> Facebook
                    </Label>
                    <Input
                      id="facebook"
                      name="facebook"
                      type="url"
                      defaultValue={social.facebook || ""}
                      placeholder="https://facebook.com/yourpage"
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">Your Facebook page URL</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="flex items-center gap-2 text-sm font-semibold">
                      <Twitter className="h-4 w-4 text-[#1DA1F2]" /> Twitter / X
                    </Label>
                    <Input
                      id="twitter"
                      name="twitter"
                      type="url"
                      defaultValue={social.twitter || ""}
                      placeholder="https://twitter.com/yourhandle"
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">Your Twitter/X profile</p>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2 text-sm font-semibold">
                      <Instagram className="h-4 w-4 text-[#E4405F]" /> Instagram
                    </Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      type="url"
                      defaultValue={social.instagram || ""}
                      placeholder="https://instagram.com/yourprofile"
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">Your Instagram profile</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center gap-2 text-sm font-semibold">
                      <Linkedin className="h-4 w-4 text-[#0A66C2]" /> LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      name="linkedin"
                      type="url"
                      defaultValue={social.linkedin || ""}
                      placeholder="https://linkedin.com/company/..."
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">Your LinkedIn company page</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube" className="flex items-center gap-2 text-sm font-semibold">
                    <Youtube className="h-4 w-4 text-[#FF0000]" /> YouTube
                  </Label>
                  <Input
                    id="youtube"
                    name="youtube"
                    type="url"
                    defaultValue={social.youtube || ""}
                    placeholder="https://youtube.com/@yourchannel"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">Your YouTube channel</p>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={isLoading} size="lg" className="min-w-[180px]">
                    {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Saving..." : "Save Social Links"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <form action={(formData) => handleSubmit("seo", formData)}>
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Search className="h-5 w-5 text-green-600" />
                  </div>
                  SEO Settings
                </CardTitle>
                <CardDescription className="text-base">Optimize your website for search engines and social media sharing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle" className="text-sm font-semibold">Default Meta Title</Label>
                  <Input
                    id="metaTitle"
                    name="metaTitle"
                    defaultValue={seo.metaTitle || ""}
                    placeholder="Deesha Foundation - Empowering Communities"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">Appears in browser tabs and search results (50-60 characters recommended)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription" className="text-sm font-semibold">Default Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    name="metaDescription"
                    rows={3}
                    defaultValue={seo.metaDescription || ""}
                    placeholder="A compelling description of your organization..."
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Displayed in search results (150-160 characters recommended)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords" className="text-sm font-semibold">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    name="keywords"
                    defaultValue={seo.keywords || ""}
                    placeholder="nonprofit, charity, education, community, empowerment"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">Help search engines understand your content (5-10 keywords recommended)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ogImage" className="text-sm font-semibold">Default Social Share Image URL</Label>
                  <Input
                    id="ogImage"
                    name="ogImage"
                    type="url"
                    defaultValue={seo.ogImage || ""}
                    placeholder="https://..."
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">Appears when your site is shared on social media • Recommended size: 1200×630 pixels</p>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={isLoading} size="lg" className="min-w-[180px]">
                    {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Saving..." : "Save SEO Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* NEW: Homepage Settings Tab */}
        <TabsContent value="homepage">
          <form
            action={async (formData) => {
              const homeHeroValue = {
                ...homeHeroImages,
                title: formData.get("title"),
                subtitle: formData.get("subtitle"),
                badge: formData.get("badge"),
              }
              await handleSubmit("home_hero", new FormData())
              await updateSiteSetting("home_hero", homeHeroValue)

              const initiativesValue = {
                education: {
                  title: formData.get("eduTitle"),
                  description: formData.get("eduDesc"),
                  image: initiativeImages.education,
                },
                empowerment: {
                  title: formData.get("empTitle"),
                  description: formData.get("empDesc"),
                  image: initiativeImages.empowerment,
                },
                health: {
                  title: formData.get("healthTitle"),
                  description: formData.get("healthDesc"),
                  image: initiativeImages.health,
                },
              }
              await updateSiteSetting("home_initiatives", initiativesValue)
              notifications.showSuccess({
                title: "Settings saved",
                description: "Homepage settings updated successfully",
              })
              router.refresh()
            }}
          >
            <div className="space-y-6">
              <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <ImageIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    Hero Section Images
                  </CardTitle>
                  <CardDescription className="text-base">Configure the main homepage hero section visuals and content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Main Hero Image</Label>
                      <FileUpload
                        bucket="hero-images"
                        currentUrl={homeHeroImages.mainImage}
                        onUpload={(url) => setHomeHeroImages((prev) => ({ ...prev, mainImage: url }))}
                        accept="image/*"
                        maxSizeMB={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Classroom Image</Label>
                      <FileUpload
                        bucket="hero-images"
                        currentUrl={homeHeroImages.classroomImage}
                        onUpload={(url) => setHomeHeroImages((prev) => ({ ...prev, classroomImage: url }))}
                        accept="image/*"
                        maxSizeMB={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Donor Image 1</Label>
                      <FileUpload
                        bucket="hero-images"
                        currentUrl={homeHeroImages.donorImage1}
                        onUpload={(url) => setHomeHeroImages((prev) => ({ ...prev, donorImage1: url }))}
                        accept="image/*"
                        maxSizeMB={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Donor Image 2</Label>
                      <FileUpload
                        bucket="hero-images"
                        currentUrl={homeHeroImages.donorImage2}
                        onUpload={(url) => setHomeHeroImages((prev) => ({ ...prev, donorImage2: url }))}
                        accept="image/*"
                        maxSizeMB={5}
                      />
                    </div>
                  </div>

                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Hero Content
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="title">Hero Title</Label>
                      <Input id="title" name="title" defaultValue={homeHero.title || "Hope for Every Child."} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subtitle">Hero Subtitle</Label>
                      <Textarea
                        id="subtitle"
                        name="subtitle"
                        rows={2}
                        defaultValue={
                          homeHero.subtitle ||
                          "We are rewriting the future of rural Nepal through education, healthcare, and community empowerment."
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="badge">Hero Badge Text</Label>
                      <Input id="badge" name="badge" defaultValue={homeHero.badge || "Est. 2014 • Kathmandu"} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <BookOpen className="h-5 w-5 text-indigo-600" />
                    </div>
                    Initiative Cards
                  </CardTitle>
                  <CardDescription className="text-base">Configure the three main initiative cards displayed on homepage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Education Card */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-indigo-600" />
                      Education Initiative
                    </h4>
                    <FileUpload
                      bucket="hero-images"
                      currentUrl={initiativeImages.education}
                      onUpload={(url) => setInitiativeImages((prev) => ({ ...prev, education: url }))}
                      label="Education Image"
                      maxSizeMB={10}
                    />
                    <Input
                      name="eduTitle"
                      defaultValue={homeInitiatives.education?.title || "Rural Education"}
                      placeholder="Title"
                    />
                    <Textarea
                      name="eduDesc"
                      defaultValue={
                        homeInitiatives.education?.description ||
                        "Providing quality education, teacher training, and infrastructure..."
                      }
                      placeholder="Description"
                      rows={3}
                    />
                  </div>

                  {/* Empowerment Card */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-indigo-600" />
                      Women's Empowerment Initiative
                    </h4>
                    <FileUpload
                      bucket="hero-images"
                      currentUrl={initiativeImages.empowerment}
                      onUpload={(url) => setInitiativeImages((prev) => ({ ...prev, empowerment: url }))}
                      label="Empowerment Image"
                      maxSizeMB={10}
                    />
                    <Input
                      name="empTitle"
                      defaultValue={homeInitiatives.empowerment?.title || "Women's Empowerment"}
                      placeholder="Title"
                    />
                    <Textarea
                      name="empDesc"
                      defaultValue={
                        homeInitiatives.empowerment?.description ||
                        "Creating sustainable livelihoods through vocational training..."
                      }
                      placeholder="Description"
                      rows={3}
                    />
                  </div>

                  {/* Health Card */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-indigo-600" />
                      Healthcare Initiative
                    </h4>
                    <FileUpload
                      bucket="hero-images"
                      currentUrl={initiativeImages.health}
                      onUpload={(url) => setInitiativeImages((prev) => ({ ...prev, health: url }))}
                      label="Health Image"
                      maxSizeMB={10}
                    />
                    <Input
                      name="healthTitle"
                      defaultValue={homeInitiatives.health?.title || "Healthcare Access"}
                      placeholder="Title"
                    />
                    <Textarea
                      name="healthDesc"
                      defaultValue={
                        homeInitiatives.health?.description ||
                        "Delivering essential medical supplies, hygiene kits, and health camps..."
                      }
                      placeholder="Description"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isLoading} size="lg" className="min-w-[180px]">
                  {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Saving..." : "Save Homepage Settings"}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        {/* NEW: Page Heroes Tab */}
        <TabsContent value="page-heroes" className="space-y-6">
          <div className="space-y-6">
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Layout className="h-5 w-5 text-purple-600" />
                  </div>
                  Page Hero Images
                </CardTitle>
                <CardDescription className="text-base">Configure hero images and content for each page of your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {[
                    { key: "about", label: "About Page", current: aboutHero },
                    { key: "contact", label: "Contact Page", current: contactHero },
                    { key: "impact", label: "Impact Page", current: impactHero },
                    { key: "press", label: "Press Page", current: pressHero },
                    { key: "programs", label: "Programs Page", current: programsHero },
                    { key: "stories", label: "Stories Page", current: storiesHero },
                    { key: "events", label: "Events Page", current: eventsHero },
                    { key: "get_involved", label: "Get Involved Page", current: getInvolvedHero },
                    { key: "donate", label: "Donate Page", current: donateHero },
                  ].map((page) => (
                    <form
                      key={page.key}
                      action={async (formData) => {
                        const value = {
                          image: pageHeroImages[page.key as keyof typeof pageHeroImages],
                          title: formData.get("title"),
                          subtitle: formData.get("subtitle"),
                          badge: formData.get("badge"),
                          overlayOpacity: 0.7,
                        }
                        await updateSiteSetting(`${page.key}_hero`, value)
                        notifications.showSuccess({
                          title: "Settings saved",
                          description: `${page.label} hero updated successfully`,
                        })
                        router.refresh()
                      }}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <h4 className="font-semibold flex items-center gap-2">
                        <Layout className="h-4 w-4 text-purple-600" />
                        {page.label}
                      </h4>
                      <FileUpload
                        bucket="hero-images"
                        currentUrl={pageHeroImages[page.key as keyof typeof pageHeroImages]}
                        onUpload={(url) =>
                          setPageHeroImages((prev) => ({ ...prev, [page.key]: url }))
                        }
                        label="Hero Image"
                        maxSizeMB={10}
                      />
                      <Input
                        name="title"
                        defaultValue={page.current.title || ""}
                        placeholder="Hero title"
                      />
                      <Textarea
                        name="subtitle"
                        defaultValue={page.current.subtitle || ""}
                        placeholder="Hero subtitle"
                        rows={2}
                      />
                      <Input
                        name="badge"
                        defaultValue={page.current.badge || ""}
                        placeholder="Badge text (optional)"
                      />
                      <Button type="submit" size="sm" disabled={isLoading}>
                        {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                        Save {page.label}
                      </Button>
                    </form>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* NEW: Press & Media Tab */}
        <TabsContent value="press" className="space-y-6">
          <form
            action={async () => {
              const value = { images: galleryImages }
              await updateSiteSetting("press_gallery", value)
              notifications.showSuccess({
                title: "Settings saved",
                description: "Press gallery updated successfully",
              })
              router.refresh()
            }}
          >
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  Press Media Gallery
                </CardTitle>
                <CardDescription className="text-base">Upload and manage images for the press & media page (max 20 images)</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <GalleryManager
                  images={galleryImages}
                  onChange={setGalleryImages}
                  bucket="press-gallery"
                  maxImages={20}
                  label="Press Gallery Images"
                />
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <Button type="submit" disabled={isLoading} size="lg" className="min-w-[180px]">
                    {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Saving..." : "Save Press Gallery"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* NEW: Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <form
            action={async () => {
              await updateSiteSetting("branding", brandingImages)
              notifications.showSuccess({
                title: "Settings saved",
                description: "Branding assets updated successfully",
              })
              router.refresh()
            }}
          >
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-pink-500/10 rounded-lg">
                    <Palette className="h-5 w-5 text-pink-600" />
                  </div>
                  Branding Assets
                </CardTitle>
                <CardDescription className="text-base">Upload logos, favicon, and social sharing images for your site identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Primary Logo</Label>
                    <FileUpload
                      bucket="site-assets"
                      currentUrl={brandingImages.primaryLogo}
                      onUpload={(url) => setBrandingImages((prev) => ({ ...prev, primaryLogo: url }))}
                      label="Primary Logo (Header)"
                      maxSizeMB={2}
                    />
                    <p className="text-xs text-muted-foreground">Used in navigation header (PNG or SVG recommended)</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Favicon</Label>
                    <FileUpload
                      bucket="site-assets"
                      currentUrl={brandingImages.favicon}
                      onUpload={(url) => setBrandingImages((prev) => ({ ...prev, favicon: url }))}
                      label="Favicon (16x16 or 32x32)"
                      maxSizeMB={1}
                    />
                    <p className="text-xs text-muted-foreground">Browser tab icon • Size: 16×16 or 32×32 pixels</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-semibold">OG / Social Share Image</Label>
                    <FileUpload
                      bucket="og-images"
                      currentUrl={brandingImages.ogImage}
                      onUpload={(url) => setBrandingImages((prev) => ({ ...prev, ogImage: url }))}
                      label="Social Sharing Image (1200x630px recommended)"
                      maxSizeMB={5}
                    />
                    <p className="text-xs text-muted-foreground">Default image shown when your site is shared on social media • Size: 1200×630 pixels</p>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={isLoading} size="lg" className="min-w-[180px]">
                    {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Saving..." : "Save Branding Assets"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
