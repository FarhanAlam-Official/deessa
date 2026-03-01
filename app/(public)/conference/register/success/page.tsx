import Link from "next/link"
import { Mic } from "lucide-react"
import { getConferenceSettings } from "@/lib/actions/conference-settings"

export const metadata = {
  title: "Registration Confirmed | DEESSA National Conference 2026",
}

interface SuccessPageProps {
  searchParams: Promise<{ id?: string; name?: string; email?: string }>
}

export default async function RegistrationSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams
  
  // Safe decode helper to prevent crashes from malformed URL params
  const safeDecode = (str: string | undefined, fallback: string): string => {
    if (!str) return fallback
    try {
      return decodeURIComponent(str)
    } catch {
      return fallback
    }
  }

  const registrationId = params.id ?? ""
  const name = safeDecode(params.name, "Attendee")
  const email = safeDecode(params.email, "")
  const firstName = name.split(" ")[0]
  const shortId = registrationId
    ? `DEESSA-2026-${registrationId.slice(0, 6).toUpperCase()}`
    : "DEESSA-2026-??????"
  // Calendar links — built server-side (no client JS needed)
  const cfg = await getConferenceSettings()
  const gcalTitle = encodeURIComponent(cfg.name)
  // Format ISO dates to YYYYMMDD for Google Calendar (end date = day after)
  const gcalStart = cfg.dateStart.replace(/-/g, "")
  const gcalEnd = (() => {
    const d = new Date(cfg.dateEnd)
    d.setUTCDate(d.getUTCDate() + 1)
    return d.toISOString().slice(0, 10).replace(/-/g, "")
  })()
  const gcalDates = `${gcalStart}/${gcalEnd}`
  const gcalLocation = encodeURIComponent(cfg.venue)
  const gcalDetails = encodeURIComponent(
    `Registration ID: ${shortId}\nJoin leaders from across Nepal for three days of innovation, connection, and hands-on learning.`,
  )
  const gcalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalDates}&location=${gcalLocation}&details=${gcalDetails}`

  return (
    <>
      <style>{`
        @keyframes ping-slow { 75%,100%{transform:scale(2);opacity:0} }
        @keyframes ping-slower { 75%,100%{transform:scale(1.8);opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes check-pop { 0%{transform:scale(0) rotate(-45deg);opacity:0} 70%{transform:scale(1.15) rotate(5deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes shimmer-move { 0%{left:-100%} 100%{left:200%} }
        .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0,0,.2,1) infinite; }
        .animate-ping-slower { animation: ping-slower 2.5s cubic-bezier(0,0,.2,1) infinite 0.4s; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-fade-up { animation: fade-up 0.6s ease-out both; }
        .animate-fade-up-1 { animation: fade-up 0.6s ease-out 0.1s both; }
        .animate-fade-up-2 { animation: fade-up 0.6s ease-out 0.2s both; }
        .animate-fade-up-3 { animation: fade-up 0.6s ease-out 0.3s both; }
        .animate-check-pop { animation: check-pop 0.5s cubic-bezier(.17,.67,.36,1.2) 0.2s both; }
        .ticket-tear::before {
          content:'';position:absolute;left:0;right:0;top:0;height:2px;
          background:radial-gradient(circle at center, transparent 70%, var(--border-color,#e2e8f0) 70%) repeat-x;
          background-size:12px 12px;
        }
        .shimmer-line { position:relative;overflow:hidden; }
        .shimmer-line::after {
          content:'';position:absolute;top:0;bottom:0;width:40%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);
          animation: shimmer-move 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Full-page gradient background */}
      <div className="relative min-h-[calc(100vh-96px)] overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 size-[480px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-[360px] rounded-full bg-primary/10 blur-[100px]" />
        {/* Subtle dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center px-4 pt-16 pb-24 sm:px-6">
          <div className="w-full max-w-[600px] flex flex-col items-center gap-10">

            {/* ── Hero Check Icon ── */}
            <div className="animate-fade-up flex flex-col items-center gap-6 text-center">
              {/* Pulsing rings + icon */}
              <div className="relative flex items-center justify-center">
                <span className="animate-ping-slow absolute inline-flex size-28 rounded-full bg-primary/20" />
                <span className="animate-ping-slower absolute inline-flex size-20 rounded-full bg-primary/25" />
                <div className="animate-float relative z-10 flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-2xl shadow-primary/40">
                  <svg
                    className="animate-check-pop size-12 text-white drop-shadow-md"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Heading */}
              <div className="animate-fade-up-1 flex flex-col gap-3">
                <div className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
                  <span className="size-2 rounded-full bg-green-500 shadow-[0_0_6px_2px_rgba(22,163,74,0.5)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Registration Completed
                  </span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  Welcome aboard, <br />
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {firstName}!
                  </span>
                </h1>
                <p className="mx-auto max-w-md text-lg text-foreground-muted">
                  Your seat at the{" "}
                  <span className="font-semibold text-foreground">{cfg.name}</span>{" "}
                  is secured. See you in Kathmandu!
                </p>
              </div>
            </div>

            {/* ── Ticket-style Summary Card ── */}
            <div className="animate-fade-up-2 w-full">
              <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/10">
                {/* Shimmer bar on top */}
                <div className="shimmer-line h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

                {/* Top section */}
                <div className="flex flex-col gap-6 p-8">
                  {/* Event info */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        {cfg.name}
                      </p>
                      <p className="text-2xl font-bold text-foreground">{cfg.dateDisplay}</p>
                      <p className="text-sm text-foreground-muted">{cfg.venue}</p>
                    </div>
                    {/* QR placeholder */}
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-muted text-xs text-foreground-muted font-mono">
                      QR
                    </div>
                  </div>

                  {/* Registration details grid */}
                  <div className="grid grid-cols-2 gap-4 rounded-2xl bg-muted/50 p-5">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                        Registration ID
                      </p>
                      <p className="font-mono text-sm font-semibold text-foreground">{shortId}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                        Attendee Name
                      </p>
                      <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                        Confirmation Email
                      </p>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {email || "Your email"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                        Status
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-green-500 shadow-[0_0_6px_2px_rgba(22,163,74,0.4)]" />
                        <span className="text-sm font-semibold text-green-600">Confirmed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tear-off divider */}
                <div className="relative mx-6 flex items-center">
                  <div className="absolute -left-6 size-5 -translate-x-1/2 rounded-full bg-background border border-border" />
                  <div className="w-full border-t-2 border-dashed border-border" />
                  <div className="absolute -right-6 size-5 translate-x-1/2 rounded-full bg-background border border-border" />
                </div>

                {/* Bottom footer of ticket */}
                <div className="flex items-center justify-between gap-4 px-8 py-5">
                  <a
                    href={gcalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Add to Google Calendar
                  </a>
                  <p className="text-xs text-foreground-muted text-right">
                    A confirmation has been <br className="sm:hidden" />sent to your inbox.
                  </p>
                </div>
                {/* TODO: Add real WhatsApp community link */}
                <div
                  className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 opacity-60 cursor-not-allowed"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-2xl shadow-sm transition-transform group-hover:scale-110">
                    💬
                  </div>
                  <div className="relative">
                    <p className="font-bold text-foreground">Join the Community</p>
                    <p className="text-xs text-foreground-muted">Connect with attendees on WhatsApp</p>
                  </div>
                  <svg className="relative ml-auto size-4 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Podcast Hub */}
                <Link
                  href="/podcasts"
                  className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 shadow-sm transition-transform group-hover:scale-110">
                    <Mic className="size-5 text-primary" />
                  </div>
                  <div className="relative">
                    <p className="font-bold text-foreground">Explore Podcast Hub</p>
                    <p className="text-xs text-foreground-muted">Pre-conference talks & insights</p>
                  </div>
                  <svg className="relative ml-auto size-4 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Support link */}
              <p className="text-center text-sm text-foreground-muted">
                Need to make changes?{" "}
                <Link href="/contact" className="font-semibold text-primary hover:underline">
                  Contact Support →
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
