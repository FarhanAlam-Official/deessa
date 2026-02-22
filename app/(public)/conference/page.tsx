import Link from "next/link"
import { Calendar, MapPin, Mail, Users, Mic, BookOpen, Heart, Clock } from "lucide-react"
import { getConferenceSettings } from "@/lib/actions/conference-settings"

const WHY_ATTEND = [
  {
    icon: Mic,
    title: "Expert Speakers",
    description: "Learn directly from pioneers and thought leaders shaping the future of philanthropy.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: Users,
    title: "Networking",
    description: "Connect with peers through dedicated sessions and curated social events.",
    color: "text-accent-empowerment bg-empowerment/10",
  },
  {
    icon: BookOpen,
    title: "Hands-on Learning",
    description: "Participate in interactive workshops to build practical, career-defining skills.",
    color: "text-accent-education bg-education/10",
  },
  {
    icon: Heart,
    title: "Community Impact",
    description: "Discover how to drive meaningful, lasting change in your community.",
    color: "text-accent-environment bg-environment/10",
  },
]

export const metadata = {
  title: "DEESSA National Conference 2026 | DEESSA Foundation",
  description:
    "Join industry leaders at the DEESSA National Conference 2026. Three days of innovation, connection, and hands-on learning.",
}

// Build a Google Maps embed URL from a maps.app.goo.gl short link or any Google Maps URL
function buildEmbedUrl(mapsUrl: string): string {
  // If it's already an embed URL, return as-is
  if (mapsUrl.includes("google.com/maps/embed")) return mapsUrl
  // For short links or place URLs, use the place query approach via the URL itself
  const query = encodeURIComponent("Hyatt Regency Kathmandu, Taragaon, Bouddha, Kathmandu")
  return `https://www.google.com/maps/embed/v1/place?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&q=${query}`
}

export default async function ConferencePage() {
  const cfg = await getConferenceSettings()

  // Derive a "place" embed URL from the mapsUrl setting
  // We use the venueAddress as the search query to get a reliable embed
  const mapEmbedQuery = encodeURIComponent(`${cfg.venue}, ${cfg.venueAddress}`)
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapEmbedQuery}&output=embed&z=16`

  return (
    <div className="flex flex-col">
      {/* ── Hero Section ── */}
      <section className="w-full px-4 py-6 sm:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="relative overflow-hidden rounded-3xl gradient-ocean px-6 py-16 text-center shadow-xl sm:px-12 sm:py-24 md:text-left">
            {/* Pattern overlay */}
            <div
              className="absolute inset-0 opacity-10 mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative z-10 flex flex-col gap-6 md:max-w-2xl">
              {/* Badge */}
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-1 backdrop-blur-sm">
                <Calendar className="size-4 text-white" />
                <span className="text-xs font-semibold uppercase tracking-wide text-white">
                  {cfg.dateDisplay}
                </span>
                <span className="mx-1 h-3 w-px bg-white/40" />
                <span className="text-xs font-semibold uppercase tracking-wide text-white">
                  Hybrid Event
                </span>
              </div>

              <h1 className="font-marissa text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
                {cfg.name}
              </h1>

              <p className="max-w-lg text-lg font-medium text-white/90 sm:text-xl">
                Join leaders from across Nepal and beyond for three days of innovation, connection, and
                hands-on learning.
              </p>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/conference/register"
                  className="flex h-12 items-center justify-center rounded-xl bg-white px-8 text-base font-bold text-primary shadow-lg transition hover:bg-gray-50 active:scale-95"
                >
                  Register Now
                </Link>
                <a
                  href="#agenda"
                  className="flex h-12 items-center justify-center rounded-xl border border-white/30 bg-white/20 px-8 text-base font-bold text-white backdrop-blur-md transition hover:bg-white/30"
                >
                  View Agenda
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Attend ── */}
      <section className="w-full px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Why Attend</h2>
            <p className="mt-3 max-w-2xl text-lg text-foreground-muted">
              Experience a conference designed to elevate your professional journey and expand your
              impact.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_ATTEND.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className={`flex size-12 items-center justify-center rounded-full ${item.color}`}>
                  <item.icon className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-foreground-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agenda + Venue ── */}
      <section id="agenda" className="w-full bg-card px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Agenda */}
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Snapshot Agenda</h2>
                <p className="text-sm text-foreground-muted">A quick look at Day 1&apos;s schedule.</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-6">
                {cfg.agenda.map((item, idx) => (
                  <div key={`${item.time}-${idx}`} className="grid grid-cols-[40px_1fr] gap-x-4">
                    <div className="flex flex-col items-center pt-1">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full ${
                          item.active ? "bg-primary text-white" : "border border-border bg-card text-foreground-muted"
                        }`}
                      >
                        <Clock className="size-4" />
                      </div>
                      {idx < cfg.agenda.length - 1 && (
                        <div className="my-1 h-full w-0.5 bg-border" />
                      )}
                    </div>
                    <div className={idx < cfg.agenda.length - 1 ? "pb-8" : ""}>
                      <span
                        className={`text-xs font-semibold ${item.active ? "text-primary" : "text-foreground-muted"}`}
                      >
                        {item.time}
                      </span>
                      <h4 className="text-base font-bold text-foreground">{item.title}</h4>
                      <p className="text-sm text-foreground-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue & Contact */}
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Venue &amp; Contact</h2>
                <p className="text-sm text-foreground-muted">Everything you need to find us.</p>
              </div>
              <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                {/* Google Maps embed */}
                <div className="h-52 w-full overflow-hidden">
                  <iframe
                    title="Conference venue map"
                    src={mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-1 size-5 text-foreground-muted shrink-0" />
                      <div>
                        <h4 className="font-bold text-foreground">{cfg.venue}</h4>
                        <p className="text-sm text-foreground-muted">{cfg.venueAddress}</p>
                        <a
                          href={cfg.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                        >
                          Open in Google Maps →
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="mt-1 size-5 text-foreground-muted shrink-0" />
                      <div>
                        <h4 className="font-bold text-foreground">Email Us</h4>
                        <a
                          href={`mailto:${cfg.contactEmail}`}
                          className="text-sm text-foreground-muted hover:text-primary transition-colors"
                        >
                          {cfg.contactEmail}
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* Early bird reminder */}
                  <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🔔</span>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          Important Reminder
                        </span>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          Early bird registration closes on{" "}
                          <span className="font-bold">{cfg.registrationDeadline}</span>. Secure your spot today.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="w-full bg-primary px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to Join the Conversation?</h2>
          <p className="mt-3 text-white/80">
            Secure your seat at the {cfg.name}.
          </p>
          <Link
            href="/conference/register"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-white px-10 text-base font-bold text-primary shadow-lg transition hover:bg-gray-50 active:scale-95"
          >
            Register Now — Free
          </Link>
        </div>
      </section>
    </div>
  )
}
