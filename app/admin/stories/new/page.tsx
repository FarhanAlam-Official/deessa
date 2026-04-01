import { StoryForm } from "@/components/admin/story-form"

export default function NewStoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Story</h1>
        <p className="mt-1 text-muted-foreground">Write and publish a new impact story with the full-width editor workspace.</p>
      </div>

      <StoryForm />
    </div>
  )
}
