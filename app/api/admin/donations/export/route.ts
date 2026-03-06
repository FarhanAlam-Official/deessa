import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { canViewFinance, type AdminRole } from "@/lib/types/admin"

function escapeXml(val: string): string {
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

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

    const { searchParams } = new URL(request.url)

    // Filter params (same as listing endpoint)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const search = searchParams.get("search")
    const currency = searchParams.get("currency")

    // Build query — no pagination, fetch ALL matching records
    let query = supabase
      .from("donations")
      .select("*")
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

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const donations = data || []

    // Complete column headers
    const headers = [
      "ID",
      "Receipt #",
      "Donor Name",
      "Donor Email",
      "Donor Phone",
      "Amount",
      "Currency",
      "Payment Method",
      "Payment Provider",
      "Payment Status",
      "Type",
      "Provider Reference",
      "Stripe Session ID",
      "Khalti PIDX",
      "Payment ID",
      "Verification ID",
      "Donor Message",
      "Review Notes",
      "Reviewed By",
      "Reviewed At",
      "Receipt Sent At",
      "Confirmed At",
      "Created At",
    ]

    const rows = donations.map((d) => [
      d.id || "",
      d.receipt_number || "",
      d.donor_name || "",
      d.donor_email || "",
      d.donor_phone || "",
      String(d.amount || 0),
      d.currency || "NPR",
      d.payment_method || "",
      d.provider || "",
      d.payment_status || "",
      d.is_monthly ? "Monthly" : "One-time",
      d.provider_ref || "",
      d.stripe_session_id || "",
      d.khalti_pidx || "",
      d.payment_id || "",
      d.verification_id || "",
      d.message || d.donor_message || "",
      d.review_notes || "",
      d.reviewed_by || "",
      d.reviewed_at ? new Date(d.reviewed_at).toLocaleString("en-GB") : "",
      d.receipt_sent_at ? new Date(d.receipt_sent_at).toLocaleString("en-GB") : "",
      d.confirmed_at ? new Date(d.confirmed_at).toLocaleString("en-GB") : "",
      d.created_at ? new Date(d.created_at).toLocaleString("en-GB") : "",
    ])

    // Generate XML Spreadsheet (Excel-compatible .xls)
    const xmlRows = rows.map((row) => {
      const cells = row
        .map((cell) => {
          const isNum = /^\d+(\.\d+)?$/.test(cell) && cell.length < 15
          const type = isNum ? "Number" : "String"
          return `<Cell><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>`
        })
        .join("")
      return `<Row>${cells}</Row>`
    })

    const headerCells = headers
      .map((h) => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
      .join("")

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default"/>
    <Style ss:ID="header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#3FABDE" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Donations">
    <Table>
      <Row>${headerCells}</Row>
      ${xmlRows.join("\n      ")}
    </Table>
  </Worksheet>
</Workbook>`

    const filename = `donations-export-${new Date().toISOString().split("T")[0]}.xlsx`

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
