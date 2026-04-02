"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EyeOff, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import notifications from "@/lib/notifications"

interface DeleteStoryButtonProps {
  storyId: string
  storyTitle: string
  isPublished?: boolean
}

export default function DeleteStoryButton({
  storyId,
  storyTitle,
  isPublished = false,
}: DeleteStoryButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/stories/${storyId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete story")
      }

      notifications.showSuccess("Story deleted successfully")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting story:", error)
      notifications.showError({
        description: error instanceof Error ? error.message : "Failed to delete story",
      })
      setIsDeleting(false)
      setOpen(false)
    }
  }

  const handleUnpublish = async () => {
    setIsUnpublishing(true)

    try {
      const response = await fetch(`/api/admin/stories/${storyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_published: false }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to unpublish story")
      }

      notifications.showSuccess("Story unpublished successfully")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error unpublishing story:", error)
      notifications.showError({
        description: error instanceof Error ? error.message : "Failed to unpublish story",
      })
    } finally {
      setIsUnpublishing(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${storyTitle}`}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this story?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div>
                  This action cannot be undone. This will permanently delete the story{" "}
                  <span className="font-semibold text-foreground">&quot;{storyTitle}&quot;</span> and remove it from the website.
                </div>
                {isPublished && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-500">
                    Tip: It is usually better to unpublish first. You can hide it from the public site now and keep it for later edits.
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={isDeleting || isUnpublishing}>Cancel</AlertDialogCancel>
            {isPublished && (
              <Button
                variant="outline"
                onClick={handleUnpublish}
                disabled={isDeleting || isUnpublishing}
                className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-500 dark:hover:bg-amber-950/30"
              >
                <EyeOff className="mr-2 h-4 w-4" />
                {isUnpublishing ? "Unpublishing..." : "Unpublish Instead"}
              </Button>
            )}
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || isUnpublishing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
