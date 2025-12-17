import Image from "next/image"
import Link from "next/link"
import { Clock, MapPin, Share2, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EventCardProps {
  title: string
  description: string
  image: string
  date: { month: string; day: string }
  time: string
  location: string
  category: string
  verified?: boolean
  href: string
  variant?: "primary" | "secondary"
  className?: string
}

export function EventCard({
  title,
  description,
  image,
  date,
  time,
  location,
  category,
  verified = true,
  href,
  variant = "primary",
  className,
}: EventCardProps) {
  return (
    <article
      className={cn(
        "group bg-surface rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col md:flex-row",
        className,
      )}
    >
      <div className="md:w-72 h-48 md:h-auto relative shrink-0 overflow-hidden">
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-2 flex flex-col items-center justify-center min-w-[60px] shadow-lg z-10">
          <span className="text-primary font-bold text-xs uppercase tracking-wider">{date.month}</span>
          <span className="text-gray-900 font-black text-2xl leading-none">{date.day}</span>
        </div>
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-6 flex flex-col flex-1 justify-center">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{category}</span>
              {verified && (
                <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="size-3.5 fill-current" /> Verified
                </span>
              )}
            </div>
            <h3 className="text-foreground text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-foreground-muted text-sm line-clamp-2">{description}</p>
          </div>
          <button className="hidden md:flex size-10 rounded-full bg-gray-50 items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
            <Share2 className="size-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-4 md:gap-8 border-t border-border pt-4 mt-auto items-center">
          <div className="flex items-center gap-2 text-foreground-muted">
            <Clock className="size-4 text-primary" />
            <span className="text-sm font-medium">{time}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground-muted">
            <MapPin className="size-4 text-primary" />
            <span className="text-sm font-medium">{location}</span>
          </div>
          <div className="md:ml-auto w-full md:w-auto mt-4 md:mt-0">
            <Button
              asChild
              className="w-full md:w-auto rounded-full"
              variant={variant === "primary" ? "default" : "outline"}
            >
              <Link href={href}>{variant === "primary" ? "Register Now" : "Volunteer"}</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
