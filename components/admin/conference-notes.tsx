"use client"

import { useState, useEffect } from "react"
import { Save, StickyNote, Loader2 } from "lucide-react"
import { notifications } from "@/lib/notifications"
import { updateConferenceRegistrationNotes } from "@/lib/actions/conference-registration"
import { Button } from "@/components/ui/button"

interface ConferenceNotesProps {
  registrationId: string
  initialNotes: string | null
}

export function ConferenceNotes({ registrationId, initialNotes }: ConferenceNotesProps) {
  const [notes, setNotes] = useState(initialNotes ?? "")
  const [savedNotes, setSavedNotes] = useState(initialNotes ?? "")
  const [saving, setSaving] = useState(false)

  // Update savedNotes when initialNotes prop changes
  useEffect(() => {
    setSavedNotes(initialNotes ?? "")
  }, [initialNotes])

  const isDirty = notes !== savedNotes

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateConferenceRegistrationNotes(registrationId, notes)
      if (result.success) {
        setSavedNotes(notes) // Update savedNotes to current notes after successful save
        notifications.showSuccess({
          title: "Notes saved",
          description: "Admin notes have been saved successfully.",
        })
      } else {
        notifications.showError({
          title: "Failed to save notes",
          description: result.error || "Please try again.",
        })
      }
    } catch (error) {
      notifications.showError({
        title: "Failed to save notes",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        aria-label="Admin-notes"
        placeholder={`Add internal notes about this registrant…\ne.g. VIP guest, needs wheelchair access, speaker contact`}
        className="w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {notes.length > 0 ? `${notes.length} characters` : "No notes yet"}
        </p>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="gap-2"
        >
          {saving
            ? <Loader2 className="size-3.5 animate-spin" />
            : <Save className="size-3.5" />}
          {saving ? "Saving…" : "Save Notes"}
        </Button>
      </div>

      {isDirty && !saving && (
        <p className="text-xs text-amber-600 font-medium">
          ● Unsaved changes
        </p>
      )}
    </div>
  )
}
