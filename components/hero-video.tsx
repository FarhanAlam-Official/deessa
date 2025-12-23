"use client"

import { useEffect, useRef, useState } from "react"

export function HeroVideo() {
  const [introComplete, setIntroComplete] = useState(false)
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

  // Play video when intro is complete
  useEffect(() => {
    if (introComplete && videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Video autoplay failed:", error)
      })
    }
  }, [introComplete])

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
