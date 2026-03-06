import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the application base URL for server-side operations
 * Automatically detects the correct URL in different environments:
 * - Production/Preview: Uses VERCEL_URL or configured environment variables
 * - Development: Falls back to localhost
 * 
 * @returns The base URL with protocol (e.g., https://your-domain.com)
 */
export function getAppBaseUrl(): string {
  // Priority 1: Explicitly configured app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Priority 2: Explicitly configured site URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // Priority 3: Vercel deployment URL (automatically available in Vercel)
  if (process.env.VERCEL_URL) {
    // VERCEL_URL doesn't include protocol, add https://
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Priority 4: Development fallback
  return 'http://localhost:3000'
}
