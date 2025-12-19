import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { StatForm } from "@/components/admin/stat-form"

export default async function NewStatPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/admin/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Impact Statistic</h1>
        <p className="text-muted-foreground">Add a new statistic to display on the website</p>
      </div>
      <StatForm />
    </div>
  )
}
