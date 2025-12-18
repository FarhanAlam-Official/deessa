"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Check if user is an admin
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id, role, is_active")
    .eq("user_id", data.user.id)
    .single()

  if (adminError || !adminUser) {
    await supabase.auth.signOut()
    return { error: "You do not have admin access" }
  }

  if (!adminUser.is_active) {
    await supabase.auth.signOut()
    return { error: "Your admin account has been deactivated" }
  }

  // Log the login activity
  await supabase.from("activity_logs").insert({
    user_id: adminUser.id,
    action: "LOGIN",
    entity_type: "auth",
  })

  revalidatePath("/admin")
  redirect("/admin")
}

export async function adminLogout() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: adminUser } = await supabase.from("admin_users").select("id").eq("user_id", user.id).single()

    if (adminUser) {
      await supabase.from("activity_logs").insert({
        user_id: adminUser.id,
        action: "LOGOUT",
        entity_type: "auth",
      })
    }
  }

  await supabase.auth.signOut()
  redirect("/admin/login")
}

export async function getCurrentAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("user_id", user.id).single()

  return adminUser
}

export async function createAdminUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const role = formData.get("role") as string

  if (!email || !password || !fullName || !role) {
    return { error: "All fields are required" }
  }

  const supabase = await createClient()

  // Check if current user is super admin
  const currentAdmin = await getCurrentAdmin()
  if (!currentAdmin || currentAdmin.role !== "SUPER_ADMIN") {
    return { error: "Only super admins can create new admin users" }
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    // Fallback: use regular signup if admin API not available
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/admin`,
      },
    })

    if (signUpError) {
      return { error: signUpError.message }
    }

    if (!signUpData.user) {
      return { error: "Failed to create user" }
    }

    // Create admin user record
    const { error: adminError } = await supabase.from("admin_users").insert({
      user_id: signUpData.user.id,
      email,
      full_name: fullName,
      role,
    })

    if (adminError) {
      return { error: adminError.message }
    }
  } else {
    // Create admin user record with admin-created user
    const { error: adminError } = await supabase.from("admin_users").insert({
      user_id: authData.user.id,
      email,
      full_name: fullName,
      role,
    })

    if (adminError) {
      return { error: adminError.message }
    }
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: currentAdmin.id,
    action: "CREATE",
    entity_type: "admin_user",
    new_data: { email, full_name: fullName, role },
  })

  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateAdminUser(userId: string, formData: FormData) {
  const fullName = formData.get("fullName") as string
  const role = formData.get("role") as string
  const isActive = formData.get("isActive") === "true"

  const supabase = await createClient()

  const currentAdmin = await getCurrentAdmin()
  if (!currentAdmin || (currentAdmin.role !== "SUPER_ADMIN" && currentAdmin.role !== "ADMIN")) {
    return { error: "Unauthorized" }
  }

  // Get old data for audit
  const { data: oldData } = await supabase.from("admin_users").select("*").eq("id", userId).single()

  const { error } = await supabase
    .from("admin_users")
    .update({
      full_name: fullName,
      role,
      is_active: isActive,
    })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  await supabase.from("activity_logs").insert({
    user_id: currentAdmin.id,
    action: "UPDATE",
    entity_type: "admin_user",
    entity_id: userId,
    old_data: oldData,
    new_data: { full_name: fullName, role, is_active: isActive },
  })

  revalidatePath("/admin/users")
  return { success: true }
}
