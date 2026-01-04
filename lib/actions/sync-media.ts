"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentAdmin } from "./admin-auth"

interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: {
    eTag: string
    size: number
    mimetype: string
    cacheControl: string
    lastModified: string
    contentLength: number
    httpStatusCode: number
  }
}

/**
 * Sync existing storage files to media_assets table
 */
export async function syncStorageToMediaAssets(bucketName: string) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: "Unauthorized", synced: 0 }
    }

    const supabase = await createClient()

    // List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list("", {
        limit: 1000,
        sortBy: { column: "created_at", order: "desc" },
      })

    if (listError) {
      console.error("List error:", listError)
      throw listError
    }
    
    if (!files || files.length === 0) {
      return { success: true, error: null, synced: 0, message: "No files found in bucket" }
    }

    console.log(`Found ${files.length} files in ${bucketName}`)

    let syncedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const file of files) {
      try {
        // Skip folders
        if (!file.name || file.name.endsWith("/") || file.id === null) {
          console.log(`Skipping folder/invalid: ${file.name}`)
          continue
        }

        // Check if already exists
        const { data: existing } = await supabase
          .from("media_assets")
          .select("id")
          .eq("bucket", bucketName)
          .eq("storage_path", file.name)
          .single()

        if (existing) {
          console.log(`Already tracked: ${file.name}`)
          skippedCount++
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(file.name)

        console.log(`Processing: ${file.name}, URL: ${urlData.publicUrl}`)

        // Determine file type from mime type or extension
        const mimeType = file.metadata?.mimetype || ""
        const extension = file.name.split('.').pop()?.toLowerCase() || ""
        
        let type: "image" | "video" | "document" = "document"
        if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
          type = "image"
        } else if (mimeType.startsWith("video/") || ["mp4", "webm", "mov", "avi"].includes(extension)) {
          type = "video"
        }

        // Insert into media_assets
        const { error: insertError } = await supabase
          .from("media_assets")
          .insert({
            filename: file.name,
            bucket: bucketName,
            storage_path: file.name,
            url: urlData.publicUrl,
            type,
            mime_type: mimeType || `application/${extension}`,
            size_bytes: file.metadata?.size || 0,
            uploaded_by: admin.id,
            created_at: file.created_at || new Date().toISOString(),
          })

        if (insertError) {
          console.error(`Insert error for ${file.name}:`, insertError)
          errors.push(`${file.name}: ${insertError.message}`)
        } else {
          console.log(`Successfully synced: ${file.name} as ${type}`)
          syncedCount++
        }
      } catch (fileError: any) {
        console.error(`File error for ${file.name}:`, fileError)
        errors.push(`${file.name}: ${fileError.message}`)
      }
    }

    return {
      success: true,
      error: null,
      synced: syncedCount,
      skipped: skippedCount,
      total: files.length,
      errors: errors.length > 0 ? errors : null,
      message: `Synced ${syncedCount} files, skipped ${skippedCount} existing files`,
    }
  } catch (error: any) {
    console.error("Error syncing storage to media assets:", error)
    return {
      success: false,
      error: error.message,
      synced: 0,
    }
  }
}

/**
 * Sync all buckets
 */
export async function syncAllBuckets() {
  const buckets = ["hero-images", "hero-videos", "press-gallery", "site-assets", "og-images"]
  const results = []

  for (const bucket of buckets) {
    const result = await syncStorageToMediaAssets(bucket)
    results.push({ bucket, ...result })
  }

  return {
    success: true,
    results,
    totalSynced: results.reduce((sum, r) => sum + r.synced, 0),
    totalSkipped: results.reduce((sum, r) => sum + (r.skipped || 0), 0),
  }
}
