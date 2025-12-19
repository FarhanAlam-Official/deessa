import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Eye, EyeOff, ExternalLink } from "lucide-react"
import { ProjectActions } from "@/components/admin/project-actions"
import { redirect } from "next/navigation"
import { hasPermission, type AdminRole } from "@/lib/types/admin"

async function checkProjectsPermission() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: adminUser } = await supabase.from("admin_users").select("role").eq("user_id", user.id).single()

  if (!adminUser) return false

  return hasPermission(adminUser.role as AdminRole, "projects")
}

async function getProjects() {
  const supabase = await createClient()
  const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false })
  return data || []
}

const categoryColors: Record<string, string> = {
  education: "bg-blue-100 text-blue-800",
  health: "bg-green-100 text-green-800",
  empowerment: "bg-purple-100 text-purple-800",
  relief: "bg-orange-100 text-orange-800",
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  urgent: "bg-red-100 text-red-800",
  draft: "bg-yellow-100 text-yellow-800",
}

export default async function ProjectsPage() {
  const hasAccess = await checkProjectsPermission()
  if (!hasAccess) {
    redirect("/admin")
  }

  const projects = await getProjects()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage programs and initiatives</p>
        </div>
        <Button asChild>
          <Link href="/admin/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No projects found. Create your first project.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {project.image && (
                          <img
                            src={project.image || "/placeholder.svg"}
                            alt={project.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{project.title}</p>
                          <p className="text-sm text-muted-foreground">{project.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={categoryColors[project.category]}>
                        {project.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[project.status]}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.goal ? (
                        <div className="w-24">
                          <div className="text-sm">
                            ₹{(project.raised || 0).toLocaleString()} / ₹{project.goal.toLocaleString()}
                          </div>
                          <div className="h-1.5 bg-muted rounded-full mt-1">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min(((project.raised || 0) / project.goal) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.is_published ? (
                        <Badge variant="default" className="bg-green-600">
                          <Eye className="mr-1 h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/projects/${project.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {project.is_published && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/programs/${project.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <ProjectActions project={project} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
