"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2, Image as ImageIcon, ExternalLink } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  bucket: string
  onUpload: (url: string) => void
  accept?: string
  currentUrl?: string
  label?: string
  maxSizeMB?: number
  allowUrl?: boolean
  className?: string
}

export function FileUpload({
  bucket,
  onUpload,
  accept = "image/*",
  currentUrl,
  label = "Upload File",
  maxSizeMB = 5,
  allowUrl = true,
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [error, setError] = useState<string | null>(null)
  const [useUrl, setUseUrl] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset error
    setError(null)

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    setUploading(true)
    const supabase = createClient()

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to upload files")
      }

      const fileExt = file.name.split(".").pop()?.toLowerCase()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { data, error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path)

      setPreview(publicUrl)
      onUpload(publicUrl)
    } catch (error: any) {
      console.error("Upload error:", error)
      setError(error.message || "Failed to upload file")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUpload("")
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUrlChange = (url: string) => {
    setPreview(url)
    onUpload(url)
    setError(null)
  }

  const isImage = accept.includes("image")
  const isVideo = accept.includes("video")

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {allowUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setUseUrl(!useUrl)}
            className="h-auto py-1 text-xs"
          >
            <ExternalLink className="size-3 mr-1" />
            {useUrl ? "Upload File" : "Use URL"}
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {useUrl ? (
        // URL Input Mode
        <div className="space-y-2">
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={preview || ""}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="w-full"
          />
          {preview && isImage && (
            <div className="relative border rounded-lg overflow-hidden">
              <Image src={preview} alt="Preview" width={300} height={200} className="w-full h-48 object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
        </div>
      ) : preview ? (
        // Preview Mode
        <div className="relative border rounded-lg overflow-hidden bg-muted">
          {isImage && (
            <Image src={preview} alt="Preview" width={400} height={300} className="w-full h-48 object-cover" />
          )}
          {isVideo && (
            <video src={preview} controls className="w-full h-48 object-cover">
              Your browser does not support the video tag.
            </video>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 shadow-lg"
            onClick={handleRemove}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        // Upload Mode
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <Input
            ref={fileInputRef}
            id={`file-upload-${bucket}`}
            type="file"
            accept={accept}
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          <Label htmlFor={`file-upload-${bucket}`} className="cursor-pointer flex flex-col items-center gap-2">
            {uploading ? (
              <Loader2 className="size-8 animate-spin text-primary" />
            ) : isImage ? (
              <ImageIcon className="size-8 text-muted-foreground" />
            ) : (
              <Upload className="size-8 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {uploading ? "Uploading..." : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isImage && `PNG, JPG, WEBP up to ${maxSizeMB}MB`}
                {isVideo && `MP4, WEBM up to ${maxSizeMB}MB`}
              </p>
            </div>
          </Label>
        </div>
      )}
    </div>
  )
}
