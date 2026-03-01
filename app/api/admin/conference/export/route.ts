import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify admin session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify admin role
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role, is_active")
      .eq("user_id", user.id)
      .single()

    if (adminError || !adminUser) {
      return new NextResponse("Forbidden - Admin access required", { status: 403 })
    }

    if (!adminUser.is_active) {
      return new NextResponse("Forbidden - Admin account is deactivated", { status: 403 })
    }

    const { data: registrations, error } = await supabase
      .from("conference_registrations")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return new NextResponse("Failed to fetch registrations", { status: 500 })
    }

    // Build CSV
    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Phone",
      "Organization",
      "Role",
      "Attendance Mode",
      "Workshops",
      "Dietary Preference",
      "T-Shirt Size",
      "Heard Via",
      "Emergency Contact Name",
      "Emergency Contact Phone",
      "Consent Terms",
      "Consent Newsletter",
      "Status",
      "Registered At",
    ]

    const escape = (val: string | null | undefined) => {
      if (val == null) return ""
      let str = String(val)
      
      // Neutralize CSV formula injection by prefixing dangerous characters
      if (str.length > 0 && /^[=+\-@]/.test(str)) {
        str = "'" + str
      }
      
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
    const rows = (registrations || []).map((r) =>
      [
        r.id,
        r.full_name,
        r.email,
        r.phone || "",
        r.organization || "",
        r.role || "",
        r.attendance_mode || "",
        (r.workshops || []).join("; "),
        r.dietary_preference || "",
        r.tshirt_size || "",
        (r.heard_via || []).join("; "),
        r.emergency_contact_name || "",
        r.emergency_contact_phone || "",
        r.consent_terms ? "Yes" : "No",
        r.consent_newsletter ? "Yes" : "No",
        r.status || "pending",
        r.created_at ? new Date(r.created_at).toISOString() : "",
      ]
        .map(escape)
        .join(",")
    )

    const csv = [headers.join(","), ...rows].join("\n")

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="conference-registrations-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (err) {
    console.error("CSV export error:", err)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
