"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export function HeroVideo() {
  const [introComplete, setIntroComplete] = useState(false)
  const [isInView, setIsInView] = useState(true) // Start as true since hero is typically at top
  const videoRef = useRef<HTMLVideoElement>(null)

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
    <video
      ref={videoRef}
      loop
      src="/websiteClip/websiteClip.mp4"
      muted
      playsInline
      preload="auto"
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
    >
      <source src="/websiteClip/websiteClip.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}
