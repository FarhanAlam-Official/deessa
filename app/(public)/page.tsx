import { SecretKeyListener } from "@/components/secret-key-listener"
import { HeroCarousel } from "@/components/hero-carousel"
import type { HeroSlide } from "@/components/hero-carousel"
import { HomeAccessibilityButton } from "@/components/home-accessibility-button"
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
  TestimonialsSection,
  WhereWeWorkSection,
  ShopSection,
  ContactSection,
  GlobalEnhancements,
} from "@/components/homepage-sections"

/* ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ  STATIC DATA  ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

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
    title: "Empowering 10,000+ Lives ΓÇö and Counting",
    subtitle:
      "From classrooms to clinics, your support reaches the communities that need it most.",
    cta: "See Our Impact",
    ctaHref: "/impact",
  },
  {
    image:
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1920&q=85",
    title: "Volunteer With Us ΓÇö Stand With Nepal",
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

/* ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ  PAGE  ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

export default async function HomePage() {
  return (
    <SecretKeyListener>
      {/* Accessibility Button - fixed on right side */}
      <HomeAccessibilityButton />

      {/* ΓöÇΓöÇ 1. HERO BANNER CAROUSEL ΓöÇΓöÇ */}
      <HeroCarousel slides={heroSlides} interval={6000} />

      {/* ΓöÇΓöÇ 2. OUR STORY ΓöÇΓöÇ */}
      <OurStorySection />

      {/* ΓöÇΓöÇ 3. MISSION, VISION, OBJECTIVES ΓöÇΓöÇ */}
      <MissionVisionSection />

      {/* ΓöÇΓöÇ 3b. EDUCATION QUOTE HIGHLIGHT ΓöÇΓöÇ */}
      <EducationQuoteSection />

      {/* ΓöÇΓöÇ 4. EXPLORE OUR WORK ΓöÇΓöÇ */}
      <ExploreWorkSection />

      {/* ΓöÇΓöÇ 5. CORE PILLARS ΓöÇΓöÇ */}
      <CorePillarsSection />

      {/* ΓöÇΓöÇ 6. TIMELINE ΓöÇΓöÇ */}
      <TimelineSection />

      {/* ΓöÇΓöÇ 6b. ADVOCACY & RECOGNITION ΓöÇΓöÇ */}
      <AdvocacySection />

      {/* ΓöÇΓöÇ 7. TESTIMONIALS ΓöÇΓöÇ */}
      <TestimonialsSection />

      {/* ΓöÇΓöÇ 8. JOIN THE MOVEMENT ΓöÇΓöÇ */}
      <JoinMovementSection />

      {/* ΓöÇΓöÇ 9. FEATURED PODCAST ΓöÇΓöÇ */}
      <PodcastSection />

      {/* ΓöÇΓöÇ 10. PARTNERS & SPONSORS ΓöÇΓöÇ */}
      <PartnersSection />

      {/* ΓöÇΓöÇ 11. WHERE WE WORK ΓöÇΓöÇ */}
      <WhereWeWorkSection />

      {/* ΓöÇΓöÇ 12. SHOP OUR STORE ΓöÇΓöÇ */}
      <ShopSection />

      {/* ΓöÇΓöÇ 14. CONTACT / VISIT OFFICE ΓöÇΓöÇ */}
      <ContactSection />

      {/* ΓöÇΓöÇ GLOBAL ENHANCEMENTS ΓöÇΓöÇ */}
      <GlobalEnhancements />
    </SecretKeyListener>
  )
}
