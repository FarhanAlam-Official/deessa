import { StoryForm } from "@/components/admin/story-form"

export default function NewStoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Story</h1>
        <p className="text-muted-foreground">Write a new news or impact story</p>
      </div>

      <StoryForm />
    </div>
  )
}
