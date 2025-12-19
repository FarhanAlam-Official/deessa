import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, CheckCircle, XCircle } from "lucide-react"
import { canManageUsers, getRoleDisplayName, type AdminRole } from "@/lib/types/admin"

async function getAdminUsers() {
  const supabase = await createClient()
  const { data } = await supabase.from("admin_users").select("*").order("created_at", { ascending: false })
  return data || []
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800",
  ADMIN: "bg-blue-100 text-blue-800",
  EDITOR: "bg-green-100 text-green-800",
  FINANCE: "bg-purple-100 text-purple-800",
}

export default async function AdminUsersPage() {
  const currentAdmin = await getCurrentAdmin()

  if (!currentAdmin || !canManageUsers(currentAdmin.role as AdminRole)) {
    redirect("/admin")
  }

  const users = await getAdminUsers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Users</h1>
          <p className="text-muted-foreground">Manage admin access and roles</p>
        </div>
        {currentAdmin.role === "SUPER_ADMIN" && (
          <Button asChild>
            <Link href="/admin/users/new">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={roleColors[user.role]}>
                      {getRoleDisplayName(user.role as AdminRole)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {currentAdmin.role === "SUPER_ADMIN" && user.id !== currentAdmin.id && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/users/${user.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
