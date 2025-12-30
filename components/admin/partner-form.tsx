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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertCircle } from "lucide-react"
import { createPartner, updatePartner } from "@/lib/actions/admin-partners"
import { FileUpload } from "@/components/admin/file-upload"
import type { Partner } from "@/lib/types/admin"

interface PartnerFormProps {
  partner?: Partner
}

export function PartnerForm({ partner }: PartnerFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [type, setType] = useState(partner?.type || "partner")
  const [logoUrl, setLogoUrl] = useState(partner?.logo || "")
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    formData.set("type", type)
    const result = partner ? await updatePartner(partner.id, formData) : await createPartner(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push("/admin/partners")
      router.refresh()
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
              <CardTitle>Partner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Partner Name *</Label>
                  <Input id="name" name="name" defaultValue={partner?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="donor">Donor</SelectItem>
                      <SelectItem value="sponsor">Sponsor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={partner?.description || ""}
                  rows={3}
                  placeholder="Brief description of the partnership..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FileUpload
                    bucket="partner-logos"
                    currentUrl={logoUrl}
                    onUpload={setLogoUrl}
                    label="Partner Logo"
                    maxSizeMB={2}
                    allowUrl={true}
                  />
                  <input type="hidden" name="logo" value={logoUrl} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    defaultValue={partner?.website || ""}
                    placeholder="https://..."
                  />
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
                  defaultChecked={partner?.is_published ?? true}
                  value="true"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, this partner will be visible on the public website.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {partner ? "Save Changes" : "Add Partner"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
