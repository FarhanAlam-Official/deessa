import Link from "next/link"

export const metadata = {
  title: "Registration Failed | DEESSA National Conference 2026",
}

interface FailurePageProps {
  searchParams: Promise<{ reason?: string; email?: string }>
}

export default async function RegistrationFailurePage({ searchParams }: FailurePageProps) {
  const params = await searchParams
  const reason = params.reason ? decodeURIComponent(params.reason) : null
  const email = params.email ? decodeURIComponent(params.email) : null

  return (
    <>
      <style>{`
        @keyframes shake { 
          0%,100%{transform:translateX(0)} 
          20%{transform:translateX(-6px) rotate(-2deg)} 
          40%{transform:translateX(6px) rotate(2deg)} 
          60%{transform:translateX(-4px) rotate(-1deg)} 
          80%{transform:translateX(4px) rotate(1deg)} 
        }
        @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.1);opacity:0.2} }
        .animate-shake { animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) 0.3s both; }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
        .animate-fade-up-1 { animation: fade-up 0.5s ease-out 0.1s both; }
        .animate-fade-up-2 { animation: fade-up 0.5s ease-out 0.2s both; }
        .animate-fade-up-3 { animation: fade-up 0.5s ease-out 0.3s both; }
        .pulse-ring { animation: pulse-ring 2s ease-in-out infinite; }
      `}</style>

      {/* Full page warm gradient */}
      <div className="relative min-h-[calc(100vh-96px)] overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/60 via-background to-orange-50/40" />
        <div className="pointer-events-none absolute -top-40 -right-40 size-[500px] rounded-full bg-red-100/40 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-[300px] rounded-full bg-orange-100/30 blur-[80px]" />
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center px-4 pt-16 pb-24 sm:px-6">
          <div className="w-full max-w-[560px] flex flex-col items-center gap-10">

            {/* ── Error Icon ── */}
            <div className="animate-fade-up flex flex-col items-center gap-6 text-center">
              <div className="relative flex items-center justify-center">
                {/* Outer ring */}
                <span className="pulse-ring absolute inline-flex size-32 rounded-full border-4 border-red-200/60" />
                <div className="animate-shake relative z-10 flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-2xl shadow-red-400/40">
                  <svg className="size-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>

              {/* Heading */}
              <div className="animate-fade-up-1 flex flex-col gap-3">
                <div className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-red-200 bg-red-50 px-4 py-1.5">
                  <span className="size-2 rounded-full bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.5)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                    Registration Failed
                  </span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  Oops, something <br />
                  <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    went wrong.
                  </span>
                </h1>
                <p className="mx-auto max-w-md text-lg text-foreground-muted">
                  We couldn&apos;t complete your registration for the{" "}
                  <span className="font-semibold text-foreground">
                    DEESSA National Conference 2026.
                  </span>
                  {" "}Don&apos;t worry — no data was saved.
                </p>
              </div>
            </div>

            {/* ── Error Detail Card ── */}
            <div className="animate-fade-up-2 w-full">
              <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-card shadow-xl shadow-red-100/50">
                {/* Top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-red-400 via-orange-400 to-red-400" />

                <div className="flex flex-col gap-6 p-8">
                  {/* Error reason (if available) */}
                  {reason && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/80 p-4">
                      <svg className="mt-0.5 size-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-red-700">Error Detail</p>
                        <p className="mt-0.5 text-sm text-red-600">{reason}</p>
                      </div>
                    </div>
                  )}

                  {/* What to do next steps */}
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                      What can you do?
                    </p>
                    {[
                      {
                        icon: "🔄",
                        title: "Try Again",
                        desc: "The issue is usually temporary. Go back and resubmit.",
                        action: { label: "Retry Registration", href: "/conference/register" },
                        highlight: true,
                      },
                      {
                        icon: "📧",
                        title: "Email Already Registered",
                        desc: email
                          ? `Check if ${email} is already signed up.`
                          : "Your email may already be registered for this conference.",
                        action: null,
                        highlight: false,
                      },
                      {
                        icon: "💬",
                        title: "Contact Support",
                        desc: "If the problem continues, our team can manually register you.",
                        action: { label: "Get Help", href: "/contact" },
                        highlight: false,
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className={`flex items-start gap-4 rounded-2xl p-4 ${
                          item.highlight ? "border-2 border-red-200 bg-red-50/50" : "border border-border bg-muted/30"
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${item.highlight ? "text-red-700" : "text-foreground"}`}>
                            {item.title}
                          </p>
                          <p className="text-sm text-foreground-muted">{item.desc}</p>
                        </div>
                        {item.action && (
                          <Link
                            href={item.action.href}
                            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                              item.highlight
                                ? "bg-red-500 text-white shadow-md shadow-red-200 hover:bg-red-600"
                                : "border border-border text-foreground hover:bg-muted"
                            }`}
                          >
                            {item.action.label}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Bottom links ── */}
            <div className="animate-fade-up-3 flex flex-col items-center gap-3 text-center">
              <Link
                href="/conference"
                className="flex items-center gap-2 text-sm font-semibold text-foreground-muted transition-colors hover:text-primary"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Back to Conference Page
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
