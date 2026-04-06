import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock3, CalendarDays, Sparkles, Tag, Share2, ArrowUpRight } from "lucide-react"
import { Section } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import { PrintButton } from "@/components/ui/print-button"
import { getPublishedStories, getStoryBySlug, getPublishedStoriesStatic } from "@/lib/data/stories"
import { sanitizeStoryContent } from "@/lib/sanitize/story-content"
import { processStoryContent } from "@/lib/utils/legacy-story"
import "@/app/print-styles.css"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const stories = await getPublishedStoriesStatic()
  return stories.map((story) => ({
    slug: story.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const story = await getStoryBySlug(slug)

  if (!story) {
    return { title: "Story Not Found - deessa Foundation" }
  }

  return {
    title: `${story.title} - deessa Foundation`,
    description: story.excerpt,
  }
}

export default async function StoryDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [story, allStories] = await Promise.all([getStoryBySlug(slug), getPublishedStories()])

  if (!story) {
    notFound()
  }

  const relatedStories = allStories.filter((item) => item.slug !== story.slug).slice(0, 3)

  const publishedDate = story.published_at
    ? new Date(story.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date(story.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

  return (
    <>
      {/* Print-only header */}
      <div className="print-header hidden">
        <div className="logo">DEESSA Foundation</div>
        <div className="url">www.deessafoundation.org</div>
      </div>

      <section className="relative isolate overflow-hidden bg-slate-950 text-white no-print">
        <div className="absolute inset-0">
          <Image src={story.image || "/placeholder.svg"} alt={story.title} fill className="object-cover opacity-60" priority />
          <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(18,53,80,0.15)_0%,rgba(2,6,23,0.78)_55%,rgba(2,6,23,0.96)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.25)_0%,rgba(2,6,23,0.08)_35%,rgba(2,6,23,0.7)_100%)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-14">
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold tracking-wide text-white/90 backdrop-blur transition hover:bg-white/15"
          >
            <ArrowLeft className="size-4" />
            Back to Stories
          </Link>

          <div className="mt-8 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/40 bg-cyan-300/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-cyan-100">
              <Sparkles className="size-3.5" />
              {story.category}
            </div>

            <h1 className="mt-5 text-4xl leading-tight sm:text-5xl lg:text-6xl">{story.title}</h1>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/80">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4" />
                {publishedDate}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="size-4" />
                {story.read_time || "5 min read"}
              </span>
              {story.author && <span className="inline-flex items-center gap-2">By {story.author}</span>}
            </div>

            <p className="mt-8 max-w-3xl text-balance text-lg leading-relaxed text-white/90 sm:text-xl">{story.excerpt}</p>
          </div>
        </div>
      </section>

      <Section className="relative bg-gradient-to-b from-sky-50/70 via-white to-white pb-6 pt-10 sm:pt-14">
        <div className="pointer-events-none absolute left-0 top-16 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-8 right-0 h-72 w-72 rounded-full bg-cyan-100/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_70px_-34px_rgba(2,132,199,0.35)] backdrop-blur md:p-9 lg:col-span-9">
            {/* Print-only metadata */}
            <div className="story-metadata hidden">
              <h1>{story.title}</h1>
              <div>
                <strong>Published:</strong> {publishedDate} | <strong>Category:</strong> {story.category} | <strong>Read Time:</strong> {story.read_time || "5 min read"}
              </div>
              {story.excerpt && (
                <div style={{ marginTop: "0.5cm", fontStyle: "italic" }}>
                  {story.excerpt}
                </div>
              )}
            </div>

            {story.content ? (
              <div className="overflow-x-auto">
                <div
                  className="tiptap story-rich text-[1.05rem] leading-8 text-slate-700"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeStoryContent(processStoryContent(story.content), story.id) 
                  }}
                />
              </div>
            ) : (
              <p className="text-slate-500">Full story content coming soon...</p>
            )}
          </article>

          <aside className="lg:col-span-3">
            <div className="space-y-4 lg:sticky lg:top-24 lg:ml-auto lg:w-full lg:max-w-[280px]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Story Snapshot</h2>
                <div className="mt-3 space-y-2.5 text-xs text-slate-600 sm:text-sm">
                  <p className="flex items-center justify-between gap-4">
                    <span>Published</span>
                    <span className="font-semibold text-slate-900">{publishedDate}</span>
                  </p>
                  <p className="flex items-center justify-between gap-4">
                    <span>Read Time</span>
                    <span className="font-semibold text-slate-900">{story.read_time || "5 min read"}</span>
                  </p>
                  <p className="flex items-center justify-between gap-4">
                    <span>Category</span>
                    <span className="font-semibold text-slate-900">{story.category}</span>
                  </p>
                </div>
              </div>

              {story.tags && story.tags.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
                    <Tag className="size-4" />
                    Tags
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {story.tags.map((tag: string) => (
                      <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Share</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <PrintButton variant="outline" className="justify-start bg-transparent" />
                  <Button asChild variant="outline" className="justify-start bg-transparent">
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(story.title)}&url=${encodeURIComponent(`https://deessafoundation.org/stories/${story.slug}`)}`} target="_blank" rel="noreferrer">
                      <Share2 className="mr-2 size-4" />
                      Share
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="justify-start bg-transparent">
                    <Link href="/stories">
                      Explore
                      <ArrowUpRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl bg-[linear-gradient(140deg,#0f172a_0%,#0b3b5e_45%,#0ea5e9_100%)] p-5 text-white shadow-lg">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">Take Action</p>
                <h3 className="mt-2 text-xl">Help Write The Next Story</h3>
                <p className="mt-2 text-sm leading-relaxed text-cyan-100/90">
                  Your support helps families access education, healthcare, and dignified opportunities.
                </p>
                <Button asChild size="lg" className="mt-4 w-full rounded-full bg-white text-slate-900 hover:bg-cyan-50">
                  <Link href="/donate">Donate Now</Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </Section>

      {relatedStories.length > 0 && (
        <Section className="bg-slate-950 py-14 text-white">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Continue Reading</p>
                <h2 className="mt-2 text-3xl">More Stories You May Like</h2>
              </div>
              <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/stories">All Stories</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {relatedStories.map((item) => (
                <Link
                  key={item.id}
                  href={`/stories/${item.slug}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-white/[0.06]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-100">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-lg leading-snug text-white">{item.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-300">{item.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}
    </>
  )
}
