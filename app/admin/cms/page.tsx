import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { hasPermission } from "@/lib/types/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Home,
  Image,
  FileText,
  Calendar,
  Users,
  Building,
  BarChart3,
  Heart,
  FolderKanban,
  Newspaper,
  Settings as SettingsIcon,
  Podcast,
} from "lucide-react"

export const metadata = {
  title: "Content Management System - Admin",
  description: "Manage all your website content from one place",
}

export default async function CMSPage() {
  const adminUser = await getCurrentAdmin()

  if (!adminUser) {
    redirect("/admin/login")
  }

  // Define all CMS modules
  const cmsModules = [
    {
      title: "Homepage Manager",
      description: "Configure hero section, initiatives, CTA, and analytics",
      icon: Home,
      href: "/admin/homepage",
      permission: "settings",
      color: "bg-blue-500",
    },
    {
      title: "Media Library",
      description: "Manage images, videos, and documents across all buckets",
      icon: Image,
      href: "/admin/media",
      permission: "settings",
      color: "bg-purple-500",
    },
    {
      title: "Projects",
      description: "Create and manage your organization's projects",
      icon: FolderKanban,
      href: "/admin/projects",
      permission: "projects",
      color: "bg-green-500",
    },
    {
      title: "Events",
      description: "Schedule and manage upcoming events",
      icon: Calendar,
      href: "/admin/events",
      permission: "events",
      color: "bg-orange-500",
    },
    {
      title: "Stories",
      description: "Share success stories and impact reports",
      icon: FileText,
      href: "/admin/stories",
      permission: "stories",
      color: "bg-indigo-500",
    },
    {
      title: "Podcasts",
      description: "Manage podcast episodes, highlights, and videos",
      icon: Podcast,
      href: "/admin/podcasts",
      permission: "stories",
      color: "bg-rose-500",
    },
    {
      title: "Team Members",
      description: "Manage your team profiles and bios",
      icon: Users,
      href: "/admin/team",
      permission: "team",
      color: "bg-cyan-500",
    },
    {
      title: "Partners",
      description: "Showcase your partners and sponsors",
      icon: Building,
      href: "/admin/partners",
      permission: "partners",
      color: "bg-teal-500",
    },
    {
      title: "Impact Stats",
      description: "Display key metrics and achievements",
      icon: BarChart3,
      href: "/admin/stats",
      permission: "stats",
      color: "bg-pink-500",
    },
    {
      title: "Newsletter",
      description: "Manage newsletter subscribers and campaigns",
      icon: Newspaper,
      href: "/admin/newsletter",
      permission: "newsletters",
      color: "bg-amber-500",
    },
    {
      title: "Press & Media",
      description: "Coming soon - Manage press releases and media coverage",
      icon: Newspaper,
      href: "#",
      permission: "settings",
      color: "bg-gray-400",
      disabled: true,
    },
    {
      title: "Site Settings",
      description: "Configure global site settings and branding",
      icon: SettingsIcon,
      href: "/admin/settings",
      permission: "settings",
      color: "bg-slate-500",
    },
  ]

  // Filter modules based on permissions
  const accessibleModules = cmsModules.filter((module) =>
    hasPermission(adminUser.role, module.permission)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Management System</h1>
        <p className="text-muted-foreground mt-2">
          Manage all your website content from one centralized dashboard
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{accessibleModules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Content sections you can manage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold capitalize">
              {adminUser.role.replace("_", " ")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Access level</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/" target="_blank">
                  View Site
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin">Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CMS Modules Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Content Modules</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accessibleModules.map((module) => (
            <Card
              key={module.title}
              className={`group transition-all hover:shadow-lg ${
                module.disabled ? "opacity-50" : "hover:border-primary"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className={`p-3 rounded-lg ${module.color} text-white transition-transform group-hover:scale-110`}
                  >
                    <module.icon className="h-6 w-6" />
                  </div>
                  {module.disabled && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                      Soon
                    </span>
                  )}
                </div>
                <CardTitle className="mt-4">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full"
                  variant={module.disabled ? "ghost" : "default"}
                  disabled={module.disabled}
                >
                  <Link href={module.disabled ? "#" : module.href}>
                    {module.disabled ? "Coming Soon" : "Manage Content"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
          <CardDescription>
            Learn how to use the CMS to manage your website content effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              View Documentation
            </Button>
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
