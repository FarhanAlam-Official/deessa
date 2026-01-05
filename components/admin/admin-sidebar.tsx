"use client"

import Link from "next/link"
import Image from "next/image"
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
  Home,
  Layers,
  PanelLeftClose,
} from "lucide-react"
import { type AdminUser, hasPermission, canViewFinance, canManageUsers } from "@/lib/types/admin"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/contexts/SidebarContext"

interface AdminSidebarProps {
  adminUser: AdminUser
}

export function AdminSidebar({ adminUser }: AdminSidebarProps) {
  const pathname = usePathname()
  const { isCollapsed, setIsCollapsed } = useSidebar()

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      permission: null,
    },
    {
      name: "CMS",
      href: "/admin/cms",
      icon: Layers,
      permission: null,
      description: "Content Management",
    },
  ]

  const contentNav = [
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
      name: "Site Settings",
      href: "/admin/settings",
      icon: Settings,
      permission: "settings",
    },
    {
      name: "Admin Users",
      href: "/admin/users",
      icon: UserCog,
      permission: "users",
      requiresAdmin: true,
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
    <TooltipProvider delayDuration={300}>
      <aside 
        onClick={() => isCollapsed && setIsCollapsed(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden flex-col border-r bg-background transition-all duration-300 lg:flex",
          isCollapsed ? "w-16 cursor-pointer hover:bg-muted/30" : "w-64"
        )}
      >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Image 
            src="/favicon.png" 
            alt="deessa Foundation" 
            width={32} 
            height={32}
            className="flex-shrink-0"
          />
          <span className={cn(
            "font-semibold transition-all duration-200",
            isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>
            deessa Admin
          </span>
        </div>
        {!isCollapsed && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsCollapsed(true)
            }}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav onClick={(e) => e.stopPropagation()} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.filter(canAccess).map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg py-2 text-sm font-medium transition-all duration-200 group relative",
                    isActive(item.href)
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md scale-[1.02]"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:scale-[1.02]",
                    isCollapsed ? "justify-center px-0 mx-auto w-10 h-10" : "gap-3 px-3"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 flex-shrink-0 transition-all",
                    isActive(item.href) && "animate-pulse"
                  )} />
                  <span className={cn(
                    "transition-all duration-200 font-semibold",
                    isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                  )}>
                    {item.name}
                  </span>
                  {isActive(item.href) && !isCollapsed && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-100 animate-shimmer pointer-events-none" />
                  )}
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>{item.name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>

        {/* Content Management - Hidden by default, accessible via CMS button */}
        {/* 
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content</p>
          {contentNav.filter(canAccess).map((item) => (
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
        */}

        {/* Engagement */}
        <div className="space-y-1">
          {isCollapsed ? (
            <div className="h-[20px] mb-1" aria-hidden="true" />
          ) : (
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Engagement</p>
          )}
          {engagementNav.filter(canAccess).map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg py-2 text-sm font-medium transition-all duration-200 group relative",
                      isActive(item.href)
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md scale-[1.02]"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:scale-[1.02]",
                      isCollapsed ? "justify-center px-0 mx-auto w-10 h-10" : "gap-3 px-3"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 flex-shrink-0 transition-all",
                      isActive(item.href) && "animate-pulse"
                    )} />
                    <span className={cn(
                      "transition-all duration-200 font-semibold",
                      isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                    )}>
                      {item.name}
                    </span>
                    {isActive(item.href) && !isCollapsed && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-100 animate-shimmer pointer-events-none" />
                    )}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
          ))}
        </div>

        {/* Settings */}
        <div className="space-y-1">
          {isCollapsed ? (
            <div className="h-[20px] mb-1" aria-hidden="true" />
          ) : (
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Settings</p>
          )}
          {settingsNav.filter(canAccess).map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg py-2 text-sm font-medium transition-all duration-200 group relative",
                      isActive(item.href)
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md scale-[1.02]"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:scale-[1.02]",
                      isCollapsed ? "justify-center px-0 mx-auto w-10 h-10" : "gap-3 px-3"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 flex-shrink-0 transition-all",
                      isActive(item.href) && "animate-pulse"
                    )} />
                    <span className={cn(
                      "transition-all duration-200 font-semibold",
                      isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                    )}>
                      {item.name}
                    </span>
                    {isActive(item.href) && !isCollapsed && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-100 animate-shimmer pointer-events-none" />
                    )}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </nav>

      <div onClick={(e) => e.stopPropagation()} className="border-t p-4">
        <Tooltip>
          <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2",
                isCollapsed && "justify-center"
              )}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground flex-shrink-0">
                  {adminUser.full_name.charAt(0)}
                </div>
                <div className={cn(
                  "flex-1 min-w-0 transition-all duration-200",
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}>
                  <p className="text-sm font-medium truncate">{adminUser.full_name}</p>
                  <p className="text-xs text-muted-foreground">{adminUser.role.replace("_", " ")}</p>
                </div>
              </div>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <div>
                  <p className="font-medium">{adminUser.full_name}</p>
                  <p className="text-xs text-muted-foreground">{adminUser.role.replace("_", " ")}</p>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
