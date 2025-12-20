import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { TeamMemberForm } from "@/components/admin/team-member-form"

async function getTeamMember(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("team_members").select("*").eq("id", id).single()

  if (error) return null
  return data
}

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const member = await getTeamMember(id)

  if (!member) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/team"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Team
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Edit Team Member</h1>
        <p className="text-muted-foreground">Update {member.name}&apos;s profile</p>
      </div>

      <TeamMemberForm member={member} />
    </div>
  )
}
