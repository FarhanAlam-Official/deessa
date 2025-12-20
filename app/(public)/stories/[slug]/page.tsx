import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, Calendar, Tag, Share2 } from "lucide-react"
import { Section } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import { getStoryBySlug, getPublishedStoriesStatic } from "@/lib/data/stories"

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
  const story = await getStoryBySlug(slug)

  if (!story) {
    notFound()
  }

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
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-[500px] relative overflow-hidden">
          <Image src={story.image || "/placeholder.svg"} alt={story.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="max-w-[1000px] mx-auto">
              <Link
                href="/stories"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="size-4" />
                Back to Stories
              </Link>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                  {story.category}
                </span>
              </div>
              <h1 className="text-white text-3xl md:text-5xl font-black leading-tight mb-4 max-w-3xl">{story.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  {publishedDate}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="size-4" />
                  {story.read_time || "5 min read"}
                </span>
                {story.author && <span className="flex items-center gap-2">By {story.author}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <Section className="bg-background">
        <div className="max-w-[800px] mx-auto">
          {/* Excerpt */}
          <p className="text-xl text-foreground-muted leading-relaxed mb-8 font-medium border-l-4 border-primary pl-6">
            {story.excerpt}
          </p>

          {/* Main Content */}
          <div className="prose prose-lg max-w-none">
            {story.content ? (
              <div
                className="text-foreground leading-relaxed space-y-6"
                dangerouslySetInnerHTML={{ __html: story.content.replace(/\n/g, "<br />") }}
              />
            ) : (
              <p className="text-foreground-muted">Full story content coming soon...</p>
            )}
          </div>

          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="size-4 text-foreground-muted" />
                {story.tags.map((tag: string) => (
                  <span key={tag} className="bg-muted px-3 py-1 rounded-full text-sm font-medium text-foreground-muted">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share Section */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Share this story</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full bg-transparent">
                  <Share2 className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-primary rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Be Part of Stories Like This</h3>
            <p className="text-white/80 mb-6">Your support helps create more positive impact in Nepal.</p>
            <Button asChild variant="secondary" size="lg" className="rounded-full">
              <Link href="/donate">Donate Now</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
