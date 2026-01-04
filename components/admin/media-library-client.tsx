"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Image as ImageIcon,
  Video,
  FileText,
  Search,
  Filter,
  Trash2,
  Download,
  MoreVertical,
  Upload,
  Loader2,
  HardDrive,
  Calendar,
  Eye,
  Copy,
  Check,
  RefreshCw,
  Grid3x3,
  List,
  ImagePlus,
} from "lucide-react"
import {
  getMediaAssets,
  deleteMediaAsset,
  permanentlyDeleteMediaAsset,
  bulkDeleteMediaAssets,
  getMediaLibraryStats,
} from "@/lib/actions/media"
import {
  browseAllBuckets,
  trackStorageFile,
  deleteStorageFile,
  type StorageFile,
} from "@/lib/actions/storage-browser"
import { syncAllBuckets } from "@/lib/actions/sync-media"
import { notifications } from "@/lib/notifications"
import type { MediaAsset, MediaType, MediaLibraryStats } from "@/lib/types/media"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { MediaPicker } from "./media-picker"

export function MediaLibraryClient() {
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<StorageFile[]>([])
  const [stats, setStats] = useState<MediaLibraryStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<MediaType | "all">("all")
  const [selectedBucket, setSelectedBucket] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [fileToDelete, setFileToDelete] = useState<StorageFile | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [showSyncDialog, setShowSyncDialog] = useState(false)
  const [groupByBucket, setGroupByBucket] = useState(false)

  // Get unique buckets
  const buckets = Array.from(new Set(storageFiles.map((f) => f.bucket)))

  // Group files by bucket
  const groupedFiles = filteredFiles.reduce((acc, file) => {
    if (!acc[file.bucket]) acc[file.bucket] = []
    acc[file.bucket].push(file)
    return acc
  }, {} as Record<string, StorageFile[]>)

  useEffect(() => {
    loadStorageFiles()
    loadStats()
  }, [])

  useEffect(() => {
    filterFiles()
  }, [searchTerm, selectedType, selectedBucket, storageFiles])

  async function loadStorageFiles() {
    setIsLoading(true)
    try {
      const { data, error } = await browseAllBuckets()
      if (error) throw new Error(error)
      setStorageFiles(data || [])
    } catch (error: any) {
      notifications.showError({
        title: "Failed to load files",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function loadStats() {
    try {
      const { data, error } = await getMediaLibraryStats()
      if (error) throw new Error(error)
      setStats(data)
    } catch (error: any) {
      console.error("Failed to load stats:", error)
    }
  }

  function filterFiles() {
    let filtered = [...storageFiles]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((file) =>
        file.name.toLowerCase().includes(term)
      )
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((file) => {
        if (selectedType === "image") return file.mimeType.startsWith("image/")
        if (selectedType === "video") return file.mimeType.startsWith("video/")
        return true
      })
    }

    if (selectedBucket !== "all") {
      filtered = filtered.filter((file) => file.bucket === selectedBucket)
    }

    setFilteredFiles(filtered)
  }

  async function handleDelete(file: StorageFile) {
    try {
      const { error } = await deleteStorageFile(file)

      if (error) throw new Error(error)

      notifications.showSuccess({
        title: "File deleted",
        description: "The file has been permanently deleted from storage",
      })

      loadStorageFiles()
      loadStats()
    } catch (error: any) {
      notifications.showError({
        title: "Failed to delete file",
        description: error.message,
      })
    } finally {
      setShowDeleteDialog(false)
      setFileToDelete(null)
    }
  }

  async function handleBulkDelete() {
    try {
      const filesToDelete = Array.from(selectedFiles).map(name => 
        storageFiles.find(f => f.name === name)
      ).filter(Boolean) as StorageFile[]

      for (const file of filesToDelete) {
        await deleteStorageFile(file)
      }

      notifications.showSuccess({
        title: "Files deleted",
        description: `${selectedFiles.size} files deleted successfully`,
      })

      setSelectedFiles(new Set())
      setShowBulkDeleteDialog(false)
      loadStorageFiles()
      loadStats()
    } catch (error: any) {
      notifications.showError({
        title: "Failed to delete files",
        description: error.message,
      })
      setShowBulkDeleteDialog(false)
    }
  }

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    notifications.showSuccess({
      title: "URL copied",
      description: "Media URL copied to clipboard",
    })
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return "Unknown"
    const mb = bytes / (1024 * 1024)
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
    return `${mb.toFixed(1)} MB`
  }

  function toggleFileSelection(name: string) {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(name)) {
      newSelection.delete(name)
    } else {
      newSelection.add(name)
    }
    setSelectedFiles(newSelection)
  }

  async function handleSyncStorage() {
    setIsSyncing(true)
    setShowSyncDialog(false)
    try {
      const result = await syncAllBuckets()
      
      notifications.showSuccess({
        title: "Storage synced",
        description: `Synced ${result.totalSynced} files, skipped ${result.totalSkipped} existing files`,
      })

      // Reload to show updated tracked status
      await loadStorageFiles()
      await loadStats()
    } catch (error: any) {
      notifications.showError({
        title: "Sync failed",
        description: error.message,
      })
    } finally {
      setIsSyncing(false)
    }
  }

  async function handleTrackFile(file: StorageFile) {
    try {
      const { error } = await trackStorageFile(file)
      if (error) throw new Error(error)

      notifications.showSuccess({
        title: "File tracked",
        description: `${file.name} is now tracked in media library`,
      })

      loadStorageFiles()
    } catch (error: any) {
      notifications.showError({
        title: "Failed to track file",
        description: error.message,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Media Library</h1>
            <p className="text-muted-foreground">Manage all your uploaded media files</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSyncDialog(true)}
            disabled={isSyncing || isLoading}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Storage
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={loadStorageFiles}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button onClick={() => setShowMediaPicker(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                {stats.images_count}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Video className="h-5 w-5 text-purple-600" />
                {stats.videos_count}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                {stats.documents_count}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatFileSize(stats.total_size_bytes)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by filename, alt text, or caption..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedType} onValueChange={(v: any) => setSelectedType(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedBucket} onValueChange={setSelectedBucket}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Bucket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buckets</SelectItem>
                {buckets.map((bucket) => (
                  <SelectItem key={bucket} value={bucket}>
                    {bucket}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              {selectedBucket === "all" && filteredFiles.length > 0 && (
                <Button
                  variant={groupByBucket ? "default" : "outline"}
                  size="icon"
                  onClick={() => setGroupByBucket(!groupByBucket)}
                  title="Group by bucket"
                >
                  <HardDrive className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {selectedFiles.size > 0 && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium">
                {selectedFiles.size} selected
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowBulkDeleteDialog(true)}
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFiles(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImagePlus className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No files found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || selectedType !== "all" || selectedBucket !== "all"
                ? "Try adjusting your filters"
                : "Upload your first file to get started"}
            </p>
            <Button onClick={() => setShowMediaPicker(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        groupByBucket && selectedBucket === "all" ? (
          <div className="space-y-8">
            {Object.entries(groupedFiles).map(([bucket, files]) => (
              <div key={bucket} className="space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold capitalize">{bucket.replace(/-/g, " ")}</h3>
                  <Badge variant="secondary">{files.length}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {files.map((file) => (
                    <Card
                      key={file.name}
                      className={cn(
                        "group relative overflow-hidden transition-all hover:shadow-lg",
                        selectedFiles.has(file.name) && "ring-2 ring-primary"
                      )}
                    >
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        {file.mimeType.startsWith("image/") ? (
                          <img
                            src={file.publicUrl}
                            alt={file.name}
                            className="object-cover w-full h-full transition-transform group-hover:scale-105"
                          />
                        ) : file.mimeType.startsWith("video/") ? (
                          <div className="flex items-center justify-center h-full bg-purple-100">
                            <Video className="h-12 w-12 text-purple-600" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full bg-green-100">
                            <FileText className="h-12 w-12 text-green-600" />
                          </div>
                        )}

                        {/* Selection Overlay */}
                        <div
                          className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={() => toggleFileSelection(file.name)}
                        >
                          <div className="absolute top-2 left-2">
                            <div
                              className={cn(
                                "w-5 h-5 border-2 rounded flex items-center justify-center",
                                selectedFiles.has(file.name)
                                  ? "bg-primary border-primary"
                                  : "bg-white border-white"
                              )}
                            >
                              {selectedFiles.has(file.name) && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="secondary" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyUrl(file.publicUrl, file.name)}>
                                {copiedId === file.name ? (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy URL
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(file.publicUrl, "_blank")}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Full Size
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setFileToDelete(file)
                                  setShowDeleteDialog(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Type Badge */}
                        <div className="absolute bottom-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            {file.mimeType.startsWith("image/") ? "image" : file.mimeType.startsWith("video/") ? "video" : "document"}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-3 space-y-1">
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(file.size)}
                          </span>
                          <span>{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</span>
                        </div>
                        {file.isTracked && (
                          <Badge variant="outline" className="text-xs">
                            Tracked
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <Card
              key={file.name}
              className={cn(
                "group relative overflow-hidden transition-all hover:shadow-lg",
                selectedFiles.has(file.name) && "ring-2 ring-primary"
              )}
            >
              <div className="aspect-video bg-muted relative overflow-hidden">
                {file.mimeType.startsWith("image/") ? (
                  <img
                    src={file.publicUrl}
                    alt={file.name}
                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  />
                ) : file.mimeType.startsWith("video/") ? (
                  <div className="flex items-center justify-center h-full bg-purple-100">
                    <Video className="h-12 w-12 text-purple-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-green-100">
                    <FileText className="h-12 w-12 text-green-600" />
                  </div>
                )}

                {/* Selection Overlay */}
                <div
                  className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => toggleFileSelection(file.name)}
                >
                  <div className="absolute top-2 left-2">
                    <div
                      className={cn(
                        "w-5 h-5 border-2 rounded flex items-center justify-center",
                        selectedFiles.has(file.name)
                          ? "bg-primary border-primary"
                          : "bg-white border-white"
                      )}
                    >
                      {selectedFiles.has(file.name) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => copyUrl(file.publicUrl, file.name)}>
                        {copiedId === file.name ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(file.publicUrl, "_blank")}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Size
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setFileToDelete(file)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Type Badge */}
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    {file.mimeType.startsWith("image/") ? "image" : file.mimeType.startsWith("video/") ? "video" : "document"}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-3 space-y-1">
                <p className="text-sm font-medium truncate" title={file.name}>
                  {file.name}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatFileSize(file.size)}
                  </span>
                  <span>{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</span>
                </div>
                {file.isTracked && (
                  <Badge variant="outline" className="text-xs">
                    Tracked
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        )
      ) : (
        groupByBucket && selectedBucket === "all" ? (
          <div className="space-y-6">
            {Object.entries(groupedFiles).map(([bucket, files]) => (
              <Card key={bucket}>
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base capitalize">{bucket.replace(/-/g, " ")}</CardTitle>
                    <Badge variant="secondary">{files.length} files</Badge>
                  </div>
                </CardHeader>
                <ScrollArea className="max-h-[400px]">
                  <div className="divide-y">
                    {files.map((file) => (
                      <div
                        key={file.name}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className={cn(
                            "w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer",
                            selectedFiles.has(file.name)
                              ? "bg-primary border-primary"
                              : "border-border"
                          )}
                          onClick={() => toggleFileSelection(file.name)}
                        >
                          {selectedFiles.has(file.name) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>

                        <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                          {file.mimeType.startsWith("image/") ? (
                            <img
                              src={file.publicUrl}
                              alt={file.name}
                              className="object-cover w-full h-full"
                            />
                          ) : file.mimeType.startsWith("video/") ? (
                            <div className="flex items-center justify-center h-full bg-purple-100">
                              <Video className="h-6 w-6 text-purple-600" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full bg-green-100">
                              <FileText className="h-6 w-6 text-green-600" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {formatFileSize(file.size)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(file.createdAt), "MMM d, yyyy")}
                            </span>
                            {file.isTracked && (
                              <Badge variant="outline" className="text-xs">
                                Tracked
                              </Badge>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => copyUrl(file.publicUrl, file.name)}>
                              {copiedId === file.name ? (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy URL
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(file.publicUrl, "_blank")}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Full Size
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setFileToDelete(file)
                                setShowDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
          <ScrollArea className="h-[600px]">
            <div className="divide-y">
              {filteredFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={cn(
                      "w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer",
                      selectedFiles.has(file.name)
                        ? "bg-primary border-primary"
                        : "border-border"
                    )}
                    onClick={() => toggleFileSelection(file.name)}
                  >
                    {selectedFiles.has(file.name) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>

                  <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                    {file.mimeType.startsWith("image/") ? (
                      <img
                        src={file.publicUrl}
                        alt={file.name}
                        className="object-cover w-full h-full"
                      />
                    ) : file.mimeType.startsWith("video/") ? (
                      <div className="flex items-center justify-center h-full bg-purple-100">
                        <Video className="h-6 w-6 text-purple-600" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-green-100">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatFileSize(file.size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(file.createdAt), "MMM d, yyyy")}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {file.bucket}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyUrl(file.publicUrl, file.name)}
                    >
                      {copiedId === file.name ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setFileToDelete(file)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
        )
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Storage File?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"?
              {fileToDelete && fileToDelete.isTracked && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This file is tracked in the media library. Deleting it will remove it from storage permanently.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && handleDelete(fileToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Files?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedFiles.size} selected file{selectedFiles.size !== 1 ? 's' : ''}?
              <span className="block mt-2 text-muted-foreground">
                This action will permanently delete the files from storage.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedFiles.size} File{selectedFiles.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sync Storage Confirmation Dialog */}
      <AlertDialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync Storage Buckets?</AlertDialogTitle>
            <AlertDialogDescription>
              This will scan all storage buckets and add any files that aren't already tracked in the media library.
              <span className="block mt-3 text-muted-foreground">
                <strong>Buckets to scan:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>hero-images</li>
                  <li>hero-videos</li>
                  <li>press-gallery</li>
                  <li>site-assets</li>
                  <li>og-images</li>
                </ul>
              </span>
              <span className="block mt-3 text-muted-foreground">
                Files already tracked will be skipped. This is safe to run multiple times.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSyncStorage}>
              Sync Storage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Media Picker for Upload */}
      <MediaPicker
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={() => {
          loadStorageFiles()
          loadStats()
        }}
      />
    </div>
  )
}
