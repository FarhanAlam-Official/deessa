"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { BrushStroke } from "@/components/ui/brush-stroke"

export function AnimatedBrushQuote() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <div ref={ref} className="relative mt-16 flex justify-center py-6">
      <div
        style={{
          position: "relative",
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 152,
          width: "100%",
        }}
      >
        <BrushStroke
          color="#0B5F8A"
          animate={inView}
          animationDuration={1.2}
          style={{ width: "100%", minHeight: 200, maxWidth: 900 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "relative",
              zIndex: 2,
              textAlign: "center",
              padding: "0 24px",
            }}
          >
            <h3
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "clamp(26px, 3.5vw, 34px)",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.2,
                marginBottom: 8,
                letterSpacing: "-0.01em",
              }}
              className="font-marissa"
            >
              “Many told us we were overthinking…
            </h3>
            <p
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: "clamp(16px, 2vw, 18px)",
                fontWeight: 400,
                color: "#ffffff",
                opacity: 0.95,
                lineHeight: 1.5,
                maxWidth: 580,
                margin: "0 auto",
              }}
              className="font-dm"
            >
              but we knew deep down that our daughters and every child like them deserved better.”
            </p>
          </motion.div>
        </BrushStroke>
      </div>
    </div>
  )
}
