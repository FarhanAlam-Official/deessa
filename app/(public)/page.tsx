import { SecretKeyListener } from "@/components/secret-key-listener"
import { HeroCarousel } from "@/components/hero-carousel"
import type { HeroSlide } from "@/components/hero-carousel"
import { HomeAccessibilityButton } from "@/components/home-accessibility-button"
import {
  OurStorySection,
  MissionVisionSection,
  ImpactStatsBar,
  ProgramsSection,
  TimelineSection,
  TestimonialsSection,
  PartnersSection,
  ContactSection,
  GlobalEnhancements,
} from "@/components/homepage-sections"

/* ──────────────────  STATIC DATA  ────────────────── */

const heroSlides: HeroSlide[] = [
  {
    image:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1920&q=85",
    title: "Hope for Every Child in Nepal",
    subtitle:
      "A society where everyone is understood, celebrated, and empowered. Join us in creating lasting change for children with autism and their families.",
    cta: "Start Donating",
    ctaHref: "/donate",
  },
  {
    image:
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1920&q=85",
    title: "Empowering 10,000+ Lives and Counting",
    subtitle:
      "From classrooms to clinics, your support reaches the communities that need it most. Together, we build a more inclusive Nepal.",
    cta: "See Our Impact",
    ctaHref: "/impact",
  },
  {
    image:
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1920&q=85",
    title: "Volunteer With Us - Stand With Nepal",
    subtitle:
      "Join our community of changemakers and see your effort transform villages firsthand. Your skills can change lives.",
    cta: "Get Involved",
    ctaHref: "/get-involved",
  },
  {
    image:
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1920&q=85",
    title: "Building Schools, Building Futures",
    subtitle:
      "50+ schools built and counting. Every classroom we build unlocks a generation of potential. Education is the key to lasting change.",
    cta: "Explore Programs",
    ctaHref: "/programs",
  },
]

/* ──────────────────  PAGE  ────────────────── */

export default async function HomePage() {
  return (
    <SecretKeyListener>
      {/* Accessibility Button - fixed on right side */}
      <HomeAccessibilityButton />

      {/* 1. HERO BANNER CAROUSEL */}
      <HeroCarousel slides={heroSlides} interval={6000} />

      {/* 2. IMPACT STATS BAR - NEW */}
      <ImpactStatsBar />

      {/* 3. OUR STORY */}
      <OurStorySection />

      {/* 4. MISSION, VISION, OBJECTIVES */}
      <MissionVisionSection />

      {/* 5. PROGRAMS (Consolidated Core Pillars + Explore Work) */}
      <ProgramsSection />

      {/* 6. TIMELINE */}
      <TimelineSection />

      {/* 7. TESTIMONIALS */}
      <TestimonialsSection />

      {/* 8. PARTNERS & SPONSORS */}
      <PartnersSection />

      {/* 9. CONTACT / VISIT OFFICE */}
      <ContactSection />

      {/* GLOBAL ENHANCEMENTS */}
      <GlobalEnhancements />
    </SecretKeyListener>
  )
}
