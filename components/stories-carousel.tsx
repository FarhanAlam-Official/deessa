"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Story {
  id: string
  title: string
  slug: string
  excerpt: string
  image: string
  category: string
  date: string
  readTime: string
}

interface StoriesCarouselProps {
  stories: Story[]
}

const categoryColors: Record<string, string> = {
  Education: "bg-sky-500",
  Relief: "bg-orange-500",
  Health: "bg-green-500",
  Empowerment: "bg-pink-500",
  Infrastructure: "bg-indigo-500",
  Events: "bg-amber-500",
}

export function StoriesCarousel({ stories }: StoriesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", updateScrollState, { passive: true })
    updateScrollState()
    return () => el.removeEventListener("scroll", updateScrollState)
  }, [updateScrollState])

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.7
    el.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" })
  }

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <span className="text-primary font-bold uppercase tracking-wider text-sm mb-2 block">Real Stories</span>
            <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
              Impact Stories
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-border bg-surface text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Scroll stories left"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-border bg-surface text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Scroll stories right"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Scrollable cards */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-4 px-4"
          role="list"
        >
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.slug}`}
              role="listitem"
              className="group flex-none w-75 sm:w-85 lg:w-95 snap-start"
            >
              <div className="bg-surface rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={story.image}
                    alt={story.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 300px, (max-width: 1024px) 340px, 380px"
                  />
                  <span
                    className={cn(
                      "absolute top-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-full",
                      categoryColors[story.category] ?? "bg-primary",
                    )}
                  >
                    {story.category}
                  </span>
                </div>
                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs text-foreground-muted mb-3">
                    <span>{story.date}</span>
                    <span className="w-1 h-1 rounded-full bg-foreground-muted" />
                    <span>{story.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-sm text-foreground-muted leading-relaxed line-clamp-2 flex-1">
                    {story.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1 text-primary font-bold text-sm mt-4 group-hover:gap-2 transition-all">
                    Read Story <ArrowRight className="size-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
