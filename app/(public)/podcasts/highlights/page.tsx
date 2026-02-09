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
      {/* Simple Clean Header */}
      <div className="bg-white border-b-4 border-brand-primary">
        <div className="container max-w-7xl mx-auto px-2 py-12 md:py-16">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-lg mb-4">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wider">Key Moments</span>
            </div>
            
            <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl mb-4 text-text-main leading-tight">
              Podcast Highlights
            </h1>
            
            <p className="text-lg md:text-xl text-text-muted leading-relaxed">
              Discover {allHighlights.length} impactful insights and inspiring stories from our podcast episodes. Each short captures the essence of meaningful conversations about autism, inclusion, and community impact.
            </p>
          </div>
        </div>
      </div>

      {/* Highlights Content */}
      <div className="container max-w-7xl mx-auto px-2 py-12">
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
      </div>
    </div>
  );
}
