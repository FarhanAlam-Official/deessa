"use client"

import { useState, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { addReviewNote } from "@/lib/actions/admin-donation-actions"
import { notifications } from "@/lib/notifications"
import { formatRelativeTime, formatAbsoluteTime } from "@/lib/utils/date-formatting"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ReviewNote {
  id: string
  note_text: string
  created_at: string
  admin_users: {
    full_name: string
    email: string
  }
}

interface ReviewNotesSectionProps {
  donationId: string
  notes: ReviewNote[]
  userRole: "ADMIN" | "SUPER_ADMIN" | "FINANCE" | "EDITOR"
}

export const ReviewNotesSection = memo(function ReviewNotesSection({ donationId, notes, userRole }: ReviewNotesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [displayCount, setDisplayCount] = useState(10)

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole)

  const handleSubmit = async () => {
    if (noteText.trim().length < 10) {
      notifications.showError({
        title: "Validation Error",
        description: "Note must be at least 10 characters",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await addReviewNote({
        donationId,
        noteText: noteText.trim(),
      })

      if (result.ok) {
        notifications.showSuccess({
          title: "Success",
          description: result.message,
        })
        setNoteText("")
        setIsDialogOpen(false)
        // Page will revalidate automatically
      } else {
        // Handle specific error cases
        if (result.message.includes("network") || result.message.includes("Network")) {
          notifications.showError({
            title: "Network Error",
            description: "Unable to connect to the server. Please check your internet connection and try again.",
            duration: 5000,
          })
        } else {
          notifications.showError({
            title: "Error",
            description: result.message,
          })
        }
      }
    } catch (error) {
      console.error("Add review note error:", error)
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        notifications.showError({
          title: "Network Error",
          description: "Unable to connect to the server. Please check your internet connection and try again.",
          duration: 5000,
        })
      } else {
        notifications.showError({
          title: "Error",
          description: "Failed to add review note. Please try again.",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayedNotes = notes.slice(0, displayCount)
  const hasMore = notes.length > displayCount

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Review Notes ({notes.length})</CardTitle>
        {isAdmin && (
          <Button size="sm" onClick={() => setIsDialogOpen(true)} className="gap-2 touch-manipulation min-h-[44px]">
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedNotes.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No review notes yet
          </div>
        ) : (
          <>
            {displayedNotes.map((note) => (
              <div
                key={note.id}
                className="border-l-4 border-blue-500 bg-muted/50 p-4 rounded-r-lg space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{note.admin_users.full_name}</span>
                  <span
                    className="text-muted-foreground"
                    title={formatAbsoluteTime(note.created_at) || undefined}
                  >
                    {formatRelativeTime(note.created_at)}
                  </span>
                </div>
                <div className="text-sm whitespace-pre-wrap">{note.note_text}</div>
              </div>
            ))}

            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisplayCount((prev) => prev + 10)}
                className="w-full touch-manipulation min-h-[44px]"
              >
                Load More ({notes.length - displayCount} remaining)
              </Button>
            )}
          </>
        )}
      </CardContent>

      {/* Add Note Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Review Note</DialogTitle>
            <DialogDescription>
              Add an internal note about this transaction. Minimum 10 characters required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Textarea
                placeholder="Enter your review note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={5}
                className={`resize-none ${noteText.length > 0 && noteText.trim().length < 10 ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                disabled={isSubmitting}
                aria-invalid={noteText.length > 0 && noteText.trim().length < 10}
                aria-describedby="note-error note-count"
              />
              <div className="flex justify-between items-center mt-1">
                <div id="note-count" className={`text-sm ${noteText.length > 0 && noteText.trim().length < 10 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {noteText.length} / 10 characters minimum
                </div>
                {noteText.length > 0 && noteText.trim().length < 10 && (
                  <div id="note-error" className="text-sm text-red-600">
                    Too short
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="touch-manipulation min-h-[44px]">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || noteText.trim().length < 10} className="touch-manipulation min-h-[44px]">
              {isSubmitting ? "Adding..." : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
})

