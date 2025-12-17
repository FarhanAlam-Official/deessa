import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { Section } from "@/components/ui/section"
import { StoryCard } from "@/components/ui/story-card"
import { getPublishedStories, getFeaturedStory } from "@/lib/data/stories"

export const metadata: Metadata = {
  title: "Stories - Dessa Foundation",
  description: "Read inspiring stories of impact and transformation from communities across Nepal.",
}

export default async function StoriesPage() {
  const allStories = await getPublishedStories()
  const featuredStory = await getFeaturedStory()
  const remainingStories = allStories.filter((s) => s.id !== featuredStory?.id)

  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-[350px] relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBTfMn_PUEG4a1KDj3AFMHXBF1v_IJPW_L720huR7TChJeC5GpxHiQIqSHbrGSrcp7nbhNBqmHrOtfAwfOePW7deVTdhaqpW9p3RuHgNWAaKtVKLkIVbiWRgojNvsMTnh7gQw0ytUKGCw2fZw_ZCNSf3DABKQ7s4kl0MYDHj3Y3_zDUqnE6KaHOJPfh_OZjDEN7-qS3tWy0Q_pbCovZMi9z9WOr4xOlN35tu7iETQHqyap9HmtH3siRVhxHBPN6UM6hAxeHRSMP37E")`,
            }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
            <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              News & Updates
            </span>
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
              Stories of Hope & Impact
            </h1>
            <p className="text-white/90 text-lg font-medium max-w-2xl leading-relaxed">
              Discover the real stories behind our work and the lives transformed.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Story */}
      {featuredStory && (
        <Section className="bg-surface">
          <Link href={`/stories/${featuredStory.slug}`} className="group block">
            <div className="grid lg:grid-cols-2 gap-8 items-center bg-background rounded-3xl overflow-hidden border border-border hover:shadow-2xl transition-all">
              <div className="aspect-[4/3] lg:aspect-auto lg:h-full relative overflow-hidden">
                <Image
                  src={featuredStory.image || "/placeholder.svg"}
                  alt={featuredStory.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                    Featured
                  </span>
                </div>
              </div>
              <div className="p-8 lg:p-12">
                <span className="text-primary font-bold text-sm uppercase tracking-wider">
                  {featuredStory.category}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-3 mb-4 group-hover:text-primary transition-colors">
                  {featuredStory.title}
                </h2>
                <p className="text-foreground-muted text-lg leading-relaxed mb-6">{featuredStory.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-foreground-muted">
                    <span>
                      {featuredStory.published_at
                        ? new Date(featuredStory.published_at).toLocaleDateString()
                        : new Date(featuredStory.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-4" />
                      {featuredStory.read_time || "5 min read"}
                    </span>
                  </div>
                  <span className="flex items-center gap-2 font-bold text-primary group-hover:gap-3 transition-all">
                    Read More <ArrowRight className="size-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </Section>
      )}

      {/* Stories Grid */}
      <Section className="bg-background">
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Latest Stories</h2>
        </div>
        {remainingStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {remainingStories.map((story) => (
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
        ) : (
          <div className="text-center py-12 text-foreground-muted">
            <p>No stories available yet. Check back soon!</p>
          </div>
        )}
      </Section>

      {/* Newsletter CTA */}
      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Get Stories in Your Inbox</h2>
          <p className="text-white/80 mb-8">Subscribe to receive our latest impact stories and foundation updates.</p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-grow h-12 px-5 rounded-full text-foreground border-0 focus:ring-2 focus:ring-white/30"
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
