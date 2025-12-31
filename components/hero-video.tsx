"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Volume2, VolumeX } from "lucide-react"

export function HeroVideo() {
  const [introComplete, setIntroComplete] = useState(false)
  const [isInView, setIsInView] = useState(true) // Start as true since hero is typically at top
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted
      videoRef.current.muted = newMutedState
      setIsMuted(newMutedState)
    }
  }

  useEffect(() => {
    // Check if intro was already shown (skip waiting if it's not showing)
    const introShown = localStorage.getItem("introShown")
    const lastShown = localStorage.getItem("introLastShown")
    const now = Date.now()
    
    // If intro was shown recently (within 2 minutes), skip waiting
    if (introShown && lastShown && now - parseInt(lastShown) <= 2 * 60 * 1000) {
      setIntroComplete(true)
    }

    // Listen for intro animation completion
    const handleIntroComplete = () => {
      setIntroComplete(true)
    }

    window.addEventListener("intro-animation-complete", handleIntroComplete)

    return () => {
      window.removeEventListener("intro-animation-complete", handleIntroComplete)
    }
  }, [])

  // Use Intersection Observer to detect when video is in viewport
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting)
        })
      },
      { threshold: 0.25 } // Video is considered in view when 25% is visible
    )

    observer.observe(videoElement)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Memoize play video function
  const playVideo = useCallback(async () => {
    if (!videoRef.current) return
    
    try {
      await videoRef.current.play()
    } catch (error) {
      // Silently handle autoplay failures - browser policies may prevent autoplay
      if (error instanceof Error && error.name === 'AbortError') {
        // This is expected when browser power-saving features interrupt playback
      }
    }
  }, [])

  // Play video when intro is complete and video is in viewport
  useEffect(() => {
    if (!introComplete || !isInView) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause()
      }
      return
    }

    // Play the video
    playVideo()

    // Retry playback on visibility change or user interaction
    const handleVisibilityChange = () => {
      if (!document.hidden && videoRef.current?.paused && isInView) {
        playVideo()
      }
    }

    const handleUserInteraction = () => {
      if (videoRef.current?.paused && isInView) {
        playVideo()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('click', handleUserInteraction, { once: true })
    window.addEventListener('scroll', handleUserInteraction, { once: true })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('click', handleUserInteraction)
      window.removeEventListener('scroll', handleUserInteraction)
    }
  }, [introComplete, isInView, playVideo])

  return (
    <div className="absolute inset-0 w-full h-full group/video">
      <video
        ref={videoRef}
        autoPlay
        loop
        src="/Deesa-Intro .mp4"
        muted={isMuted}
        playsInline
        preload="auto"
        onClick={toggleMute}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer"
      >
        <source src="/Deesa-Intro .mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Mute/Unmute Button Indicator */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleMute()
        }}
        className="absolute bottom-3 right-3 p-1.5 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all duration-200 z-50 opacity-0 group-hover/video:opacity-100"
        aria-label={isMuted ? "Unmute video" : "Mute video"}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4 text-white/80" />
        ) : (
          <Volume2 className="h-4 w-4 text-white/80" />
        )}
      </button>
    </div>
  )
}
