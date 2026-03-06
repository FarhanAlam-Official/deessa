import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { canViewFinance, type AdminRole } from "@/lib/types/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (!adminUser || !canViewFinance(adminUser.role as AdminRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Pagination params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "0", 10)
    const limit = parseInt(searchParams.get("limit") || "25", 10)
    const from = page * limit
    const to = from + limit - 1

    // Filter params
    const status = searchParams.get("status") // completed | pending | failed
    const type = searchParams.get("type") // monthly | one-time
    const search = searchParams.get("search") // donor name/email search
    const currency = searchParams.get("currency") // NPR | USD etc.

    // Build query
    let query = supabase
      .from("donations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("payment_status", status)
    }
    if (type === "monthly") {
      query = query.eq("is_monthly", true)
    } else if (type === "one-time") {
      query = query.eq("is_monthly", false)
    }
    if (currency && currency !== "all") {
      query = query.eq("currency", currency)
    }
    if (search) {
      query = query.or(`donor_name.ilike.%${search}%,donor_email.ilike.%${search}%`)
    }

    // Apply pagination
    const { data, count, error } = await query.range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also compute stats for the current filter set
    let statsQuery = supabase
      .from("donations")
      .select("amount, is_monthly, payment_status, currency")

    if (status && status !== "all") {
      statsQuery = statsQuery.eq("payment_status", status)
    }
    if (type === "monthly") {
      statsQuery = statsQuery.eq("is_monthly", true)
    } else if (type === "one-time") {
      statsQuery = statsQuery.eq("is_monthly", false)
    }
    if (currency && currency !== "all") {
      statsQuery = statsQuery.eq("currency", currency)
    }
    if (search) {
      statsQuery = statsQuery.or(`donor_name.ilike.%${search}%,donor_email.ilike.%${search}%`)
    }

    const { data: statsDonations } = await statsQuery

    const totals = statsDonations?.reduce((acc, d) => {
      if (d.payment_status === "completed") {
        const cur = d.currency || "NPR"
        acc[cur] = (acc[cur] || 0) + (d.amount || 0)
      }
      return acc
    }, {} as Record<string, number>) || {}

    const monthlyDonors = statsDonations?.filter((d) => d.is_monthly && d.payment_status === "completed").length || 0
    const totalDonors = statsDonations?.filter((d) => d.payment_status === "completed").length || 0
    const pendingCount = statsDonations?.filter((d) => d.payment_status === "pending").length || 0
    const failedCount = statsDonations?.filter((d) => d.payment_status === "failed").length || 0

    return NextResponse.json({
      donations: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: to < (count || 0) - 1,
      stats: {
        totals,
        monthlyDonors,
        totalDonors,
        pendingCount,
        failedCount,
      },
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
