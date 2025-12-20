"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  FileText,
  Users,
  HandHeart,
  BarChart3,
  Settings,
  UserCog,
  Newspaper,
  Heart,
  Building,
  MessageSquare,
} from "lucide-react"
import { type AdminUser, hasPermission, canViewFinance, canManageUsers } from "@/lib/types/admin"

interface AdminSidebarProps {
  adminUser: AdminUser
}

export function AdminSidebar({ adminUser }: AdminSidebarProps) {
  const pathname = usePathname()

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      permission: null,
    },
    {
      name: "Projects",
      href: "/admin/projects",
      icon: FolderKanban,
      permission: "projects",
    },
    {
      name: "Events",
      href: "/admin/events",
      icon: Calendar,
      permission: "events",
    },
    {
      name: "Stories",
      href: "/admin/stories",
      icon: FileText,
      permission: "stories",
    },
    {
      name: "Team",
      href: "/admin/team",
      icon: Users,
      permission: "team",
    },
    {
      name: "Partners",
      href: "/admin/partners",
      icon: Building,
      permission: "partners",
    },
    {
      name: "Impact Stats",
      href: "/admin/stats",
      icon: BarChart3,
      permission: "stats",
    },
  ]

  const engagementNav = [
    {
      name: "Donations",
      href: "/admin/donations",
      icon: HandHeart,
      permission: "donations",
      requiresFinance: true,
    },
    {
      name: "Volunteers",
      href: "/admin/volunteers",
      icon: Heart,
      permission: "volunteers",
    },
    {
      name: "Contact Messages",
      href: "/admin/contacts",
      icon: MessageSquare,
      permission: "contacts",
    },
    {
      name: "Newsletter",
      href: "/admin/newsletter",
      icon: Newspaper,
      permission: "newsletters",
    },
  ]

  const settingsNav = [
    {
      name: "Admin Users",
      href: "/admin/users",
      icon: UserCog,
      permission: "users",
      requiresAdmin: true,
    },
    {
      name: "Site Settings",
      href: "/admin/settings",
      icon: Settings,
      permission: "settings",
    },
  ]

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  const canAccess = (item: { permission: string | null; requiresFinance?: boolean; requiresAdmin?: boolean }) => {
    if (item.permission === null) return true
    if (item.requiresFinance && !canViewFinance(adminUser.role)) return false
    if (item.requiresAdmin && !canManageUsers(adminUser.role)) return false
    return hasPermission(adminUser.role, item.permission)
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-background lg:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <span className="font-semibold">deessa Admin</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.filter(canAccess).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Engagement */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engagement</p>
          {engagementNav.filter(canAccess).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Settings */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settings</p>
          {settingsNav.filter(canAccess).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {adminUser.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{adminUser.full_name}</p>
            <p className="text-xs text-muted-foreground">{adminUser.role.replace("_", " ")}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
