import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get("id")

  if (!videoId || !/^[a-zA-Z0-9_-]{6,16}$/.test(videoId)) {
    return NextResponse.json({ error: "Invalid video ID" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`,
      {
        next: { revalidate: 3600 }, // cache for 1 hour
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: "Video not found" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 })
  }
}
