"use client"

import { useState, useEffect } from "react"
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

interface LinkDialogProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}

export function LinkDialog({ editor, isOpen, onClose }: LinkDialogProps) {
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Get current selection or link
      const { from, to } = editor.state.selection
      const selectedText = editor.state.doc.textBetween(from, to, "")
      
      // Check if cursor is on a link
      const linkAttrs = editor.getAttributes("link")
      
      if (linkAttrs.href) {
        setUrl(linkAttrs.href)
        setText(selectedText || "")
      } else {
        setUrl("")
        setText(selectedText || "")
      }
      setError(null)
    }
  }, [isOpen, editor])

  const validateUrl = (href: string): boolean => {
    return /^(https?:\/\/|\/)/i.test(href)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError("URL is required")
      return
    }

    if (!validateUrl(url)) {
      setError("URL must start with http://, https://, or /")
      return
    }

    // If there's text, insert it with the link
    if (text.trim() && !editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run()
    } else if (text.trim()) {
      // Insert new text with link
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}">${text}</a>`)
        .run()
    } else {
      // Just set link on selection
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run()
    }

    onClose()
  }

  const handleRemove = () => {
    editor.chain().focus().unsetLink().run()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
          <DialogDescription>
            Add a hyperlink to your content. URLs must start with http://, https://, or /
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
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                placeholder="https://example.com or /about"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="text">Link Text (optional)</Label>
              <Input
                id="text"
                placeholder="Click here"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use selected text
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {editor.getAttributes("link").href && (
              <Button type="button" variant="destructive" onClick={handleRemove}>
                Remove Link
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Insert Link</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
