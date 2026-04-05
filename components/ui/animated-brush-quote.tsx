"use client"

import { motion } from "framer-motion"
import { BrushStroke } from "@/components/ui/brush-stroke"

export function AnimatedBrushQuote() {
  return (
    <BrushStroke 
      color="#c7d2fe" 
      animate={true} 
      animationDuration={1.2}
      style={{ width: '100%', minHeight: 200, maxWidth: 900 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <p
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "clamp(26px, 3.5vw, 34px)",
            fontWeight: 800,
            color: "#1a2456",
            lineHeight: 1.3,
            marginBottom: 12,
            letterSpacing: "-0.01em",
          }}
          className="font-marissa italic"
        >
          “Many told us we were overthinking…
        </p>
        <p
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: "clamp(16px, 2vw, 20px)",
            fontWeight: 400,
            color: "#1a2456",
            opacity: 0.95,
            lineHeight: 1.5,
            maxWidth: 680,
            margin: "0 auto",
          }}
          className="font-dm"
        >
          But we knew deep down that our daughters and every child like them deserved better.”
        </p>
      </motion.div>
    </BrushStroke>
  )
}
