import { redirect, notFound } from "next/navigation"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { getImpactStat } from "@/lib/actions/admin-stats"
import { StatForm } from "@/components/admin/stat-form"

export default async function EditStatPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/admin/login")

  const { id } = await params

  let stat
  try {
    stat = await getImpactStat(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Statistic</h1>
        <p className="text-muted-foreground">Update impact statistic</p>
      </div>
      <StatForm stat={stat} />
    </div>
  )
}
