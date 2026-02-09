"use client"

import { useEffect, useCallback } from "react"
import { XIcon, ExternalLink, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PodcastVideoModalProps {
  youtubeId: string
  title: string
  onClose: () => void
}

export default function PodcastVideoModal({
  youtubeId,
  title,
  onClose,
}: PodcastVideoModalProps) {
  // Handle escape key to close modal
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [handleEscape])

  // YouTube embed URL with autoplay, fullscreen support, and standard controls
  const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
  const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`

  return (
    <div
      className={cn(
        "fixed inset-0 z-100 flex items-center justify-center",
        "animate-in fade-in duration-300"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`Playing: ${title}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal Content */}
      <div
        className={cn(
          "relative z-10 w-full max-w-5xl mx-4 md:mx-8",
          "animate-in zoom-in-95 duration-300"
        )}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-white font-bold text-lg md:text-xl truncate pr-4">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {/* Watch on YouTube Button */}
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full",
                "bg-brand-primary/90 hover:bg-brand-primary text-white text-sm font-medium",
                "transition-all duration-300 hover:scale-105"
              )}
            >
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline">Watch on YouTube</span>
            </a>

            {/* Fullscreen (opens YouTube) */}
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center justify-center size-10 rounded-full",
                "bg-brand-primary/90 hover:bg-brand-primary text-white",
                "transition-all duration-300 hover:scale-105"
              )}
              aria-label="Open in fullscreen on YouTube"
            >
              <Maximize2 className="size-4" />
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={cn(
                "flex items-center justify-center size-10 rounded-full",
                "bg-white/10 hover:bg-red-500/80 text-white",
                "transition-all duration-300 hover:scale-105"
              )}
              aria-label="Close video"
            >
              <XIcon className="size-5" />
            </button>
          </div>
        </div>

        {/* Video Container with 16:9 Aspect Ratio */}
        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={embedUrl}
              title={title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              frameBorder="0"
            />
          </div>
        </div>

        {/* Helper Text */}
        <p className="text-center text-white/60 text-sm mt-4">
          Press <kbd className="px-2 py-0.5 bg-white/10 rounded text-white/80">Esc</kbd> or click outside to close
        </p>
      </div>
    </div>
  )
}
