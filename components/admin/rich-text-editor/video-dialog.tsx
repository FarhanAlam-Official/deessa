"use client"

import { useState } from "react"
import type { Editor } from "@tiptap/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface VideoDialogProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}

export function VideoDialog({ editor, isOpen, onClose }: VideoDialogProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const validateYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i
    return youtubeRegex.test(url)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError("YouTube URL is required")
      return
    }

    if (!validateYouTubeUrl(url)) {
      setError("Please enter a valid YouTube URL")
      return
    }

    editor.chain().focus().setYoutubeVideo({ src: url }).run()

    // Reset form
    setUrl("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Embed YouTube Video</DialogTitle>
          <DialogDescription>
            Enter a YouTube video URL to embed it in your story.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="videoUrl">YouTube URL *</Label>
              <Input
                id="videoUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Supports youtube.com and youtu.be URLs
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Embed Video</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
