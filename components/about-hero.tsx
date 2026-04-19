"use client"

import Link from "next/link"
import { motion } from "framer-motion"

/* ───────── Original team photo ───────── */
const HERO_BG_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC5xzHfv2hii0hZm5knPtqnBhBXuF43kiNX-3L6bPoaNWoNJhuaBEp0UnvkJbxD_8jxmQHLjE0b1j-TMOJq_VOIrW9983EZgYM46P8MAwn7PzfzaLz2HsWKlKvt5lKXcXf_b6vms2V8NcnXaz9-_X8SNQsr6s7_GyimSfmkpcQ4Oh5YRcHnl1A7tisgSR5H6pZkE2H_RJ7Ed4vN8OmKIZ2WhCp5LlGraRVM17Ryo2wWWdRDFec31aYUj8Kv479a7Hlv2NIwScl7Eek"

/* ───────── Staggered word-by-word H1 ───────── */
function AnimatedHeadline() {
  const line1 = ["The", "People", "Behind"]
  const line2 = ["Nepal's", "Change."]
  const all = [...line1, ...line2]

  return (
    <h1
      className="font-marissa"
      style={{
        lineHeight: 1.05,
        color: "#fff",
        fontWeight: 700,
        marginBottom: 20,
      }}
    >
      {all.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.15 + i * 0.08,
            ease: "easeOut",
          }}
          style={{ display: "inline-block", marginRight: "0.28em" }}
        >
          {word}
          {i === line1.length - 1 && <br />}
        </motion.span>
      ))}
    </h1>
  )
}

