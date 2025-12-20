import { redirect, notFound } from "next/navigation"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { getPartner } from "@/lib/actions/admin-partners"
import { PartnerForm } from "@/components/admin/partner-form"

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/admin/login")

  const { id } = await params

  let partner
  try {
    partner = await getPartner(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Partner</h1>
        <p className="text-muted-foreground">Update partner information</p>
      </div>
      <PartnerForm partner={partner} />
    </div>
  )
}
