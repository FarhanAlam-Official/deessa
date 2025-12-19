import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Eye, EyeOff, ExternalLink, Building, Heart, Award } from "lucide-react"
import { PartnerActions } from "@/components/admin/partner-actions"

async function getPartners() {
  const supabase = await createClient()
  const { data } = await supabase.from("partners").select("*").order("sort_order", { ascending: true })
  return data || []
}

const typeIcons = {
  partner: Building,
  donor: Heart,
  sponsor: Award,
}

const typeColors = {
  partner: "bg-blue-600",
  donor: "bg-green-600",
  sponsor: "bg-purple-600",
}

export default async function PartnersPage() {
  const partners = await getPartners()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partners & Sponsors</h1>
          <p className="text-muted-foreground">Manage your organization&apos;s partners, donors, and sponsors</p>
        </div>
        <Button asChild>
          <Link href="/admin/partners/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Partner
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No partners found. Add your first partner or sponsor.
                  </TableCell>
                </TableRow>
              ) : (
                partners.map((partner) => {
                  const TypeIcon = typeIcons[partner.type as keyof typeof typeIcons] || Building
                  return (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {partner.logo ? (
                            <img
                              src={partner.logo || "/placeholder.svg"}
                              alt={partner.name}
                              className="h-10 w-10 rounded object-contain bg-muted p-1"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <TypeIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{partner.name}</p>
                            {partner.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{partner.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={typeColors[partner.type as keyof typeof typeColors]}>
                          {partner.type.charAt(0).toUpperCase() + partner.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {partner.website ? (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            Visit <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {partner.is_published ? (
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
                            <Link href={`/admin/partners/${partner.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <PartnerActions partnerId={partner.id} partnerName={partner.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
