"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { createTeamMember, updateTeamMember } from "@/lib/actions/admin-team"
import type { TeamMember } from "@/lib/types/admin"

interface TeamMemberFormProps {
  member?: TeamMember
}

export function TeamMemberForm({ member }: TeamMemberFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    const result = member ? await updateTeamMember(member.id, formData) : await createTeamMember(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else if (member) {
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
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" name="name" defaultValue={member?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role / Position *</Label>
                  <Input id="role" name="role" defaultValue={member?.role} placeholder="Executive Director" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={member?.bio || ""}
                  rows={4}
                  placeholder="Brief biography..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Photo URL</Label>
                <Input
                  id="image"
                  name="image"
                  type="url"
                  defaultValue={member?.image || ""}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={member?.email || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={member?.phone || ""} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublished">Show on Website</Label>
                <Switch
                  id="isPublished"
                  name="isPublished"
                  defaultChecked={member?.is_published ?? true}
                  value="true"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, this team member will be visible on the public About page.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {member ? "Save Changes" : "Add Member"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
