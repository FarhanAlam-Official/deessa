"use client"

import { cn } from "@/lib/utils"

interface Partner {
  name: string
  color: string
}

interface PartnerStripProps {
  partners: Partner[]
}

export function PartnerStrip({ partners }: PartnerStripProps) {
  const doubled = [...partners, ...partners]

  return (
    <section className="py-12 bg-muted border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-foreground-muted">
          Our Partners <span className="text-foreground-muted/60 normal-case italic">&</span> Supporters
        </p>
      </div>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-muted to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-muted to-transparent z-10 pointer-events-none" />
        {/* Scrolling track */}
        <div
          className="flex items-center gap-8 animate-marquee"
          style={{ width: "max-content" }}
          aria-hidden="true"
        >
          {doubled.map((partner, i) => (
            <div
              key={`${partner.name}-${i}`}
              className="flex-none flex items-center gap-3 px-5 py-3 rounded-full bg-background border border-border shadow-sm hover:shadow-md transition-shadow duration-300 group"
            >
              {/* Color dot */}
              <span
                className="w-3 h-3 rounded-full flex-none"
                style={{ backgroundColor: partner.color }}
              />
              <span className="text-sm font-bold text-foreground/70 group-hover:text-foreground transition-colors duration-200 whitespace-nowrap">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Accessible fallback */}
      <div className="sr-only">
        <p>Our partners include: {partners.map((p) => p.name).join(", ")}.</p>
      </div>
    </section>
  )
}
