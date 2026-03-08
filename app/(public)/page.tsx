import { SecretKeyListener } from "@/components/secret-key-listener"
import { HeroCarousel } from "@/components/hero-carousel"
import type { HeroSlide } from "@/components/hero-carousel"
import { HomeFAQs } from "@/components/home-faqs"
import { HomeAccessibilityButton } from "@/components/home-accessibility-button"
import { HomeTestimonialsSlider } from "@/components/home-testimonials-slider"
import {
  OurStorySection,
  MissionVisionSection,
  EducationQuoteSection,
  ExploreWorkSection,
  CorePillarsSection,
  TimelineSection,
  AdvocacySection,
  JoinMovementSection,
  PodcastSection,
  PartnersSection,
  WhereWeWorkSection,
  ShopSection,
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
      "A society where everyone is understood, celebrated, and empowered.",
    cta: "Start Donating",
    ctaHref: "/donate",
  },
  {
    image:
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1920&q=85",
    title: "Empowering 10,000+ Lives — and Counting",
    subtitle:
      "From classrooms to clinics, your support reaches the communities that need it most.",
    cta: "See Our Impact",
    ctaHref: "/impact",
  },
  {
    image:
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1920&q=85",
    title: "Volunteer With Us — Stand With Nepal",
    subtitle:
      "Join our community of changemakers and see your effort transform villages firsthand.",
    cta: "Get Involved",
    ctaHref: "/get-involved",
  },
  {
    image:
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1920&q=85",
    title: "Building Schools, Building Futures",
    subtitle:
      "50+ schools built and counting. Every classroom we build unlocks a generation of potential.",
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

      {/* ── 1. HERO BANNER CAROUSEL ── */}
      <HeroCarousel slides={heroSlides} interval={6000} />

      {/* ── 2. OUR STORY ── */}
      <OurStorySection />

      {/* ── 3. MISSION, VISION, OBJECTIVES ── */}
      <MissionVisionSection />

      {/* ── 3b. EDUCATION QUOTE HIGHLIGHT ── */}
      <EducationQuoteSection />

      {/* ── 4. EXPLORE OUR WORK ── */}
      <ExploreWorkSection />

      {/* ── 5. CORE PILLARS ── */}
      <CorePillarsSection />

      {/* ── 6. TIMELINE ── */}
      <TimelineSection />

      {/* ── 6b. ADVOCACY & RECOGNITION ── */}
      <AdvocacySection />

      {/* ── 7. TESTIMONIALS SLIDER ── */}
      <HomeTestimonialsSlider />

      {/* ── 8. JOIN THE MOVEMENT ── */}
      <JoinMovementSection />

      {/* ── 9. FEATURED PODCAST ── */}
      <PodcastSection />

      {/* ── 10. PARTNERS & SPONSORS ── */}
      <PartnersSection />

      {/* ── 11. WHERE WE WORK ── */}
      <WhereWeWorkSection />

      {/* ── 12. FAQs ── */}
      <HomeFAQs />

      {/* ── 13. SHOP OUR STORE ── */}
      <ShopSection />

      {/* ── 14. CONTACT / VISIT OFFICE ── */}
      <ContactSection />

      {/* ── GLOBAL ENHANCEMENTS ── */}
      <GlobalEnhancements />
    </SecretKeyListener>
  )
}
