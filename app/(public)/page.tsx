import {
  HeroSection,
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
  ShopSection,
  ContactSection,
  GlobalEnhancements,
} from "@/components/homepage-sections"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <OurStorySection />
      <MissionVisionSection />
      <EducationQuoteSection />
      <ExploreWorkSection />
      <CorePillarsSection />
      <TimelineSection />
      <AdvocacySection />
      <JoinMovementSection />
      <PodcastSection />
      <PartnersSection />
      <TestimonialsSection />
      <ShopSection />
      <ContactSection />
      <GlobalEnhancements />
    </main>
  )
}
