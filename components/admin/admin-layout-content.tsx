"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext"
import type { AdminUser } from "@/lib/types/admin"
import { cn } from "@/lib/utils"

interface AdminLayoutContentProps {
  adminUser: AdminUser
  children: React.ReactNode
}

function AdminLayoutInner({ adminUser, children }: AdminLayoutContentProps) {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar adminUser={adminUser} />
      <div 
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <AdminHeader adminUser={adminUser} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

export function AdminLayoutContent({ adminUser, children }: AdminLayoutContentProps) {
  return (
    <SidebarProvider>
      <AdminLayoutInner adminUser={adminUser}>
        {children}
      </AdminLayoutInner>
    </SidebarProvider>
  )
}
