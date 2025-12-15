import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

// Next.js 16+ expects either a default export or a named `proxy` export
// for the proxy entry point. We simply forward to your existing
// `updateSession` helper so behavior stays the same as before.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ["/admin/:path*"],
}
