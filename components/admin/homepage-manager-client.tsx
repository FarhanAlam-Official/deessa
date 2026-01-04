"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  Video,
  BookOpen,
  BarChart3,
  Megaphone,
  Save,
  Loader2,
  Eye,
  Image as ImageIcon,
  Settings,
  Trash2,
  Plus,
  Link as LinkIcon,
  TrendingUp,
  Users,
  Heart,
  ArrowUpRight,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { updateSiteSetting } from "@/lib/actions/admin-settings"
import { notifications } from "@/lib/notifications"
import { MediaPicker } from "./media-picker"
import { VideoPicker } from "./video-picker"
import type { MediaAsset } from "@/lib/types/media"

interface HomepageManagerClientProps {
  settings: Record<string, Record<string, unknown>>
}

export function HomepageManagerClient({ settings }: HomepageManagerClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Get current settings
  const homeHero = (settings.home_hero || {}) as any
  const homeInitiatives = (settings.home_initiatives || {}) as any
  const homeCta = (settings.home_cta || {}) as any
  const homeStats = (settings.home_stats || {}) as any

  // Hero Section State
  const [heroVideo, setHeroVideo] = useState<any>(homeHero.video || null)
  const [heroImages, setHeroImages] = useState({
    mainImage: homeHero.mainImage || "",
    classroomImage: homeHero.classroomImage || "",
    donorImage1: homeHero.donorImage1 || "",
    donorImage2: homeHero.donorImage2 || "",
  })
  const [heroContent, setHeroContent] = useState({
    title: homeHero.title || "Hope for Every Child.",
    subtitle:
      homeHero.subtitle ||
      "We are rewriting the future of rural Nepal through education, healthcare, and community empowerment.",
    badge: homeHero.badge || "Est. 2014 • Kathmandu",
  })
  const [heroButtons, setHeroButtons] = useState({
    primaryText: homeHero.ctaButton?.text || "Start Making Impact",
    primaryLink: homeHero.ctaButton?.link || "/donate",
    secondaryText: homeHero.secondaryButton?.text || "Learn Our Story",
    secondaryLink: homeHero.secondaryButton?.link || "/about",
  })

  // Initiatives State
  const [initiatives, setInitiatives] = useState({
    education: {
      title: homeInitiatives.education?.title || "Rural Education",
      description:
        homeInitiatives.education?.description ||
        "Providing quality education, teacher training, and infrastructure to rural schools.",
      image: homeInitiatives.education?.image || "",
      link: homeInitiatives.education?.link || "/programs",
      stats: homeInitiatives.education?.stats || { label: "Students Reached", value: "10,000+" },
      isDeleted: homeInitiatives.education?.isDeleted || false,
    },
    empowerment: {
      title: homeInitiatives.empowerment?.title || "Women's Empowerment",
      description:
        homeInitiatives.empowerment?.description ||
        "Creating sustainable livelihoods through vocational training and microfinance.",
      image: homeInitiatives.empowerment?.image || "",
      link: homeInitiatives.empowerment?.link || "/programs",
      stats: homeInitiatives.empowerment?.stats || {
        label: "Women Trained",
        value: "5,000+",
      },
      isDeleted: homeInitiatives.empowerment?.isDeleted || false,
    },
    health: {
      title: homeInitiatives.health?.title || "Healthcare Access",
      description:
        homeInitiatives.health?.description ||
        "Delivering essential medical supplies, hygiene kits, and health camps to remote areas.",
      image: homeInitiatives.health?.image || "",
      link: homeInitiatives.health?.link || "/programs",
      stats: homeInitiatives.health?.stats || {
        label: "Health Camps Conducted",
        value: "200+",
      },
      isDeleted: homeInitiatives.health?.isDeleted || false,
    },
  })

  // CTA Section State
  const [ctaSection, setCtaSection] = useState({
    title: homeCta.title || "Ready to Make a Difference?",
    description:
      homeCta.description ||
      "Join thousands of donors who are transforming lives in rural Nepal.",
    primaryButton: {
      text: homeCta.primaryButton?.text || "Donate Now",
      link: homeCta.primaryButton?.link || "/donate",
    },
    secondaryButton: {
      text: homeCta.secondaryButton?.text || "Become a Partner",
      link: homeCta.secondaryButton?.link || "/get-involved",
    },
    backgroundImage: homeCta.backgroundImage || "",
  })

  // Stats Section State
  const [statsSection, setStatsSection] = useState({
    title: homeStats.title || "Our Impact in Numbers",
    description: homeStats.description || "Real change, measurable results",
    stats: homeStats.stats || [
      {
        id: "students",
        icon: "users",
        label: "Students Educated",
        value: "15,000+",
        isDeleted: false,
      },
      {
        id: "villages",
        icon: "home",
        label: "Villages Reached",
        value: "250+",
        isDeleted: false,
      },
      {
        id: "volunteers",
        icon: "heart",
        label: "Active Volunteers",
        value: "500+",
        isDeleted: false,
      },
      {
        id: "projects",
        icon: "trending-up",
        label: "Completed Projects",
        value: "120+",
        isDeleted: false,
      },
    ],
  })

  // Modal States
  const [showVideoPicker, setShowVideoPicker] = useState(false)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [currentImageField, setCurrentImageField] = useState<string>("")
  const [currentInitiative, setCurrentInitiative] = useState<string>("")
  const [initiativeToDelete, setInitiativeToDelete] = useState<string>("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [statToDelete, setStatToDelete] = useState<string>("")
  const [showStatDeleteDialog, setShowStatDeleteDialog] = useState(false)

  function openImagePicker(field: string, initiative?: string) {
    setCurrentImageField(field)
    setCurrentInitiative(initiative || "")
    setShowMediaPicker(true)
  }

  function handleImageSelect(url: string, asset?: MediaAsset) {
    if (currentImageField === "ctaBackground") {
      setCtaSection((prev) => ({ ...prev, backgroundImage: url }))
    } else if (currentInitiative) {
      setInitiatives((prev) => ({
        ...prev,
        [currentInitiative]: {
          ...prev[currentInitiative as keyof typeof prev],
          image: url,
        },
      }))
    } else {
      setHeroImages((prev) => ({
        ...prev,
        [currentImageField]: url,
      }))
    }
    setShowMediaPicker(false)
  }

  function handleVideoSelect(settings: any) {
    setHeroVideo(settings)
  }

  async function saveHeroSection() {
    setIsLoading(true)
    try {
      const heroData = {
        video: heroVideo,
        ...heroImages,
        ...heroContent,
        ctaButton: {
          text: heroButtons.primaryText,
          link: heroButtons.primaryLink,
        },
        secondaryButton: {
          text: heroButtons.secondaryText,
          link: heroButtons.secondaryLink,
        },
      }

      const result = await updateSiteSetting("home_hero", heroData)

      if (result?.error) throw new Error(result.error)

      notifications.showSuccess({
        title: "Hero section saved",
        description: "Your homepage hero has been updated successfully",
      })

      router.refresh()
    } catch (error: any) {
      notifications.showError({
        title: "Failed to save",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function saveInitiatives() {
    setIsLoading(true)
    try {
      const result = await updateSiteSetting("home_initiatives", initiatives)

      if (result?.error) throw new Error(result.error)

      notifications.showSuccess({
        title: "Initiatives saved",
        description: "Your initiative cards have been updated successfully",
      })

      router.refresh()
    } catch (error: any) {
      notifications.showError({
        title: "Failed to save",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function saveCta() {
    setIsLoading(true)
    try {
      const result = await updateSiteSetting("home_cta", ctaSection)

      if (result?.error) throw new Error(result.error)

      notifications.showSuccess({
        title: "CTA section saved",
        description: "Your call-to-action section has been updated successfully",
      })

      router.refresh()
    } catch (error: any) {
      notifications.showError({
        title: "Failed to save",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function saveStats() {
    setIsLoading(true)
    try {
      const result = await updateSiteSetting("home_stats", statsSection)

      if (result?.error) throw new Error(result.error)

      notifications.showSuccess({
        title: "Analytics section saved",
        description: "Your analytics section has been updated successfully",
      })

      router.refresh()
    } catch (error: any) {
      notifications.showError({
        title: "Failed to save",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleDeleteInitiative(key: string) {
    setInitiativeToDelete(key)
    setShowDeleteDialog(true)
  }

  function confirmDeleteInitiative() {
    setInitiatives(prev => ({
      ...prev,
      [initiativeToDelete]: {
        ...(prev as any)[initiativeToDelete],
        isDeleted: true
      }
    }))
    setShowDeleteDialog(false)
    setInitiativeToDelete("")
  }

  function handleDeleteStat(id: string) {
    setStatToDelete(id)
    setShowStatDeleteDialog(true)
  }

  function confirmDeleteStat() {
    setStatsSection(prev => ({
      ...prev,
      stats: prev.stats.map((stat: any) => 
        stat.id === statToDelete ? { ...stat, isDeleted: true } : stat
      )
    }))
    setShowStatDeleteDialog(false)
    setStatToDelete("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Homepage Content Manager</h1>
            <p className="text-muted-foreground">
              Professional content management for your homepage
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.open("/", "_blank")}>
          <Eye className="h-4 w-4 mr-2" />
          Preview Live Site
        </Button>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Hero Section
          </TabsTrigger>
          <TabsTrigger value="initiatives" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Initiatives
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="cta" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            CTA Section
          </TabsTrigger>
        </TabsList>

        {/* Hero Section Tab */}
        <TabsContent value="hero" className="space-y-6">
          {/* Video Configuration */}
          <Card className="border-2">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Background Video
              </CardTitle>
              <CardDescription>
                Configure video for your hero section (optional but recommended)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {heroVideo?.url ? (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={heroVideo.url}
                      poster={heroVideo.thumbnail}
                      autoPlay={heroVideo.autoplay}
                      loop={heroVideo.loop}
                      muted={heroVideo.muted}
                      controls={heroVideo.showControls}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setShowVideoPicker(true)} variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Video Settings
                    </Button>
                    <Button
                      onClick={() => setHeroVideo(null)}
                      variant="outline"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Video
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {heroVideo.autoplay && (
                      <Badge variant="secondary">Autoplay: On</Badge>
                    )}
                    {heroVideo.loop && <Badge variant="secondary">Loop: On</Badge>}
                    {heroVideo.muted && <Badge variant="secondary">Muted: On</Badge>}
                    {heroVideo.showControls && (
                      <Badge variant="secondary">Controls: Visible</Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium mb-2">No video configured</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a background video to make your hero section more engaging
                  </p>
                  <Button onClick={() => setShowVideoPicker(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Video
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hero Images */}
          <Card className="border-2">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                Hero Images
              </CardTitle>
              <CardDescription>
                Upload or select images for your hero section
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(heroImages).map(([key, url]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm font-semibold capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                      {url ? (
                        <>
                          <div className="aspect-video bg-muted rounded overflow-hidden">
                            <img
                              src={url}
                              alt={key}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => openImagePicker(key)}
                            >
                              Change
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() =>
                                setHeroImages((prev) => ({ ...prev, [key]: "" }))
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => openImagePicker(key)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Select Image
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hero Content */}
          <Card className="border-2">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Hero Content
              </CardTitle>
              <CardDescription>
                Edit the text content for your hero section
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-title">Main Title</Label>
                <Input
                  id="hero-title"
                  value={heroContent.title}
                  onChange={(e) =>
                    setHeroContent((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Hope for Every Child."
                />
                <p className="text-xs text-muted-foreground">
                  The main headline displayed prominently in the hero
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-subtitle">Subtitle</Label>
                <Textarea
                  id="hero-subtitle"
                  rows={3}
                  value={heroContent.subtitle}
                  onChange={(e) =>
                    setHeroContent((prev) => ({ ...prev, subtitle: e.target.value }))
                  }
                  placeholder="We are rewriting the future..."
                />
                <p className="text-xs text-muted-foreground">
                  Supporting text that appears below the title
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-badge">Badge Text</Label>
                <Input
                  id="hero-badge"
                  value={heroContent.badge}
                  onChange={(e) =>
                    setHeroContent((prev) => ({ ...prev, badge: e.target.value }))
                  }
                  placeholder="Est. 2014 • Kathmandu"
                />
                <p className="text-xs text-muted-foreground">
                  Small badge or tagline (optional)
                </p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary Button Text</Label>
                  <Input
                    value={heroButtons.primaryText}
                    onChange={(e) =>
                      setHeroButtons((prev) => ({ ...prev, primaryText: e.target.value }))
                    }
                    placeholder="Start Making Impact"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary Button Link</Label>
                  <Input
                    value={heroButtons.primaryLink}
                    onChange={(e) =>
                      setHeroButtons((prev) => ({ ...prev, primaryLink: e.target.value }))
                    }
                    placeholder="/donate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Button Text</Label>
                  <Input
                    value={heroButtons.secondaryText}
                    onChange={(e) =>
                      setHeroButtons((prev) => ({
                        ...prev,
                        secondaryText: e.target.value,
                      }))
                    }
                    placeholder="Learn Our Story"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Button Link</Label>
                  <Input
                    value={heroButtons.secondaryLink}
                    onChange={(e) =>
                      setHeroButtons((prev) => ({
                        ...prev,
                        secondaryLink: e.target.value,
                      }))
                    }
                    placeholder="/about"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={saveHeroSection} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Hero Section
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Initiatives Tab */}
        <TabsContent value="initiatives" className="space-y-6">
          {Object.entries(initiatives).filter(([_, initiative]) => !initiative.isDeleted).map(([key, initiative]) => (
            <Card key={key} className="border-2">
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      <BookOpen className="h-5 w-5 text-indigo-600" />
                      {key} Initiative
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      Configure the {key} card displayed on homepage
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteInitiative(key)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Image */}
                <div className="space-y-2">
                  <Label>Card Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                    {initiative.image ? (
                      <>
                        <div className="aspect-video bg-muted rounded overflow-hidden">
                          <img
                            src={initiative.image}
                            alt={initiative.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => openImagePicker("image", key)}
                          >
                            Change Image
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() =>
                              setInitiatives((prev) => ({
                                ...prev,
                                [key]: { ...prev[key as keyof typeof prev], image: "" },
                              }))
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => openImagePicker("image", key)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Select Image
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={initiative.title}
                      onChange={(e) =>
                        setInitiatives((prev) => ({
                          ...prev,
                          [key]: { ...prev[key as keyof typeof prev], title: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      value={initiative.description}
                      onChange={(e) =>
                        setInitiatives((prev) => ({
                          ...prev,
                          [key]: {
                            ...prev[key as keyof typeof prev],
                            description: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Link</Label>
                    <Input
                      value={initiative.link}
                      onChange={(e) =>
                        setInitiatives((prev) => ({
                          ...prev,
                          [key]: { ...prev[key as keyof typeof prev], link: e.target.value },
                        }))
                      }
                      placeholder="/programs"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Stat Label</Label>
                      <Input
                        value={initiative.stats?.label || ""}
                        onChange={(e) =>
                          setInitiatives((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key as keyof typeof prev],
                              stats: {
                                ...prev[key as keyof typeof prev].stats,
                                label: e.target.value,
                              },
                            },
                          }))
                        }
                        placeholder="Students Reached"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stat Value</Label>
                      <Input
                        value={initiative.stats?.value || ""}
                        onChange={(e) =>
                          setInitiatives((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key as keyof typeof prev],
                              stats: {
                                ...prev[key as keyof typeof prev].stats,
                                value: e.target.value,
                              },
                            },
                          }))
                        }
                        placeholder="10,000+"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <Button size="lg" onClick={saveInitiatives} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Initiatives
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* CTA Section Tab */}
        <TabsContent value="cta" className="space-y-6">
          <Card className="border-2">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Call-to-Action Section
              </CardTitle>
              <CardDescription>
                Configure the prominent CTA section on your homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Background Image */}
              <div className="space-y-2">
                <Label>Background Image</Label>
                <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                  {ctaSection.backgroundImage ? (
                    <>
                      <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                        <img
                          src={ctaSection.backgroundImage}
                          alt="CTA Background"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openImagePicker("ctaBackground", "")}
                        >
                          Change Image
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() =>
                            setCtaSection((prev) => ({ ...prev, backgroundImage: "" }))
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => openImagePicker("ctaBackground", "")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Select Background Image
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="cta-title">Title</Label>
                <Input
                  id="cta-title"
                  value={ctaSection.title}
                  onChange={(e) =>
                    setCtaSection((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Join Us in Making a Difference"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cta-description">Description</Label>
                <Textarea
                  id="cta-description"
                  rows={3}
                  value={ctaSection.description}
                  onChange={(e) =>
                    setCtaSection((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Every contribution counts..."
                />
              </div>

              <Separator />

              {/* Buttons */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Primary Button */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Primary Button
                  </h3>
                  <div className="space-y-4 pl-6">
                    <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input
                        value={ctaSection.primaryButton.text}
                        onChange={(e) =>
                          setCtaSection((prev) => ({
                            ...prev,
                            primaryButton: { ...prev.primaryButton, text: e.target.value },
                          }))
                        }
                        placeholder="Donate Now"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Link</Label>
                      <Input
                        value={ctaSection.primaryButton.link}
                        onChange={(e) =>
                          setCtaSection((prev) => ({
                            ...prev,
                            primaryButton: { ...prev.primaryButton, link: e.target.value },
                          }))
                        }
                        placeholder="/donate"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Button */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Secondary Button
                  </h3>
                  <div className="space-y-4 pl-6">
                    <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input
                        value={ctaSection.secondaryButton.text}
                        onChange={(e) =>
                          setCtaSection((prev) => ({
                            ...prev,
                            secondaryButton: { ...prev.secondaryButton, text: e.target.value },
                          }))
                        }
                        placeholder="Learn More"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Link</Label>
                      <Input
                        value={ctaSection.secondaryButton.link}
                        onChange={(e) =>
                          setCtaSection((prev) => ({
                            ...prev,
                            secondaryButton: { ...prev.secondaryButton, link: e.target.value },
                          }))
                        }
                        placeholder="/about"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={saveCta} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save CTA Section
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Analytics/Stats Section Tab */}
        <TabsContent value="stats" className="space-y-6">
          <Card className="border-2">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics Section
              </CardTitle>
              <CardDescription>
                Configure the statistics displayed on your homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="stats-title">Section Title</Label>
                <Input
                  id="stats-title"
                  value={statsSection.title}
                  onChange={(e) =>
                    setStatsSection((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Our Impact in Numbers"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stats-description">Description</Label>
                <Textarea
                  id="stats-description"
                  rows={3}
                  value={statsSection.description}
                  onChange={(e) =>
                    setStatsSection((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Here's what we've achieved together..."
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Statistics</Label>
                  <Badge variant="secondary">{statsSection.stats.filter((s: any) => !s.isDeleted).length} Active</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {statsSection.stats.filter((stat: any) => !stat.isDeleted).map((stat: any) => (
                    <Card key={stat.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            {stat.icon === "Users" && <Users className="h-4 w-4 text-primary" />}
                            {stat.icon === "Heart" && <Heart className="h-4 w-4 text-primary" />}
                            {stat.icon === "TrendingUp" && <TrendingUp className="h-4 w-4 text-primary" />}
                            {stat.icon === "BookOpen" && <BookOpen className="h-4 w-4 text-primary" />}
                            {stat.label}
                          </CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteStat(stat.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>Label</Label>
                          <Input
                            value={stat.label}
                            onChange={(e) =>
                              setStatsSection((prev) => ({
                                ...prev,
                                stats: prev.stats.map((s: any) =>
                                  s.id === stat.id ? { ...s, label: e.target.value } : s
                                ),
                              }))
                            }
                            placeholder="Students Reached"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Value</Label>
                          <Input
                            value={stat.value}
                            onChange={(e) =>
                              setStatsSection((prev) => ({
                                ...prev,
                                stats: prev.stats.map((s: any) =>
                                  s.id === stat.id ? { ...s, value: e.target.value } : s
                                ),
                              }))
                            }
                            placeholder="15,000+"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <select
                            value={stat.icon}
                            onChange={(e) =>
                              setStatsSection((prev) => ({
                                ...prev,
                                stats: prev.stats.map((s: any) =>
                                  s.id === stat.id ? { ...s, icon: e.target.value } : s
                                ),
                              }))
                            }
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="Users">Users (People)</option>
                            <option value="Heart">Heart (Love/Support)</option>
                            <option value="TrendingUp">TrendingUp (Growth)</option>
                            <option value="BookOpen">BookOpen (Education)</option>
                          </select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={saveStats} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Analytics
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Initiative Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Initiative?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the <strong className="capitalize">{initiativeToDelete}</strong> initiative from your homepage. You can restore it later from the database if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteInitiative}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Initiative
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Stat Dialog */}
      <AlertDialog open={showStatDeleteDialog} onOpenChange={setShowStatDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Statistic?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide this statistic from your homepage. You can restore it later by re-saving the analytics section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Statistic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Media Picker Modal */}
      <MediaPicker
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={handleImageSelect}
        bucket="hero-images"
        accept="image/*"
        mediaType="image"
      />

      {/* Video Picker Modal */}
      <VideoPicker
        open={showVideoPicker}
        onOpenChange={setShowVideoPicker}
        onSelect={handleVideoSelect}
        currentSettings={heroVideo}
      />
    </div>
  )
}
