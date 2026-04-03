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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { FileUpload } from "@/components/admin/file-upload"
import type { ImageAttributes } from "./extensions/custom-image"

interface ImageDialogProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}

export function ImageDialog({ editor, isOpen, onClose }: ImageDialogProps) {
  const [url, setUrl] = useState("")
  const [uploadedUrl, setUploadedUrl] = useState("")
  const [alt, setAlt] = useState("")
  const [caption, setCaption] = useState("")
  const [align, setAlign] = useState<ImageAttributes["align"]>("center")
  const [width, setWidth] = useState<ImageAttributes["width"]>("medium")
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const finalUrl = uploadedUrl || url

    if (!finalUrl.trim()) {
      setError("Image URL is required")
      return
    }

    editor
      .chain()
      .focus()
      .setImage({
        src: finalUrl,
        alt: alt || undefined,
        caption: caption || undefined,
        align,
        width,
      })
      .run()

    // Reset form
    setUrl("")
    setUploadedUrl("")
    setAlt("")
    setCaption("")
    setAlign("center")
    setWidth("medium")
    onClose()
  }

  const handleUpload = (newUrl: string) => {
    setUploadedUrl(newUrl)
    setIsUploading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Upload an image or provide a URL. Maximum file size: 5MB.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <FileUpload
                bucket="story-images"
                currentUrl={uploadedUrl}
                onUpload={handleUpload}
                label="Image File"
                maxSizeMB={5}
                allowUrl={false}
              />
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="url">Image URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/image.jpg"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="alt">Alt Text *</Label>
              <Input
                id="alt"
                placeholder="Describe the image for accessibility"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for accessibility
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Input
                id="caption"
                placeholder="Image caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="align">Alignment</Label>
                <Select value={align} onValueChange={(value) => setAlign(value as ImageAttributes["align"])}>
                  <SelectTrigger id="align">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="width">Width</Label>
                <Select value={width} onValueChange={(value) => setWidth(value as ImageAttributes["width"])}>
                  <SelectTrigger id="width">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (33%)</SelectItem>
                    <SelectItem value="medium">Medium (66%)</SelectItem>
                    <SelectItem value="full">Full Width</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Insert Image
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
