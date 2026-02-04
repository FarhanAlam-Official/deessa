import { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllPodcastHighlights } from '@/lib/data/podcasts';
import HighlightsPageContent from '@/components/podcasts/highlights-page-content';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Podcast Highlights - All Shorts | Deesha Foundation',
  description: 'Watch all YouTube Shorts highlights from our podcast episodes. Key moments, insights, and stories.',
  openGraph: {
    title: 'Podcast Highlights - All Shorts | Deesha Foundation',
    description: 'Watch all YouTube Shorts highlights from our podcast episodes. Key moments, insights, and stories.',
    type: 'website',
  },
};

export const revalidate = 3600; // Revalidate every hour

export default async function HighlightsPage() {
  // Fetch all highlights without limit
  const allHighlights = await getAllPodcastHighlights();

  return (
    <div className="min-h-screen bg-bg-main">
      <main className="container mx-auto px-4 py-8 lg:py-12">
        {/* Header - Improved Design */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-heading font-bold text-text-main mb-1">
                Podcast Highlights
              </h1>
              <p className="text-lg text-text-muted">
                Key moments from our conversations
              </p>
            </div>
          </div>
          <p className="text-base text-text-muted max-w-3xl leading-relaxed ml-20">
            Discover the most impactful insights, inspiring stories, and powerful moments from our podcast episodes. 
            Each short captures the essence of meaningful conversations about autism, inclusion, and community impact.
          </p>
        </div>

        {/* Content with filters */}
        {allHighlights.length > 0 ? (
          <Suspense fallback={<div className="text-center py-12">Loading highlights...</div>}>
            <HighlightsPageContent highlights={allHighlights} />
          </Suspense>
        ) : (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-text-main mb-2">
              No Highlights Available Yet
            </h2>
            <p className="text-text-muted">
              Check back soon for exciting highlights from our podcast episodes!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
