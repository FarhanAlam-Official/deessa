import { ProjectForm } from "@/components/admin/project-form"

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Project</h1>
        <p className="text-muted-foreground">Add a new program or initiative</p>
      </div>

      <ProjectForm />
    </div>
  )
}
