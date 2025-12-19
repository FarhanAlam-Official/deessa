import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { PartnerForm } from "@/components/admin/partner-form"

export default async function NewPartnerPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/admin/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Partner</h1>
        <p className="text-muted-foreground">Add a new partner, donor, or sponsor</p>
      </div>
      <PartnerForm />
    </div>
  )
}
