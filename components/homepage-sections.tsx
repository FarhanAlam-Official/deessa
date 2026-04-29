"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Heart, ArrowRight, GraduationCap, MapPin, Stethoscope,
  BookOpen, ChevronRight, Phone, Clock, Mail, Shield, Home as HomeIcon,
  Target, Eye, Flag, Users, Leaf, ArrowUpRight, Star, Play,
  Quote, Award, Building2, Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ScrollReveal,
  CountUp,
  BackToTop,
} from "@/components/scroll-animations"
import { BrushStroke } from "@/components/ui/brush-stroke"

/* ──────────────────  IMPACT STATS BAR  ────────────────── */

export function ImpactStatsBar() {
  const stats = [
    { value: 10000, suffix: "+", label: "Children Supported" },
    { value: 50, suffix: "+", label: "Schools Built" },
    { value: 25, suffix: "+", label: "Districts Reached" },
    { value: 500, suffix: "+", label: "Trained Teachers" },
  ]

  return (
    <section className="bg-primary/5 border-y border-primary/10 py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-primary font-comic-num">
                <CountUp end={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────  OUR STORY SECTION  ────────────────── */

export function OurStorySection() {
  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <ScrollReveal animation="fade-up" duration={700}>
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="/ourStory.png"
                  alt="How Deessa started - our origin story"
                  width={700}
                  height={500}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
              </div>
              <ScrollReveal animation="scale-in" delay={400}>
                <div className="absolute -bottom-6 -right-6 bg-primary text-white rounded-2xl p-6 shadow-xl hidden md:block animate-badge-bounce">
                  <p className="text-4xl font-black font-comic-num">
                    <CountUp end={2014} prefix="" duration={1500} />
                  </p>
                  <p className="text-sm font-bold opacity-90">Founded</p>
                </div>
              </ScrollReveal>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-left" delay={200}>
            <div>
              <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Our Story</span>
              <div className="mx-auto w-full max-w-4xl">
                <BrushStroke
                  color="#6F3E96"
                  animate={true}
                  animationDuration={1.2}
                  className="mx-auto"
                  style={{
                    padding: '28px 48px',
                    minHeight: 0
                  }}
                >
                  <div className="py-0 px-0">
                    <h2 className="font-marissa text-3xl md:text-[42px] text-white text-center" style={{ lineHeight: 1.2 }}>
                      How Deesha Started
                    </h2>
                  </div>
                </BrushStroke>
              </div>
              <p className="text-lg text-foreground/70 leading-relaxed mb-6">
                Born from a deep passion for social justice and a belief in the power of community, Deesha Foundation
                was established in 2014 in Kathmandu, Nepal. What began as a small group of dedicated individuals
                has grown into a movement touching thousands of lives.
              </p>
              <p className="text-lg text-foreground/70 leading-relaxed mb-8">
                Our founders saw the gaps in education, healthcare, and opportunity across rural Nepal and decided
                to act. Today, Deesha stands as a beacon of hope, building bridges between communities and the
                resources they need to thrive.
              </p>
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 font-bold text-primary hover:text-primary/80 transition-colors text-lg"
              >
                Read Our Full Story
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-2 duration-300" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────  MISSION, VISION & OBJECTIVES  ────────────────── */

export function MissionVisionSection() {
  const cards = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To empower marginalized communities in Nepal through education, healthcare, and sustainable development, ensuring every individual has the opportunity to live with dignity and purpose.",
      color: "border-l-4 border-l-primary",
      iconBg: "bg-primary/10",
      iconColor: "text-primary"
    },
    {
      icon: Eye,
      title: "Our Vision",
      description: "A Nepal where every community thrives — where children dream freely, families are healthy, and opportunities are within everyone's reach.",
      color: "border-l-4 border-l-blue-500",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500"
    },
    {
      icon: Flag,
      title: "Our Objectives",
      description: "Build 100+ schools, reach 50,000+ lives through healthcare, empower 10,000+ women through skill development, and create lasting change in every district we serve.",
      color: "border-l-4 border-l-green-500",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500"
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-muted relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Our Direction</span>
            <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4">
              Mission, Vision <span className="font-normal">&</span> Objectives
            </h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              Guided by clear values and a bold vision for Nepal&apos;s future.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal animation="scale-in">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/missionVisionObjectives.png"
                alt="Mission, Vision and Objectives"
                width={700}
                height={500}
                className="w-full h-auto object-cover"
              />
            </div>
          </ScrollReveal>

          <div className="space-y-8 connecting-line">
            {cards.map((card, i) => {
              const IconComp = card.icon
              return (
                <ScrollReveal key={card.title} animation="fade-right" delay={i * 200}>
                  <div className={`group ${card.color} rounded-xl bg-background/50 p-4 hover:scale-[1.02] transition-transform duration-300`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors`}>
                        <IconComp className={`size-7 ${card.iconColor} group-hover:rotate-[15deg] transition-transform duration-300`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-foreground mb-2">{card.title}</h3>
                        <p className="text-foreground/70 leading-relaxed">{card.description}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────  PROGRAMS SECTION  ────────────────── */

export function ProgramsSection() {
  const corePillars = [
    {
      icon: GraduationCap,
      title: "Education",
      description: "Building schools, training teachers, and providing scholarships to ensure every child has access to quality education.",
      color: "bg-blue-500",
      glowClass: "hover-glow-blue",
      stat: "50+",
      statLabel: "Schools",
      statEnd: 50,
    },
    {
      icon: Stethoscope,
      title: "Health",
      description: "Running health camps, providing medical supplies, and building health posts in underserved communities.",
      color: "bg-green-500",
      glowClass: "hover-glow-green",
      stat: "200+",
      statLabel: "Health Camps",
      statEnd: 200,
    },
    {
      icon: HomeIcon,
      title: "Shelter",
      description: "Constructing safe housing and rebuilding communities affected by natural disasters across Nepal.",
      color: "bg-orange-500",
      glowClass: "hover-glow-orange",
      stat: "1000+",
      statLabel: "Homes Built",
      statEnd: 1000,
    },
    {
      icon: Shield,
      title: "Freedom",
      description: "Empowering individuals with skills, resources, and opportunities for self-determination and independence.",
      color: "bg-purple-500",
      glowClass: "hover-glow-purple",
      stat: "5000+",
      statLabel: "Empowered",
      statEnd: 5000,
    },
  ]

  return (
    <section id="what-we-do" className="py-20 md:py-28 bg-foreground text-white relative overflow-hidden scroll-mt-24">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">What We Do</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Core Pillars</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Our work is guided by four fundamental pillars that drive lasting change.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {corePillars.map((pillar, idx) => {
            const IconComp = pillar.icon
            return (
              <ScrollReveal
                key={pillar.title}
                animation={idx % 2 === 0 ? "fade-right" : "fade-left"}
                delay={idx * 150}
              >
                <div className={`group relative rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/40 transition-all duration-500 hover:-translate-y-1 ${pillar.glowClass}`}>
                  <div className="p-8 text-center">
                    <div className="text-2xl font-black text-primary mb-2 font-comic-num">
                      <CountUp end={pillar.statEnd} suffix="+" />
                    </div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-4">{pillar.statLabel}</p>
                    <div className={`w-16 h-16 ${pillar.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComp className="size-8 text-white animate-icon-float" />
                    </div>
                    <h3 className="text-xl font-black mb-3">{pillar.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{pillar.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────  TIMELINE SECTION  ────────────────── */

export function TimelineSection() {
  const milestones = [
    {
      year: "2014",
      milestone: "Founded in Kathmandu",
      description: "Deesha Foundation began with a simple commitment: serve communities that are often left behind.",
      icon: MapPin,
      badgeClass: "from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary-dark))]",
      yearClass: "bg-[rgb(var(--brand-primary))]",
    },
    {
      year: "2016",
      milestone: "First education program",
      description: "Our scholarship initiative opened classroom doors for 200+ students with limited access to learning.",
      icon: GraduationCap,
      badgeClass: "from-[rgb(var(--accent-education))] to-amber-500",
      yearClass: "bg-[rgb(var(--accent-education))]",
    },
    {
      year: "2018",
      milestone: "Health camps expanded",
      description: "Medical outreach scaled to 50+ remote villages, bringing care closer to families who needed it most.",
      icon: Stethoscope,
      badgeClass: "from-[rgb(var(--accent-empowerment))] to-pink-500",
      yearClass: "bg-[rgb(var(--accent-empowerment))]",
    },
    {
      year: "2020",
      milestone: "COVID-19 relief",
      description: "Emergency food, hygiene kits, and support reached 5,000+ families during Nepal's most urgent months.",
      icon: Heart,
      badgeClass: "from-[rgb(var(--accent-environment))] to-lime-500",
      yearClass: "bg-[rgb(var(--accent-environment))]",
    },
    {
      year: "2022",
      milestone: "10,000 lives impacted",
      description: "A decade of trust, partnerships, and consistent fieldwork transformed lives across communities.",
      icon: Globe,
      badgeClass: "from-[#6F3E96] to-[#6F3E96]",
      yearClass: "bg-[#6F3E96]",
    },
    {
      year: "2024",
      milestone: "New horizons",
      description: "We are now expanding into art, podcasting, and digital literacy to shape future-ready communities.",
      icon: BookOpen,
      badgeClass: "from-[#F7C52B] to-[#F7C52B]",
      yearClass: "bg-[#F7C52B]",
    },
  ]

  const desktopPositions = [
    { top: "10%", left: "61%", width: "35%" },
    { top: "27%", left: "64%", width: "33%" },
    { top: "43%", left: "40%", width: "44%" },
    { top: "61%", left: "8%", width: "43%" },
    { top: "75%", left: "55%", width: "41%" },
    { top: "88%", left: "8%", width: "43%" },
  ]

  return (
    <section className="py-20 md:py-24 relative overflow-hidden bg-[linear-gradient(180deg,#f6f3ed_0%,#fbfaf7_100%)]">
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: "radial-gradient(circle, rgba(63,171,222,0.22) 2px, transparent 2px)", backgroundSize: "42px 42px" }} />
      <div className="absolute -left-28 top-8 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal animation="fade-up">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Our Journey</span>
            <div className="mx-auto w-full max-w-4xl">
              <BrushStroke
                color="#6F3E96"
                animate={true}
                animationDuration={1.2}
                className="mx-auto"
                style={{ minHeight: 150 }}
              >
                <div className="py-4 md:py-5 px-3 md:px-10 flex items-center justify-center">
                  <h2 className="text-2xl sm:text-3xl md:text-[3.1rem] font-black text-white leading-none tracking-tight text-center whitespace-nowrap">
                    Together, We Are Changing Lives
                  </h2>
                </div>
              </BrushStroke>
            </div>
            <p className="text-lg text-foreground/70 leading-relaxed">
              Every year added a new layer of impact. From local beginnings to national outreach, these milestones trace how hope turned into measurable change.
            </p>
          </div>
        </ScrollReveal>

        <div className="hidden lg:block mt-10 relative h-[1380px]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 1380" fill="none" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M705 185 C 860 180, 885 300, 730 365 C 610 415, 630 560, 458 610 C 300 655, 225 760, 74 845 C 130 945, 430 965, 614 1020 C 745 1065, 395 1135, 74 1225"
              stroke="#3FABDE"
              strokeWidth="4"
              strokeDasharray="8 10"
              strokeLinecap="round"
            />
            <circle cx="730" cy="365" r="7" fill="#3FABDE" />
            <circle cx="458" cy="610" r="7" fill="#3FABDE" />
            <circle cx="74" cy="845" r="7" fill="#3FABDE" />
            <circle cx="614" cy="1020" r="7" fill="#3FABDE" />
            <circle cx="74" cy="1225" r="7" fill="#3FABDE" />
          </svg>

          <ScrollReveal animation="fade-right" delay={80}>
            <article className="absolute left-0 top-0 w-[57%] rounded-[2rem] overflow-hidden border border-white/70 shadow-[0_38px_72px_-48px_rgba(15,23,42,0.7)]">
              <Image
                src="/OurImpactThroughTheYear.png"
                alt="Our Impact Through the Years"
                width={760}
                height={520}
                className="h-[470px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[2.35rem] leading-none font-black text-white mb-3">11 Years of Impact</p>
                <div className="grid grid-cols-3 gap-2.5">
                  <div
                    className="rounded-2xl p-3 text-white"
                    style={{ background: "linear-gradient(90deg, rgb(var(--brand-primary-dark) / 0.95) 0%, rgb(var(--brand-primary) / 0.95) 100%)" }}
                  >
                    <p className="text-[1.85rem] font-black font-comic-num leading-none">10,000+</p>
                    <p className="text-xs mt-1 uppercase tracking-wide text-white/90">Lives Transformed</p>
                  </div>
                  <div
                    className="rounded-2xl p-3 text-white"
                    style={{ background: "linear-gradient(90deg, rgb(var(--accent-education) / 0.95) 0%, rgb(245 158 11 / 0.95) 100%)" }}
                  >
                    <p className="text-[1.85rem] font-black font-comic-num leading-none">50+</p>
                    <p className="text-xs mt-1 uppercase tracking-wide text-white/90">Villages Reached</p>
                  </div>
                  <div
                    className="rounded-2xl p-3 text-white"
                    style={{ background: "linear-gradient(90deg, rgb(var(--accent-environment) / 0.95) 0%, rgb(132 204 22 / 0.95) 100%)" }}
                  >
                    <p className="text-[1.85rem] font-black font-comic-num leading-none">200+</p>
                    <p className="text-xs mt-1 uppercase tracking-wide text-white/90">Students Supported</p>
                  </div>
                </div>
              </div>
            </article>
          </ScrollReveal>

          {milestones.map((item, i) => {
            const IconComp = item.icon

            return (
              <ScrollReveal key={item.year} animation={i % 2 === 0 ? "fade-left" : "fade-right"} delay={140 + i * 80}>
                <article
                  className="absolute rounded-[1.8rem] bg-white/95 backdrop-blur border border-white/90 p-4 shadow-[0_24px_46px_-34px_rgba(15,23,42,0.68)]"
                  style={desktopPositions[i]}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`size-14 rounded-full bg-gradient-to-br ${item.badgeClass} text-white shadow-lg ring-4 ring-white flex items-center justify-center`}>
                      <IconComp className="size-6" />
                    </div>

                    <span className={`inline-flex items-center rounded-full ${item.yearClass} text-white text-sm font-black px-4 py-1.5 font-comic-num shadow-sm`}>
                      {item.year}
                    </span>
                  </div>

                  <h4 className="text-[1.65rem] leading-[1.08] font-black text-slate-800 mb-1.5">
                    {item.milestone}
                  </h4>
                  <p className="text-[1rem] leading-7 text-slate-600">
                    {item.description}
                  </p>
                </article>
              </ScrollReveal>
            )
          })}
        </div>

        <div className="lg:hidden mt-10 relative pl-7 space-y-4">
          <div className="absolute left-[9px] top-0 bottom-0 w-[3px] rounded-full bg-primary/20" />

          <ScrollReveal animation="fade-up">
            <article className="rounded-3xl overflow-hidden border border-primary/15 bg-white shadow-lg">
              <div className="relative h-[260px]">
                <Image
                  src="/OurImpactThroughTheYear.png"
                  alt="Our Impact Through the Years"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/20 to-transparent" />
                <p className="absolute left-4 bottom-3 text-3xl font-black text-white">11 Years of Impact</p>
              </div>
            </article>
          </ScrollReveal>

          {milestones.map((item, i) => {
            const IconComp = item.icon

            return (
              <ScrollReveal key={item.year} animation="fade-up" delay={i * 80}>
                <article className="relative rounded-2xl border border-primary/15 bg-white/95 p-4 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.6)]">
                  <span className={`absolute -left-9 top-6 size-7 rounded-full ${item.yearClass} ring-4 ring-white`} />
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`size-9 rounded-full bg-gradient-to-br ${item.badgeClass} text-white flex items-center justify-center`}>
                      <IconComp className="size-4" />
                    </div>
                    <span className={`inline-flex items-center rounded-full ${item.yearClass} text-white text-xs font-black px-3 py-1 font-comic-num`}>
                      {item.year}
                    </span>
                  </div>
                  <h4 className="font-black text-foreground text-lg leading-tight">
                    {item.milestone}
                  </h4>
                  <p className="text-sm leading-relaxed text-foreground/70 mt-1.5">
                    {item.description}
                  </p>
                </article>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────  TESTIMONIALS SECTION  ────────────────── */

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sita Sharma",
      role: "Parent, Kathmandu",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      quote: "Deessa Foundation changed my daughter's life. She now attends school regularly and dreams of becoming a teacher. The scholarship program gave us hope when we had none.",
      rating: 5,
    },
    {
      name: "Ram Bahadur Thapa",
      role: "Village Elder, Gorkha",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      quote: "The health camp organized by Deesha brought medical care to our remote village for the first time in years. Over 200 families received treatment. We are forever grateful.",
      rating: 5,
    },
    {
      name: "Maya Gurung",
      role: "Volunteer, Pokhara",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
      quote: "Volunteering with Deesha has been the most rewarding experience of my life. Seeing the smiles on children's faces when they receive books and supplies is priceless.",
      rating: 5,
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-muted relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-12">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-4">
              Voices of Impact
            </h2>
            <p className="text-foreground/60 text-lg max-w-2xl mx-auto">
              Hear from the people whose lives have been touched by our work
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <ScrollReveal key={testimonial.name} animation="fade-up" delay={idx * 150}>
              <div className="bg-background rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                <div className="text-primary/20 mb-4">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                  </svg>
                </div>

                <p className="text-foreground/80 leading-relaxed mb-6 flex-grow italic">
                  "{testimonial.quote}"
                </p>

                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-500 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-foreground/60">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────  PARTNERS SECTION  ────────────────── */

// Partner Logo Components as SVGs
const WorldVisionLogo = () => (
  <svg viewBox="0 0 120 50" className="h-12 md:h-14 w-auto" fill="currentColor">
    <circle cx="15" cy="25" r="8" className="text-blue-600" />
    <text x="28" y="30" className="text-xs font-bold" fill="currentColor">World Vision</text>
  </svg>
)

const SaaltLogo = () => (
  <svg viewBox="0 0 80 50" className="h-12 md:h-14 w-auto" fill="currentColor">
    <text x="5" y="30" className="text-xl font-bold lowercase" fill="#2D5F3F">saalt</text>
  </svg>
)

const ActionAidLogo = () => (
  <svg viewBox="0 0 110 50" className="h-12 md:h-14 w-auto">
    <circle cx="15" cy="25" r="10" fill="#E63946" />
    <text x="30" y="30" className="text-xs font-bold" fill="currentColor">ActionAid</text>
  </svg>
)

const RealMedicineLogo = () => (
  <svg viewBox="0 0 180 50" className="h-12 md:h-14 w-auto">
    <rect x="5" y="15" width="18" height="18" rx="3" fill="#8B4513" />
    <text x="28" y="30" className="text-[10px] font-bold" fill="currentColor">Real Medicine Foundation</text>
  </svg>
)

const PedalHealthLogo = () => (
  <svg viewBox="0 0 120 50" className="h-12 md:h-14 w-auto">
    <path d="M15 25 L22 18 L22 32 Z" fill="#4CAF50" />
    <text x="28" y="30" className="text-xs font-bold" fill="currentColor">PedalHealth</text>
  </svg>
)

const WorldBicycleLogo = () => (
  <svg viewBox="0 0 160 50" className="h-12 md:h-14 w-auto">
    <circle cx="12" cy="30" r="7" stroke="#FF6B35" strokeWidth="2" fill="none" />
    <circle cx="28" cy="30" r="7" stroke="#FF6B35" strokeWidth="2" fill="none" />
    <text x="40" y="30" className="text-[10px] font-bold" fill="currentColor">World Bicycle Relief</text>
  </svg>
)

const UBCLogo = () => (
  <svg viewBox="0 0 80 50" className="h-14 md:h-16 w-auto">
    <rect x="10" y="10" width="35" height="30" rx="2" fill="#003366" />
    <text x="18" y="30" className="text-base font-bold" fill="white">UBC</text>
  </svg>
)

const BuildingEqualityLogo = () => (
  <svg viewBox="0 0 180 50" className="h-12 md:h-14 w-auto">
    <rect x="5" y="15" width="12" height="18" fill="#6A4C93" />
    <rect x="19" y="12" width="12" height="21" fill="#6A4C93" />
    <text x="36" y="30" className="text-[10px] font-bold" fill="currentColor">Building Equality</text>
  </svg>
)

const LSSLogo = () => (
  <svg viewBox="0 0 80 50" className="h-14 md:h-16 w-auto">
    <rect x="10" y="10" width="38" height="28" rx="3" fill="#2E7D32" />
    <text x="18" y="30" className="text-base font-bold" fill="white">LSS</text>
  </svg>
)

const RedCrossLogo = () => (
  <svg viewBox="0 0 100 50" className="h-12 md:h-14 w-auto">
    <rect x="15" y="15" width="7" height="18" fill="#E63946" />
    <rect x="11" y="19" width="15" height="7" fill="#E63946" />
    <text x="30" y="30" className="text-xs font-bold" fill="currentColor">Red Cross</text>
  </svg>
)

const UNICEFLogo = () => (
  <svg viewBox="0 0 90 50" className="h-12 md:h-14 w-auto">
    <circle cx="15" cy="20" r="9" fill="#00AEEF" />
    <path d="M11 25 L15 29 L19 25" stroke="white" strokeWidth="2" fill="none" />
    <text x="8" y="43" className="text-[10px] font-bold" fill="currentColor">UNICEF</text>
  </svg>
)

const WorldBankLogo = () => (
  <svg viewBox="0 0 110 50" className="h-12 md:h-14 w-auto">
    <circle cx="15" cy="25" r="10" fill="#009FDA" />
    <text x="30" y="30" className="text-xs font-bold" fill="currentColor">World Bank</text>
  </svg>
)

const SaveChildrenLogo = () => (
  <svg viewBox="0 0 140 50" className="h-12 md:h-14 w-auto">
    <circle cx="15" cy="25" r="9" fill="#E2231A" />
    <text x="28" y="30" className="text-xs font-bold" fill="currentColor">Save the Children</text>
  </svg>
)

const OxfamLogo = () => (
  <svg viewBox="0 0 90 50" className="h-12 md:h-14 w-auto">
    <circle cx="15" cy="25" r="9" fill="#61A534" />
    <text x="28" y="30" className="text-xs font-bold" fill="currentColor">Oxfam</text>
  </svg>
)

const RotaryLogo = () => (
  <svg viewBox="0 0 150 50" className="h-12 md:h-14 w-auto">
    <circle cx="15" cy="25" r="9" fill="#17458F" />
    <text x="28" y="30" className="text-xs font-bold" fill="currentColor">Rotary International</text>
  </svg>
)

const CareInternationalLogo = () => (
  <svg viewBox="0 0 140 50" className="h-12 md:h-14 w-auto">
    <rect x="5" y="15" width="18" height="18" rx="3" fill="#0066A6" />
    <text x="28" y="30" className="text-xs font-bold" fill="currentColor">Care International</text>
  </svg>
)

export function PartnersSection() {
  const partners = [
    { name: "World Vision", Component: WorldVisionLogo },
    { name: "saalt", Component: SaaltLogo },
    { name: "ActionAid", Component: ActionAidLogo },
    { name: "Real Medicine Foundation", Component: RealMedicineLogo },
    { name: "PedalHealth", Component: PedalHealthLogo },
    { name: "World Bicycle Relief", Component: WorldBicycleLogo },
    { name: "UBC", Component: UBCLogo },
    { name: "Building Equality", Component: BuildingEqualityLogo },
    { name: "LSS", Component: LSSLogo },
    { name: "Red Cross", Component: RedCrossLogo },
    { name: "UNICEF", Component: UNICEFLogo },
    { name: "World Bank", Component: WorldBankLogo },
    { name: "Save the Children", Component: SaveChildrenLogo },
    { name: "Oxfam", Component: OxfamLogo },
    { name: "Rotary International", Component: RotaryLogo },
    { name: "Care International", Component: CareInternationalLogo },
  ]

  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-[linear-gradient(180deg,#fffaf4_0%,#f7fbff_100%)]">
      <div className="absolute inset-0 pointer-events-none opacity-55" style={{ backgroundImage: "radial-gradient(circle, rgba(63,171,222,0.08) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[#F7C52B]/10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Our Network</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-6">
              Partners <span className="font-normal">&</span> Sponsors
            </h2>
            <div className="max-w-3xl mx-auto mb-8">
              <h3 className="text-xl md:text-2xl font-bold text-primary mb-3">Making the Impossible Possible</h3>
              <p className="text-foreground/70 leading-relaxed">
                We extend our heartfelt gratitude to our generous donors. Your support is transforming lives and creating lasting opportunities for communities in need. Thank you to our partners who believe in our mission and help us build a brighter future.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <div className="relative mx-auto max-w-[1600px] px-0 sm:px-0 lg:px-0">
        <div className="relative overflow-hidden py-6 md:py-8">
          <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-[#fffaf4] to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#f7fbff] to-transparent pointer-events-none z-10" />

          <div className="flex items-center gap-12 animate-marquee py-3 md:gap-16" style={{ width: "max-content" }}>
          {[...partners, ...partners, ...partners].map((partner, i) => {
            const LogoComponent = partner.Component
            return (
              <div
                key={`partner-${i}`}
                className="group flex-none flex items-center justify-center px-2 py-1 transition-transform duration-300 hover:scale-[1.06]"
                title={partner.name}
              >
                <div className="flex items-center justify-center text-slate-800/95 transition-opacity duration-300 group-hover:opacity-100 opacity-90">
                  <LogoComponent />
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────  CONTACT SECTION (RESTORED)  ────────────────── */

export function ContactSection() {
  const contactItems = [
    { icon: MapPin, title: "Address", line1: "Dhobighat Nayabato, Sanepa, Lalitpur 44600", line2: "Nepal" },
    { icon: Phone, title: "Phone", line1: "+977-1-XXXXXXX", line2: null },
    { icon: Mail, title: "Email", line1: "deessa.social@gmail.com", line2: null },
    { icon: Clock, title: "Office Hours", line1: "Sun - Fri: 10:00 AM - 5:00 PM", line2: "Saturday: Closed" },
  ]

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Find Us</span>
            <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4">
              Visit Our Office
            </h2>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            {contactItems.map((item, i) => {
              const IconComp = item.icon
              return (
                <ScrollReveal key={item.title} animation="fade-right" delay={i * 120}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <IconComp className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-black text-foreground mb-1">{item.title}</h3>
                      <p className="text-foreground/70">{item.line1}</p>
                      {item.line2 && <p className="text-foreground/50 text-sm">{item.line2}</p>}
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
          <ScrollReveal animation="scale-in" delay={200}>
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-border h-[380px] md:h-[460px] lg:h-[520px]">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent("Dhobighat Nayabato, Sanepa, Lalitpur 44600, Nepal")}&output=embed&z=16`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Deessa Foundation Office Location — Dhobighat Nayabato, Sanepa, Lalitpur 44600"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────  GLOBAL ENHANCEMENTS  ────────────────── */

export function GlobalEnhancements() {
  return (
    <>
      <BackToTop />
    </>
  )
}
