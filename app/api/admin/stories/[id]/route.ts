import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = await params

    const isPublished =
      typeof body.is_published === "boolean"
        ? body.is_published
        : typeof body.published === "boolean"
          ? body.published
          : undefined

    if (isPublished === undefined) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      is_published: isPublished,
    }

    if (isPublished) {
      const { data: existing, error: existingError } = await supabase
        .from("stories")
        .select("published_at")
        .eq("id", id)
        .single()

      if (existingError) {
        return NextResponse.json({ error: existingError.message }, { status: 500 })
      }

      if (!existing?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from("stories")
      .update(updateData)
      .eq("id", id)
      .select("id, is_published")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidatePath("/admin/stories")
    revalidatePath("/stories")

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase.from("stories").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidatePath("/admin/stories")
    revalidatePath("/stories")

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
