import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OrganizationSettingsForm } from "@/components/admin/organization-settings-form"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Organization Settings | Admin",
  description: "Manage organization details and receipt settings",
}

async function getOrganizationDetails() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "organization_details")
    .single()

  if (error || !data?.value) {
    return null
  }

  return data.value
}

export default async function OrganizationSettingsPage() {
  const organizationDetails = await getOrganizationDetails()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Organization Settings</h1>
        <p className="text-foreground-muted mt-2">
          Manage your organization details, tax information, and receipt settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            These details will appear on donation receipts and official documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationSettingsForm initialData={organizationDetails} />
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Receipt Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            • Receipt numbers are automatically generated in the format: <strong>PREFIX-YEAR-NUMBER</strong>
          </p>
          <p>
            • Each donation receives a unique receipt number for tracking and audit purposes
          </p>
          <p>
            • Tax and registration details are displayed on all generated receipts
          </p>
          <p>
            • Donors receive receipts via email and can download them anytime
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
