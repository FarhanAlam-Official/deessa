import type { Metadata } from "next"
import Link from "next/link"
import {
  Flag,
  Eye,
  Heart,
  Download,
  FileText,
  Handshake,
  Globe,
  GraduationCap,
  HeartPulse,
  Droplet,
  Trees,
} from "lucide-react"
import { Section } from "@/components/ui/section"
import { TeamMemberCard } from "@/components/ui/team-member-card"
import { Button } from "@/components/ui/button"
import { getPublishedTeamMembers } from "@/lib/data/team"
import { timeline } from "@/data/timeline"
import { ResourceDownloads } from "@/components/resource-downloads"
import { AboutHero } from "@/components/about-hero"

export const metadata: Metadata = {
  title: "Who We Are - Deessa Foundation",
  description: "Learn about our mission, vision, and the team behind Deessa Foundation working to empower Nepal.",
}

export default async function AboutPage() {
  const teamMembers = await getPublishedTeamMembers()

  return (
    <>
      {/* Hero Section — Split layout with Framer Motion */}
      <AboutHero />

      {/* Introduction */}
      <Section className="bg-[#f8f6f1]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Who We Are</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Rooted in Community, Driven by Change.
          </h3>
          <p className="text-foreground-muted text-lg leading-relaxed">
            Founded in 2015, Dessa Foundation is a non-profit organization rooted in the belief that sustainable change
            comes from within the community. We work hand-in-hand with local leaders to bridge gaps in education,
            healthcare, and economic opportunity across the Himalayas. We don&apos;t just build structures; we build
            capabilities.
          </p>
        </div>
      </Section>

      {/* Mission / Vision / Values */}
      <Section className="bg-background">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-8 rounded-xl shadow-sm border border-border group hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <Flag className="size-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">Our Mission</h2>
            <p className="text-foreground-muted">
              To empower marginalized communities through sustainable education, health, and livelihood initiatives,
              ensuring every voice is heard.
            </p>
          </div>
          <div className="bg-surface p-8 rounded-xl shadow-sm border border-border group hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <Eye className="size-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">Our Vision</h2>
            <p className="text-foreground-muted">
              A self-reliant Nepal where every individual, regardless of background, has the opportunity to live with
              dignity, hope, and prosperity.
            </p>
          </div>
          <div className="bg-surface p-8 rounded-xl shadow-sm border border-border group hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <Heart className="size-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">Our Values</h2>
            <p className="text-foreground-muted">
              Integrity, Compassion, and Sustainability are the pillars that guide every decision we make and every
              project we undertake.
            </p>
          </div>
        </div>
      </Section>

      {/* Timeline / Journey */}
      <Section className="bg-surface" id="journey">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Transparency Reports <span className="font-normal">&</span> Documents</h2>
            <p className="text-foreground-muted mt-2">Milestones that defined our path.</p>
          </div>
          <div className="relative">
            <div className="absolute left-[14px] md:left-1/2 top-0 bottom-0 w-0.5 bg-border transform md:-translate-x-1/2" />
            {timeline.map((item, index) => (
              <div
                key={item.year}
                className="relative mb-12"
              >
                {/* Mobile layout: stacked left-aligned */}
                <div className="flex items-start gap-6 md:hidden">
                  {/* Dot */}
                  <div className="mt-1 w-4 h-4 bg-surface border-4 border-primary rounded-full z-10 shrink-0" />
                  {/* Content */}
                  <div>
                    <h3 className="text-2xl font-bold text-primary">{item.year}</h3>
                    <h4 className="text-xl font-bold text-foreground mt-1">{item.title}</h4>
                    <p className="text-foreground-muted mt-2">{item.description}</p>
                  </div>
                </div>

                {/* Desktop layout: zigzag */}
                <div className="hidden md:flex md:items-center md:justify-between">
                  {/* Left side content (even indexes: 0, 2, 4...) */}
                  <div className={`w-5/12 ${index % 2 === 0 ? "text-right pr-8" : ""}`}>
                    {index % 2 === 0 && (
                      <>
                        <h3 className="text-2xl font-bold text-primary">{item.year}</h3>
                        <h4 className="text-xl font-bold text-foreground mt-1">{item.title}</h4>
                        <p className="text-foreground-muted mt-2">{item.description}</p>
                      </>
                    )}
                  </div>

                  {/* Center dot */}
                  <div className="w-4 h-4 bg-surface border-4 border-primary rounded-full z-10 shrink-0" />

                  {/* Right side content (odd indexes: 1, 3, 5...) */}
                  <div className={`w-5/12 ${index % 2 === 1 ? "text-left pl-8" : ""}`}>
                    {index % 2 === 1 && (
                      <>
                        <h3 className="text-2xl font-bold text-primary">{item.year}</h3>
                        <h4 className="text-xl font-bold text-foreground mt-1">{item.title}</h4>
                        <p className="text-foreground-muted mt-2">{item.description}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Team Section - Now uses database data */}
      <Section className="bg-background" id="team">
        <div className="text-center mb-16">
          <span className="text-primary font-bold tracking-wider uppercase text-xs mb-3 block">Our People</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Meet the Changemakers</h2>
          <p className="text-foreground-muted mt-3 max-w-2xl mx-auto">
            Our diverse team of passionate individuals working tirelessly on the ground and behind the scenes.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[ 
            { 
              name: "Bikram Thapa", 
              role: "Program Director", 
              bio: "Leading education initiatives across rural Nepal.",
              image: "/deesa-resources/changeMaker1.jpeg"
            },
            { 
              name: "Rejina Gharti Magar", 
              role: "Community Lead", 
              bio: "Building sustainable communities through grassroots engagement.",
              image: "/deesa-resources/changeMaker2.jpeg"
            },
            { 
              name: "Deepak Bashyal", 
              role: "Health Coordinator", 
              bio: "Bringing healthcare access to remote villages.",
              image: "/deesa-resources/changeMaker3.jpeg"
            },
          ].map((member, index) => (
            <div key={index} className="group">
              <div className="bg-surface rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300">
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-bold text-lg">{member.name}</h3>
                    <p className="text-white/80 text-sm">{member.role}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-foreground-muted text-sm">{member.bio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Partners & Reports Section */}
      <Section className="bg-gradient-to-b from-surface via-surface to-background" id="partners">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Partners Section */}
          <div className="lg:w-1/2">
            <div className="mb-8">
              <span className="text-primary font-bold tracking-wider uppercase text-xs mb-2 block">Collaboration</span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Our Partners <span className="font-normal">&</span> Supporters</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { Icon: Handshake, label: 'Partnerships', color: 'blue', bg: 'bg-blue-50', iconColor: 'text-blue-500', border: 'border-blue-100' },
                { Icon: Globe, label: 'Global NGOs', color: 'green', bg: 'bg-green-50', iconColor: 'text-green-500', border: 'border-green-100' },
                { Icon: GraduationCap, label: 'Education', color: 'purple', bg: 'bg-purple-50', iconColor: 'text-purple-500', border: 'border-purple-100' },
                { Icon: HeartPulse, label: 'Healthcare', color: 'rose', bg: 'bg-rose-50', iconColor: 'text-rose-500', border: 'border-rose-100' },
                { Icon: Droplet, label: 'Water', color: 'cyan', bg: 'bg-cyan-50', iconColor: 'text-cyan-500', border: 'border-cyan-100' },
                { Icon: Trees, label: 'Environment', color: 'emerald', bg: 'bg-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100' },
              ].map((partner, index) => {
                const { Icon, label, bg, iconColor, border } = partner;
                return (
                  <div
                    key={index}
                    className={`group relative bg-white rounded-xl border ${border} p-5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer`}
                  >
                    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center ${iconColor} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="size-6" />
                    </div>
                    <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reports Section */}
          <div className="lg:w-1/2" id="reports">
            <div className="mb-8">
              <span className="text-primary font-bold tracking-wider uppercase text-xs mb-2 block">Transparency</span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Transparency <span className="font-normal">&</span> Reports</h2>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { title: "Annual Report 2023", size: "2.4 MB", year: "2023" },
                { title: "Financial Statement 2023", size: "1.1 MB", year: "2023" },
                { title: "Impact Assessment Q4 2023", size: "890 KB", year: "2023" },
              ].map((report) => (
                <div
                  key={report.title}
                  className="group flex items-center p-4 bg-white rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mr-4 transition-colors group-hover:bg-primary group-hover:text-white">
                    <FileText className="size-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm">{report.title}</h3>
                    <p className="text-xs text-foreground-muted">PDF • {report.size}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-foreground-muted group-hover:bg-primary group-hover:text-white transition-all">
                    <Download className="size-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Resources & Documentation */}
      <Section className="bg-gradient-to-b from-background via-surface/50 to-background">
        <div className="text-center mb-12">
          <span className="text-primary font-bold tracking-wider uppercase text-xs mb-3 block">Resources</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Official Documents & Materials
          </h2>
          <p className="text-foreground-muted text-lg max-w-2xl mx-auto">
            Access our organizational documents, brand guidelines, and registration certificates.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <ResourceDownloads />
        </div>
      </Section>
      {/* CTA Section */}
      <section className="bg-foreground py-20">
        <div className="max-w-300 mx-auto px-4 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Make a Difference?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Whether through volunteering, donating, or simply spreading the word, your involvement is crucial to our
            mission.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="rounded-full h-12 px-8">
              <Link href="/donate">Donate Now</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full h-12 px-8 bg-transparent border-gray-600 text-white hover:bg-white hover:text-foreground"
            >
              <Link href="/get-involved">Join Our Team</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
