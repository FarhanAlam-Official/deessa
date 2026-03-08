"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { GraduationCap, Users, MapPin, Percent, Heart, Stethoscope } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  GraduationCap,
  Users,
  MapPin,
  Percent,
  Heart,
  Stethoscope,
}

interface StatItem {
  value: number
  suffix: string
  label: string
  icon: string
  color: string
}

interface ImpactCounterProps {
  stats: StatItem[]
}

function AnimatedNumber({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 2000
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * target)
      setCount(current)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [inView, target])

  return (
    <span className="tabular-nums font-comic-num">
      {inView ? count.toLocaleString() : "0"}
      {suffix}
    </span>
  )
}

export function ImpactCounter({ stats }: ImpactCounterProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="bg-linear-to-r from-background via-muted/50 to-background py-10 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, i) => {
            const Icon = iconMap[stat.icon] ?? GraduationCap
            return (
              <div
                key={stat.label}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl transition-all duration-500",
                  inView ? "animate-fade-in-up" : "opacity-0",
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={cn("shrink-0 w-12 h-12 rounded-xl flex items-center justify-center", stat.color)}>
                  <Icon className="size-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-none">
                    <AnimatedNumber target={stat.value} suffix={stat.suffix} inView={inView} />
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-foreground-muted uppercase tracking-wider mt-1">
                    {stat.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
