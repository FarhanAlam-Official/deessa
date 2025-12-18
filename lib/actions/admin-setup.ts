"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function checkSetupRequired() {
  const supabase = await createClient()

  // Check if any admin users exist
  const { count, error } = await supabase.from("admin_users").select("*", { count: "exact", head: true })

  if (error) {
    console.error("Error checking admin users:", error)
    return false
  }

  // Setup is required only if no admin users exist
  return count === 0
}

export async function setupFirstAdmin(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const setupKey = formData.get("setupKey") as string

  // Validate setup key (optional extra security - use a secret from env)
  const expectedKey = process.env.ADMIN_SETUP_KEY || "deesha-foundation-2024"
  if (setupKey !== expectedKey) {
    return { error: "Invalid setup key" }
  }

  if (!email || !password || !fullName) {
    return { error: "All fields are required" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const supabase = await createClient()

  // Double-check no admin exists (security)
  const { count } = await supabase.from("admin_users").select("*", { count: "exact", head: true })

  if (count && count > 0) {
    return { error: "Setup has already been completed. Please use the login page." }
  }

  // Create auth user via signup
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${typeof window !== "undefined" ? window.location.origin : ""}/admin`,
      data: {
        full_name: fullName,
      },
    },
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!signUpData.user) {
    return { error: "Failed to create user account" }
  }

  // Create admin user record with SUPER_ADMIN role
  const { error: adminError } = await supabase.from("admin_users").insert({
    user_id: signUpData.user.id,
    email,
    full_name: fullName,
    role: "SUPER_ADMIN", // First user is always super admin
    is_active: true,
  })

  if (adminError) {
    return { error: adminError.message }
  }

  // Log the setup activity
  const { data: adminUser } = await supabase.from("admin_users").select("id").eq("user_id", signUpData.user.id).single()

  if (adminUser) {
    await supabase.from("activity_logs").insert({
      user_id: adminUser.id,
      action: "CREATE",
      entity_type: "setup",
      new_data: { message: "Initial admin setup completed" },
    })
  }

  redirect("/admin/login?setup=success")
}
