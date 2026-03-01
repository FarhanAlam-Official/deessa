import Link from "next/link"
import { ArrowLeft, Settings } from "lucide-react"
import { getConferenceSettings } from "@/lib/actions/conference-settings"
import { ConferenceSettingsForm } from "@/components/admin/conference-settings-form"

export const metadata = {
  title: "Conference Settings | Admin",
}

export default async function ConferenceSettingsPage() {
  const settings = await getConferenceSettings()

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/conference"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Conference
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">Settings</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Settings className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conference Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure event details and email template content
          </p>
        </div>
      </div>

      {/* Form */}
      <ConferenceSettingsForm settings={settings} />
    </div>
  )
}
