import { notFound } from "next/navigation"
import { getProject } from "@/lib/actions/admin-projects"
import { ProjectForm } from "@/components/admin/project-form"

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let project
  try {
    project = await getProject(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <p className="text-muted-foreground">Update project details</p>
      </div>

      <ProjectForm project={project} />
    </div>
  )
}
