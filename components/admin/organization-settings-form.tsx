"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { notifications } from "@/lib/notifications"
import { updateSiteSetting } from "@/lib/actions/admin-settings"
import { useRouter } from "next/navigation"

interface OrganizationDetails {
  name: string
  vat_registration_number: string
  pan_number: string
  swc_registration_number: string
  address: string
  phone: string
  email: string
  logo_url: string
  receipt_prefix: string
  receipt_number_start: number
}

interface OrganizationSettingsFormProps {
  initialData?: OrganizationDetails
}

export function OrganizationSettingsForm({ initialData }: OrganizationSettingsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState<OrganizationDetails>(
    initialData || {
      name: "Dessa Foundation",
      vat_registration_number: "",
      pan_number: "",
      swc_registration_number: "",
      address: "",
      phone: "",
      email: "",
      logo_url: "",
      receipt_prefix: "RCP",
      receipt_number_start: 1000,
    },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "receipt_number_start" ? parseInt(value, 10) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      await updateSiteSetting("organization_details", formData)
      setSuccess("Organization details updated successfully!")
      router.refresh()

      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update settings"
      setError(message)
      notifications.showError({
        title: "Error",
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Organization Name */}
      <div>
        <Label htmlFor="name">Organization Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          placeholder="Dessa Foundation"
        />
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="info@dessafoundation.org"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="+977-1-XXXXXXX"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="Organization address"
          rows={3}
        />
      </div>

      {/* Registration Numbers */}
      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900">Tax & Registration Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vat_registration_number">VAT Registration Number</Label>
            <Input
              id="vat_registration_number"
              name="vat_registration_number"
              value={formData.vat_registration_number}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g., 610123456789"
            />
          </div>
          <div>
            <Label htmlFor="pan_number">PAN Number</Label>
            <Input
              id="pan_number"
              name="pan_number"
              value={formData.pan_number}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g., 610123456"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="swc_registration_number">SWC Registration Number</Label>
          <Input
            id="swc_registration_number"
            name="swc_registration_number"
            value={formData.swc_registration_number}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="Social Welfare Council registration"
          />
        </div>
      </div>

      {/* Logo */}
      <div>
        <Label htmlFor="logo_url">Logo URL</Label>
        <Input
          id="logo_url"
          name="logo_url"
          type="url"
          value={formData.logo_url}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="https://example.com/logo.png"
        />
        {formData.logo_url && (
          <div className="mt-2">
            <img
              src={formData.logo_url}
              alt="Organization Logo"
              className="h-16 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          </div>
        )}
      </div>

      {/* Receipt Settings */}
      <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-semibold text-green-900">Receipt Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="receipt_prefix">Receipt Prefix</Label>
            <Input
              id="receipt_prefix"
              name="receipt_prefix"
              value={formData.receipt_prefix}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="RCP"
              maxLength={10}
            />
            <p className="text-xs text-green-700 mt-1">
              Used in receipt numbers (e.g., {formData.receipt_prefix}-2024-001)
            </p>
          </div>
          <div>
            <Label htmlFor="receipt_number_start">Starting Receipt Number</Label>
            <Input
              id="receipt_number_start"
              name="receipt_number_start"
              type="number"
              value={formData.receipt_number_start}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="1000"
              min="1"
            />
            <p className="text-xs text-green-700 mt-1">
              First receipt will be {formData.receipt_prefix}-{new Date().getFullYear()}-
              {String(formData.receipt_number_start).padStart(3, "0")}
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Organization Details"
          )}
        </Button>
      </div>
    </form>
  )
}
