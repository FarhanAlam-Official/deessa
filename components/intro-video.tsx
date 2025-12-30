"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

export function IntroVideo() {
  const [showIntro, setShowIntro] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [animateLogo, setAnimateLogo] = useState(false)
  const [fadeBackground, setFadeBackground] = useState(false)
  const [logoStyle, setLogoStyle] = useState<React.CSSProperties>({})
  const [isBrave, setIsBrave] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  // Detect Brave browser
  useEffect(() => {
    const checkBrave = async () => {
      if ((navigator as any).brave && await (navigator as any).brave.isBrave()) {
        setIsBrave(true)
      }
    }
    checkBrave()
  }, [])

  useEffect(() => {
    // Check if intro has been shown (using localStorage to persist across sessions)
    const introShown = localStorage.getItem("introShown")
    const lastShown = localStorage.getItem("introLastShown")
    const now = Date.now()
    
    // Show intro if never shown, or if it's been more than 2 minutes
    if (!introShown || (lastShown && now - parseInt(lastShown) > 2 * 60 * 1000)) {
      setShowIntro(true)
    }
  }, [])

  useEffect(() => {
    if (showIntro && videoRef.current && !userInteracted) {
      const video = videoRef.current
      
      // Always start muted to satisfy browser autoplay policies
      video.muted = true
      
      // Ensure video is ready to play
      video.load()
      
      // Try to play the video
      const playPromise = video.play()
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Video started playing successfully
            console.log('Video autoplay started (muted)')
          })
          .catch((error) => {
            console.error("Video autoplay failed:", error)
          })
      }
    }
  }, [showIntro, userInteracted])

  // Handle user click to play video (for non-Brave browsers)
  const handlePlayClick = () => {
    if (videoRef.current && !userInteracted) {
      const video = videoRef.current
      video.muted = true // Keep muted for other browsers
      video.play().then(() => {
        setUserInteracted(true)
        console.log('Video started after user interaction')
      }).catch(err => console.error('Play failed:', err))
    }
  }

  // Handle any click to start video or enable sound
  const handleContainerClick = (e: React.MouseEvent) => {
    if (!userInteracted && videoRef.current) {
      // First click: restart the video with proper audio settings
      const video = videoRef.current
      const currentTime = video.currentTime // Save current position
      
      // Unmute the video - user interaction allows sound in all browsers
      video.muted = false
      
      // Restart from current position with new audio settings
      video.currentTime = currentTime
      video.play().then(() => {
        setUserInteracted(true)
        setSoundEnabled(true)
        console.log('Video playing with sound after user interaction')
      }).catch(err => {
        console.error('Play with audio failed:', err)
        // Fallback: try muted
        video.muted = true
        video.play().then(() => {
          setUserInteracted(true)
          console.log('Video playing muted (audio failed)')
        }).catch(err2 => console.error('Fallback play failed:', err2))
      })
    }
  }

  const handleVideoEnd = () => {
    setVideoEnded(true)
    
    // Small delay to ensure layout is stable and logo is rendered
    setTimeout(() => {
      // Calculate navbar logo position
      const navbarLogo = document.querySelector('[data-navbar-logo]') as HTMLElement
      const navbarLogoImg = navbarLogo?.querySelector('img') as HTMLImageElement
      
      if (navbarLogo && logoRef.current) {
        // Get the actual rendered size of navbar logo image
        const navbarImgRect = navbarLogoImg?.getBoundingClientRect() || navbarLogo.getBoundingClientRect()
        const navbarRect = navbarLogo.getBoundingClientRect()
        const logoRect = logoRef.current.getBoundingClientRect()
        
        // Calculate exact positions - align centers
        const navbarCenterX = navbarRect.left + navbarRect.width / 2
        const navbarCenterY = navbarRect.top + navbarRect.height / 2
        const logoCenterX = logoRect.left + logoRect.width / 2
        const logoCenterY = logoRect.top + logoRect.height / 2
        
        // Calculate the delta to move the logo center to navbar center
        const deltaX = navbarCenterX - logoCenterX
        const deltaY = navbarCenterY - logoCenterY
        
        // Calculate scale based on actual navbar logo image size
        const targetWidth = navbarImgRect.width || 48
        const targetHeight = navbarImgRect.height || 48
        const currentWidth = logoRect.width
        const currentHeight = logoRect.height
        
        // Scale to match navbar logo size exactly
        const scaleX = targetWidth / currentWidth
        const scaleY = targetHeight / currentHeight
        // Use the smaller scale to maintain aspect ratio
        const scale = Math.min(scaleX, scaleY)

        setLogoStyle({
          transform: `translate(${deltaX}px, ${deltaY}px) scale(${scale})`,
          transformOrigin: "center center",
        })
      }
      
      // Trigger animation on next frame for smoother transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Hide navbar logo when flying animation starts
          window.dispatchEvent(new CustomEvent("intro-logo-flying"))
          
          setAnimateLogo(true)
          
          // Wait for logo animation to complete (1800ms), then fade background and show navbar logo
          setTimeout(() => {
            setFadeBackground(true)
            // Show navbar logo when flying logo reaches destination
            window.dispatchEvent(new CustomEvent("intro-logo-landed"))
            // Notify that intro animation is complete and page content can start
            window.dispatchEvent(new CustomEvent("intro-animation-complete"))
          }, 1800)
        })
      })
      
      // After animation completes, hide intro and mark as shown
      setTimeout(() => {
        localStorage.setItem("introShown", "true")
        localStorage.setItem("introLastShown", Date.now().toString())
        setShowIntro(false)
      }, 2800) // Animation (1800ms) + fade (1000ms)
    }, 300)
  }

  if (!showIntro) return null

  return (
    <div 
      className={`fixed inset-0 z-[100] transition-opacity duration-1000 ease-out cursor-pointer ${
        fadeBackground ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      onClick={handleContainerClick}
    >
      {/* Subtle text prompt - show before interaction */}
      {!userInteracted && !videoEnded && (
        <div
          className="absolute top-4 right-4 z-10 text-black/30 hover:text-black/50 text-[10px] uppercase tracking-wider transition-colors duration-300 pointer-events-none"
        >
          Click for sound
        </div>
      )}

      {/* Video Background - fades when logo starts flying */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-700 ease-out ${
          animateLogo ? "opacity-0" : "opacity-100"
        }`}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          onEnded={handleVideoEnd}
          playsInline
          autoPlay
          muted
          preload="auto"
          webkit-playsinline="true"
        >
          <source src="/Deesa-Intro .mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Logo overlay - shown at end of video */}
      {videoEnded && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            ref={logoRef}
            className={`relative will-change-transform ${
              animateLogo 
                ? "transition-all duration-[1800ms] ease-out" 
                : "scale-100 opacity-100"
            }`}
            style={animateLogo ? logoStyle : { transformOrigin: "center center" }}
          >
            <Image
              src="/logo.png"
              alt="deessa Foundation Logo"
              width={900}
              height={900}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      )}
    </div>
  )
}

