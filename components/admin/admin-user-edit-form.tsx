"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Save, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { updateAdminUser, deleteAdminUser } from "@/lib/actions/admin-users"

interface AdminUserEditFormProps {
  user: {
    id: string
    email: string
    full_name: string
    role: string
    is_active: boolean
  }
  currentAdminId: string
}

export function AdminUserEditForm({ user, currentAdminId }: AdminUserEditFormProps) {
  const router = useRouter()
  const [role, setRole] = useState(user.role)
  const [isActive, setIsActive] = useState(user.is_active)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleSubmit() {
    setIsLoading(true)
    setError(null)

    const result = await updateAdminUser(user.id, { role, is_active: isActive })

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push("/admin/users")
      router.refresh()
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)

    const result = await deleteAdminUser(user.id)

    if (result?.error) {
      setError(result.error)
      setIsDeleting(false)
    } else {
      router.push("/admin/users")
      router.refresh()
    }
  }

  const isSelf = user.id === currentAdminId

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>User Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Name</Label>
          <p className="text-sm font-medium">{user.full_name}</p>
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <p className="text-sm font-medium">{user.email}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={setRole} disabled={isSelf}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="EDITOR">Editor</SelectItem>
              <SelectItem value="FINANCE">Finance</SelectItem>
            </SelectContent>
          </Select>
          {isSelf && <p className="text-xs text-muted-foreground">You cannot change your own role</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="is_active">Active Status</Label>
            <p className="text-xs text-muted-foreground">Inactive users cannot log in</p>
          </div>
          <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} disabled={isSelf} />
        </div>

        <div className="flex items-center gap-4 pt-4">
          <Button onClick={handleSubmit} disabled={isLoading || isSelf}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>

          {!isSelf && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the admin user &quot;{user.full_name}&quot;. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
