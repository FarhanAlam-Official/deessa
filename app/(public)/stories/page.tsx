import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react"
import { getPublishedStories, getFeaturedStory } from "@/lib/data/stories"
import { StoriesSections } from "./StoriesSections"

export const metadata: Metadata = {
  title: "Stories - Deessa Foundation",
  description: "Read inspiring stories of impact and transformation from our community.",
}

function formatStoryDate(story: { published_at?: string | null; created_at?: string | null }) {
  const rawDate = story.published_at || story.created_at

  if (!rawDate) {
    return "Recently"
  }

  return new Date(rawDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface StoriesPageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function StoriesPage({ searchParams }: StoriesPageProps) {
  const [allStories, featuredStory, params] = await Promise.all([
    getPublishedStories(),
    getFeaturedStory(),
    searchParams,
  ])

  const filterOptions = ["all", "latest", "featured"] as const
  const requestedFilter = (params.filter || "all").toLowerCase()
  const activeFilter = filterOptions.includes(requestedFilter as (typeof filterOptions)[number])
    ? (requestedFilter as (typeof filterOptions)[number])
    : "all"

  const getStoryTime = (story: { published_at?: string | null; created_at?: string | null }) => {
    const raw = story.published_at || story.created_at
    return raw ? new Date(raw).getTime() : 0
  }

  const primaryStory = featuredStory ?? allStories[0] ?? null

  const filteredPool = (() => {
    if (activeFilter === "featured") {
      return allStories.filter((story) => story.is_featured)
    }

    const withoutPrimary = primaryStory
      ? allStories.filter((story) => story.id !== primaryStory.id)
      : allStories

    if (activeFilter === "latest") {
      return [...withoutPrimary].sort((a, b) => getStoryTime(b) - getStoryTime(a))
    }

    return withoutPrimary
  })()

  const spotlightMainStory = filteredPool[0] ?? null
  const spotlightSideStories = filteredPool.slice(1, 3)
  const remainingStories = filteredPool.slice(3)
  const categoryCount = new Set(allStories.map((story) => story.category || "General")).size
  const latestStory = allStories.find((story) => story.published_at || story.created_at) ?? null

  return (
    <>
      {/* ═══════════════════════════════════════════
          SECTION 1 — HERO (Original Design - UNCHANGED)
      ═══════════════════════════════════════════ */}
      <section className="relative isolate flex min-h-[100svh] overflow-hidden bg-[linear-gradient(180deg,#fbf8f2_0%,#f4efe5_100%)]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: 'url("/StoriesSectionImage.png")' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(251,191,119,0.32),transparent_22%),radial-gradient(circle_at_85%_15%,rgba(54,69,122,0.18),transparent_20%),linear-gradient(180deg,rgba(251,248,242,0.35),rgba(251,248,242,0.95)_70%,rgba(251,248,242,1))]" />
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:px-8 md:py-12 lg:grid-cols-12 lg:items-center lg:py-16">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary shadow-sm backdrop-blur">
              <Sparkles className="size-3.5" />
              Stories of care and change
            </span>

            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.96] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Every child sees the world <span className="text-primary">differently</span>.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
              These stories capture the small victories, careful routines, and steady hope that shape autism care.
              The page stays focused on the stories themselves, with a clear featured piece and an asymmetric grid below.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#stories"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_45px_-22px_rgba(54,69,122,0.9)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Browse stories
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/donate"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-white/75 px-6 py-3.5 text-sm font-semibold text-primary shadow-sm backdrop-blur transition-colors duration-300 hover:border-primary/35 hover:bg-white"
              >
                Support a child
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-[2.1rem] bg-white/85 p-5 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.42)] backdrop-blur md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Stories overview</p>
              <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950 md:text-[2rem]">
                Explore the latest journeys and milestones.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Start with the featured story, then browse the full collection arranged below in a tighter, easier-to-scan layout.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-primary/8 p-3">
                  <div className="text-2xl font-black text-primary">{String(allStories.length).padStart(2, "0")}</div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Stories</div>
                </div>
                <div className="rounded-2xl bg-secondary/8 p-3">
                  <div className="text-2xl font-black text-secondary">{String(categoryCount).padStart(2, "0")}</div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Categories</div>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3">
                  <div className="text-sm font-black text-slate-900">{latestStory ? formatStoryDate(latestStory) : "Soon"}</div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Latest</div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href="#featured"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Go to featured
                </Link>
                <Link
                  href="#stories"
                  className="inline-flex items-center justify-center rounded-full border border-primary/25 bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-colors duration-300 hover:border-primary/40"
                >
                  View all stories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections 2 and 3 - Client Component with Framer Motion */}
      <StoriesSections
        primaryStory={primaryStory}
        activeFilter={activeFilter}
        spotlightMainStory={spotlightMainStory}
        spotlightSideStories={spotlightSideStories}
        remainingStories={remainingStories}
        formatStoryDate={formatStoryDate}
      />

      {/* CTA Section */}
      <section className="bg-[linear-gradient(180deg,#f7f4ef_0%,#fbf8f4_100%)] py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="rounded-[2.25rem] bg-primary px-6 py-10 text-center text-white shadow-[0_22px_60px_-40px_rgba(54,69,122,0.85)] md:px-10 md:py-14">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">Take action</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Be part of someone's story.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/85">
              Your support helps families access therapy, inclusive education, and patient guidance that change daily life for children and caregivers.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/donate"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-primary transition-transform duration-300 hover:-translate-y-0.5"
              >
                Support a child
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/70 bg-transparent px-7 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/10"
              >
                Share a story
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
