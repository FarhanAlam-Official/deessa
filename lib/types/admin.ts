export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "FINANCE"

export interface AdminUser {
  id: string
  user_id: string
  email: string
  full_name: string
  role: AdminRole
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  title: string
  slug: string
  description: string
  long_description?: string
  image?: string
  category: "education" | "health" | "empowerment" | "relief"
  location: string
  status: "active" | "completed" | "urgent" | "draft"
  raised: number
  goal?: number
  is_published: boolean
  created_by?: string
  created_at: string
  updated_at: string
  metrics?: ProjectMetric[]
  timeline?: ProjectTimeline[]
}

export interface ProjectMetric {
  id: string
  project_id: string
  label: string
  value: string
  sort_order: number
}

export interface ProjectTimeline {
  id: string
  project_id: string
  phase: string
  date_range: string
  description: string
  status: "completed" | "current" | "upcoming"
  sort_order: number
}

export interface TeamMember {
  id: string
  name: string
  role: string
  bio?: string
  image?: string
  email?: string
  phone?: string
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  slug: string
  description: string
  image?: string
  event_date: string
  event_time?: string
  location: string
  category: string
  type: "upcoming" | "past"
  is_published: boolean
  max_capacity?: number
  created_by?: string
  created_at: string
  updated_at: string
  registration_count?: number
}

export interface Story {
  id: string
  title: string
  slug: string
  excerpt: string
  content?: string
  image?: string
  category: string
  author_id?: string
  author?: AdminUser
  is_featured: boolean
  is_published: boolean
  published_at?: string
  read_time?: string
  created_at: string
  updated_at: string
}

export interface Partner {
  id: string
  name: string
  logo?: string
  website?: string
  description?: string
  type: "partner" | "donor" | "sponsor"
  is_published: boolean
  sort_order: number
  created_at: string
}

export interface ImpactStat {
  id: string
  label: string
  value: string
  icon?: string
  color?: string
  progress?: number
  category: "home" | "impact"
  sort_order: number
  is_published: boolean
  updated_at: string
}

export interface SiteSetting {
  id: string
  key: string
  value: Record<string, unknown>
  updated_by?: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  user?: AdminUser
  action: string
  entity_type: string
  entity_id?: string
  old_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

export interface Donation {
  id: string
  amount: number
  currency: string
  donor_name: string
  donor_email: string
  donor_phone?: string
  is_monthly: boolean
  payment_status: string
  payment_id?: string
  created_at: string
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  created_at: string
}

export interface NewsletterSubscription {
  id: string
  email: string
  subscribed_at: string
  is_active: boolean
}

export interface VolunteerApplication {
  id: string
  full_name: string
  email: string
  phone: string
  occupation?: string
  skills: string[]
  availability: string
  interests: string[]
  message?: string
  applied_at: string
  status: string
}

export interface EventRegistration {
  id: string
  event_id: string
  event_title: string
  attendee_name: string
  attendee_email: string
  attendee_phone?: string
  number_of_guests: number
  special_requirements?: string
  registered_at: string
}

// Permission helpers
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "projects",
    "events",
    "stories",
    "team",
    "partners",
    "stats",
    "settings",
    "users",
    "volunteers",
    "contacts",
    "newsletters",
    "donations",
  ],
  EDITOR: ["projects", "events", "stories", "team", "partners", "stats"],
  FINANCE: ["donations", "stats", "reports"],
}

export function hasPermission(role: AdminRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  return permissions.includes("*") || permissions.includes(permission)
}

export function canManageUsers(role: AdminRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN"
}

export function canViewFinance(role: AdminRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "FINANCE"
}

export function canEditContent(role: AdminRole): boolean {
  return role !== "FINANCE"
}

// Helper functions for role display and description
export function getRoleDisplayName(role: AdminRole): string {
  const names: Record<AdminRole, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Administrator",
    EDITOR: "Content Editor",
    FINANCE: "Finance Manager",
  }
  return names[role]
}

export function getRoleDescription(role: AdminRole): string {
  const descriptions: Record<AdminRole, string> = {
    SUPER_ADMIN: "Full access to all features including user management and site settings",
    ADMIN: "Manage content, view submissions, and configure site settings",
    EDITOR: "Create and edit content like projects, events, and stories",
    FINANCE: "View and manage donations and financial reports",
  }
  return descriptions[role]
}
