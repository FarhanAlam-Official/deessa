"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Search,
  Check,
  X,
  Loader2,
  Trash2,
  Calendar,
  HardDrive,
  AlertCircle,
} from "lucide-react"
import { FileUpload } from "./file-upload"
import { getMediaAssets, deleteMediaAsset, createMediaAsset } from "@/lib/actions/media"
import { browseAllBuckets, deleteStorageFile, type StorageFile } from "@/lib/actions/storage-browser"
import { notifications } from "@/lib/notifications"
import type { MediaAsset, MediaType } from "@/lib/types/media"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface MediaPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string, asset?: MediaAsset) => void
  currentUrl?: string
  bucket?: string
  accept?: string
  mediaType?: MediaType
  maxSizeMB?: number
  title?: string
  description?: string
}

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  currentUrl,
  bucket = "hero-images",
  accept = "image/*",
  mediaType = "image",
  maxSizeMB = 10,
  title = "Select Media",
  description = "Choose from library, upload new, or paste a URL",
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState("library")
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<StorageFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null)
  const [urlInput, setUrlInput] = useState(currentUrl || "")
  const [uploadedUrl, setUploadedUrl] = useState("")
  const [fileToDelete, setFileToDelete] = useState<StorageFile | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Load media assets
  useEffect(() => {
    if (open) {
      loadMediaAssets()
    }
  }, [open])

  // Filter files based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = storageFiles.filter(
        (file) =>
          file.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredFiles(filtered)
    } else {
      setFilteredFiles(storageFiles)
    }
  }, [searchTerm, storageFiles])

  async function loadMediaAssets() {
    setIsLoading(true)
    try {
      const { data, error } = await browseAllBuckets()
      if (error) throw new Error(error)
      
      // Filter by media type and bucket
      let filtered = data || []
      
      if (bucket !== "all") {
        filtered = filtered.filter(f => f.bucket === bucket)
      }
      
      if (mediaType === "image") {
        filtered = filtered.filter(f => f.mimeType.startsWith("image/"))
      } else if (mediaType === "video") {
        filtered = filtered.filter(f => f.mimeType.startsWith("video/"))
      }
      
      setStorageFiles(filtered)
      setFilteredFiles(filtered)
    } catch (error: any) {
      notifications.showError({
        title: "Failed to load media",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!fileToDelete) return

    try {
      const { error } = await deleteStorageFile(fileToDelete)
      if (error) throw new Error(error)

      notifications.showSuccess({
        title: "File deleted",
        description: "The file has been deleted from storage",
      })

      setShowDeleteDialog(false)
      setFileToDelete(null)
      
      // Reload files
      loadMediaAssets()
    } catch (error: any) {
      notifications.showError({
        title: "Failed to delete file",
        description: error.message,
      })
      setShowDeleteDialog(false)
      setFileToDelete(null)
    }
  }

  function handleSelect() {
    if (activeTab === "library" && selectedFile) {
      onSelect(selectedFile.publicUrl)
    } else if (activeTab === "url" && urlInput) {
      onSelect(urlInput)
    } else if (activeTab === "upload" && uploadedUrl) {
      onSelect(uploadedUrl)
    }
    onOpenChange(false)
  }

  async function handleUploadComplete(url: string) {
    setUploadedUrl(url)
    
    // Create media asset record
    const filename = url.split("/").pop() || "unknown"
    await createMediaAsset({
      filename,
      bucket,
      storage_path: filename,
      url,
      type: mediaType,
    })

    // Reload assets
    loadMediaAssets()
    
    notifications.showSuccess({
      title: "Upload complete",
      description: "Your file has been uploaded successfully",
    })
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return "Unknown"
    const mb = bytes / (1024 * 1024)
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
    return `${mb.toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload New
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by filename, alt text, or caption..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={loadMediaAssets}
                disabled={isLoading}
              >
                <Loader2 className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-lg font-medium">No media found</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? "Try a different search term"
                    : "Upload your first media file to get started"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-3 gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.name}
                      className={cn(
                        "group relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md",
                        selectedFile?.name === file.name
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedFile(file)}
                    >
                      {/* Image Preview */}
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        {file.mimeType.startsWith("image/") ? (
                          <img
                            src={file.publicUrl}
                            alt={file.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}

                        {/* Selection Indicator */}
                        {selectedFile?.name === file.name && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}

                        {/* Delete Button */}
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFileToDelete(file)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* File Info */}
                      <div className="p-2 space-y-1">
                        <p className="text-xs font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(file.size)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(file.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {file.bucket}
                        </Badge>
                        {file.isTracked && (
                          <Badge variant="secondary" className="text-xs">
                            Tracked
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="border-2 border-dashed rounded-lg p-8">
              <FileUpload
                bucket={bucket}
                currentUrl={uploadedUrl}
                onUpload={handleUploadComplete}
                accept={accept}
                maxSizeMB={maxSizeMB}
              />
            </div>
            {uploadedUrl && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-800">File uploaded successfully!</p>
              </div>
            )}
          </TabsContent>

          {/* URL Tab */}
          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="url-input">Image URL</Label>
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste a direct link to an image hosted elsewhere
              </p>
            </div>
            {urlInput && (
              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <img
                  src={urlInput}
                  alt="Preview"
                  className="max-w-full h-auto rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={
              (activeTab === "library" && !selectedFile) ||
              (activeTab === "url" && !urlInput) ||
              (activeTab === "upload" && !uploadedUrl)
            }
          >
            <Check className="h-4 w-4 mr-2" />
            Select Media
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be
              undone and will permanently remove the file from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
