import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { TrendingUp, Download, FileText, Users, MapPin, GraduationCap, Heart } from "lucide-react"
import { Section } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import { getPublishedStories } from "@/lib/data/stories"
import { impactStats } from "@/data/stats"

export const metadata: Metadata = {
  title: "Our Impact - Dessa Foundation",
  description:
    "See the measurable impact of our work in education, healthcare, and community empowerment across Nepal.",
}

const yearlyStats = [
  { year: "2021", beneficiaries: 3200, projects: 12, villages: 28 },
  { year: "2022", beneficiaries: 5800, projects: 18, villages: 45 },
  { year: "2023", beneficiaries: 12450, projects: 58, villages: 120 },
]

export default async function ImpactPage() {
  const stories = await getPublishedStories()

  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-[450px] relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuD7xPA5ZcI6zKmXhschYT9kJF4AqJ9KYyAa5qyutl1ZWv5adO6OvYLgL0wZmsSvQmp5iq8EBildkvodJmW6nQOiy52WDTtHveVZgJcxx0_cw_pXOEkv2E8ngXc8S6exY0flcsgm65QruhCVLREAaOyUXoPaJssWLYw4Gq3TRXCA6np2SOBQgIml3lxCiJQAcTos1hfbuZ1VmD0z_I8NvTTPYtKaIPbfibEi2YEU4fAP01FwBiwW62SkaoM5YiSpdS6RRW8rx6YqKo8")`,
            }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
            <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Transparency & Results
            </span>
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
              Measuring What Matters
            </h1>
            <p className="text-white/90 text-lg font-medium max-w-2xl leading-relaxed">
              Every number tells a story. See the real impact of your support on communities across Nepal.
            </p>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <Section className="bg-surface">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {impactStats.map((stat, index) => (
            <div
              key={index}
              className="bg-background p-8 rounded-2xl border border-border text-center group hover:shadow-lg transition-shadow"
            >
              <div className="text-5xl font-black text-primary mb-2">{stat.value}</div>
              <div className="text-foreground-muted font-bold uppercase tracking-wide text-sm mb-4">{stat.label}</div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Growth Over Years */}
      <Section className="bg-background">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Growing Impact Year Over Year</h2>
          <p className="text-foreground-muted max-w-2xl mx-auto">
            Our reach continues to expand as we work with more communities across Nepal.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {yearlyStats.map((year) => (
            <div
              key={year.year}
              className="bg-surface rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="size-6 text-primary" />
                <span className="text-2xl font-black text-foreground">{year.year}</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground-muted">
                    <Users className="size-4" />
                    <span>Beneficiaries</span>
                  </div>
                  <span className="font-bold text-foreground">{year.beneficiaries.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground-muted">
                    <GraduationCap className="size-4" />
                    <span>Projects</span>
                  </div>
                  <span className="font-bold text-foreground">{year.projects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground-muted">
                    <MapPin className="size-4" />
                    <span>Villages</span>
                  </div>
                  <span className="font-bold text-foreground">{year.villages}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Reports Section */}
      <Section className="bg-surface" id="reports">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Transparency Reports</h2>
            <p className="text-foreground-muted">
              Download our annual reports for detailed breakdowns of finances and impact.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              { title: "Annual Report 2023", size: "2.4 MB", year: "2023" },
              { title: "Financial Statement 2023", size: "1.1 MB", year: "2023" },
              { title: "Impact Assessment Q4 2023", size: "890 KB", year: "2023" },
              { title: "Annual Report 2022", size: "2.1 MB", year: "2022" },
            ].map((report) => (
              <div
                key={report.title}
                className="flex items-center p-5 bg-background rounded-xl border border-border hover:shadow-md transition-shadow"
              >
                <div className="bg-red-100 p-3 rounded-lg text-primary mr-4">
                  <FileText className="size-6" />
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
      </Section>

      {/* Success Stories Preview */}
      <Section className="bg-background">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Stories of Change</h2>
            <p className="text-foreground-muted mt-2">Real stories from the communities we serve.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full bg-transparent">
            <Link href="/stories">View All Stories</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.slice(0, 3).map((story) => (
            <article
              key={story.id}
              className="group bg-surface rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all"
            >
              <div className="aspect-[16/10] relative overflow-hidden">
                <Image
                  src={story.image || "/placeholder.svg"}
                  alt={story.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 text-foreground px-3 py-1 rounded-full text-xs font-bold">
                    {story.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {story.title}
                </h3>
                <p className="text-foreground-muted text-sm line-clamp-2">{story.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="bg-foreground py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heart className="size-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Be Part of Our Next Milestone</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Join thousands of supporters who are making these numbers possible.
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
              <Link href="/get-involved">Get Involved</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
