/**
 * Date Formatting Utilities
 * Provides relative and absolute timestamp formatting
 */

/**
 * Format a date as relative time (e.g., "2 hours ago", "yesterday")
 * Returns null if the input is null or undefined
 */
export function formatRelativeTime(date: string | Date | null | undefined): string | null {
  if (!date) return null

  try {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    const diffWeek = Math.floor(diffDay / 7)
    const diffMonth = Math.floor(diffDay / 30)
    const diffYear = Math.floor(diffDay / 365)

    // Future dates
    if (diffMs < 0) {
      return "in the future"
    }

    // Less than a minute
    if (diffSec < 60) {
      return "just now"
    }

    // Less than an hour
    if (diffMin < 60) {
      return diffMin === 1 ? "1 minute ago" : `${diffMin} minutes ago`
    }

    // Less than a day
    if (diffHour < 24) {
      return diffHour === 1 ? "1 hour ago" : `${diffHour} hours ago`
    }

    // Less than a week
    if (diffDay < 7) {
      if (diffDay === 1) return "yesterday"
      return `${diffDay} days ago`
    }

    // Less than a month
    if (diffWeek < 4) {
      return diffWeek === 1 ? "1 week ago" : `${diffWeek} weeks ago`
    }

    // Less than a year
    if (diffMonth < 12) {
      return diffMonth === 1 ? "1 month ago" : `${diffMonth} months ago`
    }

    // Years
    return diffYear === 1 ? "1 year ago" : `${diffYear} years ago`
  } catch (error) {
    console.error("Error formatting relative time:", error)
    return null
  }
}

/**
 * Format a date as absolute timestamp (e.g., "Jan 15, 2024 at 3:45 PM")
 * Returns null if the input is null or undefined
 */
export function formatAbsoluteTime(date: string | Date | null | undefined): string | null {
  if (!date) return null

  try {
    const d = new Date(date)
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  } catch (error) {
    console.error("Error formatting absolute time:", error)
    return null
  }
}

/**
 * Format a date for display with both relative and absolute time
 * Returns an object with both formats
 */
export function formatTimestamp(date: string | Date | null | undefined): {
  relative: string | null
  absolute: string | null
} {
  return {
    relative: formatRelativeTime(date),
    absolute: formatAbsoluteTime(date),
  }
}

/**
 * Format a date as ISO string for database storage
 */
export function formatForDatabase(date: Date): string {
  return date.toISOString()
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: any): boolean {
  if (!date) return false
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}
