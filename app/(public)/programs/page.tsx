import type { Metadata } from "next"
import Link from "next/link"
import { ProgramsClient } from "./programs-client"

export const metadata: Metadata = {
  title: "Programs - Deessa Foundation",
  description: "From classrooms in Karnali to clinics in the Terai — our programs deliver sustainable education, healthcare, and empowerment across Nepal's most remote communities.",
}

// Hardcoded programs data
const programs = [
  {
    id: "education",
    category: "education",
    categoryLabel: "📚 EDUCATION",
    categoryColor: "bg-blue-500",
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&q=80",
    title: "Building Schools, Building Futures",
    description: "Constructing classrooms and training teachers to bring quality education to rural Nepal's children.",
    stat: "3,000+ Students Reached",
    slug: "education",
  },
  {
    id: "healthcare",
    category: "healthcare",
    categoryLabel: "🏥 HEALTHCARE",
    categoryColor: "bg-green-500",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
    title: "Bringing Medicine to the Mountains",
    description: "Mobile health camps, medical supplies, and trained health workers reaching 50+ remote villages.",
    stat: "200+ Health Camps Held",
    slug: "healthcare",
  },
  {
    id: "autism",
    category: "autism",
    categoryLabel: "🧩 AUTISM SUPPORT",
    categoryColor: "bg-orange-500",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80",
    title: "Every Mind Is a Gift",
    description: "Therapy, family counseling, and inclusive education programs for children with autism across Nepal.",
    stat: "847 Children Supported",
    slug: "autism-support",
  },
  {
    id: "empowerment",
    category: "empowerment",
    categoryLabel: "👩 EMPOWERMENT",
    categoryColor: "bg-purple-500",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80",
    title: "Women Who Lead, Communities That Thrive",
    description: "Skill development, microfinance access, and leadership training for women across 25 districts.",
    stat: "10,000+ Women Empowered",
    slug: "women-empowerment",
  },
  {
    id: "relief",
    category: "relief",
    categoryLabel: "🆘 RELIEF",
    categoryColor: "bg-red-500",
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&q=80",
    title: "Rebuilding After the Storm",
    description: "Emergency response, safe shelter construction, and community rebuilding after natural disasters.",
    stat: "5,000+ Families Helped",
    slug: "disaster-relief",
  },
  {
    id: "training",
    category: "training",
    categoryLabel: "🎨 TRAINING",
    categoryColor: "bg-teal-500",
    image: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=80",
    title: "Creative Expression, Lasting Skills",
    description: "Art workshops and vocational training programs that equip youth with tools for sustainable livelihoods.",
    stat: "500+ Youth Trained",
    slug: "art-training",
  },
]

