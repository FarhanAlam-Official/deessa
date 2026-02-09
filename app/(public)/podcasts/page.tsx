import { Metadata } from 'next';
import { Suspense } from 'react';
import PodcastMainHero from '@/components/podcasts/podcast-main-hero';
import PodcastLatestEpisode from '@/components/podcasts/podcast-latest-episode';
import PodcastArchiveSection from '@/components/podcasts/podcast-archive-section';
import AllHighlightsSection from '@/components/podcasts/all-highlights-section';
import { getPublishedPodcasts, getLatestPodcasts, getFeaturedPodcast, getFeaturedPodcasts, getAllPodcastHighlights } from '@/lib/data/podcasts';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Podcasts - Living With Autism | Deesha Foundation',
  description: 'Explore our podcast series featuring stories, insights, and conversations about autism, inclusion, and community impact.',
  openGraph: {
    title: 'Podcasts - Living With Autism | Deesha Foundation',
    description: 'Explore our podcast series featuring stories, insights, and conversations about autism, inclusion, and community impact.',
    type: 'website',
  },
};

export const revalidate = 3600; // Revalidate every hour

export default async function PodcastsPage() {
  // Fetch all data in parallel
  const [allPodcasts, featuredPodcasts, allHighlights] = await Promise.all([
    getPublishedPodcasts(),
    getFeaturedPodcasts(),
    getAllPodcastHighlights(10), // Limit to 10 latest highlights for main page
  ]);

  // Use featured podcasts or first episode for hero
  const heroEpisodes = featuredPodcasts.length > 0 ? featuredPodcasts : (allPodcasts[0] ? [allPodcasts[0]] : []);
  
  // Latest episode for the large featured card
  // If there are featured podcasts, show the most recent non-featured one
  // If no featured and we have at least 2 podcasts, show the second one
  // If only 1 podcast, don't show latest episode section
  const featuredIds = heroEpisodes.map(ep => ep.id);
  const latestEpisode = featuredPodcasts.length > 0
    ? allPodcasts.find(ep => !featuredIds.includes(ep.id))
    : (allPodcasts.length >= 2 ? allPodcasts[1] : null);

  // Archive includes all podcasts
  const archiveEpisodes = allPodcasts;

  // Check if there are no podcasts at all
  if (!allPodcasts || allPodcasts.length === 0) {
    return (
      <div className="min-h-screen bg-bg-main">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-20">
            <h1 className="text-4xl font-heading font-bold text-text-main mb-4">
              DEESSA Voices – Stories of Resilience
            </h1>
            <p className="text-lg text-text-muted mb-8">
              Our podcast series is coming soon! Check back later for inspiring stories and conversations.
            </p>
            <Button asChild className="bg-brand-primary hover:bg-brand-primary-dark">
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        {heroEpisodes.length > 0 && <PodcastMainHero episodes={heroEpisodes} />}

        {/* All Highlights Section - Show highlights from all episodes */}
        {allHighlights.length > 0 && (
          <AllHighlightsSection highlights={allHighlights} />
        )}

        {/* Latest Episode Section - Only show if we have a separate latest episode */}
        {latestEpisode && (
          <section>
            <h2 className="text-3xl font-heading font-bold text-text-main mb-6">Latest Episode</h2>
            <PodcastLatestEpisode episode={latestEpisode} />
          </section>
        )}

        {/* Archive Section with Filters - Show only if we have archive episodes */}
        {archiveEpisodes.length > 0 && (
          <section>
            <PodcastArchiveSection episodes={archiveEpisodes} totalCount={allPodcasts.length} />
          </section>
        )}

        {/* Message when only 1 podcast exists */}
        {allPodcasts.length === 1 && (
          <div className="text-center py-12">
            <p className="text-text-muted text-lg">
              More episodes coming soon! Stay tuned for more inspiring stories.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
