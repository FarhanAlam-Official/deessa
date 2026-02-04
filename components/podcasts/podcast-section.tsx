"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Headphones, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { PodcastCard } from "./podcast-card"
import PodcastVideoModal from "./podcast-video-modal"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Podcast } from "@/lib/types/podcast"

interface PodcastSectionProps {
  podcasts: Podcast[]
  className?: string
}

export default function PodcastSection({ podcasts, className }: PodcastSectionProps) {
  const mainEpisodes = podcasts.slice(0, 3)
  const teaserVideos = podcasts.slice(3, 6)
  
  const [activePodcast, setActivePodcast] = useState<Podcast | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Scroll handlers for teaser carousel
  const scrollTeaser = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  if (podcasts.length === 0) {
    return null
  }

  return (
    <>
      <section
        ref={sectionRef}
        className={cn(
          "py-16 md:py-24 bg-gradient-to-b from-bg-soft to-white relative overflow-hidden",
          className
        )}
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent-education/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          {/* Section Header */}
          <div
            className={cn(
              "text-center mb-12 transition-all duration-700",
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            )}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary mb-4">
              <Headphones className="size-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Podcast Series
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-text-main mb-4">
              Living With Autism
            </h2>

            <p className="text-lg text-text-muted max-w-2xl mx-auto mb-8">
              Real voices, real stories. Join us for intimate conversations about autism,
              neurodiversity, and building inclusive communities.
            </p>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
            >
              <Link href="/podcasts">
                View All Episodes
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Main Episodes Grid */}
          <div
            className={cn(
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 transition-all duration-1000 delay-300",
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
            )}
          >
            {mainEpisodes.map((podcast, index) => (
              <div
                key={podcast.id}
                className={cn(
                  "transition-all duration-700",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12"
                )}
                style={{
                  transitionDelay: `${300 + index * 150}ms`,
                }}
              >
                <PodcastCard
                  podcast={podcast}
                  variant="primary"
                  showTopics
                  onPlay={setActivePodcast}
                />
              </div>
            ))}
          </div>

          {/* Teaser Videos Carousel */}
          {teaserVideos.length > 0 && (
            <div
              className={cn(
                "transition-all duration-1000 delay-700",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-heading font-bold text-text-main">
                  More Episodes
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollTeaser("left")}
                    className="size-10 rounded-full bg-white border border-border hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-300 flex items-center justify-center"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    onClick={() => scrollTeaser("right")}
                    className="size-10 rounded-full bg-white border border-border hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-300 flex items-center justify-center"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </div>

              <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {teaserVideos.map((podcast) => (
                  <div
                    key={podcast.id}
                    className="flex-shrink-0 w-80 snap-start"
                  >
                    <PodcastCard
                      podcast={podcast}
                      variant="secondary"
                      onPlay={setActivePodcast}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support Message Card */}
          <div
            className={cn(
              "mt-16 bg-gradient-ocean rounded-2xl p-8 md:p-12 text-center transition-all duration-1000 delay-1000",
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
            )}
          >
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4">
              Support Our Podcast Mission
            </h3>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Your support helps us create more content and programs that make a real
              difference in the autism community.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-brand-primary hover:bg-white/90 font-semibold"
            >
              <Link href="/donate">
                Donate Now
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {activePodcast && (
        <PodcastVideoModal
          youtubeId={activePodcast.youtubeId}
          title={activePodcast.title}
          onClose={() => setActivePodcast(null)}
        />
      )}
    </>
  )
}
