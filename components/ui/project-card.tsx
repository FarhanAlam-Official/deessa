import Image from "next/image"
import Link from "next/link"
import { MapPin, ArrowRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ProjectCardProps {
  title: string
  description: string
  image: string
  icon: LucideIcon
  iconColor?: string
  location: string
  category: string
  status: "active" | "completed" | "urgent"
  raised?: number
  goal?: number
  metrics?: { label: string; value: string }[]
  href: string
  className?: string
}

export function ProjectCard({
  title,
  description,
  image,
  icon: Icon,
  iconColor = "text-primary",
  location,
  category,
  status,
  raised,
  goal,
  metrics,
  href,
  className,
}: ProjectCardProps) {
  const progress = raised && goal ? Math.round((raised / goal) * 100) : 0

  return (
    <div
      className={cn(
        "group flex flex-col bg-surface rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
        className,
      )}
    >
      <div className="relative h-56 w-full overflow-hidden">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <span className="bg-white/90 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Icon className={cn("size-3.5", iconColor)} /> {category}
          </span>
          {status === "completed" && (
            <span className="bg-green-100/90 backdrop-blur-sm text-green-800 text-xs font-bold px-3 py-1 rounded-full">
              Completed
            </span>
          )}
          {status === "urgent" && (
            <span className="bg-red-100/90 backdrop-blur-sm text-red-800 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              Urgent
            </span>
          )}
        </div>
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>
      <div className="flex flex-col p-5 gap-4 flex-1">
        <div>
          <div className="flex items-center gap-2 text-foreground-muted text-xs font-medium mb-2 uppercase tracking-wide">
            <MapPin className="size-3.5" /> {location}
          </div>
          <h3 className="text-foreground text-xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-foreground-muted text-sm leading-relaxed line-clamp-2">{description}</p>
        </div>
        <div className="mt-auto pt-2">
          {raised && goal ? (
            <>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-foreground font-bold text-lg">{progress}%</span>
                  <span className="text-foreground-muted text-xs ml-1">Funded</span>
                </div>
                <div className="text-right">
                  <span className="text-foreground font-bold text-sm">${goal.toLocaleString()}</span>
                  <span className="text-foreground-muted text-xs ml-1">Goal</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : metrics ? (
            <div className="flex gap-4 pt-2 border-t border-border">
              {metrics.map((metric) => (
                <div key={metric.label} className="flex flex-col">
                  <span className="text-foreground font-bold text-lg">{metric.value}</span>
                  <span className="text-foreground-muted text-xs">{metric.label}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex gap-3 mt-5">
            <Button asChild className="flex-1 rounded-full">
              <Link href={href}>{status === "completed" ? "View Impact" : "Donate"}</Link>
            </Button>
            <Button asChild variant="outline" size="icon" className="rounded-full bg-transparent">
              <Link href={href}>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
