"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut, User, ExternalLink, Heart, ChevronRight } from "lucide-react"
import type { AdminUser } from "@/lib/types/admin"
import { adminLogout } from "@/lib/actions/admin-auth"

interface AdminHeaderProps {
  adminUser: AdminUser
}

export function AdminHeader({ adminUser }: AdminHeaderProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split("/").filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/")
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
    return { href, label }
  })

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="font-semibold">Deesha Admin</span>
          </div>
          <nav className="grid gap-1 p-4">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/projects"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Projects
            </Link>
            <Link
              href="/admin/events"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/admin/stories"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Stories
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {/* View Site */}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" target="_blank">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Site
          </Link>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {adminUser.full_name.charAt(0)}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{adminUser.full_name}</p>
                <p className="text-xs text-muted-foreground">{adminUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={adminLogout}>
                <button type="submit" className="flex w-full items-center text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
