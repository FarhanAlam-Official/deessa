"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { BrushStroke } from "@/components/ui/brush-stroke"

// ─── BRUSH STROKE SVG COMPONENTS ─────────────────────────────────────────────

function BrushDividerWhiteToBrush() {
  return (
    <div className="relative w-full overflow-hidden leading-none" style={{ height: 90, marginBottom: -1 }}>
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full brush-sway"
      >
        <path
          d="M0,60 C80,20 200,80 360,55 C520,30 600,70 780,48 C960,26 1100,72 1280,50 C1360,40 1420,65 1440,58 L1440,90 L0,90 Z"
          fill="#eef6ff"
          opacity="1"
        />
        <path
          d="M0,70 C120,40 300,85 480,60 C660,35 800,78 1000,55 C1200,32 1350,70 1440,62 L1440,90 L0,90 Z"
          fill="#eef6ff"
          opacity="0.6"
        />
        <path
          d="M0,50 C60,30 160,75 320,52 C480,29 640,68 820,45 C1000,22 1200,68 1440,48 L1440,90 L0,90 Z"
          fill="#eef6ff"
          opacity="0.35"
        />
      </svg>
    </div>
  )
}

function BrushDividerBrushToWhite() {
  return (
    <div className="relative w-full overflow-hidden leading-none" style={{ height: 90, marginBottom: -1 }}>
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full brush-sway"
        style={{ background: "#eef6ff" }}
      >
        <path
          d="M0,28 C80,60 200,18 380,42 C560,66 700,22 880,45 C1060,68 1200,28 1380,38 C1410,40 1430,35 1440,30 L1440,90 L0,90 Z"
          fill="white"
          opacity="1"
        />
        <path
          d="M0,38 C120,65 340,20 520,48 C700,76 880,24 1080,50 C1280,76 1380,32 1440,40 L1440,90 L0,90 Z"
          fill="white"
          opacity="0.55"
        />
        <path
          d="M0,22 C100,52 280,14 460,36 C640,58 820,18 1040,42 C1260,66 1360,28 1440,36 L1440,90 L0,90 Z"
          fill="white"
          opacity="0.3"
        />
      </svg>
    </div>
  )
}

function BrushDividerWhiteToTeal() {
  return (
    <div className="relative w-full overflow-hidden leading-none" style={{ height: 90, marginBottom: -1 }}>
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full brush-sway"
      >
        <path
          d="M0,60 C100,25 280,78 460,50 C640,22 820,72 1020,48 C1220,24 1360,68 1440,55 L1440,90 L0,90 Z"
          fill="#1a8fa0"
          opacity="1"
        />
        <path
          d="M0,70 C140,38 340,80 540,58 C740,36 920,78 1120,52 C1320,26 1400,65 1440,62 L1440,90 L0,90 Z"
          fill="#29b6c8"
          opacity="0.7"
        />
        <path
          d="M0,50 C80,30 200,72 380,48 C560,24 740,70 940,46 C1140,22 1320,66 1440,50 L1440,90 L0,90 Z"
          fill="#1a8fa0"
          opacity="0.4"
        />
      </svg>
    </div>
  )
}

function BrushDividerBrushToAutism() {
  return (
    <div className="relative w-full overflow-hidden leading-none" style={{ height: 90, marginBottom: -1 }}>
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full brush-sway"
        style={{ background: "#eef6ff" }}
      >
        <path
          d="M0,32 C90,62 260,18 440,44 C620,70 800,22 980,50 C1160,78 1320,30 1440,42 L1440,0 L0,0 Z"
          fill="#fff7ed"
          opacity="1"
        />
        <path
          d="M0,45 C120,70 320,25 520,52 C720,79 900,28 1100,54 C1300,80 1400,36 1440,48 L1440,0 L0,0 Z"
          fill="#fff7ed"
          opacity="0.55"
        />
      </svg>
    </div>
  )
}

// ─── PUZZLE PIECE SVG ─────────────────────────────────────────────────────────

