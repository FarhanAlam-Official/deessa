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

export const metadata: Metadata = {
  title: "About Us - Dessa Foundation",
  description: "Learn about our mission, vision, and the team behind Dessa Foundation working to empower Nepal.",
}

export default async function AboutPage() {
  const teamMembers = await getPublishedTeamMembers()

  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-150 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuC5xzHfv2hii0hZm5knPtqnBhBXuF43kiNX-3L6bPoaNWoNJhuaBEp0UnvkJbxD_8jxmQHLjE0b1j-TMOJq_VOIrW9983EZgYM46P8MAwn7PzfzaLz2HsWKlKvt5lKXcXf_b6vms2V8NcnXaz9-_X8SNQsr6s7_GyimSfmkpcQ4Oh5YRcHnl1A7tisgSR5H6pZkE2H_RJ7Ed4vN8OmKIZ2WhCp5LlGraRVM17Ryo2wWWdRDFec31aYUj8Kv479a7Hlv2NIwScl7Eek")`,
            }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
            <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Since 2015
            </span>
            <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tight mb-6">
              Our Story, Your Impact.
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-medium max-w-2xl leading-relaxed mb-8">
              We are dedicated to bridging the gap between potential and opportunity in Nepal&apos;s most remote
              communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="rounded-full h-12 px-8 shadow-xl shadow-primary/20">
                <Link href="#journey">Read Our Story</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full h-12 px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              >
                <Link href="/impact#reports">View Annual Reports</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <Section className="bg-surface">
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Our Journey</h2>
            <p className="text-foreground-muted mt-2">Milestones that defined our path.</p>
          </div>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border transform md:-translate-x-1/2" />
            {timeline.map((item, index) => (
              <div
                key={item.year}
                className="relative flex items-center justify-between mb-12"
              >
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
            ))}
          </div>
        </div>
      </Section>

      {/* Team Section - Now uses database data */}
      <Section className="bg-background" id="team">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Meet the Changemakers</h2>
          <p className="text-foreground-muted mt-2 max-w-2xl mx-auto">
            Our diverse team of passionate individuals working tirelessly on the ground and behind the scenes.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                name={member.name}
                role={member.role}
                bio={member.bio || ""}
                image={member.image || ""}
              />
            ))
          ) : (
            <div className="col-span-4 text-center py-12 text-foreground-muted">
              <p>Team information coming soon.</p>
            </div>
          )}
        </div>
      </Section>

      {/* Partners & Reports Section */}
      <Section className="bg-surface border-t border-border" id="partners">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-2xl font-bold text-foreground mb-8">Our Partners & Supporters</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[
                { Icon: Handshake, color: 'blue', from: 'from-blue-50', to: 'to-blue-100', hoverBorder: 'hover:border-blue-400', hoverShadow: 'hover:shadow-blue-500/20', hoverGradient: 'group-hover:from-blue-500/5 group-hover:to-blue-500/10', hoverIcon: 'group-hover:text-blue-600' },
                { Icon: Globe, color: 'green', from: 'from-green-50', to: 'to-green-100', hoverBorder: 'hover:border-green-400', hoverShadow: 'hover:shadow-green-500/20', hoverGradient: 'group-hover:from-green-500/5 group-hover:to-green-500/10', hoverIcon: 'group-hover:text-green-600' },
                { Icon: GraduationCap, color: 'purple', from: 'from-purple-50', to: 'to-purple-100', hoverBorder: 'hover:border-purple-400', hoverShadow: 'hover:shadow-purple-500/20', hoverGradient: 'group-hover:from-purple-500/5 group-hover:to-purple-500/10', hoverIcon: 'group-hover:text-purple-600' },
                { Icon: HeartPulse, color: 'rose', from: 'from-rose-50', to: 'to-rose-100', hoverBorder: 'hover:border-rose-400', hoverShadow: 'hover:shadow-rose-500/20', hoverGradient: 'group-hover:from-rose-500/5 group-hover:to-rose-500/10', hoverIcon: 'group-hover:text-rose-600' },
                { Icon: Droplet, color: 'cyan', from: 'from-cyan-50', to: 'to-cyan-100', hoverBorder: 'hover:border-cyan-400', hoverShadow: 'hover:shadow-cyan-500/20', hoverGradient: 'group-hover:from-cyan-500/5 group-hover:to-cyan-500/10', hoverIcon: 'group-hover:text-cyan-600' },
                { Icon: Trees, color: 'emerald', from: 'from-emerald-50', to: 'to-emerald-100', hoverBorder: 'hover:border-emerald-400', hoverShadow: 'hover:shadow-emerald-500/20', hoverGradient: 'group-hover:from-emerald-500/5 group-hover:to-emerald-500/10', hoverIcon: 'group-hover:text-emerald-600' },
              ].map((partner, index) => {
                const { Icon, from, to, hoverBorder, hoverShadow, hoverGradient, hoverIcon } = partner;
                return (
                  <div
                    key={index}
                    className={`group relative h-28 bg-gradient-to-br ${from} ${to} dark:from-background dark:to-surface rounded-2xl flex items-center justify-center border-2 border-border/50 ${hoverBorder} transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl ${hoverShadow} hover:-translate-y-1`}
                  >
                    {/* Background gradient effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent ${hoverGradient} transition-all duration-300`} />
                    
                    {/* Icon with animation */}
                    <Icon className={`relative size-12 text-foreground-muted/60 ${hoverIcon} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`} />
                    
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute -inset-full top-0 block h-full w-1/2 transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 group-hover:animate-[shimmer_1.5s_ease-in-out]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="lg:w-1/2" id="reports">
            <h2 className="text-2xl font-bold text-foreground mb-8">Transparency & Reports</h2>
            <div className="flex flex-col gap-4">
              {[
                { title: "Annual Report 2023", size: "2.4 MB" },
                { title: "Financial Statement 2023", size: "1.1 MB" },
                { title: "Impact Assessment Q4 2023", size: "890 KB" },
              ].map((report) => (
                <div
                  key={report.title}
                  className="flex items-center p-4 bg-background rounded-xl border border-border hover:shadow-md transition-shadow"
                >
                  <div className="bg-red-100 p-3 rounded-lg text-primary mr-4">
                    <FileText className="size-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{report.title}</h3>
                    <p className="text-sm text-foreground-muted">PDF • {report.size}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                    <Download className="size-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
      {/* Resources & Documentation */}
      <Section className="bg-background">
        <div className="text-center mb-12">
          <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Resources</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Official Documents & Materials
          </h3>
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
