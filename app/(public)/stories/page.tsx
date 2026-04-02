import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock, BookOpen } from "lucide-react"
import { Section } from "@/components/ui/section"
import { StoryCard } from "@/components/ui/story-card"
import { getPublishedStories, getFeaturedStory } from "@/lib/data/stories"

export const metadata: Metadata = {
  title: "Stories - Deessa Foundation",
  description: "Read inspiring stories of impact and transformation from our community.",
}

export default async function StoriesPage() {
  const [allStories, featuredStory] = await Promise.all([
    getPublishedStories(),
    getFeaturedStory(),
  ])
  
  const regularStories = featuredStory
    ? allStories.filter((story) => story.id !== featuredStory.id)
    : allStories

  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-87.5 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("/StoriesSectionImage.png")`,
            }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
            <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Stories
            </span>
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
              Stories of Hope & Impact
            </h1>
            <p className="text-white/90 text-lg font-medium max-w-2xl leading-relaxed">
              Discover real stories behind our work and the impact we create together.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            href="/podcasts"
            className="group block rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-sky-50 p-6 md:p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary/80">Listen Next</p>
                <h2 className="mt-2 text-2xl md:text-3xl font-black text-foreground">Explore Our Podcast Episodes</h2>
                <p className="mt-2 text-foreground-muted max-w-2xl">
                  Visit the podcast page to watch and listen to the Living With Autism series.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-300 group-hover:translate-x-1 md:self-center">
                Go to Podcasts
                <ArrowRight className="size-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Stories Grid - Only show if there are stories */}
      {(regularStories.length > 0 || featuredStory) && (
        <Section className="bg-gradient-to-b from-background to-muted/30">
          <div className="relative mb-12">
            {/* Background decoration */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-2 -right-6 w-32 h-32 bg-primary/3 rounded-full blur-3xl" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 flex items-center justify-center bg-primary/10 rounded-2xl text-primary">
                  <BookOpen className="size-6" />
                </div>
                <div>
                  <span className="text-primary font-bold uppercase tracking-wider text-sm block">
                    Written Stories
                  </span>
                  <div className="w-12 h-0.5 bg-primary/30 mt-1" />
                </div>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight mb-4">
                Latest Stories
              </h2>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <p className="text-foreground-muted text-lg leading-relaxed max-w-2xl">
                  Read inspiring narratives from individuals and communities we serve,
                  showcasing real impact and transformation.
                </p>
                
                <div className="flex items-center gap-6 text-sm text-foreground-muted">
                  <div className="flex items-center gap-2">
                    <div className="size-2 bg-green-500 rounded-full" />
                    <span>Published stories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-2 bg-blue-500 rounded-full" />
                    <span>Community impact</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {featuredStory && (
            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-foreground">Featured Story</h3>
              <div className="max-w-xl">
                <StoryCard
                  title={featuredStory.title}
                  excerpt={featuredStory.excerpt}
                  image={featuredStory.image}
                  category={featuredStory.category}
                  date={
                    featuredStory.published_at
                      ? new Date(featuredStory.published_at).toLocaleDateString()
                      : new Date(featuredStory.created_at).toLocaleDateString()
                  }
                  readTime={featuredStory.read_time || "5 min read"}
                  href={`/stories/${featuredStory.slug}`}
                />
              </div>
            </div>
          )}

          {regularStories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularStories.map((story) => (
                <StoryCard
                  key={story.id}
                  title={story.title}
                  excerpt={story.excerpt}
                  image={story.image}
                  category={story.category}
                  date={
                    story.published_at
                      ? new Date(story.published_at).toLocaleDateString()
                      : new Date(story.created_at).toLocaleDateString()
                  }
                  readTime={story.read_time || "5 min read"}
                  href={`/stories/${story.slug}`}
                />
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Newsletter CTA */}
      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Get Stories in Your Inbox</h2>
          <p className="text-white/80 mb-8">Subscribe to receive our latest impact stories and foundation updates.</p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-grow h-12 px-5 rounded-full text-foreground border border-white/30 focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              className="h-12 px-8 bg-foreground text-white font-bold rounded-full hover:bg-foreground/90 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
