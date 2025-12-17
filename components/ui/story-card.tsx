import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface StoryCardProps {
  title: string
  excerpt: string
  image: string
  category: string
  date: string
  readTime: string
  href: string
  className?: string
}

export function StoryCard({ title, excerpt, image, category, date, readTime, href, className }: StoryCardProps) {
  return (
    <Link href={href} className={cn("group flex flex-col gap-4", className)}>
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl shadow-sm">
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-primary uppercase tracking-wider shadow-sm">
          {category}
        </div>
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-xs font-medium text-foreground-muted uppercase tracking-wide">
          <span>{date}</span>
          <span className="size-1 rounded-full bg-gray-300" />
          <span>{readTime}</span>
        </div>
        <h3 className="text-xl font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-foreground-muted text-base leading-relaxed line-clamp-2">{excerpt}</p>
        <div className="mt-2 flex items-center gap-1 text-sm font-bold text-primary">
          Read Story
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}
