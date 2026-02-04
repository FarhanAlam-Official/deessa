"use client"

import { useState, useRef, useEffect } from "react"
import { Headphones, ChevronLeft, ChevronRight } from "lucide-react"
import { PodcastCard } from "@/components/podcast-card"
import { PodcastVideoModal } from "@/components/podcast-video-modal"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Episode data - Living With Autism podcast series from deessa Foundation YouTube
const mainEpisodes = [
  {
    id: 1,
    title: "Living With Autism – Episode 1",
    description:
      "An intimate conversation exploring the daily experiences, challenges, and beautiful moments of living with autism. Hear directly from individuals and families sharing their authentic stories.",
    thumbnail: "https://img.youtube.com/vi/_3sg3XmjChU/maxresdefault.jpg",
    duration: "24:15",
    episode: 1,
    youtubeId: "_3sg3XmjChU",
  },
  {
    id: 2,
    title: "Living With Autism – Episode 2",
    description:
      "Continuing our journey into autism awareness, this episode features new perspectives on communication, sensory experiences, and building understanding in communities.",
    thumbnail: "https://img.youtube.com/vi/P5sl39_iatQ/maxresdefault.jpg",
    duration: "28:42",
    episode: 2,
    youtubeId: "P5sl39_iatQ",
  },
  {
    id: 3,
    title: "Living With Autism – Episode 3",
    description:
      "Our latest episode dives deep into support systems, educational approaches, and celebrating neurodiversity. Stories of resilience, growth, and hope.",
    thumbnail: "https://img.youtube.com/vi/95y79LR13Rk/maxresdefault.jpg",
    duration: "31:08",
    episode: 3,
    youtubeId: "95y79LR13Rk",
  },
]

// Teaser/additional videos
const teaserVideos = [
  {
    id: 4,
    title: "Living With Autism – Episode 1 Teaser",
    description: "A sneak peek into Episode 1 of our autism awareness series.",
    thumbnail: "https://img.youtube.com/vi/er9_Y4_gyk8/maxresdefault.jpg",
    duration: "1:30",
    episode: 1,
    youtubeId: "er9_Y4_gyk8",
  },
  {
    id: 5,
    title: "Living With Autism – Episode 2 Teaser",
    description: "Preview of Episode 2 exploring new perspectives on autism.",
    thumbnail: "https://img.youtube.com/vi/oHmRPg5ohkY/hqdefault.jpg",
    duration: "1:25",
    episode: 2,
    youtubeId: "oHmRPg5ohkY",
  },
  {
    id: 6,
    title: "Living With Autism – Episode 3 Teaser",
    description: "Coming soon - a glimpse into Episode 3 of our series.",
    thumbnail: "https://img.youtube.com/vi/2NA9nd5AD-U/maxresdefault.jpg",
    duration: "1:20",
    episode: 3,
    youtubeId: "2NA9nd5AD-U",
  },
]

