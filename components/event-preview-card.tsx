import Link from "next/link"
import Image from "next/image"
import { MapPin, ArrowRight, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface EventPreviewProps {
  event: {
    id: string
    title: string
    slug: string
    description: string
    image: string
    date: { month: string; day: string; full: string }
    time: string
    location: string
    category: string
    type: "upcoming" | "past"
  }
}

const categoryBorder: Record<string, string> = {
  Education: "border-l-sky-500",
  Empowerment: "border-l-pink-500",
  Health: "border-l-green-500",
  Relief: "border-l-orange-500",
}

export function EventPreviewCard({ event }: EventPreviewProps) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex bg-surface rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Date badge */}
      <div className={cn("flex-none w-20 sm:w-24 flex flex-col items-center justify-center bg-muted border-l-4", categoryBorder[event.category] ?? "border-l-primary")}>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">{event.date.month}</span>
        <span className="text-3xl sm:text-4xl font-black text-foreground leading-none">{event.date.day}</span>
      </div>
      {/* Content */}
      <div className="flex-1 p-4 sm:p-5 min-w-0">
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate text-base sm:text-lg">
          {event.title}
        </h3>
        <p className="text-sm text-foreground-muted line-clamp-1 mt-1">{event.description}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-foreground-muted">
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {event.location}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {event.time}
          </span>
        </div>
      </div>
    </Link>
  )
}
