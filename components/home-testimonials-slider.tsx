"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface Testimonial {
  name: string
  role: string
  quote: string
  avatar: string
  backgroundImage: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    name: "Dipak Tharu",
    role: "Parent",
    quote:
      "I am excited about the youthful voice that is here — the young professionals who are coming at this with real zeal and passion and information.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=85",
    backgroundImage:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1920&q=80",
    rating: 5,
  },
  {
    name: "Sarita Maharjan",
    role: "Parent",
    quote:
      "Deessa has given my daughter the confidence to dream bigger. The support, love, and guidance she receives has transformed our entire family.",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=85",
    backgroundImage:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1920&q=80",
    rating: 5,
  },
  {
    name: "Ramesh Shrestha",
    role: "Community Leader",
    quote:
      "The health camps changed everything for our village. Now we have regular checkups and our children are healthier and happier than ever before.",
    avatar:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=200&q=85",
    backgroundImage:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1920&q=80",
    rating: 5,
  },
  {
    name: "Anita Gurung",
    role: "Volunteer",
    quote:
      "Being part of Deessa's mission has been a life-changing experience. I have seen firsthand how dedicated the team is to every single community they serve.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=85",
    backgroundImage:
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1920&q=80",
    rating: 5,
  },
]

export function HomeTestimonialsSlider() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<"left" | "right">("right")

  const go = useCallback(
    (index: number, dir: "left" | "right") => {
      if (animating) return
      setDirection(dir)
      setAnimating(true)
      setTimeout(() => {
        setCurrent(index)
        setAnimating(false)
      }, 400)
    },
    [animating],
  )

  const prev = () => go((current - 1 + testimonials.length) % testimonials.length, "left")
  const next = useCallback(() => go((current + 1) % testimonials.length, "right"), [current, go])

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [next])

  const t = testimonials[current]

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background images — crossfade */}
      {testimonials.map((item, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === current ? "opacity-100" : "opacity-0",
          )}
        >
          <Image
            src={item.backgroundImage}
            alt=""
            fill
            className="object-cover"
            priority={i === 0}
          />
          <div className="absolute inset-0 bg-black/45" />
        </div>
      ))}

      {/* Large decorative quotation mark */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[5] pointer-events-none select-none">
        <span className="text-[12rem] md:text-[16rem] leading-none font-serif text-white/[0.05]">&ldquo;</span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-14 md:py-20">
        {/* Label */}
        <span className="text-white/70 text-xs font-bold tracking-[0.35em] uppercase mb-8 block">
          Real Stories
        </span>
        <h2 className="text-white text-3xl md:text-4xl font-black tracking-widest uppercase mb-12 text-center">
          Testimonials
        </h2>

        {/* Slide content — crossfade with vertical slide */}
        <div
          className={cn(
            "flex flex-col items-center w-full max-w-3xl transition-all duration-400 ease-out",
            animating
              ? direction === "right"
                ? "opacity-0 translate-y-4"
                : "opacity-0 -translate-y-4"
              : "opacity-100 translate-y-0",
          )}
        >
          {/* Circular avatar with glowing ring */}
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl animate-avatar-glow">
              <Image
                src={t.avatar}
                alt={t.name}
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* Quote box */}
          <div className="w-full bg-black/55 backdrop-blur-sm px-8 py-8 mb-6">
            <p className="text-white text-base md:text-lg leading-relaxed text-center italic font-light">
              &ldquo;{t.quote}&rdquo;
            </p>
          </div>

          {/* Star ratings */}
          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} className="size-4 text-amber-400 fill-amber-400" />
            ))}
          </div>

          {/* Name & role */}
          <p className="text-white font-black tracking-widest uppercase text-sm md:text-base">
            {t.name}
          </p>
          <p className="text-white/60 text-xs tracking-wider uppercase mt-1">{t.role}</p>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-4 mt-12">
          <button
            onClick={prev}
            className="w-12 h-12 bg-white/20 hover:bg-white/35 backdrop-blur-sm border border-white/30 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="size-5" />
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i, i > current ? "right" : "left")}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === current
                    ? "w-6 h-2 bg-white"
                    : "w-2 h-2 bg-white/40 hover:bg-white/70",
                )}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-12 h-12 bg-white/20 hover:bg-white/35 backdrop-blur-sm border border-white/30 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Next testimonial"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