export default function ProgramsPage() {
  return (
    <>
      {/* Hero Section - Immersive Photo Collage */}
      <section className="relative w-full overflow-hidden h-[100svh] md:h-[88vh]">
        {/* LAYER 1 - Photo Mosaic Background */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-[2px] bg-[#1a1a2e]">
          {/* Photo 1 - Large classroom (spans col 1-2, row 1) */}
          <div className="col-span-2 row-span-1 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=900&q=80"
              alt="Children learning in classroom"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.55) saturate(0.85)" }}
            />
          </div>

          {/* Photo 2 - Healthcare (col 3, row 1) */}
          <div className="col-span-1 row-span-1 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&q=80"
              alt="Doctor with patient"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.55) saturate(0.85)" }}
            />
          </div>

          {/* Photo 3 - Women empowerment (col 1, row 2) */}
          <div className="col-span-1 row-span-1 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80"
              alt="Women group empowerment"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.55) saturate(0.85)" }}
            />
          </div>

          {/* Photo 4 - Child learning (spans col 2-3, row 2) */}
          <div className="col-span-2 row-span-1 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=700&q=80"
              alt="Child learning"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.55) saturate(0.85)" }}
            />
          </div>
        </div>

        {/* LAYER 2 - Gradient Scrim */}
        <div
          className="absolute inset-0 z-[5]"
          style={{
            background:
              "linear-gradient(105deg, rgba(10, 15, 35, 0.92) 0%, rgba(10, 15, 35, 0.75) 38%, rgba(10, 15, 35, 0.30) 65%, rgba(10, 15, 35, 0.10) 100%)",
          }}
        />

        {/* Mobile darker overlay */}
        <div className="absolute inset-0 z-[5] bg-[rgba(10,15,35,0.88)] md:hidden" />

        {/* LAYER 3 - Content */}
        <div className="absolute left-[6%] top-1/2 -translate-y-1/2 z-10 max-w-[600px] px-4 md:px-0">
          {/* Breadcrumb */}
          <div className="mb-5 text-[13px] font-['DM_Sans'] text-white/45">Home › Programs</div>

          {/* Badge */}
          <div className="mb-[22px] text-[11px] font-['Comic_Neue'] tracking-widest text-[#29b6c8] border-l-[3px] border-[#29b6c8] pl-3">
            | MAKING A DIFFERENCE ACROSS NEPAL
          </div>

          {/* H1 */}
          <h1 className="mb-5 text-[48px] md:text-[64px] font-['Marissa'] leading-[1.08] text-white">
            <span className="block">Programs That</span>
            <span className="block">
              Change <span className="text-[#29b6c8]">Lives.</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-[17px] font-['DM_Sans'] text-white/76 max-w-[460px] leading-[1.7]">
            From classrooms in Karnali to clinics in Terai — sustainable education, healthcare, and empowerment
            reaching Nepal's most remote communities.
          </p>

          {/* Stats Row */}
          <div className="mb-8 flex flex-wrap gap-x-8 gap-y-4">
            {/* Stat 1 */}
            <div className="flex items-baseline gap-2">
              <span className="text-[40px] font-['Marissa'] text-[#29b6c8] leading-none">6</span>
              <span className="text-[13px] font-['DM_Sans'] text-white/60">Programs</span>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-[1px] bg-white/20 self-stretch" />

            {/* Stat 2 */}
            <div className="flex items-baseline gap-2">
              <span className="text-[40px] font-['Marissa'] text-[#29b6c8] leading-none">25+</span>
              <span className="text-[13px] font-['DM_Sans'] text-white/60">Districts</span>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-[1px] bg-white/20 self-stretch" />

            {/* Stat 3 */}
            <div className="flex items-baseline gap-2">
              <span className="text-[40px] font-['Marissa'] text-[#29b6c8] leading-none">10K+</span>
              <span className="text-[13px] font-['DM_Sans'] text-white/60">Lives Changed</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col md:flex-row gap-3.5">
            <a
              href="#programs"
              className="inline-block text-center px-7 py-3.5 rounded-full bg-[#29b6c8] text-white font-['Comic_Neue'] font-bold text-[15px] hover:bg-[#1a8fa0] hover:-translate-y-0.5 transition-all duration-300"
            >
              Explore Programs ↓
            </a>
            <Link
              href="/donate"
              className="inline-block text-center px-7 py-3.5 rounded-full border-[1.5px] border-white/55 text-white font-['Comic_Neue'] font-bold text-[15px] hover:border-white hover:bg-white/8 transition-all duration-300"
            >
              Donate to a Program →
            </Link>
          </div>
        </div>

        {/* LAYER 4 - Brush Stroke Bottom Transition */}
        <div className="absolute bottom-[-2px] left-0 w-full z-20 pointer-events-none">
          <svg
            viewBox="0 0 1440 90"
            preserveAspectRatio="none"
            className="block w-full h-[80px]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,32 C180,70 360,8 540,42 C720,72 900,10 1080,40 C1240,65 1360,18 1440,38 L1440,90 L0,90 Z"
              fill="#f8f6f1"
            />
            <path
              d="M0,48 C200,22 400,68 600,36 C800,8 1020,58 1200,28 C1320,10 1400,44 1440,26 L1440,90 L0,90 Z"
              fill="#f8f6f1"
              opacity="0.55"
            />
          </svg>
        </div>
      </section>

      {/* Programs Grid Section */}
      <section id="programs" className="bg-[#f8f6f1] py-12 md:py-18">
        <div className="max-w-6xl mx-auto px-4">
          <ProgramsClient programs={programs} />
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="relative bg-[#1a1a2e] overflow-hidden">
        {/* Top Brush Stroke Transition */}
        <div className="absolute top-0 left-0 right-0 h-20 z-10">
          <svg
            viewBox="0 0 1200 80"
            preserveAspectRatio="none"
            className="w-full h-full rotate-180"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,40 Q150,10 300,35 T600,40 T900,30 T1200,45 L1200,80 L0,80 Z"
              fill="#f8f6f1"
            />
          </svg>
        </div>

        <div className="relative z-20 py-16 md:py-20 px-4 text-center">
          <h2 className="text-[36px] sm:text-[44px] md:text-[52px] font-['Marissa'] text-white mb-3 md:mb-4 leading-tight px-4">
            Want to Support a Specific Program?
          </h2>
          <p className="text-[16px] md:text-[18px] font-['DM_Sans'] text-white/72 max-w-2xl mx-auto mb-10 md:mb-12 px-4">
            Your targeted donation ensures maximum impact in the area you care about most.
          </p>

          {/* 3 CTA Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
            {/* Card 1 */}
            <div className="bg-white/6 border border-white/12 rounded-2xl p-6 md:p-8 hover:border-[#29b6c8] hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-3 md:mb-4">❤️</div>
              <h3 className="text-[22px] md:text-[24px] font-['Marissa'] text-white mb-2 md:mb-3">Make a Donation</h3>
              <p className="text-[13px] md:text-[14px] font-['DM_Sans'] text-white/60 mb-5 md:mb-6 leading-relaxed">
                Fund education, healthcare, or autism support directly.
              </p>
              <Link
                href="/donate"
                className="inline-block px-5 md:px-6 py-2.5 md:py-3 rounded-full bg-[#29b6c8] text-white font-['Comic_Neue'] font-bold text-[13px] md:text-[14px] hover:bg-[#1a8fa0] transition-colors"
              >
                Donate Now
              </Link>
            </div>

            {/* Card 2 */}
            <div className="bg-white/6 border border-white/12 rounded-2xl p-6 md:p-8 hover:border-[#29b6c8] hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-3 md:mb-4">🤝</div>
              <h3 className="text-[22px] md:text-[24px] font-['Marissa'] text-white mb-2 md:mb-3">Become a Partner</h3>
              <p className="text-[13px] md:text-[14px] font-['DM_Sans'] text-white/60 mb-5 md:mb-6 leading-relaxed">
                Organizations partnering with us multiply impact across Nepal.
              </p>
              <Link
                href="/contact"
                className="inline-block px-5 md:px-6 py-2.5 md:py-3 rounded-full border-2 border-white text-white font-['Comic_Neue'] font-bold text-[13px] md:text-[14px] hover:bg-white/10 transition-colors"
              >
                Partner With Us
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-white/6 border border-white/12 rounded-2xl p-6 md:p-8 hover:border-[#29b6c8] hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-3 md:mb-4">🙌</div>
              <h3 className="text-[22px] md:text-[24px] font-['Marissa'] text-white mb-2 md:mb-3">Volunteer Your Skills</h3>
              <p className="text-[13px] md:text-[14px] font-['DM_Sans'] text-white/60 mb-5 md:mb-6 leading-relaxed">
                Join our team on the ground or offer remote support to our programs.
              </p>
              <Link
                href="/get-involved"
                className="inline-block px-5 md:px-6 py-2.5 md:py-3 rounded-full border-2 border-white text-white font-['Comic_Neue'] font-bold text-[13px] md:text-[14px] hover:bg-white/10 transition-colors"
              >
                Get Involved
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
