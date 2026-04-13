import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, BookOpen, Sparkles } from "lucide-react"
import { StoryCard } from "@/components/ui/story-card"
import { getPublishedStories, getFeaturedStory } from "@/lib/data/stories"

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

      <section id="featured" className="bg-[linear-gradient(180deg,#f7f2ea_0%,#fbf8f3_100%)] py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-[2.25rem] bg-white p-3 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)]">
                <div className="absolute left-[-2rem] top-8 h-44 w-44 rounded-full bg-secondary/10 blur-3xl" />
                <div className="absolute right-[-1rem] bottom-4 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]">
                  <Image
                    src={primaryStory?.image || "/StoriesSectionImage.png"}
                    alt={primaryStory?.title || "Featured story image"}
                    fill
                    sizes="(min-width: 1024px) 35vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.05)_0%,rgba(3,7,18,0.08)_35%,rgba(3,7,18,0.5)_100%)]" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">Featured story</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                {primaryStory ? primaryStory.title : "A featured story"}
              </h2>
              <blockquote className="mt-6 border-l-4 border-secondary/40 pl-5 text-xl font-medium italic leading-9 text-slate-800 sm:text-2xl">
                {primaryStory
                  ? primaryStory.excerpt
                  : "This is where the featured story sits, with enough room for the narrative to breathe."}
              </blockquote>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                The featured section stays immersive without becoming a separate story page. It gives one story room to stand out, while the list below keeps the rest of the page compact and scannable.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Context",
                    body: "A clear sense of the child, family, or community at the start of the journey.",
                  },
                  {
                    title: "Support",
                    body: "The care, guidance, or intervention that helped the story move forward.",
                  },
                  {
                    title: "Outcome",
                    body: "The visible change, confidence, or progress that makes the story worth sharing.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-[1.5rem] bg-white p-5 shadow-[0_16px_42px_-34px_rgba(15,23,42,0.35)]">
                    <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stories" className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <span className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Written stories</span>
                  <div className="mt-1 h-0.5 w-14 rounded-full bg-primary/30" />
                </div>
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Narratives of unfolding potential
              </h2>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
                The strongest stories here combine quiet confidence, family support, and visible progress. The cards below keep that balance: clear hierarchy, soft surfaces, and enough breathing room for the content to land.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { key: "all", label: "All stories" },
                { key: "latest", label: "Latest" },
                { key: "featured", label: "Featured" },
              ].map((option) => {
                const isActive = activeFilter === option.key
                return (
                  <Link
                    key={option.key}
                    href={option.key === "all" ? "/stories#stories" : `/stories?filter=${option.key}#stories`}
                    className={
                      isActive
                        ? "rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm"
                        : "rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm transition-colors duration-300 hover:text-primary"
                    }
                  >
                    {option.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {spotlightMainStory ? (
            <div className="grid gap-5 lg:grid-cols-12">
              <Link href={`/stories/${spotlightMainStory.slug}`} className="group flex lg:col-span-8">
                <article className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.42)] transition-transform duration-300 hover:-translate-y-1">
                  <div className="relative min-h-[280px] flex-1 overflow-hidden">
                    <Image
                      src={spotlightMainStory.image || "/placeholder.svg"}
                      alt={spotlightMainStory.title}
                      fill
                      sizes="(min-width: 1024px) 60vw, 100vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <span className="rounded-full bg-secondary/10 px-3 py-1 text-secondary">{spotlightMainStory.category}</span>
                      <span>{formatStoryDate(spotlightMainStory)}</span>
                      <span className="size-1 rounded-full bg-slate-300" />
                      <span>{spotlightMainStory.read_time || "5 min read"}</span>
                    </div>
                    <h3 className="mt-4 text-2xl font-bold leading-tight text-slate-950 transition-colors duration-300 group-hover:text-primary md:text-3xl">
                      {spotlightMainStory.title}
                    </h3>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                      {spotlightMainStory.excerpt}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Read story
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </article>
              </Link>

              <div className="grid gap-4 lg:col-span-4 lg:grid-rows-2">
                {spotlightSideStories.map((story) => (
                  <Link key={story.id} href={`/stories/${story.slug}`} className="group block">
                    <article className="h-full overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] transition-transform duration-300 hover:-translate-y-1">
                      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.35rem]">
                        <Image
                          src={story.image || "/placeholder.svg"}
                          alt={story.title}
                          fill
                          sizes="(min-width: 1024px) 26vw, 100vw"
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.02)_0%,rgba(3,7,18,0.45)_100%)]" />
                      </div>
                      <div className="flex flex-col justify-between p-3">
                        <div>
                          <span className="inline-flex rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
                            {story.category}
                          </span>
                          <h3 className="mt-3 text-xl font-bold leading-tight text-slate-950 transition-colors duration-300 group-hover:text-primary">
                            {story.title}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-600">
                            {story.excerpt}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                          <span>{formatStoryDate(story)}</span>
                          <span className="inline-flex items-center gap-2 text-primary">
                            Read
                            <ArrowUpRight className="size-4" />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[2rem] bg-white p-8 text-center shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">No stories yet</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-950">This section is ready for the next published story.</h3>
              <p className="mt-3 text-slate-600">The layout stays intact even when content is sparse, so the page remains stable and usable.</p>
            </div>
          )}

          {remainingStories.length > 0 && (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {remainingStories.map((story) => (
                <StoryCard
                  key={story.id}
                  title={story.title}
                  excerpt={story.excerpt}
                  image={story.image}
                  category={story.category}
                  date={formatStoryDate(story)}
                  readTime={story.read_time || "5 min read"}
                  href={`/stories/${story.slug}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f7f4ef_0%,#fbf8f4_100%)] py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="rounded-[2.25rem] bg-primary px-6 py-10 text-center text-white shadow-[0_22px_60px_-40px_rgba(54,69,122,0.85)] md:px-10 md:py-14">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">Take action</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Be part of someone’s story.</h2>
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
