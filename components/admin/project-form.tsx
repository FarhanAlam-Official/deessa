"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { createProject, updateProject } from "@/lib/actions/admin-projects"
import { FileUpload } from "@/components/admin/file-upload"
import type { Project } from "@/lib/types/admin"

interface ProjectFormProps {
  project?: Project
}

export function ProjectForm({ project }: ProjectFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(project?.image || "")
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    const result = project ? await updateProject(project.id, formData) : await createProject(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else if (project) {
      router.refresh()
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" defaultValue={project?.title} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description *</Label>
                <Textarea id="description" name="description" defaultValue={project?.description} rows={3} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longDescription">Full Description</Label>
                <Textarea
                  id="longDescription"
                  name="longDescription"
                  defaultValue={project?.long_description || ""}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <FileUpload
                  bucket="project-images"
                  currentUrl={imageUrl}
                  onUpload={setImageUrl}
                  label="Project Image"
                  maxSizeMB={5}
                  allowUrl={true}
                />
                <input type="hidden" name="image" value={imageUrl} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="goal">Funding Goal (₹)</Label>
                  <Input id="goal" name="goal" type="number" min="0" step="100" defaultValue={project?.goal || ""} />
                </div>
                {project && (
                  <div className="space-y-2">
                    <Label htmlFor="raised">Amount Raised (₹)</Label>
                    <Input
                      id="raised"
                      name="raised"
                      type="number"
                      min="0"
                      step="100"
                      defaultValue={project?.raised || 0}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublished">Published</Label>
                <Switch id="isPublished" name="isPublished" defaultChecked={project?.is_published} value="true" />
              </div>
              <p className="text-sm text-muted-foreground">Published projects are visible on the public website.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={project?.category || "education"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="empowerment">Empowerment</SelectItem>
                    <SelectItem value="relief">Relief</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select name="status" defaultValue={project?.status || "draft"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input id="location" name="location" defaultValue={project?.location} required />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {project ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
