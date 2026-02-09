import { Metadata } from 'next';
import { getPublishedPodcasts } from '@/lib/data/podcasts';
import EpisodesPageContent from '@/components/podcasts/episodes-page-content';
import { Podcast } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'All Episodes - Deesha Foundation',
  description: 'Browse our complete archive of podcast episodes featuring inspiring conversations about education, empowerment, and environmental conservation.',
  openGraph: {
    title: 'All Episodes - Deesha Foundation',
    description: 'Browse our complete archive of podcast episodes featuring inspiring conversations about education, empowerment, and environmental conservation.',
  },
};

export default async function EpisodesPage() {
  const allPodcasts = await getPublishedPodcasts();

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Simple Clean Header */}
      <div className="bg-white border-b-4 border-brand-primary">
        <div className="container max-w-7xl mx-auto px-2 py-12 md:py-16">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-lg mb-4">
              <Podcast className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wider">Complete Archive</span>
            </div>
            
            <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl mb-4 text-text-main leading-tight">
              All Episodes
            </h1>
            
            <p className="text-lg md:text-xl text-text-muted leading-relaxed">
              Browse our complete collection of {allPodcasts.length} inspiring conversations. Use powerful filters and search to discover episodes that matter to you.
            </p>
          </div>
        </div>
      </div>

      {/* Episodes Content */}
      <div className="container max-w-7xl mx-auto px-2 py-12">
        <EpisodesPageContent episodes={allPodcasts} />
      </div>
    </div>
  );
}
