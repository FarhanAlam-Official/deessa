import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Eye, EyeOff, Home, BarChart3 } from "lucide-react"
import { StatActions } from "@/components/admin/stat-actions"
import { Progress } from "@/components/ui/progress"

async function getImpactStats() {
  const supabase = await createClient()
  const { data } = await supabase.from("impact_stats").select("*").order("sort_order", { ascending: true })
  return data || []
}

export default async function ImpactStatsPage() {
  const stats = await getImpactStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Impact Statistics</h1>
          <p className="text-muted-foreground">Manage statistics displayed on the homepage and impact page</p>
        </div>
        <Button asChild>
          <Link href="/admin/stats/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Stat
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Statistic</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No statistics found. Add your first impact statistic.
                  </TableCell>
                </TableRow>
              ) : (
                stats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded flex items-center justify-center"
                          style={{ backgroundColor: stat.color ? `${stat.color}20` : "#f1f5f9" }}
                        >
                          <BarChart3 className="h-5 w-5" style={{ color: stat.color || "#64748b" }} />
                        </div>
                        <div>
                          <p className="font-medium">{stat.label}</p>
                          {stat.icon && <p className="text-xs text-muted-foreground">Icon: {stat.icon}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-semibold">{stat.value}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {stat.category === "home" ? (
                          <>
                            <Home className="h-3 w-3" /> Homepage
                          </>
                        ) : (
                          <>
                            <BarChart3 className="h-3 w-3" /> Impact Page
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {stat.progress !== null ? (
                        <div className="flex items-center gap-2 w-24">
                          <Progress value={stat.progress} className="h-2" />
                          <span className="text-xs text-muted-foreground">{stat.progress}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {stat.is_published ? (
                        <Badge variant="default" className="bg-green-600">
                          <Eye className="mr-1 h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Hidden
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/stats/${stat.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <StatActions statId={stat.id} statLabel={stat.label} />
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