function PuzzlePiece({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20,20 L45,20 C45,20 42,10 50,10 C58,10 55,20 55,20 L80,20 L80,45 C80,45 90,42 90,50 C90,58 80,55 80,55 L80,80 L55,80 C55,80 58,90 50,90 C42,90 45,80 45,80 L20,80 L20,55 C20,55 10,58 10,50 C10,42 20,45 20,45 Z"
        fill="currentColor"
        opacity="0.15"
      />
    </svg>
  )
}

// ─── STAT COUNTER COMPONENT ───────────────────────────────────────────────────

function StatCounter({ value, suffix = "", label, sublabel, delay = 0 }: {
  value: number
  suffix?: string
  label: string
  sublabel?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      className="stat-card group flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 cursor-default"
    >
      <span className="stat-number font-marissa text-teal leading-none">
        {value.toLocaleString()}{suffix}
      </span>
      <span className="stat-label font-comic font-bold text-dark mt-2">{label}</span>
      {sublabel && <span className="stat-sublabel font-dm text-gray-500 mt-1">{sublabel}</span>}
    </div>
  )
}

// ─── SCROLL PROGRESS BAR ──────────────────────────────────────────────────────

function ScrollProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      setProgress(totalHeight > 0 ? (scrolled / totalHeight) * 100 : 0)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none">
      <div
        className="h-full transition-none"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #1a8fa0, #29b6c8)",
          boxShadow: "0 0 8px #29b6c8aa",
        }}
      />
    </div>
  )
}

// ─── FADE-SLIDE SECTION HEADING ───────────────────────────────────────────────

function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── HERO WORD REVEAL ─────────────────────────────────────────────────────────

function HeroTitle({ text }: { text: string }) {
  const words = text.split(" ")
  return (
    <h1 className="font-marissa hero-h1 leading-none text-white mb-6 flex flex-wrap justify-center gap-x-4">
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 60, rotateX: -30 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.75,
            delay: 0.4 + i * 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  )
}

// ─── PROGRAM BLOCK ────────────────────────────────────────────────────────────

