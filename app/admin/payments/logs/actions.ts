"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Clear old payment logs
 */
export async function clearOldLogs(daysOld: number = 90) {
  try {
    const supabase = await createClient()
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from("payment_events")
      .delete()
      .lt("created_at", cutoffDate)
      .select("id")

    if (error) {
      return {
        success: false,
        message: error.message,
        deleted: 0,
      }
    }

    return {
      success: true,
      message: "Logs cleared successfully",
      deleted: data?.length || 0,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      deleted: 0,
    }
  }
}

/**
 * Export logs to CSV
 */
export async function exportLogs(filters?: { provider?: string; dateFrom?: string; dateTo?: string }) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("payment_events")
      .select("*, donations(id, donor_name, donor_email, amount, currency)")
      .order("created_at", { ascending: false })
      .limit(1000) // Limit to 1000 for export

    if (filters?.provider) {
      query = query.eq("provider", filters.provider)
    }

    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo)
    }

    const { data, error } = await query

    if (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      }
    }

    return {
      success: true,
      message: "Logs exported successfully",
      data: data || [],
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null,
    }
  }
}
