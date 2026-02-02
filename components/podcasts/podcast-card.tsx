"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Play, ExternalLink, Clock, Video, Youtube } from "lucide-react"
import { cn } from "@/lib/utils"
import { Podcast } from "@/lib/types/podcast"

interface PodcastCardProps {
  podcast: Podcast
  variant?: "primary" | "secondary"
  showTopics?: boolean
  onPlay?: (podcast: Podcast) => void
  className?: string
}

export function PodcastCard({
  podcast,
  variant = "primary",
  showTopics = false,
  onPlay,
  className,
}: PodcastCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const isPrimary = variant === "primary"
  const formatIcon = podcast.format === 'video' ? Video : Music

  return (
    <Link
      href={`/podcasts/${podcast.slug}`}
      className={cn(
        "group relative flex flex-col rounded-xl overflow-hidden bg-white border border-border/40 shadow-lg transition-all duration-500 ease-out",
        "hover:shadow-2xl hover:shadow-brand-primary/20 hover:border-brand-primary/50 hover:-translate-y-1.5 hover:scale-[1.02]",
        isPrimary ? "h-full" : "h-auto",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail Container - Video Focused */}
      <div className="relative overflow-hidden aspect-video bg-gray-900">
        {/* Episode Badge */}
        {podcast.episodeNumber && (
          <div className="absolute top-3 left-3 z-20">
            <span className="bg-brand-primary text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider shadow-lg">
              EP {podcast.episodeNumber}
            </span>
          </div>
        )}

        {/* Duration Badge - Top Right */}
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded text-xs font-semibold">
            {podcast.duration} min
          </span>
        </div>

        {/* Thumbnail Image */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-500",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}>
          <Image
            src={podcast.thumbnailUrl}
            alt={podcast.title}
            fill
            className={cn(
              "object-cover transition-transform duration-700 ease-out",
              isHovered && "scale-110"
            )}
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Loading Placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-bg-soft animate-pulse" />
        )}

        {/* Play Button Overlay */}
        <button
          onClick={(e) => {
            e.preventDefault()
            onPlay?.(podcast)
          }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all"
          aria-label={`Play ${podcast.title}`}
        >
          <div
            className={cn(
              "w-14 h-14 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform",
              isHovered && "scale-110"
            )}
          >
            <Play className="w-6 h-6 md:w-7 md:h-7 text-brand-primary ml-0.5" fill="currentColor" />
          </div>
        </button>

        {/* Gradient Overlay - Subtle */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className={cn(
        "flex flex-col grow p-5 md:p-6",
        isPrimary ? "gap-3" : "gap-2"
      )}>
        {/* Topics */}
        {showTopics && podcast.topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {podcast.topics.slice(0, 2).map((topic) => (
              <span
                key={topic}
                className="inline-block px-2 py-1 text-xs font-medium text-brand-primary rounded"
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        <h3 
          className={cn(
            "font-heading font-bold text-text-main leading-tight transition-colors duration-300 group-hover:text-brand-primary",
            isPrimary ? "text-lg md:text-xl" : "text-base"
          )}
        >
          {podcast.title}
        </h3>

        {isPrimary && (
          <p className="text-text-muted text-sm md:text-base leading-relaxed line-clamp-2">
            {podcast.description}
          </p>
        )}

        {/* Actions */}
        <div className={cn(
          "flex items-center gap-3 mt-auto pt-2 border-t border-border/30",
          isPrimary ? "pt-4" : "pt-3"
        )}>
          <div className={cn(
            "flex items-center gap-2 font-semibold text-white bg-brand-primary px-3 py-1.5 rounded-lg transition-all duration-300",
            "group-hover:bg-brand-primary-dark group-hover:gap-3 group-hover:shadow-md",
            isPrimary ? "text-xs" : "text-xs"
          )}>
            <Play className="size-3.5" fill="currentColor" />
            Watch Episode
          </div>

          <a
            href={`https://www.youtube.com/watch?v=${podcast.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1.5 text-text-muted transition-all duration-300 hover:text-red-600 hover:scale-105",
              isPrimary ? "text-sm" : "text-xs"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Youtube className="size-4" />
            <span className="font-medium">View on YouTube</span>
          </a>
        </div>
      </div>
    </Link>
  )
}

