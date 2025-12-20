import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Download, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getEventWithRegistrations(id: string) {
  const supabase = await createClient()

  const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", id).single()

  if (eventError) return null

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: false })

  return { event, registrations: registrations || [] }
}

export default async function EventRegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getEventWithRegistrations(id)

  if (!data) {
    notFound()
  }

  const { event, registrations } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/events"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Events
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Registrations</h1>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registrations.length}</div>
          </CardContent>
        </Card>
        {event.max_capacity && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Max Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{event.max_capacity}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Spots Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.max(0, event.max_capacity - registrations.length)}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No registrations yet.
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{reg.name}</TableCell>
                    <TableCell>{reg.email}</TableCell>
                    <TableCell>{reg.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{reg.number_of_attendees || 1}</Badge>
                    </TableCell>
                    <TableCell>{new Date(reg.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`mailto:${reg.email}`}>
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
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
