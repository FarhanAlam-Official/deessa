"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentAdmin } from "./admin-auth"

export interface StorageFile {
  name: string
  bucket: string
  size: number
  mimeType: string
  createdAt: string
  publicUrl: string
  isTracked: boolean // Whether it exists in media_assets table
  assetId?: string // If tracked, the media_asset id
}

/**
 * Get mime type from file extension
 */
function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ""
  
  // Images
  if (["jpg", "jpeg"].includes(ext)) return "image/jpeg"
  if (ext === "png") return "image/png"
  if (ext === "gif") return "image/gif"
  if (ext === "webp") return "image/webp"
  if (ext === "svg") return "image/svg+xml"
  if (ext === "ico") return "image/x-icon"
  if (ext === "bmp") return "image/bmp"
  if (ext === "tiff" || ext === "tif") return "image/tiff"
  
  // Videos
  if (ext === "mp4") return "video/mp4"
  if (ext === "webm") return "video/webm"
  if (ext === "mov") return "video/quicktime"
  if (ext === "avi") return "video/x-msvideo"
  if (ext === "mkv") return "video/x-matroska"
  if (ext === "flv") return "video/x-flv"
  if (ext === "wmv") return "video/x-ms-wmv"
  
  // Documents
  if (ext === "pdf") return "application/pdf"
  if (ext === "doc") return "application/msword"
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  if (ext === "xls") return "application/vnd.ms-excel"
  if (ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  if (ext === "ppt") return "application/vnd.ms-powerpoint"
  if (ext === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  if (ext === "txt") return "text/plain"
  if (ext === "csv") return "text/csv"
  if (ext === "json") return "application/json"
  if (ext === "xml") return "application/xml"
  
  // Audio
  if (ext === "mp3") return "audio/mpeg"
  if (ext === "wav") return "audio/wav"
  if (ext === "ogg") return "audio/ogg"
  if (ext === "m4a") return "audio/mp4"
  
  // Default
  return "application/octet-stream"
}

/**
 * Recursively list all files in a folder
 */
async function listFilesRecursive(
  supabase: any,
  bucketName: string,
  folderPath: string = ""
): Promise<any[]> {
  const allFiles: any[] = []

  const { data: items, error } = await supabase.storage
    .from(bucketName)
    .list(folderPath, {
      limit: 1000,
      sortBy: { column: "created_at", order: "desc" },
    })

  if (error) {
    console.error(`Error listing ${bucketName}/${folderPath}:`, error)
    return allFiles
  }

  if (!items || items.length === 0) {
    return allFiles
  }

  for (const item of items) {
    // Skip the current folder reference
    if (!item.name || item.name === ".") continue

    const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name

    // If it's a folder (has id === null or name ends with /), recurse into it
    if (item.id === null || item.name.endsWith("/")) {
      const subFiles = await listFilesRecursive(supabase, bucketName, fullPath.replace(/\/$/, ""))
      allFiles.push(...subFiles)
    } else {
      // It's a file, add it with its full path
      allFiles.push({
        ...item,
        fullPath: fullPath,
      })
    }
  }

  return allFiles
}

/**
 * Browse files directly from storage buckets
 */
export async function browseStorageBucket(bucketName: string) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { data: null, error: "Unauthorized" }
    }

    const supabase = await createClient()

    console.log(`[Storage Browser] Scanning bucket: ${bucketName}`)

    // List all files recursively
    const files = await listFilesRecursive(supabase, bucketName)

    console.log(`[Storage Browser] Found ${files.length} files in ${bucketName}`)

    if (!files || files.length === 0) {
      return { data: [], error: null }
    }

    // Process each file
    const filePromises = files.map(async (file) => {
      const filePath = file.fullPath || file.name

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      // Check if this file is tracked in media_assets
      const { data: asset } = await supabase
        .from("media_assets")
        .select("id")
        .eq("bucket", bucketName)
        .eq("storage_path", filePath)
        .eq("is_deleted", false)
        .maybeSingle()

      // Determine mime type from extension since storage API doesn't provide it reliably
      const mimeType = getMimeTypeFromExtension(filePath)

      const storageFile: StorageFile = {
        name: filePath,
        bucket: bucketName,
        size: file.metadata?.size || 0,
        mimeType: mimeType,
        createdAt: file.created_at,
        publicUrl: urlData.publicUrl,
        isTracked: !!asset,
        assetId: asset?.id,
      }

      return storageFile
    })

    const storageFiles = await Promise.all(filePromises)

    console.log(
      `[Storage Browser] Processed ${storageFiles.length} files from ${bucketName}:`,
      storageFiles.map((f) => ({ name: f.name, mime: f.mimeType, tracked: f.isTracked }))
    )

    return { data: storageFiles, error: null }
  } catch (error: any) {
    console.error("Error browsing storage bucket:", error)
    return { data: null, error: error.message }
  }
}

/**
 * Browse all buckets
 */
export async function browseAllBuckets() {
  const buckets = ["hero-images", "hero-videos", "press-gallery", "site-assets", "og-images"]
  const allFiles: StorageFile[] = []

  console.log("[Storage Browser] Starting scan of all buckets...")

  for (const bucket of buckets) {
    const { data, error } = await browseStorageBucket(bucket)
    if (data) {
      allFiles.push(...data)
      console.log(`[Storage Browser] Added ${data.length} files from ${bucket}`)
    } else if (error) {
      console.error(`[Storage Browser] Error in bucket ${bucket}:`, error)
    }
  }

  console.log(`[Storage Browser] Total files found: ${allFiles.length}`)
  console.log(
    "[Storage Browser] Files by type:",
    allFiles.reduce(
      (acc, f) => {
        if (f.mimeType.startsWith("image/")) acc.images++
        else if (f.mimeType.startsWith("video/")) acc.videos++
        else acc.documents++
        return acc
      },
      { images: 0, videos: 0, documents: 0 }
    )
  )

  return { data: allFiles, error: null }
}

/**
 * Track a storage file in media_assets table
 */
export async function trackStorageFile(file: StorageFile) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: "Unauthorized" }
    }

    const supabase = await createClient()

    // Determine file type
    let type: "image" | "video" | "document" = "document"
    if (file.mimeType.startsWith("image/")) type = "image"
    else if (file.mimeType.startsWith("video/")) type = "video"

    // Insert into media_assets
    const { data, error } = await supabase
      .from("media_assets")
      .insert({
        filename: file.name,
        bucket: file.bucket,
        storage_path: file.name,
        url: file.publicUrl,
        type,
        mime_type: file.mimeType,
        size_bytes: file.size,
        uploaded_by: admin.id,
        created_at: file.createdAt,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, error: null, data }
  } catch (error: any) {
    console.error("Error tracking storage file:", error)
    return { success: false, error: error.message, data: null }
  }
}

/**
 * Delete file from storage and media_assets
 */
export async function deleteStorageFile(file: StorageFile) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: "Unauthorized" }
    }

    const supabase = await createClient()

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(file.bucket)
      .remove([file.name])

    if (storageError) throw storageError

    // If tracked, delete from media_assets
    if (file.isTracked && file.assetId) {
      const { error: dbError } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", file.assetId)

      if (dbError) throw dbError
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error deleting storage file:", error)
    return { success: false, error: error.message }
  }
}
