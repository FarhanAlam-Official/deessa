import type React from "react"
import { cn } from "@/lib/utils"

interface SectionProps {
  children: React.ReactNode
  className?: string
  containerClassName?: string
  id?: string
}

export function Section({ children, className, containerClassName, id }: SectionProps) {
  return (
    <section className={cn("py-16 md:py-24", className)} id={id}>
      <div className={cn("max-w-350 mx-auto px-4 md:px-8", containerClassName)}>{children}</div>
    </section>
  )
}
