"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────────
   ScrollReveal – triggers CSS animation when element enters viewport
   ───────────────────────────────────────────────────────────── */
interface ScrollRevealProps {
  children: ReactNode
  className?: string
  animation?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale-in" | "wipe-right" | "none"
  delay?: number
  duration?: number
  threshold?: number
  once?: boolean
}

export function ScrollReveal({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  duration = 700,
  threshold = 0.15,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) obs.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, once])

  const baseStyles: Record<string, string> = {
    "fade-up": "translate-y-8 opacity-0",
    "fade-down": "-translate-y-8 opacity-0",
    "fade-left": "translate-x-8 opacity-0",
    "fade-right": "-translate-x-8 opacity-0",
    "scale-in": "scale-95 opacity-0",
    "wipe-right": "clip-path-hidden",
    "none": "opacity-0",
  }

  const visibleStyles: Record<string, string> = {
    "fade-up": "translate-y-0 opacity-100",
    "fade-down": "translate-y-0 opacity-100",
    "fade-left": "translate-x-0 opacity-100",
    "fade-right": "translate-x-0 opacity-100",
    "scale-in": "scale-100 opacity-100",
    "wipe-right": "clip-path-visible",
    "none": "opacity-100",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all ease-out",
        visible ? visibleStyles[animation] : baseStyles[animation],
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   CountUp – animated number counter triggered on scroll
   ───────────────────────────────────────────────────────────── */
interface CountUpProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}

export function CountUp({ end, suffix = "", prefix = "", duration = 2000, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          obs.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const steps = 60
    const increment = end / steps
    const stepTime = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, stepTime)
    return () => clearInterval(timer)
  }, [started, end, duration])

  return (
    <span ref={ref} className={`font-comic-num ${className || ""}`}>
      {prefix}{started ? count.toLocaleString() : "0"}{suffix}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────
   StaggerChildren – reveals children one-by-one with stagger
   ───────────────────────────────────────────────────────────── */
interface StaggerChildrenProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
  animation?: "fade-up" | "fade-left" | "fade-right" | "scale-in"
}

export function StaggerChildren({
  children,
  className,
  staggerDelay = 150,
  animation = "fade-up",
}: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <ScrollReveal key={i} animation={animation} delay={i * staggerDelay}>
              {child}
            </ScrollReveal>
          ))
        : children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ParallaxImage – subtle parallax on scroll
   ───────────────────────────────────────────────────────────── */
interface ParallaxImageProps {
  children: ReactNode
  className?: string
  speed?: number
}

export function ParallaxImage({ children, className, speed = 0.3 }: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const windowH = window.innerHeight
      const elementCenter = rect.top + rect.height / 2
      const viewportCenter = windowH / 2
      const diff = (elementCenter - viewportCenter) * speed
      setOffset(diff)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed])

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <div style={{ transform: `translateY(${offset}px)` }} className="transition-none">
        {children}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   FloatingParticles – subtle decorative particles
   ───────────────────────────────────────────────────────────── */
export function FloatingParticles({ count = 20, className }: { count?: number; className?: string }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${(i * 37 + 13) % 100}%`,
    top: `${(i * 53 + 7) % 100}%`,
    size: 2 + (i % 3),
    delay: (i * 0.5) % 5,
    duration: 3 + (i % 4),
  }))

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white/20 animate-float-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   WordByWordReveal – staggered word-by-word fade-up animation
   ───────────────────────────────────────────────────────────── */
interface WordByWordRevealProps {
  text: string
  className?: string
  wordClassName?: string
  staggerMs?: number
  active?: boolean
}

export function WordByWordReveal({
  text,
  className,
  wordClassName,
  staggerMs = 80,
  active = true,
}: WordByWordRevealProps) {
  const words = text.split(" ")
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className={cn(
            "inline-block transition-all ease-out",
            active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            wordClassName,
          )}
          style={{
            transitionDuration: "500ms",
            transitionDelay: active ? `${i * staggerMs + 200}ms` : "0ms",
          }}
        >
          {word}&nbsp;
        </span>
      ))}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────
   ScrollProgressBar – thin bar at top of page
   ───────────────────────────────────────────────────────────── */
export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[9999] bg-transparent pointer-events-none">
      <div
        className="h-full bg-primary transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   BackToTop – floating button after scrolling 300px
   ───────────────────────────────────────────────────────────── */
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-primary/90 hover:scale-110",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
      )}
      aria-label="Back to top"
    >
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}
