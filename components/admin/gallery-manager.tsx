"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Loader2, Image as ImageIcon, GripVertical } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface GalleryImage {
  url: string
  caption?: string
  credit?: string
}

interface GalleryManagerProps {
  images: GalleryImage[]
  onChange: (images: GalleryImage[]) => void
  bucket: string
  maxImages?: number
  label?: string
  className?: string
}

export function GalleryManager({
  images,
  onChange,
  bucket,
  maxImages = 20,
  label = "Gallery Images",
  className,
}: GalleryManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // Check max images limit
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setError(null)
    setUploading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to upload files")
      }

      const uploadedUrls: GalleryImage[] = []

      for (const file of files) {
        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} is too large. Maximum 10MB per image.`)
          continue
        }

        const fileExt = file.name.split(".").pop()?.toLowerCase()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { data, error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

        if (uploadError) {
          console.error("Upload error:", uploadError)
          continue
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(data.path)

        uploadedUrls.push({
          url: publicUrl,
          caption: "",
          credit: "deessa Foundation",
        })
      }

      onChange([...images, ...uploadedUrls])
    } catch (error: any) {
      console.error("Gallery upload error:", error)
      setError(error.message || "Failed to upload images")
    } finally {
      setUploading(false)
    }
  }

  const updateImage = (index: number, updates: Partial<GalleryImage>) => {
    const newImages = [...images]
    newImages[index] = { ...newImages[index], ...updates }
    onChange(newImages)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [removed] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, removed)
    onChange(newImages)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">
          {images.length} / {maxImages} images
        </span>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {/* Upload Button */}
      {images.length < maxImages && (
        <div>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="gallery-upload"
          />
          <Label htmlFor="gallery-upload">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                  </div>
                  <div className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 10MB</div>
                </div>
              )}
            </div>
          </Label>
        </div>
      )}

      {/* Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-48 bg-muted">
                  <Image src={image.url} alt={image.caption || `Gallery image ${index + 1}`} fill className="object-cover" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-2 left-2 h-8 w-8"
                      onClick={() => moveImage(index, index - 1)}
                    >
                      ↑
                    </Button>
                  )}
                  {index < images.length - 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-2 right-2 h-8 w-8"
                      onClick={() => moveImage(index, index + 1)}
                    >
                      ↓
                    </Button>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor={`caption-${index}`} className="text-xs">
                      Caption
                    </Label>
                    <Input
                      id={`caption-${index}`}
                      value={image.caption || ""}
                      onChange={(e) => updateImage(index, { caption: e.target.value })}
                      placeholder="Image caption..."
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`credit-${index}`} className="text-xs">
                      Credit
                    </Label>
                    <Input
                      id={`credit-${index}`}
                      value={image.credit || ""}
                      onChange={(e) => updateImage(index, { credit: e.target.value })}
                      placeholder="Photo credit..."
                      className="h-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No images added yet</p>
        </div>
      )}
    </div>
  )
}
