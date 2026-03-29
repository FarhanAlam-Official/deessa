"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FloatingParticles, WordByWordReveal } from "@/components/scroll-animations"

export interface HeroSlide {
  image: string
  title: string
  subtitle: string
  cta: string
  ctaHref: string
  ctaVariant?: "primary" | "secondary"
}

interface HeroCarouselProps {
  slides: HeroSlide[]
  interval?: number
}

export function HeroCarousel({ slides, interval = 6000 }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [parallaxY, setParallaxY] = useState(0)

  const goTo = useCallback(
    (index: number, dir?: "next" | "prev") => {
      setDirection(dir ?? (index > current ? "next" : "prev"))
      setCurrent(index)
    },
    [current],
  )

  const next = useCallback(() => {
    goTo((current + 1) % slides.length, "next")
  }, [current, slides.length, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length, "prev")
  }, [current, slides.length, goTo])

  // Auto-advance
  useEffect(() => {
    if (isPaused) return
    timerRef.current = setInterval(next, interval)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, next, interval])

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setParallaxY(scrollY * 0.3)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    },
    [next, prev],
  )

  return (
    <section
      ref={sectionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured campaigns"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative w-full h-130 sm:h-145 lg:h-162 overflow-hidden bg-foreground"
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${slides.length}: ${slide.title}`}
          aria-hidden={i !== current}
          className={cn(
            "absolute inset-0 transition-all duration-700 ease-in-out",
            i === current ? "opacity-100 z-10" : "opacity-0 z-0",
          )}
        >
          {/* Background image with Ken Burns + parallax */}
          <div
            className="absolute inset-0"
            style={{ transform: `translateY(${parallaxY}px)` }}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              className={cn(
                "object-cover",
                i === current && "animate-kenburns",
              )}
              priority={i === 0}
              sizes="100vw"
            />
          </div>
          {/* Gradient overlay — bottom-left dark fading to transparent right */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Floating particles */}
          <FloatingParticles count={15} className="z-[5]" />

          {/* Content */}
          <div className="relative z-10 h-full flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-2xl">
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.08] tracking-tight mb-6 text-balance font-comic"
                >
                  <WordByWordReveal
                    text={slide.title}
                    active={i === current}
                    staggerMs={80}
                  />
                </h1>
                <p
                  className={cn(
                    "text-lg sm:text-xl text-white/85 leading-relaxed mb-8 max-w-lg font-marissa",
                    "transition-all duration-700 delay-200",
                    i === current ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
                  )}
                >
                  {slide.subtitle}
                </p>
                <div
                  className={cn(
                    "transition-all duration-700 delay-300",
                    i === current ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
                  )}
                >
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full h-14 px-8 text-base font-bold shadow-xl animate-cta-ripple"
                  >
                    <Link href={slide.ctaHref}>{slide.cta}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Arrow navigation */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100 sm:opacity-60"
        aria-label="Previous slide"
      >
        <ChevronLeft className="size-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100 sm:opacity-60"
        aria-label="Next slide"
      >
        <ChevronRight className="size-6" />
      </button>

      {/* Scroll indicator — animated bouncing arrow */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-scroll-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 rounded-full bg-white/70" />
        </div>
      </div>

      {/* Bottom controls: dots + pause */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === current ? "true" : undefined}
            className={cn(
              "rounded-full transition-all duration-300",
              i === current
                ? "w-8 h-3 bg-white"
                : "w-3 h-3 bg-white/40 hover:bg-white/70",
            )}
          />
        ))}
        <button
          onClick={() => setIsPaused((p) => !p)}
          aria-label={isPaused ? "Play carousel" : "Pause carousel"}
          className="ml-2 w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
        </button>
      </div>

      {/* Live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {current + 1} of {slides.length}: {slides[current]?.title}
      </div>
    </section>
  )
}
