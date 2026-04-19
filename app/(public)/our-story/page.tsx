import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Brain, Eye, Flag, HandHeart, Heart, Lightbulb, Lock, Rocket, UserRoundX, Wallet } from "lucide-react"
import { BrushStroke } from "@/components/ui/brush-stroke"
import { AnimatedBrushQuote } from "./AnimatedBrushQuote"

export const metadata: Metadata = {
  title: "Our Story - deessa Foundation",
  description:
    "From personal struggles to a mission of inclusion and hope. Discover the heart of the deessa Foundation journey.",
}

const challengeCards = [
  {
    icon: Lock,
    title: "Limited Access",
    description:
      "Specialized care and diagnostic tools were often hundreds of miles away or locked behind endless waiting lists.",
    accent: "text-primary",
  },
  {
    icon: Wallet,
    title: "High Costs",
    description:
      "The financial burden of consistent therapy and inclusive education puts quality support out of reach for many.",
    accent: "text-empowerment",
  },
  {
    icon: UserRoundX,
    title: "Social Misconceptions",
    description:
      "Dealing with stigma and lack of understanding from society was often harder than the diagnosis itself.",
    accent: "text-chart-4",
  },
]

const timelineItems = [
  {
    year: "2021: The Realization",
    text: "The seed of deessa was planted during late-night discussions about the lack of accessible resources in Nepal's remote regions.",
    icon: Lightbulb,
    color: "bg-primary",
    textColor: "text-primary",
  },
  {
    year: "2022: Building Community",
    text: "We began connecting with specialists and parents, realizing that a unified platform for advocacy was essential.",
    icon: HandHeart,
    color: "bg-empowerment",
    textColor: "text-empowerment",
  },
  {
    year: "2023: Official Launch",
    text: "deessa Foundation was officially established, focusing on education, health equity, and social inclusion.",
    icon: Rocket,
    color: "bg-chart-4",
    textColor: "text-chart-4",
  },
]

const impact = [
  {
    icon: Brain,
    from: "From confusion",
    to: "to clarity",
    text: "Empowering families with knowledge and clear diagnostic paths.",
    color: "text-primary",
  },
  {
    icon: Heart,
    from: "From stigma",
    to: "to acceptance",
    text: "Promoting awareness and celebrating every unique ability.",
    color: "text-empowerment",
  },
  {
    icon: HandHeart,
    from: "From isolation",
    to: "to support",
    text: "Building networks of support so no family walks alone.",
    color: "text-chart-4",
  },
]

