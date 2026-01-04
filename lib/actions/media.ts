"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentAdmin } from "./admin-auth"
import type {
  MediaAsset,
  CreateMediaAssetInput,
  UpdateMediaAssetInput,
  MediaLibraryFilters,
  MediaLibraryStats,
  MediaUsageLocation,
} from "@/lib/types/media"

/**
 * Get all media assets with optional filtering
 */
export async function getMediaAssets(
  filters?: MediaLibraryFilters
): Promise<{ data: MediaAsset[] | null; error: string | null }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { data: null, error: "Unauthorized" }
    }

    const supabase = await createClient()
    let query = supabase
      .from("media_assets")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })

    // Apply filters
    if (filters?.type) {
      query = query.eq("type", filters.type)
    }
    if (filters?.bucket) {
      query = query.eq("bucket", filters.bucket)
    }
    if (filters?.search) {
      query = query.or(
        `filename.ilike.%${filters.search}%,alt_text.ilike.%${filters.search}%,caption.ilike.%${filters.search}%`
      )
    }
    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return { data: data as MediaAsset[], error: null }
  } catch (error: any) {
    console.error("Error fetching media assets:", error)
    return { data: null, error: error.message }
  }
}

/**
 * Get a single media asset by ID
 */
export async function getMediaAsset(
  id: string
): Promise<{ data: MediaAsset | null; error: string | null }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { data: null, error: "Unauthorized" }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single()

    if (error) throw error

    return { data: data as MediaAsset, error: null }
  } catch (error: any) {
    console.error("Error fetching media asset:", error)
    return { data: null, error: error.message }
  }
}

/**
 * Create a new media asset record
 */
export async function createMediaAsset(
  input: CreateMediaAssetInput
): Promise<{ data: MediaAsset | null; error: string | null }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { data: null, error: "Unauthorized" }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("media_assets")
      .insert({
        ...input,
        uploaded_by: admin.id,
        usage_locations: [],
      })
      .select()
      .single()

    if (error) throw error

    return { data: data as MediaAsset, error: null }
  } catch (error: any) {
    console.error("Error creating media asset:", error)
    return { data: null, error: error.message }
  }
}

/**
 * Update a media asset
 */
export async function updateMediaAsset(
  id: string,
  input: UpdateMediaAssetInput
): Promise<{ data: MediaAsset | null; error: string | null }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { data: null, error: "Unauthorized" }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("media_assets")
      .update(input)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return { data: data as MediaAsset, error: null }
  } catch (error: any) {
    console.error("Error updating media asset:", error)
    return { data: null, error: error.message }
  }
}

/**
 * Soft delete a media asset
 */
export async function deleteMediaAsset(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: "Unauthorized" }
    }

    const supabase = await createClient()
    
    // Soft delete by setting is_deleted to true
    const { error } = await supabase
      .from("media_assets")
      .update({ is_deleted: true })
      .eq("id", id)

    if (error) throw error

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error deleting media asset:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Permanently delete a media asset and its file from storage
 */
export async function permanentlyDeleteMediaAsset(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: "Unauthorized" }
    }

    const supabase = await createClient()
    
    // First get the asset details
    const { data: asset, error: fetchError } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError
    if (!asset) throw new Error("Asset not found")

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(asset.bucket)
      .remove([asset.storage_path])

    if (storageError) {
      console.error("Error deleting from storage:", storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("media_assets")
      .delete()
      .eq("id", id)

    if (deleteError) throw deleteError

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error permanently deleting media asset:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Bulk delete media assets
 */
export async function bulkDeleteMediaAssets(
  ids: string[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: "Unauthorized" }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("media_assets")
      .update({ is_deleted: true })
      .in("id", ids)

    if (error) throw error

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error bulk deleting media assets:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Update media asset usage locations
 */
export async function updateMediaUsage(
  id: string,
  usageLocations: MediaUsageLocation[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: "Unauthorized" }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("media_assets")
      .update({ usage_locations: usageLocations })
      .eq("id", id)

    if (error) throw error

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error updating media usage:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get media library statistics
 */
export async function getMediaLibraryStats(): Promise<{
  data: MediaLibraryStats | null
  error: string | null
}> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { data: null, error: "Unauthorized" }
    }

    const supabase = await createClient()
    
    // Get all media assets
    const { data: assets, error } = await supabase
      .from("media_assets")
      .select("type, size_bytes")
      .eq("is_deleted", false)

    if (error) throw error

    const stats: MediaLibraryStats = {
      total_count: assets?.length || 0,
      total_size_bytes: assets?.reduce((sum, a) => sum + (a.size_bytes || 0), 0) || 0,
      images_count: assets?.filter((a) => a.type === "image").length || 0,
      videos_count: assets?.filter((a) => a.type === "video").length || 0,
      documents_count: assets?.filter((a) => a.type === "document").length || 0,
    }

    return { data: stats, error: null }
  } catch (error: any) {
    console.error("Error fetching media library stats:", error)
    return { data: null, error: error.message }
  }
}

/**
 * Search media assets
 */
export async function searchMediaAssets(
  searchTerm: string
): Promise<{ data: MediaAsset[] | null; error: string | null }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { data: null, error: "Unauthorized" }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .eq("is_deleted", false)
      .or(
        `filename.ilike.%${searchTerm}%,alt_text.ilike.%${searchTerm}%,caption.ilike.%${searchTerm}%`
      )
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error

    return { data: data as MediaAsset[], error: null }
  } catch (error: any) {
    console.error("Error searching media assets:", error)
    return { data: null, error: error.message }
  }
}

/**
 * Get media assets by bucket
 */
export async function getMediaAssetsByBucket(
  bucket: string
): Promise<{ data: MediaAsset[] | null; error: string | null }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { data: null, error: "Unauthorized" }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .eq("bucket", bucket)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { data: data as MediaAsset[], error: null }
  } catch (error: any) {
    console.error("Error fetching media assets by bucket:", error)
    return { data: null, error: error.message }
  }
}
