"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  AlertCircle,
  Check,
  Globe,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react"
import { updateSiteSetting } from "@/lib/actions/admin-settings"

interface SiteSettingsFormProps {
  settings: Record<string, Record<string, unknown>>
}

export function SiteSettingsForm({ settings }: SiteSettingsFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Get defaults from settings
  const general = (settings.general || {}) as Record<string, string>
  const contact = (settings.contact || {}) as Record<string, string>
  const social = (settings.social || {}) as Record<string, string>
  const seo = (settings.seo || {}) as Record<string, string>

  async function handleSubmit(key: string, formData: FormData) {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const value: Record<string, unknown> = {}
    formData.forEach((v, k) => {
      if (k !== "settingKey") value[k] = v
    })

    const result = await updateSiteSetting(key, value)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(`${key.charAt(0).toUpperCase() + key.slice(1)} settings saved successfully`)
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-600 bg-green-50 text-green-800">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form action={(formData) => handleSubmit("general", formData)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>Basic website information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input id="siteName" name="siteName" defaultValue={general.siteName || "Deesha Foundation"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input id="tagline" name="tagline" defaultValue={general.tagline || "Empowering Communities"} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Site Description</Label>
                  <Textarea id="description" name="description" rows={3} defaultValue={general.description || ""} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo URL</Label>
                    <Input
                      id="logo"
                      name="logo"
                      type="url"
                      defaultValue={general.logo || ""}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favicon">Favicon URL</Label>
                    <Input
                      id="favicon"
                      name="favicon"
                      type="url"
                      defaultValue={general.favicon || ""}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save General Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="contact">
          <form action={(formData) => handleSubmit("contact", formData)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>Contact details displayed on the website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </Label>
                    <Input id="email" name="email" type="email" defaultValue={contact.email || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Phone
                    </Label>
                    <Input id="phone" name="phone" defaultValue={contact.phone || ""} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Address
                  </Label>
                  <Textarea id="address" name="address" rows={2} defaultValue={contact.address || ""} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="officeHours">Office Hours</Label>
                    <Input
                      id="officeHours"
                      name="officeHours"
                      defaultValue={contact.officeHours || ""}
                      placeholder="Mon-Fri: 9am-5pm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mapUrl">Google Maps Embed URL</Label>
                    <Input
                      id="mapUrl"
                      name="mapUrl"
                      type="url"
                      defaultValue={contact.mapUrl || ""}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Contact Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="social">
          <form action={(formData) => handleSubmit("social", formData)}>
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Connect your social media accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" /> Facebook
                    </Label>
                    <Input
                      id="facebook"
                      name="facebook"
                      type="url"
                      defaultValue={social.facebook || ""}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" /> Twitter / X
                    </Label>
                    <Input
                      id="twitter"
                      name="twitter"
                      type="url"
                      defaultValue={social.twitter || ""}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" /> Instagram
                    </Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      type="url"
                      defaultValue={social.instagram || ""}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      name="linkedin"
                      type="url"
                      defaultValue={social.linkedin || ""}
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube" className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" /> YouTube
                  </Label>
                  <Input
                    id="youtube"
                    name="youtube"
                    type="url"
                    defaultValue={social.youtube || ""}
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Social Links
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="seo">
          <form action={(formData) => handleSubmit("seo", formData)}>
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Search engine optimization settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Default Meta Title</Label>
                  <Input
                    id="metaTitle"
                    name="metaTitle"
                    defaultValue={seo.metaTitle || ""}
                    placeholder="Deesha Foundation - Empowering Communities"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Default Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    name="metaDescription"
                    rows={3}
                    defaultValue={seo.metaDescription || ""}
                    placeholder="A compelling description of your organization..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    name="keywords"
                    defaultValue={seo.keywords || ""}
                    placeholder="nonprofit, charity, education, community"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ogImage">Default Social Share Image URL</Label>
                  <Input
                    id="ogImage"
                    name="ogImage"
                    type="url"
                    defaultValue={seo.ogImage || ""}
                    placeholder="https://..."
                  />
                  <p className="text-sm text-muted-foreground">Recommended size: 1200x630 pixels</p>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save SEO Settings
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