function ProgramBlock({
  reversed,
  imageSrc,
  imageAlt,
  badge,
  headline,
  body,
  bullets,
  stat,
  statLabel,
  link,
  linkText = "Read Stories →",
}: {
  reversed?: boolean
  imageSrc: string
  imageAlt: string
  badge: string
  headline: string
  body: string
  bullets: string[]
  stat: string
  statLabel: string
  link?: string
  linkText?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <div
      ref={ref}
      className={`flex flex-col ${reversed ? "lg:flex-row-reverse" : "lg:flex-row"} gap-12 lg:gap-16 items-center`}
    >
      {/* Image */}
      <motion.div
        className="w-full lg:w-1/2 relative"
        initial={{ opacity: 0, x: reversed ? 60 : -60 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border-4 border-white shadow-2xl">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {/* Brush stroke label */}
          <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-[#29b6c8ee] to-transparent">
            <span className="font-marissa text-white text-2xl">{imageAlt}</span>
          </div>
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        className="w-full lg:w-1/2"
        initial={{ opacity: 0, x: reversed ? -60 : 60 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="font-comic font-bold text-sm text-white bg-teal px-4 py-1.5 rounded-full uppercase tracking-wider inline-block mb-5">
          {badge}
        </span>
        <h2 className="font-marissa program-h2 text-dark leading-tight mb-5">{headline}</h2>
        <p className="font-dm text-gray-600 text-lg leading-relaxed mb-6">{body}</p>
        <ul className="space-y-3 mb-8">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-teal text-xl mt-0.5">✓</span>
              <span className="font-comic font-bold text-dark">{b}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline gap-3 mb-6 p-5 bg-brush-bg rounded-2xl border border-teal/20">
          <span className="font-marissa text-5xl text-teal leading-none">{stat}</span>
          <span className="font-comic font-bold text-dark text-lg">{statLabel}</span>
        </div>
        <Link
          href={link || "/stories"}
          className="font-dm text-teal font-semibold text-lg hover:text-teal-dark transition-colors inline-flex items-center gap-2 group"
        >
          {linkText}
          <span className="transform group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </motion.div>
    </div>
  )
}

// ─── STORY CARD ───────────────────────────────────────────────────────────────

function StoryCard({
  imageSrc,
  name,
  location,
  program,
  quote,
  delay = 0,
}: {
  imageSrc: string
  name: string
  location: string
  program: string
  quote: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group story-card rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-cover transition-all duration-700 scale-100 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-[#29b6c8dd] to-transparent">
          <span className="font-marissa text-white text-xl">{name}</span>
        </div>
      </div>
      <div className="p-5">
        <p className="font-dm italic text-gray-600 text-sm mb-4 line-clamp-3">"{quote}"</p>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="font-comic font-bold text-dark text-sm">{name}</span>
          <span className="text-gray-400 text-xs">·</span>
          <span className="font-comic text-sm text-gray-500">{location}</span>
          <span className="font-comic text-xs bg-teal/10 text-teal-dark px-2 py-0.5 rounded-full ml-auto">{program}</span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ImpactClientPage() {
  const heroRef = useRef<HTMLElement>(null)
  const [heroLoaded, setHeroLoaded] = useState(false)

  useEffect(() => {
    setHeroLoaded(true)
  }, [])

  // Inject fonts & custom styles once
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');

      @font-face {
        font-family: 'Marissa Font';
        src: url('/fonts/MarissaFont-Regular.ttf') format('truetype');
        font-weight: 400 700;
        font-display: swap;
      }

      .font-marissa { font-family: 'Marissa Font', 'Georgia', serif !important; }
      .font-comic   { font-family: 'Comic Neue', 'Comic Sans MS', cursive !important; }
      .font-dm      { font-family: 'DM Sans', system-ui, sans-serif !important; }

      .hero-h1    { font-size: clamp(52px, 7vw, 88px); }
      .program-h2 { font-size: clamp(32px, 4vw, 48px); }
      .stat-number { font-size: clamp(48px, 6vw, 72px); }
      .stat-label  { font-size: 16px; }
      .stat-sublabel { font-size: 13px; }

      .text-teal      { color: #29b6c8 !important; }
      .text-teal-dark { color: #1a8fa0 !important; }
      .text-orange    { color: #f97316 !important; }
      .text-dark      { color: #1a1a2e !important; }
      .bg-teal        { background: #29b6c8 !important; }
      .bg-teal-dark   { background: #1a8fa0 !important; }
      .bg-brush-bg    { background: #eef6ff !important; }
      .bg-orange      { background: #f97316 !important; }
      .border-teal    { border-color: #29b6c8 !important; }

      .stat-card {
        background: white;
        border: 2px solid transparent;
        transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
      }
      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 0 24px 0 #29b6c83a;
        border-color: #29b6c8;
      }

      @keyframes brushSway {
        0%, 100% { transform: translateX(0); }
        50%       { transform: translateX(3px); }
      }
      .brush-sway { animation: brushSway 8s ease-in-out infinite; }

      @keyframes floatBadge {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(-6px); }
      }
      .float-badge { animation: floatBadge 3s ease-in-out infinite; }

      .trust-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.3);
        backdrop-filter: blur(12px);
        border-radius: 999px;
        padding: 8px 18px;
        font-family: 'Comic Neue', cursive;
        font-weight: 700;
        color: white;
        font-size: 13px;
      }
      .autism-section {
        background: linear-gradient(135deg, #fff7ed 0%, #fef3e8 30%, #eef6ff 70%, #e8f8ff 100%);
      }
      .cta-card {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        backdrop-filter: blur(16px);
        border-radius: 20px;
        transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
      }
      .cta-card:hover {
        transform: translateY(-6px);
      }
      .cta-card.donate:hover  { box-shadow: 0 0 36px #f9731640; border-color: #f97316; }
      .cta-card.volunteer:hover { box-shadow: 0 0 36px #29b6c840; border-color: #29b6c8; }
      .cta-card.partner:hover { box-shadow: 0 0 36px #ffffff30; border-color: rgba(255,255,255,0.5); }

      .featured-story {
        background: white;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(41,182,200,0.1);
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  const stats1 = [
    { value: 10000, suffix: "+", label: "Lives Impacted", sublabel: "Across Nepal" },
    { value: 50, suffix: "+", label: "Schools Built", sublabel: "& Renovated" },
    { value: 25, suffix: "+", label: "Districts Reached", sublabel: "Out of 77" },
    { value: 500, suffix: "+", label: "Teachers Trained", sublabel: "In 10 Years" },
  ]
  const stats2 = [
    { value: 120, suffix: "+", label: "Villages Served", sublabel: "Rural Nepal" },
    { value: 3000, suffix: "+", label: "Scholarships Awarded", sublabel: "Since 2014" },
    { value: 847, suffix: "+", label: "Autism Children", sublabel: "Supported" },
    { value: 200, suffix: "+", label: "Health Camps Run", sublabel: "Free of cost" },
  ]

  const programs = [
    {
      badge: "📚 Education",
      headline: "Building Classrooms, Building Futures",
      body: "Since 2014, Deessa Foundation has constructed and renovated 50+ schools across remote Himalayan and Terai communities — ensuring every child has a safe space to learn, grow, and dream. Our education initiatives combine infrastructure with holistic teacher training programs.",
      bullets: [
        "50+ schools built & renovated from Humla to Dang",
        "500+ teachers trained in child-centered pedagogy",
        "3,000+ scholarships awarded to marginalized students",
      ],
      stat: "3,000+",
      statLabel: "students supported",
      imageSrc: "/StoriesSectionImage.png",
      imageAlt: "Education in Nepal",
      link: "/programs?category=education",
      linkText: "Read Education Stories →",
    },
    {
      badge: "🏥 Healthcare",
      headline: "Bringing Medicine to the Mountains",
      body: "200+ free health camps have reached villages where the nearest hospital is a full day's walk away. Our mobile health units carry everything from basic diagnostics to maternal care — meeting communities where they are, not where is convenient.",
      bullets: [
        "200+ free health camps across 25 districts",
        "Maternal & child health care for 5,000+ women",
        "Eye care, dental, and general checkups provided free",
      ],
      stat: "200+",
      statLabel: "health camps conducted",
      imageSrc: "/missionVisionObjectives.png",
      imageAlt: "Healthcare for mountain communities",
      link: "/programs?category=health",
      linkText: "See Health Impact Stories →",
    },
    {
      badge: "👩 Women Empowerment",
      headline: "Women Who Lead",
      body: "When women rise, communities transform. Our women's empowerment programs provide vocational training, microfinance access, and leadership workshops — creating 500+ self-sufficient entrepreneurs and community advocates across Nepal's remotest corners.",
      bullets: [
        "500+ women trained in vocational skills",
        "Microfinance access for rural women entrepreneurs",
        "Leadership programs promoting women in governance",
      ],
      stat: "500+",
      statLabel: "women empowered",
      imageSrc: "/JoinTheMovement.png",
      imageAlt: "Women leadership in Nepal",
      link: "/programs?category=empowerment",
      linkText: "See Women's Stories →",
    },
  ]

  const stories = [
    {
      imageSrc: "/StoriesSectionImage.png",
      name: "Sunita Tamang",
      location: "Sindhupalchok",
      program: "Education",
      quote: "I used to walk two hours each way to reach a broken-down school. After Deessa Foundation built our new classroom, I never missed a single day.",
    },
    {
      imageSrc: "/testimonials.png",
      name: "Bikram Shrestha",
      location: "Humla",
      program: "Healthcare",
      quote: "The health camp was the first time my mother ever saw a doctor. She had been suffering in silence for years. Now she is healthy and strong.",
    },
    {
      imageSrc: "/ourStory.png",
      name: "Parvati Gurung",
      location: "Kaski",
      program: "Women Empowerment",
      quote: "I opened my own tailoring shop after the vocational training. Today I employ five other women from my village.",
    },
  ]

  return (
    <>
      <ScrollProgressBar />

      {/* ═══════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Full-bleed hero photo with gradient overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/OurImpactThroughTheYear.png"
            alt="Deessa Foundation Nepal community impact"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Dark gradient overlay - left to right */}
          <div 
            className="absolute inset-0" 
            style={{
              background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)'
            }}
          />
        </div>

        {/* Photo credit */}
        <div className="absolute bottom-8 left-8 z-20">
          <p className="font-dm text-white/60 text-xs tracking-wide">Karnali Province, Nepal</p>
        </div>

        {/* Hero content - left-aligned */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
            <div className="max-w-2xl">
              {/* Badge pill */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-6"
              >
                <span className="font-comic font-bold bg-teal text-white px-5 py-2 rounded-full text-sm uppercase tracking-wider inline-block">
                  ✦ OUR IMPACT 2014–2024
                </span>
              </motion.div>

              {/* H1 - Two-line, two-color */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="mb-6"
              >
                <div className="font-marissa text-white leading-none" style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}>
                  10,000+ Lives.
                </div>
                <div className="font-marissa text-teal leading-none" style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}>
                  One Mission.
                </div>
              </motion.h1>

              {/* Subtitle with semi-transparent background */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.7 }}
                className="mb-8"
              >
                <div className="inline-block bg-black/40 backdrop-blur-sm px-6 py-4 rounded-2xl">
                  <p className="font-dm text-white text-lg leading-relaxed max-w-lg">
                    From Humla's frozen peaks to Terai's golden plains, we've been showing up — with books, medicine, and unwavering belief in Nepal's communities.
                  </p>
                </div>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.6 }}
                className="flex flex-wrap items-center gap-3 mb-8 font-dm text-white/80 text-sm"
              >
                <span>● Govt Registered</span>
                <span>● SWC Affiliated</span>
                <span>● 10+ Years</span>
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <Link
                  href="/stories"
                  className="font-comic font-bold bg-teal hover:bg-[#1a8fa0] text-white px-8 py-4 rounded-full text-base transition-all duration-300 hover:shadow-[0_0_30px_#29b6c860] hover:-translate-y-1"
                >
                  See Stories
                </Link>
                <a
                  href="/deesa-resources/deessa Foundation_ Short Bio -2.pdf"
                  download
                  className="font-comic font-bold bg-[#1a1a2e] hover:bg-[#0f0f1a] text-white px-8 py-4 rounded-full text-base transition-all duration-300 hover:-translate-y-1"
                >
                  Download Report
                </a>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Brush stroke bleeding into stats section */}
        <div className="relative z-10">
          <BrushDividerWhiteToBrush />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — STATS STRIP
      ═══════════════════════════════════════════ */}
      <section className="bg-brush-bg py-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading className="text-center mb-12">
            <h2 className="font-marissa text-dark mb-4" style={{ fontSize: "clamp(36px,4vw,52px)" }}>
              A Decade Measured in Moments
            </h2>
            <p className="font-dm text-gray-500 text-lg max-w-2xl mx-auto">
              Every number below represents a life changed, a family supported, a dream made possible.
            </p>
          </SectionHeading>

          {/* Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {stats1.map((s, i) => (
              <StatCounter key={s.label} {...s} delay={i * 150} />
            ))}
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats2.map((s, i) => (
              <StatCounter key={s.label} {...s} delay={400 + i * 150} />
            ))}
          </div>
        </div>
      </section>

      <BrushDividerBrushToWhite />

      {/* ═══════════════════════════════════════════
          SECTION 3 — PROGRAM IMPACTS
      ═══════════════════════════════════════════ */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading className="text-center mb-20">
            <h2 className="font-marissa text-dark mb-4" style={{ fontSize: "clamp(36px,4vw,52px)" }}>
              Where Every Rupee Goes
            </h2>
            <p className="font-dm text-gray-500 text-lg">Four pillars. Ten years. Immeasurable change.</p>
          </SectionHeading>

          <div className="space-y-28">
            {/* Program 1 — Education */}
            <ProgramBlock {...programs[0]} reversed={false} />

            {/* ─── PAINT-STROKE QUOTE BANNER ─── */}
            <div className="-mx-6 relative" style={{ margin: "4rem -1.5rem" }}>
              <section
                style={{
                  background: "transparent",
                  padding: "24px 0",
                  position: "relative",
                  overflow: "visible",
                }}
              >
                {/* Container for paint stroke + text */}
                <div
                  style={{
                    position: "relative",
                    maxWidth: 1200,
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 152,
                  }}
                >
                  <BrushStroke 
                    color="#8B8DD4" 
                    animate={true} 
                    animationDuration={1.2}
                    style={{ width: '100%', minHeight: 200, maxWidth: 900 }}
                  >
                    {/* Text content — on top of paint stroke */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
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
                        Deepening rural reach.
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
                        Every initiative implemented and life touched ripples outward, creating lasting, sustainable pathways for underserved communities.
                      </p>
                    </motion.div>
                  </BrushStroke>
                </div>
              </section>
            </div>

            {/* Program 2 — Healthcare */}
            <ProgramBlock {...programs[1]} reversed={true} />

            {/* ─── AUTISM SPECIAL SECTION ─── */}
            <div className="-mx-6 relative">
              <BrushDividerBrushToAutism />
              <div className="autism-section px-6 py-16">
                <div className="max-w-7xl mx-auto">
                  {/* Floating puzzle pieces */}
                  <div className="relative">
                    <PuzzlePiece className="absolute -top-10 -right-10 w-64 h-64 text-orange" />
                    <PuzzlePiece className="absolute -bottom-10 -left-10 w-48 h-48 text-teal" />

                    <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                      {/* Left: content */}
                      <motion.div
                        initial={{ opacity: 0, x: -60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <span className="font-comic font-bold text-sm bg-orange text-white px-4 py-1.5 rounded-full uppercase tracking-wider inline-block mb-5">
                          🧩 Autism Support
                        </span>
                        <h2 className="font-marissa text-dark leading-tight mb-5" style={{ fontSize: "clamp(32px,4vw,48px)" }}>
                          Every Mind Is a Gift
                        </h2>
                        <p className="font-dm text-gray-600 text-lg leading-relaxed mb-6">
                          Nepal has one of the lowest rates of autism diagnosis and support infrastructure in
                          South Asia. Deessa Foundation is changing that — running 12 therapy centers,
                          training 200+ specialist educators, and fighting the stigma that silences
                          thousands of families across the country.
                        </p>
                        <ul className="space-y-3 mb-8">
                          {[
                            "12 dedicated autism therapy centers across Nepal",
                            "200+ educators trained in inclusive education",
                            "Monthly family support groups in 8 provinces",
                          ].map((b, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="text-orange text-xl mt-0.5">✓</span>
                              <span className="font-comic font-bold text-dark">{b}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Big stat */}
                        <div className="flex items-baseline gap-3 mb-8 p-5 bg-white/70 rounded-2xl border border-orange/20 backdrop-blur-sm">
                          <span className="font-marissa text-5xl leading-none" style={{ color: "#f97316" }}>847</span>
                          <span className="font-comic font-bold text-dark text-lg">children supported · 12 therapy centers</span>
                        </div>

                        {/* Parent testimonial */}
                        <blockquote className="border-l-4 border-orange pl-5 mb-8">
                          <p className="font-marissa italic text-dark" style={{ fontSize: 22, lineHeight: 1.5 }}>
                            "For the first time, my son has a place where he belongs.
                            Deessa Foundation didn't just help him — they gave our whole
                            family hope we didn't know we'd lost."
                          </p>
                          <footer className="font-comic font-bold text-gray-500 mt-2 text-sm">
                            — Ranjana Maharjan, mother · Lalitpur
                          </footer>
                        </blockquote>

                        <Link
                          href="/donate"
                          className="font-comic font-bold bg-orange text-white px-8 py-4 rounded-full text-base inline-block transition-all duration-300 hover:shadow-[0_0_30px_#f9731670] hover:-translate-y-1"
                        >
                          Sponsor an Autism Program
                        </Link>
                      </motion.div>

                      {/* Right: image */}
                      <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border-4 border-white shadow-2xl">
                          <Image
                            src="/educationHealthShelterFreedom.png"
                            alt="Autism support programs Nepal"
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                          />
                          <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-[#f97316cc] to-transparent">
                            <span className="font-marissa text-white text-2xl">Every Mind Matters</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ background: "#fff7ed", height: 4 }} />
              {/* Return to white */}
              <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 80, background: "#fff7ed" }} className="brush-sway">
                <path d="M0,35 C90,65 260,18 440,44 C620,70 800,24 1000,50 C1200,76 1360,28 1440,42 L1440,80 L0,80 Z" fill="white" />
                <path d="M0,50 C120,76 320,28 520,54 C720,80 900,30 1100,56 C1300,82 1400,36 1440,50 L1440,80 L0,80 Z" fill="white" opacity="0.5" />
              </svg>
            </div>

            {/* Program 3 — Women Empowerment */}
            <ProgramBlock {...programs[2]} reversed={false} />
          </div>
        </div>
      </section>

      <BrushDividerWhiteToBrush />

      {/* ═══════════════════════════════════════════
          SECTION 4 — STORIES GRID
      ═══════════════════════════════════════════ */}
      <section className="bg-brush-bg py-24">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading className="text-center mb-16">
            <h2 className="font-marissa text-dark mb-4" style={{ fontSize: "clamp(36px,4vw,52px)" }}>
              In Their Own Words
            </h2>
            <p className="font-dm text-gray-500 text-lg">
              Numbers tell the scale. Stories tell the truth.
            </p>
          </SectionHeading>

          {/* Featured story */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="featured-story mb-12 flex flex-col lg:flex-row overflow-hidden"
          >
            {/* Photo — 60% */}
            <div className="relative lg:w-3/5 aspect-video lg:aspect-auto min-h-[360px]">
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop"
                alt="Featured story — Ramesh Karki"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            {/* Quote — 40% */}
            <div className="lg:w-2/5 p-10 flex flex-col justify-center">
              <span className="font-marissa text-teal mb-4 block" style={{ fontSize: 72, lineHeight: 0.8, opacity: 0.3 }}>"</span>
              <blockquote className="font-marissa text-dark leading-snug mb-6" style={{ fontSize: "clamp(22px,2.5vw,30px)" }}>
                Before Deessa Foundation came to our village, our children had no school,
                no clinic, and no future they could see. Now our son is studying engineering
                in Kathmandu. That is what a single school can do.
              </blockquote>
              <footer className="mb-2">
                <span className="font-comic font-bold text-dark text-base block">Ramesh Karki</span>
                <span className="font-comic text-gray-500 text-sm">Sindhupalchok · Education Program</span>
              </footer>
              <p className="font-dm text-gray-600 text-sm mb-6 italic">
                Ramesh walked 4 hours daily to the construction site, volunteering with
                Deessa's team to help build the school that would change his children's lives.
              </p>
              <Link
                href="/stories"
                className="font-dm text-teal font-semibold text-base hover:text-teal-dark transition-colors inline-flex items-center gap-2 group"
              >
                Read Full Story
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </motion.div>

          {/* 3-column story grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stories.map((s, i) => (
              <StoryCard key={s.name} {...s} delay={i * 0.1} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link
              href="/stories"
              className="font-comic font-bold border-2 border-teal text-teal px-8 py-4 rounded-full text-base inline-block transition-all duration-300 hover:bg-teal hover:text-white hover:-translate-y-1"
            >
              View All Stories →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5 — GET INVOLVED CTA
      ═══════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Animated rich gradient background matching Deessa's teal & cyan theme */}
        <div className="absolute inset-0 z-0 bg-[#083344]">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[30%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[140px] mix-blend-screen opacity-50 bg-[#0ea5e9]"
          />
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              rotate: [0, -90, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 2 }}
            className="absolute top-[20%] -right-[20%] w-[60vw] h-[60vw] rounded-full blur-[120px] mix-blend-screen opacity-40 bg-[#f97316]"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 5 }}
            className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full blur-[160px] mix-blend-screen opacity-50 bg-[#14b8a6]"
          />
        </div>

        <section className="relative z-10 py-32">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center mb-20"
            >
              <h2 className="font-marissa text-white mb-6 drop-shadow-lg" style={{ fontSize: "clamp(48px,6vw,72px)" }}>
                Be Part of the Change
              </h2>
              <p className="font-dm text-white/90 text-xl max-w-2xl mx-auto font-light leading-relaxed">
                One in ten thousand sounds like a statistic. To us, it's a child's name.
                Join us in writing the next chapter together.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Donate */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-10 flex flex-col gap-6 rounded-3xl bg-white/5 backdrop-blur-[24px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#f97316]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-5xl drop-shadow-md relative z-10">❤️</span>
                <div className="relative z-10">
                  <h3 className="font-comic font-bold text-white text-2xl mb-3 tracking-wide">Donate</h3>
                  <p className="font-dm text-white/80 text-base leading-relaxed">
                    Fund a child's education, a health camp, or a therapy center. Every rupee is accounted for.
                  </p>
                </div>
                <Link
                  href="/donate"
                  className="relative z-10 font-comic font-bold bg-orange text-white px-8 py-4 rounded-full text-base text-center transition-all duration-300 hover:shadow-[0_0_30px_#f9731660] hover:scale-105 mt-auto"
                >
                  Fund a Child's Future
                </Link>
              </motion.div>

              {/* Volunteer */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-10 flex flex-col gap-6 rounded-3xl bg-white/5 backdrop-blur-[24px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-5xl drop-shadow-md relative z-10">🙌</span>
                <div className="relative z-10">
                  <h3 className="font-comic font-bold text-white text-2xl mb-3 tracking-wide">Volunteer</h3>
                  <p className="font-dm text-white/80 text-base leading-relaxed">
                    Give your time, skills, and energy. Teach, build, support — your talent has a home here.
                  </p>
                </div>
                <Link
                  href="/get-involved"
                  className="relative z-10 font-comic font-bold bg-white/10 backdrop-blur-md border-2 border-white/80 text-white px-8 py-4 rounded-full text-base text-center transition-all duration-300 hover:bg-white hover:text-[#0f172a] mt-auto"
                >
                  Give Your Time & Skills
                </Link>
              </motion.div>

              {/* Partner */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-10 flex flex-col gap-6 rounded-3xl bg-white/5 backdrop-blur-[24px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#06b6d4]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-5xl drop-shadow-md relative z-10">🤝</span>
                <div className="relative z-10">
                  <h3 className="font-comic font-bold text-white text-2xl mb-3 tracking-wide">Partner</h3>
                  <p className="font-dm text-white/80 text-base leading-relaxed">
                    CSR partnerships, institutional grants, or joint programs — grow impact together with us.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="relative z-10 font-comic font-bold bg-transparent border-2 border-white/30 text-white px-8 py-4 rounded-full text-base text-center transition-all duration-300 hover:border-white hover:bg-white/10 hover:shadow-[0_0_20px_white] mt-auto"
                >
                  Grow Impact Together
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
