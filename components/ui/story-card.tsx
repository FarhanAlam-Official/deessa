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
    <Link href={href} className={cn("group block h-full", className)}>
      <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white/90 shadow-[0_18px_52px_-35px_rgba(15,23,42,0.38)] transition-transform duration-300 hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            sizes="(min-width: 1024px) 30vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.03)_0%,rgba(3,7,18,0.08)_45%,rgba(3,7,18,0.72)_100%)]" />
          <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur">
            {category}
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{date}</span>
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{readTime}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-xl font-semibold leading-tight text-slate-950 transition-colors duration-300 group-hover:text-primary">
            {title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{excerpt}</p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Read story
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  )
}
