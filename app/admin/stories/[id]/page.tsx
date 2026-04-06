import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { StoryForm } from "@/components/admin/story-form"

async function getStory(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("stories").select("*").eq("id", id).single()

  if (error) return null
  return data
}

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const story = await getStory(id)

  if (!story) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/stories"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Stories
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Story</h1>
        <p className="mt-1 text-muted-foreground">Update {story.title} in the expanded writing workspace.</p>
      </div>

      <StoryForm story={story} />
    </div>
  )
}
