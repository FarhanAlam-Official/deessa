import { EventForm } from "@/components/admin/event-form"

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Event</h1>
        <p className="text-muted-foreground">Add a new event</p>
      </div>

      <EventForm />
    </div>
  )
}
