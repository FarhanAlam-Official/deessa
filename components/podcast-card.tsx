"use client"

import { useState } from "react"
import Image from "next/image"
import { Play, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface PodcastCardProps {
  title: string
  description: string
  thumbnail: string
  duration: string
  episode: number
  youtubeId: string
  onPlay: (youtubeId: string) => void
  variant?: "primary" | "secondary"
  className?: string
}

export function PodcastCard({
  title,
  description,
  thumbnail,
  duration,
  episode,
  youtubeId,
  onPlay,
  variant = "primary",
  className,
}: PodcastCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const isPrimary = variant === "primary"

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-3xl overflow-hidden bg-background border border-border/50 shadow-sm transition-all duration-500 ease-out",
        "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-1",
        isPrimary ? "h-full" : "h-auto",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail Container */}
      <div className={cn(
        "relative overflow-hidden",
        isPrimary ? "aspect-video" : "aspect-video"
      )}>
        {/* Episode Badge */}
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-primary/95 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
            Episode {episode}
          </span>
        </div>

        {/* Duration Badge */}
        <div className="absolute top-4 right-4 z-20">
          <span className="bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium">
            {duration}
          </span>
        </div>

        {/* Thumbnail Image */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-500",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}>
          <Image
            src={thumbnail}
            alt={title}
            fill
            className={cn(
              "object-cover transition-transform duration-700 ease-out",
              isHovered && "scale-105"
            )}
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Loading Placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}

        {/* Play Button Overlay */}
        <button
          onClick={() => onPlay(youtubeId)}
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center bg-black/30 transition-all duration-300",
            isHovered ? "bg-black/40" : "bg-black/20"
          )}
          aria-label={`Play ${title}`}
        >
          <div
            className={cn(
              "flex items-center justify-center size-16 md:size-20 rounded-full bg-white/95 shadow-2xl transition-all duration-300 ease-out",
              isHovered && "scale-110 bg-white"
            )}
          >
            <Play
              className={cn(
                "size-7 md:size-8 text-primary ml-1 transition-transform duration-300",
                isHovered && "scale-110"
              )}
              fill="currentColor"
            />
          </div>
        </button>

        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className={cn(
        "flex flex-col grow p-5 md:p-6",
        isPrimary ? "gap-3" : "gap-2"
      )}>
        <h3 className={cn(
          "font-bold text-foreground leading-tight transition-colors duration-300 group-hover:text-primary",
          isPrimary ? "text-lg md:text-xl" : "text-base"
        )}>
          {title}
        </h3>

        {isPrimary && (
          <p className="text-foreground-muted text-sm md:text-base leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {/* Actions */}
        <div className={cn(
          "flex items-center gap-3 mt-auto",
          isPrimary ? "pt-3" : "pt-2"
        )}>
          <button
            onClick={() => onPlay(youtubeId)}
            className={cn(
              "flex items-center gap-2 font-semibold text-primary transition-all duration-300",
              "hover:gap-3",
              isPrimary ? "text-sm" : "text-xs"
            )}
          >
            <Play className="size-4" fill="currentColor" />
            Watch Now
          </button>

          <span className="text-border">•</span>

          <a
            href={`https://www.youtube.com/watch?v=${youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1.5 text-foreground-muted transition-colors duration-300 hover:text-primary",
              isPrimary ? "text-sm" : "text-xs"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="size-3.5" />
            YouTube
          </a>
        </div>
      </div>
    </div>
  )
}
