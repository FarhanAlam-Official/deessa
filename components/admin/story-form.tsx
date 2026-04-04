"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, PenSquare, Eye, AlertTriangle } from "lucide-react"
import { PrintButton } from "@/components/ui/print-button"
import { notifications } from "@/lib/notifications"
import { createStory, updateStory } from "@/lib/actions/admin-stories"
import { FileUpload } from "@/components/admin/file-upload"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { StoryPreviewModal } from "@/components/admin/story-preview-modal"
import { useUnsavedChanges } from "@/components/admin/rich-text-editor/hooks/use-unsaved-changes"
import { getAutosaveBackup, clearAutosaveBackup } from "@/components/admin/rich-text-editor/hooks/use-autosave"
import type { Story } from "@/lib/types/admin"
import "@/app/print-styles.css"

interface StoryFormProps {
  story?: Story
}

export function StoryForm({ story }: StoryFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(story?.image || "")
  const [content, setContent] = useState(story?.content || "")
  const [lastSavedContent, setLastSavedContent] = useState(story?.content || "")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [showBackupRestore, setShowBackupRestore] = useState(false)
  const [backupContent, setBackupContent] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState({
    title: story?.title || "",
    excerpt: story?.excerpt || "",
    category: story?.category || "",
    readTime: story?.read_time || "",
  })
  const router = useRouter()

  // Check for autosave backup on mount
  useEffect(() => {
    if (story?.id) {
      const backup = getAutosaveBackup(story.id)
      if (backup && backup.content !== story.content) {
        setBackupContent(backup.content)
        setShowBackupRestore(true)
      }
    }
  }, [story?.id, story?.content])

  const handleRestoreBackup = () => {
    if (backupContent) {
      setContent(backupContent)
      setShowBackupRestore(false)
      notifications.showSuccess({
        title: "Backup restored",
        description: "Your unsaved changes have been restored.",
      })
    }
  }

  const handleDiscardBackup = () => {
    if (story?.id) {
      clearAutosaveBackup(story.id)
    }
    setShowBackupRestore(false)
    setBackupContent(null)
  }

  // Track unsaved changes (content differs from last saved)
  const hasUnsavedChanges = content !== lastSavedContent

  // Enable unsaved changes guard
  useUnsavedChanges({
    hasUnsavedChanges,
    message: "You have unsaved changes. Are you sure you want to leave?",
  })

  // Update lastSavedContent when autosave completes
  // This is handled by monitoring content changes after successful autosave
  useEffect(() => {
    // When editing an existing story, autosave will update the content
    // We need to sync lastSavedContent after autosave completes
    // For now, we'll update it on successful form submission
  }, [])

  const handlePreview = () => {
    // Get current form values
    const form = document.querySelector("form") as HTMLFormElement
    const formData = new FormData(form)

    setPreviewData({
      title: (formData.get("title") as string) || "",
      excerpt: (formData.get("excerpt") as string) || "",
      category: (formData.get("category") as string) || "",
      readTime: (formData.get("readTime") as string) || "",
    })

    setIsPreviewOpen(true)
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    // Validate required fields
    const title = formData.get("title") as string
    const excerpt = formData.get("excerpt") as string
    const category = formData.get("category") as string
    const isPublished = formData.get("isPublished") === "true"

    if (!title?.trim()) {
      setError("Title is required")
      setIsLoading(false)
      // Scroll to title field
      document.getElementById("title")?.scrollIntoView({ behavior: "smooth", block: "center" })
      document.getElementById("title")?.focus()
      return
    }

    if (!excerpt?.trim()) {
      setError("Excerpt is required")
      setIsLoading(false)
      document.getElementById("excerpt")?.scrollIntoView({ behavior: "smooth", block: "center" })
      document.getElementById("excerpt")?.focus()
      return
    }

    if (!category?.trim()) {
      setError("Category is required")
      setIsLoading(false)
      document.getElementById("category")?.scrollIntoView({ behavior: "smooth", block: "center" })
      document.getElementById("category")?.focus()
      return
    }

    // Warn if publishing with empty content
    if (isPublished && !content?.trim()) {
      const confirmed = window.confirm(
        "You are about to publish a story with empty content. Are you sure you want to continue?"
      )
      if (!confirmed) {
        setIsLoading(false)
        return
      }
    }

    if (story) {
      notifications.showInfo({ title: "Saving", description: "Saving your changes..." })
    }

    const result = story ? await updateStory(story.id, formData) : await createStory(formData)

    if (result?.error) {
      setError(result.error)
      notifications.showError({ title: "Save failed", description: result.error })
      setIsLoading(false)
    } else if (story) {
      notifications.showSuccess({ title: "Changes saved", description: "Story updated successfully." })
      setLastSavedContent(content) // Clear unsaved changes flag
      router.refresh()
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Print-only header */}
      <div className="print-header hidden">
        <div className="logo">DEESSA Foundation - Admin Preview</div>
        <div className="url">Internal Document</div>
      </div>

      {/* Print-only draft watermark */}
      {story && !story.is_published && (
        <div className="draft-watermark hidden">
          DRAFT
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="no-print">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Backup restore prompt */}
      {showBackupRestore && (
        <Alert className="no-print">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>We found unsaved changes from a previous session. Would you like to restore them?</span>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleDiscardBackup}>
                Discard
              </Button>
              <Button type="button" size="sm" onClick={handleRestoreBackup}>
                Restore
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Story Setup</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Print-only metadata */}
          <div className="story-metadata hidden mb-6">
            <h1>{previewData.title || story?.title || "Untitled Story"}</h1>
            <div>
              <strong>Status:</strong> {story?.is_published ? "Published" : "Draft"} | 
              <strong> Category:</strong> {previewData.category || story?.category || "Uncategorized"} | 
              <strong> Read Time:</strong> {previewData.readTime || story?.read_time || "N/A"}
            </div>
            {(previewData.excerpt || story?.excerpt) && (
              <div style={{ marginTop: "0.5cm", fontStyle: "italic" }}>
                {previewData.excerpt || story?.excerpt}
              </div>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="space-y-2 lg:col-span-8">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" defaultValue={story?.title} required className="h-11 text-base" />
            </div>

            <div className="rounded-lg border bg-muted/20 p-4 lg:col-span-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublished">Published</Label>
                <Switch id="isPublished" name="isPublished" defaultChecked={story?.is_published} value="true" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Label htmlFor="isFeatured">Featured</Label>
                <Switch id="isFeatured" name="isFeatured" defaultChecked={story?.is_featured} value="true" />
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="excerpt">Excerpt *</Label>
            <Textarea id="excerpt" name="excerpt" defaultValue={story?.excerpt} rows={3} required />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <PenSquare className="h-5 w-5" />
            Writing Editor
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Full-width writing surface. Use the toolbar for formatting, media, layout blocks, and font color.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <RichTextEditor
            content={content}
            onChange={setContent}
            onAutosaveComplete={() => setLastSavedContent(content)}
            placeholder="Write your story content here..."
            className="w-full"
            storyId={story?.id}
            enableAutosave={!!story?.id}
          />
          {/* Hidden input to maintain form submission compatibility */}
          <input type="hidden" name="content" value={content} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              bucket="story-images"
              currentUrl={imageUrl}
              onUpload={setImageUrl}
              label="Story Image"
              maxSizeMB={5}
              allowUrl={true}
            />
            <input type="hidden" name="image" value={imageUrl} />
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Story Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                name="category"
                defaultValue={story?.category || ""}
                placeholder="Education, Health, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="readTime">Read Time</Label>
              <Input id="readTime" name="readTime" defaultValue={story?.read_time || ""} placeholder="5 min read" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap gap-3 rounded-xl border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 no-print">
        <Button type="button" variant="outline" className="bg-transparent" onClick={() => router.push('/admin/stories')}>
          Cancel
        </Button>
        <PrintButton variant="outline" className="bg-transparent">
          Print Draft
        </PrintButton>
        <Button type="button" variant="outline" className="bg-transparent" onClick={handlePreview}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {story ? "Save Changes" : "Create Story"}
        </Button>
        <p className="my-auto text-xs text-muted-foreground">Tip: use slash commands and font color controls while writing.</p>
      </div>

      {/* Preview Modal */}
      <StoryPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        story={{
          title: previewData.title,
          excerpt: previewData.excerpt,
          content: content,
          image: imageUrl,
          category: previewData.category,
          read_time: previewData.readTime,
        }}
      />
    </form>
  )
}
