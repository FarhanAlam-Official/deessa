"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Heart, ArrowRight, GraduationCap, MapPin, Stethoscope,
  Podcast, Palette, BookOpen, ChevronRight, ShoppingBag,
  Phone, Clock, Mail, Shield, Home as HomeIcon, Target, Eye, Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/ui/section"
import {
  ScrollReveal,
  CountUp,
  StaggerChildren,
  ScrollProgressBar,
  BackToTop,
} from "@/components/scroll-animations"

/* ──────────────────  DATA (re-exported from page)  ────────────────── */

interface CorePillar {
  icon: typeof GraduationCap
  title: string
  description: string
  color: string
  glowClass: string
  stat: string
  statLabel: string
  statEnd: number
}

const corePillars: CorePillar[] = [
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

const exploreWorkCards = [
  {
    icon: Podcast,
    title: "Podcast",
    description: "Listen to stories of impact, interviews with changemakers, and discussions on social issues.",
    href: "/podcasts",
    color: "from-purple-500 to-indigo-600",
    borderColor: "bg-purple-500",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=85",
  },
  {
    icon: Palette,
    title: "Art Workshop",
    description: "Creative expression programs that empower communities through art, culture, and storytelling.",
    href: "/programs",
    color: "from-pink-500 to-rose-600",
    borderColor: "bg-pink-500",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=85",
  },
  {
    icon: BookOpen,
    title: "Training",
    description: "Skill development workshops that equip individuals with tools for sustainable livelihoods.",
    href: "/programs",
    color: "from-amber-500 to-orange-600",
    borderColor: "bg-amber-500",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=85",
  },
]

const impactYears = [
  { year: "2014", milestone: "Founded in Kathmandu", description: "Deessa Foundation was born from a passion to serve." },
  { year: "2016", milestone: "First education program", description: "Launched scholarship programs reaching 200+ students." },
  { year: "2018", milestone: "Health camps expanded", description: "Medical outreach to 50+ remote villages across Nepal." },
  { year: "2020", milestone: "COVID-19 relief", description: "Emergency supplies distributed to 5,000+ families." },
  { year: "2022", milestone: "10,000 lives impacted", description: "A decade of transformation across communities." },
  { year: "2024", milestone: "New horizons", description: "Expanding programs into art, podcasting, and digital literacy." },
]

const partnerLogos = [
  { name: "UNICEF", color: "#009edb" },
  { name: "World Bank", color: "#009fda" },
  { name: "Save the Children", color: "#e2001a" },
  { name: "Oxfam", color: "#61a534" },
  { name: "Rotary International", color: "#17458f" },
  { name: "Plan International", color: "#e3000f" },
  { name: "World Vision", color: "#005c97" },
  { name: "Red Cross", color: "#ce1126" },
  { name: "ActionAid", color: "#e8502a" },
  { name: "Care International", color: "#0066a6" },
]

/* ──────────────────  ENHANCED SECTIONS  ────────────────── */

/** Section 2: Our Story */
export function OurStorySection() {
  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
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
                  <p className="text-4xl font-black">
                    <CountUp end={2014} prefix="" duration={1500} className="font-comic-num" />
                  </p>
                  <p className="text-sm font-bold opacity-90">Founded</p>
                </div>
              </ScrollReveal>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fade-left" delay={200}>
            <div>
              <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Our Story</span>
              <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight tracking-tight mb-6">
                How Deessa Started
              </h2>
              <p className="text-lg text-foreground/70 leading-relaxed mb-6">
                Born from a deep passion for social justice and a belief in the power of community, Deessa Foundation
                was established in 2014 in Kathmandu, Nepal. What began as a small group of dedicated individuals
                has grown into a movement touching thousands of lives.
              </p>
              <p className="text-lg text-foreground/70 leading-relaxed mb-8">
                Our founders saw the gaps in education, healthcare, and opportunity across rural Nepal and decided
                to act. Today, Deessa stands as a beacon of hope, building bridges between communities and the
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

/** Section 3: Mission, Vision & Objectives */
export function MissionVisionSection() {
  const cards = [
    { icon: Target, title: "Our Mission", color: "border-l-4 border-l-primary", iconBg: "bg-primary/10", iconColor: "text-primary", hoverBg: "group-hover:bg-primary/20", description: "To empower marginalized communities in Nepal through education, healthcare, and sustainable development, ensuring every individual has the opportunity to live with dignity and purpose." },
    { icon: Eye, title: "Our Vision", color: "border-l-4 border-l-blue-500", iconBg: "bg-blue-500/10", iconColor: "text-blue-500", hoverBg: "group-hover:bg-blue-500/20", description: "A Nepal where every community thrives — where children dream freely, families are healthy, and opportunities are within everyone's reach." },
    { icon: Flag, title: "Our Objectives", color: "border-l-4 border-l-green-500", iconBg: "bg-green-500/10", iconColor: "text-green-500", hoverBg: "group-hover:bg-green-500/20", description: "Build 100+ schools, reach 50,000+ lives through healthcare, empower 10,000+ women through skill development, and create lasting change in every district we serve." },
  ]

  return (
    <section className="py-20 md:py-28 bg-muted relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Our Direction</span>
            <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4">
              Mission, Vision <span className="text-primary/60 font-normal italic text-[0.7em] font-comic-num">&</span> Objectives
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
                      <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0 ${card.hoverBg} transition-colors`}>
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

/** Section 3b: Education Quote Highlight */
export function EducationQuoteSection() {
  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/[0.03]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal animation="fade-up">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
              <Image
                src="/deesa-resources/education%20quote%20by%20deessa.jpeg"
                alt="Open Doors to Education for All — Deessa Foundation"
                width={600}
                height={600}
                className="w-full h-auto object-cover"
              />
            </div>
            <div>
              <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Our Belief</span>
              <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight tracking-tight mb-6">
                Open Doors to <span className="text-primary">Education</span> for All
              </h2>
              <p className="text-lg text-foreground/70 leading-relaxed mb-6">
                Education is a universal right. By removing barriers, we ensure that children with autism 
                and other challenges have equal access to learning opportunities.
              </p>
              <p className="text-foreground/60 leading-relaxed mb-8">
                At Deessa Foundation, we believe every child deserves the chance to learn, grow, and dream without limits. 
                Our inclusive education programs are breaking down barriers and building bridges to brighter futures.
              </p>
              <Link
                href="/programs"
                className="group inline-flex items-center gap-2 font-bold text-primary hover:text-primary/80 transition-colors text-lg"
              >
                Explore Our Programs
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-2 duration-300" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

/** Section 4: Explore Our Work */
export function ExploreWorkSection() {
  return (
    <Section>
      <ScrollReveal animation="fade-up">
        <div className="text-center mb-16">
          <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Discover</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4">
            Explore Our Work
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            From podcasts to art workshops to training programs — see how we&apos;re creating impact.
          </p>
        </div>
      </ScrollReveal>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {exploreWorkCards.map((card, idx) => {
          const IconComp = card.icon
          return (
            <ScrollReveal key={card.title} animation="fade-up" delay={idx * 150}>
              <Link href={card.href} className="group block">
                <div className="relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 h-full hover-lift">
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className={`absolute inset-0 bg-linear-to-t ${card.color} opacity-80 group-hover:opacity-50 transition-opacity duration-500`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                        <IconComp className="size-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className={`h-1 w-full ${card.borderColor}`} />
                  <div className="p-6 bg-background">
                    <h3 className="text-xl font-black text-foreground mb-2 group-hover:text-primary transition-colors">{card.title}</h3>
                    <p className="text-foreground/60 text-sm leading-relaxed">{card.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-primary font-bold text-sm hover-underline-draw">
                      Learn More <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          )
        })}
      </div>
    </Section>
  )
}

/** Section 5: Core Pillars */
export function CorePillarsSection() {
  return (
    <section className="py-20 md:py-28 bg-foreground text-white relative overflow-hidden">
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

/** Section 6: Timeline */
export function TimelineSection() {
  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <ScrollReveal animation="fade-up">
              <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Our Journey</span>
              <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight tracking-tight mb-6">
                Together, We Are Changing Lives
              </h2>
              <p className="text-lg text-foreground/70 leading-relaxed mb-10">
                Over the years, every milestone has been a step towards a better Nepal. Here&apos;s our journey of impact.
              </p>
            </ScrollReveal>
            <div className="relative ml-6">
              {/* Timeline vertical line — on the left */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-primary/15">
                <div className="w-full rounded-full bg-primary animate-timeline-draw" />
              </div>
              <div className="space-y-8">
                {impactYears.map((item, i) => (
                  <ScrollReveal key={item.year} animation="fade-right" delay={i * 120}>
                    <div className="relative pl-10">
                      {/* Dot on the line */}
                      <div className="absolute left-0 top-1 -translate-x-[calc(50%-1.5px)] w-4 h-4 rounded-full bg-primary shadow-md shadow-primary/30 ring-4 ring-background z-10 hover:scale-125 transition-transform" />
                      {/* Year badge */}
                      <span className="inline-block text-xs font-black text-white bg-primary rounded-full px-3 py-1 mb-2 shadow-sm font-comic-num">
                        {item.year}
                      </span>
                      <h4 className="font-black text-foreground text-lg leading-tight">
                        {item.milestone.split(/([\d,]+)/).map((part, pi) =>
                          /[\d,]+/.test(part) ? <span key={pi} className="font-comic-num">{part}</span> : part
                        )}
                      </h4>
                      <p className="text-foreground/60 text-sm mt-1">
                        {item.description.split(/([\d,+]+)/).map((part, pi) =>
                          /[\d,+]+/.test(part) ? <span key={pi} className="font-comic-num">{part}</span> : part
                        )}
                      </p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
          <ScrollReveal animation="scale-in" delay={200}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/OurImpactThroughTheYear.png"
                alt="Our Impact Through the Years"
                width={700}
                height={600}
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

/** Section 6b: Advocacy & Recognition */
export function AdvocacySection() {
  return (
    <section className="py-20 md:py-28 bg-muted relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Recognition</span>
            <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4">
              Advocacy <span className="text-primary/60 font-normal italic text-[0.7em] font-comic-num">&</span> Awards
            </h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              Our commitment to sustainable development and inclusive communities continues to earn recognition.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* SDG Youth Award Card */}
          <ScrollReveal animation="fade-right" delay={100}>
            <div className="group relative rounded-3xl overflow-hidden bg-background border border-border shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="relative h-72 overflow-hidden">
                <Image
                  src="/deesa-resources/sustainableDevelopment%20Award%20to%20youths.jpeg"
                  alt="Sustainable Development Youth Award — Nepal Youth Convention"
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block bg-primary text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                    SDG Award
                  </span>
                  <h3 className="text-white text-lg font-black leading-tight">
                    Sustainable Development Youth Award
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-foreground/70 leading-relaxed mb-3">
                  <span className="font-comic-num">6</span> youth leaders honored with the {"\u2018"}Sustainable Development Promotion Youth Award{"\u2019"} at the Nepal Youth Convention, recognizing their exceptional contributions to SDG goals.
                </p>
                <p className="text-sm text-foreground/50">
                  Featured in Gorkhapatra — Nepal&apos;s national daily
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Autism Awareness Card */}
          <ScrollReveal animation="fade-left" delay={200}>
            <div className="group relative rounded-3xl overflow-hidden bg-background border border-border shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="relative h-72 overflow-hidden">
                <Image
                  src="/deesa-resources/CEOofSDGonAutism.jpeg"
                  alt="Pradeep Kumar Lamichhane — Autism Awareness Month advocacy"
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                    Autism Awareness
                  </span>
                  <h3 className="text-white text-lg font-black leading-tight">
                    Compassionate Policies for Inclusion
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-foreground/70 leading-relaxed mb-3">
                  Autism acceptance begins with understanding and evolves through compassionate policies — creating an inclusive and supportive society for individuals with autism.
                </p>
                <p className="text-sm text-foreground/50 italic">
                  — Pradeep Kumar Lamichhane, CEO, SDG Studio
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

/** Section 8: Join the Movement — FIXES BLURRY IMAGE */
export function JoinMovementSection() {
  return (
    <section className="relative text-white">
      {/* Full-width image — unprocessed, sharp */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/JoinTheMovement.png"
        alt="Join the movement"
        className="w-full h-auto block"
        loading="eager"
      />
      {/* CTA buttons pinned to the bottom of the image */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 md:pb-14 px-4 z-10">
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="rounded-full h-14 px-8 bg-white text-primary hover:bg-white/90 font-bold shadow-lg">
            <Link href="/donate">
              <Heart className="mr-2 size-5 fill-current" />
              Donate Now
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full h-14 px-8 bg-transparent border-white/50 text-white hover:bg-white/15 font-bold backdrop-blur-sm"
          >
            <Link href="/get-involved">Become a Volunteer</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full h-14 px-8 bg-transparent border-white/50 text-white hover:bg-white/15 font-bold backdrop-blur-sm"
          >
            <Link href="/contact">Partner With Us</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

/** Section 9: Podcast */
export function PodcastSection() {
  return (
    <section className="py-20 md:py-28 bg-foreground text-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <ScrollReveal animation="fade-right">
            <div>
              <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Listen Now</span>
              <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight mb-6">
                Listen to the Podcast
              </h2>
              <p className="text-lg text-white/60 leading-relaxed mb-8">
                Dive into conversations about community, resilience, and impact. Our podcast brings you stories directly
                from the people making change happen across Nepal.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-full h-14 px-8 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/30 animate-heartbeat">
                  <Link href="/podcasts">
                    <Podcast className="mr-2 size-5" />
                    Browse Episodes
                  </Link>
                </Button>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="scale-in" delay={200}>
            <div className="flex justify-center">
              <div className="relative w-48 h-48 lg:w-72 lg:h-72">
                {/* Radiating sound wave rings */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-sound-wave" />
                <div className="absolute inset-0 rounded-full border-2 border-primary/15 animate-sound-wave-delayed" />
                <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-sound-wave-delayed-2" />
                {/* Static ring */}
                <div className="absolute inset-8 rounded-full border-2 border-primary/30" />
                {/* Inner circle */}
                <div className="absolute inset-16 lg:inset-16 rounded-full bg-primary/10 border border-primary/40 backdrop-blur-sm flex items-center justify-center" style={{ inset: 'clamp(2rem, 22%, 4rem)' }}>
                  <Podcast className="size-10 lg:size-16 text-primary" />
                </div>
                {/* Waveform bars */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
                  {[1,2,3,4,5,6,7].map(n => (
                    <div
                      key={n}
                      className="w-1 bg-primary/40 rounded-full"
                      style={{
                        animation: `waveBar ${0.8 + n * 0.15}s ease-in-out infinite`,
                        animationDelay: `${n * 0.1}s`,
                        height: "4px",
                      }}
                    />
                  ))}
                </div>
                {/* Floating micro-dots */}
                <div className="absolute top-6 right-10 w-3 h-3 rounded-full bg-primary/50 animate-float-particle" />
                <div className="absolute bottom-10 left-8 w-2 h-2 rounded-full bg-primary/40 animate-float-particle" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 right-4 w-1.5 h-1.5 rounded-full bg-primary/60 animate-float-particle" style={{ animationDelay: "2s" }} />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

/** Section 10b: Testimonials */
export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-muted relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-12">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              Voices of Impact
            </h2>
          </div>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={150}>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src="/testimonials.png"
              alt="Testimonials from community members"
              width={1200}
              height={400}
              className="w-full h-auto object-contain bg-background"
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

/** Section 10: Partners & Sponsors */
export function PartnersSection() {
  return (
    <section className="py-16 md:py-24 bg-background border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <ScrollReveal animation="fade-up">
          <div className="text-center">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Our Network</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-4">
              Partners <span className="text-primary/60 font-normal italic text-[0.7em] font-comic-num">&</span> Sponsors
            </h2>
          </div>
        </ScrollReveal>
      </div>
      <ScrollReveal animation="fade-up" delay={150}>
        <div className="relative mb-8">
          <Image
            src="/SponsersAndPartnerships.png"
            alt="Our Partners and Sponsors"
            width={1200}
            height={300}
            className="w-full max-w-5xl mx-auto h-auto object-contain px-4"
          />
        </div>
      </ScrollReveal>
      {/* Single colorful marquee */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="flex items-center gap-6 animate-marquee" style={{ width: "max-content" }} aria-hidden="true">
          {[...partnerLogos, ...partnerLogos].map((partner, i) => (
            <div
              key={`fwd-${partner.name}-${i}`}
              className="flex-none flex items-center gap-3 px-5 py-3 rounded-full bg-muted border border-border shadow-sm hover:shadow-md transition-all duration-300"
            >
              <span className="w-3 h-3 rounded-full flex-none" style={{ backgroundColor: partner.color }} />
              <span className="text-sm font-bold text-foreground/70 whitespace-nowrap">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Section 11: Where We Work */
export function WhereWeWorkSection() {
  const stats = [
    { value: 120, suffix: "+", label: "Villages Reached" },
    { value: 25, suffix: "+", label: "Districts Covered" },
    { value: 50, suffix: "+", label: "Schools Built" },
    { value: 10000, suffix: "+", label: "Lives Impacted" },
  ]

  return (
    <Section className="bg-muted">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <ScrollReveal animation="fade-right">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Our Reach</span>
            <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight tracking-tight mb-6">
              Where We Work
            </h2>
            <p className="text-lg text-foreground/70 leading-relaxed mb-6">
              From the hills of Gandaki to the plains of the Terai, Deessa Foundation works across Nepal to bring
              education, healthcare, and empowerment to communities that need it most.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.label} animation="fade-up" delay={i * 100}>
                <div className="bg-background rounded-2xl p-4 border border-border accent-border-teal hover-lift">
                  <p className="text-3xl font-black text-primary font-comic-num">
                    <CountUp end={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-foreground/60 font-bold">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
        <ScrollReveal animation="scale-in" delay={200}>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-background p-4">
            <Image
              src="/map.png"
              alt="Map of Nepal showing where Deessa Foundation works"
              width={700}
              height={500}
              className="w-full h-auto object-contain"
            />
            {/* Pulsing dot markers */}
            <div className="absolute top-[35%] left-[45%] w-3 h-3 rounded-full bg-primary animate-dot-pulse" />
            <div className="absolute top-[45%] left-[55%] w-3 h-3 rounded-full bg-primary animate-dot-pulse" style={{ animationDelay: "0.5s" }} />
            <div className="absolute top-[50%] left-[35%] w-3 h-3 rounded-full bg-primary animate-dot-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute top-[40%] left-[60%] w-2 h-2 rounded-full bg-primary animate-dot-pulse" style={{ animationDelay: "1.5s" }} />
          </div>
        </ScrollReveal>
      </div>
    </Section>
  )
}

/** Section 13: Shop Our Store */
export function ShopSection() {
  return (
    <section className="py-20 md:py-28 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Support Us</span>
            <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4">
              Shop Our Store
            </h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              Every purchase directly supports our programs. Wear your impact proudly.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={150}>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-12">
            <Image
              src="/Merchandise.png"
              alt="Deessa Foundation Merchandise"
              width={1200}
              height={500}
              className="w-full h-auto object-contain bg-background"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h3 className="text-2xl font-black mb-2">Deessa Merchandise Collection</h3>
              <p className="text-white/80 mb-4">T-shirts, bags, stickers and more — all for a cause.</p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={300}>
          <div className="text-center">
            <Button asChild size="lg" className="rounded-full h-14 px-8 group">
              <Link href="/contact">
                <ShoppingBag className="mr-2 size-5" />
                Shop Now
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

/** Section 14: Visit Office / Contact */
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

/** Global Wrappers: ScrollProgressBar + BackToTop */
export function GlobalEnhancements() {
  return (
    <>
      <ScrollProgressBar />
      <BackToTop />
    </>
  )
}