/* ───────── Main Hero ───────── */
export function AboutHero() {
  return (
    <section
      className="about-hero-section"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* ═══ Scoped responsive styles ═══ */}
      <style>{`
        .about-hero-section { height: 92vh; }
        .about-hero-h1 h1  { font-size: 72px; }
        .about-hero-text   { left: 7%; padding-right: 24px; }
        .about-hero-btns   { flex-direction: row; }
        .about-hero-brush  { height: 90px; }

        @media (max-width: 767px) {
          .about-hero-section { height: 100svh; }
          .about-hero-h1 h1  { font-size: 48px; }
          .about-hero-text   { left: 24px; right: 24px; padding-right: 0; }
          .about-hero-btns   { flex-direction: column; }
          .about-hero-btns a { width: 100%; text-align: center; }
          .about-hero-brush  { height: 60px; }
          .about-hero-scrim  {
            background: rgba(15,18,35,0.75) !important;
          }
        }
      `}</style>

      {/* ─── LAYER 1 — Full-bleed background photo ─── */}
      <img
        src={HERO_BG_URL}
        alt="Deessa Foundation team in Nepal"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 68%",
          filter: "brightness(0.72) saturate(0.9)",
          zIndex: 1,
        }}
      />

      {/* ─── LAYER 2 — Gradient scrim ─── */}
      <div
        className="about-hero-scrim"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background:
            "linear-gradient(to right, rgba(15,18,35,0.82) 0%, rgba(15,18,35,0.55) 45%, rgba(15,18,35,0.10) 100%)",
        }}
      />

      {/* ─── LAYER 3 — Text content ─── */}
      <div
        className="about-hero-text"
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          maxWidth: 560,
          zIndex: 10,
        }}
      >
        {/* a) Breadcrumb */}
        <nav
          className="font-dm-sans"
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            marginBottom: 20,
          }}
          aria-label="Breadcrumb"
        >
          <Link href="/" style={{ color: "rgba(255,255,255,0.55)" }} className="hover:underline">
            Home
          </Link>
          <span style={{ margin: "0 6px", opacity: 0.7 }}>›</span>
          <span>Who We Are</span>
        </nav>

        {/* b) Badge pill */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          style={{ marginBottom: 22 }}
        >
          <span
            className="font-comic"
            style={{
              display: "inline-block",
              backgroundColor: "#29b6c8",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.12em",
              padding: "6px 16px",
              borderRadius: 999,
              textTransform: "uppercase",
            }}
          >
            ✦ OUR TEAM &amp; MISSION
          </span>
        </motion.div>

        {/* c) H1 */}
        <div className="about-hero-h1">
          <AnimatedHeadline />
        </div>

        {/* d) Subtitle */}
        <motion.p
          className="font-dm-sans"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
          style={{
            fontSize: 17,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.78)",
            maxWidth: 460,
            marginBottom: 32,
          }}
        >
          We are a dedicated team rooted in Nepal&apos;s communities,
          bridging the gap between potential and opportunity
          across the country&apos;s most remote regions.
        </motion.p>

        {/* e) CTA Buttons */}
        <motion.div
          className="about-hero-btns"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
          style={{ display: "flex", gap: 14 }}
        >
          <Link
            href="#journey"
            className="font-comic"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#29b6c8",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              padding: "14px 28px",
              borderRadius: 999,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1a8fa0"
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(41,182,200,0.35)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#29b6c8"
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            Read Our Story
          </Link>
          <Link
            href="/impact#reports"
            className="font-comic"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              padding: "14px 28px",
              borderRadius: 999,
              border: "1.5px solid rgba(255,255,255,0.6)",
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#fff"
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"
              e.currentTarget.style.backgroundColor = "transparent"
            }}
          >
            View Annual Reports
          </Link>
        </motion.div>

        {/* f) Trust strip */}
        <motion.div
          className="font-dm-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.75, ease: "easeOut" }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 28,
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            flexWrap: "wrap",
          }}
        >
          {["Est. 2014", "Govt Registered", "SWC Affiliated"].map((text) => (
            <span key={text} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#29b6c8",
                  flexShrink: 0,
                }}
              />
              {text}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ─── LAYER 4 — Brush stroke SVG divider ─── */}
      <div
        className="about-hero-brush"
        style={{
          position: "absolute",
          bottom: -2,
          left: 0,
          width: "100%",
          zIndex: 20,
          pointerEvents: "none",
          lineHeight: 0,
        }}
      >
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          {/* Main brush edge */}
          <path
            d="M0,38 C120,72 240,18 380,52 C500,80 620,12 760,44 C880,70 1000,8 1140,38 C1260,62 1360,22 1440,42 L1440,100 L0,100 Z"
            fill="#f8f6f1"
          />
          {/* Texture layer, semi-transparent */}
          <path
            d="M0,55 C150,28 300,68 440,38 C570,10 700,62 840,35 C970,10 1100,58 1240,30 C1330,12 1400,48 1440,32 L1440,100 L0,100 Z"
            fill="#f8f6f1"
            opacity="0.55"
          />
          {/* Bristle marks left edge */}
          <path
            d="M0,38 C-8,32 -12,42 -6,50 C-2,55 8,52 0,58"
            fill="#f8f6f1"
            opacity="0.6"
          />
          {/* Bristle marks right edge */}
          <path
            d="M1440,42 C1448,36 1452,46 1446,54 C1442,59 1432,56 1440,62"
            fill="#f8f6f1"
            opacity="0.6"
          />
          {/* Top bristle drips */}
          <path d="M320,52 C318,38 322,28 325,24 C323,32 324,44 320,52" fill="#f8f6f1" opacity="0.35" />
          <path d="M740,44 C738,28 742,16 745,12 C743,22 744,36 740,44" fill="#f8f6f1" opacity="0.3" />
          <path d="M1100,38 C1098,24 1102,14 1105,10 C1103,20 1104,32 1100,38" fill="#f8f6f1" opacity="0.32" />
          {/* Splatter dots */}
          <circle cx="210" cy="42" r="2.5" fill="#f8f6f1" opacity="0.4" />
          <circle cx="580" cy="22" r="2" fill="#f8f6f1" opacity="0.35" />
          <circle cx="980" cy="18" r="2" fill="#f8f6f1" opacity="0.32" />
          <circle cx="1320" cy="30" r="2.5" fill="#f8f6f1" opacity="0.38" />
          <ellipse cx="440" cy="35" rx="3" ry="1.5" fill="#f8f6f1" opacity="0.3" />
        </svg>
      </div>
    </section>
  )
}