export default function OurStoryPage() {
  return (
    <main className="bg-background text-foreground">
      <section className="relative flex min-h-[82svh] items-center justify-center overflow-hidden px-6 pb-24 pt-20 md:px-8">
        {/* BACKGROUND IMAGE WITH FILTER */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/OurStoryHeroImage.png"
            alt="Our Story hero background"
            fill
            className="object-cover"
            style={{ 
              objectPosition: "center center",
              filter: "brightness(0.65) saturate(1.1)",
            }}
            priority
          />
          {/* DARK GRADIENT SCRIM OVERLAY */}
          <div 
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(10, 15, 35, 0.55) 0%, rgba(10, 15, 35, 0.35) 50%, rgba(10, 15, 35, 0.70) 100%)"
            }} 
          />
        </div>

        {/* TEXT CONTENT */}
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <span 
            className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider sm:text-sm"
            style={{ color: "#29b6c8", backgroundColor: "rgba(41, 182, 200, 0.12)" }}
          >
            Our Origins
          </span>
          <h1 
            className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl md:text-7xl"
            style={{ color: "white" }}
          >
            The Story Behind
            <br />
            deessa Foundation
          </h1>
          <p 
            className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed md:text-2xl"
            style={{ color: "rgba(255, 255, 255, 0.82)" }}
          >
            From personal struggles to a mission of inclusion and hope.
            <br className="hidden md:block" />
            Discover the heart of our journey.
          </p>
        </div>

        {/* BRUSH STROKE SVG DIVIDER */}
        <div
          className="absolute bottom-[-2px] left-0 w-full pointer-events-none"
          style={{ zIndex: 20, lineHeight: 0 }}
        >
          <svg
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block", width: "100%", height: "clamp(50px, 6vw, 90px)" }}
          >
            {/* Main brush edge */}
            <path
              d="M0,38 C120,72 240,18 380,52 C500,80 620,12 760,44 C880,70 1000,8 1140,38 C1260,62 1360,22 1440,42 L1440,100 L0,100 Z"
              fill="#f8f6f1"
            />
            {/* Texture layer, semi-transparent */}
            <path
              d="M0,55 C150,28 300,68 440,38 C570,10 700,62 840,35 C970,10 1100,58 1240,30 C1330,12 1400,48 1440,32 L1440,100 L0,100 Z"
              fill="#f8f6f1"
              opacity="0.55"
            />
            {/* Bristle marks left edge */}
            <path
              d="M0,38 C-8,32 -12,42 -6,50 C-2,55 8,52 0,58"
              fill="#f8f6f1"
              opacity="0.6"
            />
            {/* Bristle marks right edge */}
            <path
              d="M1440,42 C1448,36 1452,46 1446,54 C1442,59 1432,56 1440,62"
              fill="#f8f6f1"
              opacity="0.6"
            />
            {/* Top bristle drips */}
            <path d="M320,52 C318,38 322,28 325,24 C323,32 324,44 320,52" fill="#f8f6f1" opacity="0.35" />
            <path d="M740,44 C738,28 742,16 745,12 C743,22 744,36 740,44" fill="#f8f6f1" opacity="0.3" />
            <path d="M1100,38 C1098,24 1102,14 1105,10 C1103,20 1104,32 1100,38" fill="#f8f6f1" opacity="0.32" />
            {/* Splatter dots */}
            <circle cx="210" cy="42" r="2.5" fill="#f8f6f1" opacity="0.4" />
            <circle cx="580" cy="22" r="2" fill="#f8f6f1" opacity="0.35" />
            <circle cx="980" cy="18" r="2" fill="#f8f6f1" opacity="0.32" />
            <circle cx="1320" cy="30" r="2.5" fill="#f8f6f1" opacity="0.38" />
            <ellipse cx="440" cy="35" rx="3" ry="1.5" fill="#f8f6f1" opacity="0.3" />
          </svg>
        </div>
      </section>

      <section id="about" className="bg-surface px-6 py-24 md:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-3 -rotate-2 rounded-3xl bg-chart-4/20" aria-hidden />
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJXx8c8UwNt7LMcnZjeUcX3fiHF3kwS7Gq7zT-1FsnaGctC36Qn5Dd9I6mZpE41cWf_SdvBD_Y21oFEi0_RWaXcA4jaguOrWviJaCITse3FNl6Cbtie7hVxRoJZEE8U0nqWoMbrdKdVaDD-Dvf6o2NGZSIunDnP2C78pKPQX9Kqs248JnyI8pYI6lvh2BhE793AmHE0hPMMlimCcX4gbJt9zSJE2zrx3QRMDVZyiNfHzd_R5kDKeps-f8pp_BIEG38lDZEcZCoZSM"
                alt="Two sisters smiling in a garden"
                width={800}
                height={1000}
                className="relative w-full rounded-3xl object-cover shadow-xl"
              />
            </div>
          </div>

          <div className="order-1 space-y-7 lg:order-2">
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">The Sisters who Sparked a Movement</h2>
            <div className="text-foreground-muted space-y-5 text-base leading-relaxed sm:text-lg">
              <p>
                Our journey began in the most personal of ways through the lives of our daughters,
                <span className="font-bold text-primary"> Deetya and Marissa</span>. Watching them navigate a world that was not always built for their unique needs opened our eyes to the gaps in support systems many families face.
              </p>
              <p>
                They are the heartbeat of this foundation. Their resilience taught us that every child deserves a path forward that celebrates their potential rather than focusing on limitations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-muted p-6">
                <p className="text-3xl font-bold text-primary">D</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Deetya</p>
              </div>
              <div className="rounded-2xl bg-muted p-6">
                <p className="text-3xl font-bold text-empowerment">M</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Marissa</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted px-6 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">Facing the Invisible Walls</h2>
            <p className="text-foreground-muted mt-4">
              We encountered obstacles that felt insurmountable at first, reflecting the struggles of thousands of families.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {challengeCards.map((card) => {
              const Icon = card.icon
              return (
                <article key={card.title} className="bg-surface rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1">
                  <Icon className={`mb-5 size-8 ${card.accent}`} aria-hidden />
                  <h3 className="text-xl font-bold">{card.title}</h3>
                  <p className="text-foreground-muted mt-3 leading-relaxed">{card.description}</p>
                </article>
              )
            })}
          </div>

          <AnimatedBrushQuote />
        </div>
      </section>

      <section className="bg-surface px-6 py-28 text-center md:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
            “If this was difficult for us,
            <br />
            how much harder must it be
            <br />
            for families in rural Nepal?”
          </h2>
          <div className="bg-chart-4 mx-auto mt-10 h-1 w-24 rounded-full" />
        </div>
      </section>

      <section className="bg-muted px-6 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">The Birth of a Vision</h2>

          <div className="relative mx-auto mt-16 max-w-5xl space-y-9">
            <div className="bg-border absolute bottom-0 left-6 top-0 w-px md:left-1/2 md:-translate-x-1/2" />

            {timelineItems.map((item, index) => {
              const Icon = item.icon
              const isEven = index % 2 === 0
              return (
                <div key={item.year} className="relative flex flex-col items-start md:flex-row md:items-center">
                  <div className={`hidden md:block md:w-1/2 ${isEven ? "pr-12 text-right" : "order-3 pl-12 text-left"}`}>
                    <p className={`text-lg font-bold ${item.textColor}`}>{item.year}</p>
                  </div>

                  <div className={`relative z-10 inline-flex size-12 items-center justify-center rounded-full text-white shadow-lg ${item.color} md:size-14`}>
                    <Icon className="size-5" aria-hidden />
                  </div>

                  <div className={`mt-3 w-full md:mt-0 md:w-1/2 ${isEven ? "md:pl-12" : "md:order-1 md:pr-12"}`}>
                    <p className={`mb-2 text-lg font-bold md:hidden ${item.textColor}`}>{item.year}</p>
                    <div className={`bg-surface rounded-3xl p-6 ${isEven ? "text-left" : "text-left md:text-right"}`}>
                      <p className="text-foreground-muted">{item.text}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-surface px-6 py-28 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-14 lg:flex-row lg:gap-16">
          <div className="flex-1 space-y-7">
            <h2 className="text-3xl font-bold sm:text-4xl">More Than a Name</h2>
            <p className="text-foreground-muted text-lg leading-relaxed">
              The name <span className="font-bold text-primary">deessa</span> was born from the hearts of our daughters.
              It merges their identities while pointing toward our shared goal.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-primary/25 rounded-3xl border p-7 text-center">
                <p className="text-5xl font-extrabold text-primary">dee</p>
                <p className="text-muted-foreground mt-2 text-xs uppercase tracking-[0.2em]">Deetya</p>
              </div>
              <div className="border-empowerment/35 rounded-3xl border p-7 text-center">
                <p className="text-5xl font-extrabold text-empowerment">ssa</p>
                <p className="text-muted-foreground mt-2 text-xs uppercase tracking-[0.2em]">Marissa</p>
              </div>
            </div>

            <div className="bg-muted flex items-center gap-5 rounded-3xl p-6">
              <div className="bg-primary/25 text-primary inline-flex size-14 items-center justify-center rounded-full">
                <Flag className="size-6" aria-hidden />
              </div>
              <div>
                <p className="text-xl font-bold">Direction</p>
                <p className="text-foreground-muted text-sm">Meaning of “deessa” in Nepali context</p>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuASbw9oLQ6Bh5rUk63XQrLHVkV_YsJruNHh9vUHngNQPfPynL33cPYYmE1khtQzPyDPaL40kuW3zuZ1lFda-uHADLefB3FKfwE4uUKHUCmoQJAm4qzWhABmQ3Xd2FlwepeIBkuV3JNEvFD5E6INwLJRdOyrhMM1JU1vtpV2yUrKwuspz-dvvpNkXn82WJhmis8zMQsnvKJ5SsGHOaIKQONsM1N91RSkPKZULy9LZnXB1GPEPLVPVG5XBKsOhcI7F1Nb5yCCkbPiZwY"
              alt="A winding path through a green valley"
              width={900}
              height={900}
              className="w-full rounded-3xl object-cover shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section id="mission" className="bg-muted px-6 py-24 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 md:gap-10">
          <article className="bg-surface border-primary rounded-3xl border-t-8 p-10 shadow-sm">
            <Flag className="text-primary mb-5 size-9" aria-hidden />
            <h2 className="text-3xl font-bold">Our Mission</h2>
            <p className="text-foreground-muted mt-5 text-lg leading-relaxed">
              To break down barriers for families navigating developmental and physical challenges by providing
              accessible healthcare, educational resources, and a community of unwavering support.
            </p>
          </article>

          <article className="bg-surface rounded-3xl border-t-8 border-[rgb(var(--accent-empowerment))] p-10 shadow-sm">
            <Eye className="text-empowerment mb-5 size-9" aria-hidden />
            <h2 className="text-3xl font-bold">Our Vision</h2>
            <p className="text-foreground-muted mt-5 text-lg leading-relaxed">
              A world where every child, regardless of ability or location, is seen, heard, and given the resources
              to lead a life of dignity and purpose.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-surface px-6 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">The Evolution of Impact</h2>
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {impact.map((item, index) => {
              const Icon = item.icon
              return (
                <article key={item.from} className="group text-center">
                  <div className="relative mb-8 inline-block">
                    <div className="bg-muted text-muted-foreground inline-flex size-28 items-center justify-center rounded-full transition-colors group-hover:bg-accent sm:size-32">
                      <Icon className={`size-10 ${item.color}`} aria-hidden />
                    </div>
                    {index < impact.length - 1 && (
                      <ArrowRight className="text-border absolute -right-8 top-1/2 hidden size-7 -translate-y-1/2 md:block" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold">{item.from}</h3>
                  <p className="text-foreground-muted mt-3 px-4">{item.text}</p>
                  <p className={`mt-3 font-bold ${item.color}`}>{item.to}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-6 py-24 md:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-brand-primary-dark px-6 py-14 text-center sm:px-10 sm:py-20">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDObnZb9aDESJ36lgucVDoXG4ikhozQiTrqeLRtpIdSNRy5igPnNFD8ELZKcR9IRcU7oz6dSPbFoFlYSveJqlZRa_tdqqAreV_NQge-Ryajr-weagx4XprOHVZSMsYBWn3MWeLouBUb-iUHWpm10ckFMO0_yjDlZuBNGSMmKcBSGm4z2a_EwG0Ip0KcNJE4xjLdnQQ4ER7OxQL1HNNa3NULGLGU1elM726TzK_JM0jKLIM3dnDDN4ah09-mbldfWlA_4HYp2h38IWY"
              alt="Hands nurturing a seedling"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
              Every child deserves
              <br />
              understanding.
              <br />
              Every family deserves
              <br />
              support.
            </h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/get-involved"
                className="inline-flex items-center rounded-full bg-brand-primary px-8 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-dark"
              >
                Join Us
                <ArrowRight className="ml-2 size-4" aria-hidden />
              </Link>
              <Link
                href="/donate"
                className="rounded-full bg-white px-8 py-3 text-sm font-bold text-brand-primary-dark transition hover:bg-surface"
              >
                Support Our Mission
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