export function PodcastSection({ className }: { className?: string }) {
  const [activeVideo, setActiveVideo] = useState<{
    youtubeId: string
    title: string
  } | null>(null)
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

  const handlePlayVideo = (youtubeId: string, title: string) => {
    setActiveVideo({ youtubeId, title })
  }

  const handleCloseModal = () => {
    setActiveVideo(null)
  }

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

  return (
    <>
      <section
        ref={sectionRef}
        className={cn(
          "py-16 md:py-24 bg-linear-to-b from-muted/50 to-background",
          className
        )}
      >
        <div className="max-w-350 mx-auto px-4 md:px-8">
          {/* Section Header */}
          <div
            className={cn(
              "flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 transition-all duration-700",
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            )}
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 flex items-center justify-center bg-primary/10 rounded-xl text-primary">
                  <Headphones className="size-5" />
                </div>
                <span className="text-primary font-bold uppercase tracking-wider text-sm">
                  Podcast & Videos
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
                Living With Autism
              </h2>
              <p className="text-foreground-muted mt-3 max-w-xl text-lg leading-relaxed">
                Authentic stories, expert insights, and community voices
                exploring the beautiful spectrum of autism.
              </p>
            </div>

            <a
              href="https://www.youtube.com/@deessafoundation"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-full",
                "bg-transparent border-2 border-primary/30 text-primary font-semibold text-sm",
                "hover:bg-primary hover:text-white hover:border-primary",
                "transition-all duration-300"
              )}
            >
              View All on YouTube
            </a>
          </div>

          {/* Main Episodes Grid */}
          <div
            className={cn(
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12",
              "transition-all duration-700 delay-150",
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            )}
          >
            {mainEpisodes.map((episode, index) => (
              <div
                key={episode.id}
                className="transition-all duration-500"
                style={{
                  transitionDelay: isVisible ? `${200 + index * 100}ms` : "0ms",
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(20px)",
                }}
              >
                <PodcastCard
                  title={episode.title}
                  description={episode.description}
                  thumbnail={episode.thumbnail}
                  duration={episode.duration}
                  episode={episode.episode}
                  youtubeId={episode.youtubeId}
                  onPlay={(id) => handlePlayVideo(id, episode.title)}
                  variant="primary"
                />
              </div>
            ))}
          </div>

          {/* Teaser Videos Carousel (if teasers available and more than shown) */}
          {teaserVideos.length > 0 && (
            <div
              className={cn(
                "transition-all duration-700 delay-300",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">
                  Teasers & Highlights
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-full"
                    onClick={() => scrollTeaser("left")}
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-full"
                    onClick={() => scrollTeaser("right")}
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {teaserVideos.map((video) => (
                  <div
                    key={video.id}
                    className="shrink-0 w-72 snap-start"
                  >
                    <PodcastCard
                      title={video.title}
                      description={video.description}
                      thumbnail={video.thumbnail}
                      duration={video.duration}
                      episode={video.episode}
                      youtubeId={video.youtubeId}
                      onPlay={(id) => handlePlayVideo(id, video.title)}
                      variant="secondary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supportive Message */}
          <div
            className={cn(
              "mt-16 relative overflow-hidden",
              "transition-all duration-700 delay-500",
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            )}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-primary" />
              <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full bg-primary" />
              <div className="absolute top-1/2 right-8 w-16 h-16 rounded-full bg-primary" />
            </div>
            
            <div className="relative bg-gradient-to-br from-primary/8 via-primary/5 to-transparent p-8 md:p-12 rounded-4xl border border-primary/10">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center justify-center size-16 bg-primary/10 rounded-2xl mb-6">
                  <Headphones className="size-8 text-primary" />
                </div>
                
                <blockquote className="text-xl md:text-2xl font-bold text-foreground mb-4 leading-relaxed">
                  <span className="text-primary">&ldquo;</span>
                  Every voice matters.
                  <span className="text-primary">&rdquo;</span>
                </blockquote>
                
                <p className="text-foreground-muted text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                  Our podcast series shares real stories from individuals and
                  families, fostering understanding, acceptance, and celebration of
                  neurodiversity. Each episode brings authentic voices to the forefront
                  of autism awareness.
                </p>
                
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="https://www.youtube.com/@deessafoundation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 px-6 py-3 rounded-full",
                      "bg-primary text-white font-semibold text-sm shadow-lg",
                      "hover:bg-primary/90 hover:shadow-xl hover:scale-105",
                      "transition-all duration-300"
                    )}
                  >
                    Subscribe for Updates
                  </a>
                  
                  <span className="text-foreground-muted text-sm flex items-center gap-2">
                    <div className="size-2 bg-green-500 rounded-full animate-pulse" />
                    New episodes released monthly
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {activeVideo && (
        <PodcastVideoModal
          isOpen={!!activeVideo}
          onClose={handleCloseModal}
          youtubeId={activeVideo.youtubeId}
          title={activeVideo.title}
        />
      )}
    </>
  )
}

// Export episode data for use elsewhere
export { mainEpisodes, teaserVideos }
