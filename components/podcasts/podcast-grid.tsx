'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PodcastCard } from './podcast-card';
import PodcastVideoModal from './podcast-video-modal';
import { Podcast } from '@/lib/types/podcast';
import { Button } from '@/components/ui/button';

interface PodcastGridProps {
  initialPodcasts: Podcast[];
}

export default function PodcastGrid({ initialPodcasts }: PodcastGridProps) {
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [displayCount, setDisplayCount] = useState(9);

  const visiblePodcasts = initialPodcasts.slice(0, displayCount);
  const hasMore = displayCount < initialPodcasts.length;

  return (
    <div>
      {/* Archive Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-bold text-text-main">
          Episode Archive
        </h2>
        <span className="text-sm text-text-muted">
          Showing {visiblePodcasts.length} of {initialPodcasts.length}
        </span>
      </div>

      {/* Podcast Grid */}
      {initialPodcasts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">No podcasts found. Check back soon!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {visiblePodcasts.map((podcast) => (
              <PodcastCard
                key={podcast.id}
                podcast={podcast}
                variant="primary"
                showTopics
                onPlay={setSelectedPodcast}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setDisplayCount((prev) => prev + 9)}
                className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
              >
                Load More Episodes
              </Button>
            </div>
          )}
        </>
      )}

      {/* Video Modal */}
      {selectedPodcast && (
        <PodcastVideoModal
          youtubeId={selectedPodcast.youtubeId}
          title={selectedPodcast.title}
          onClose={() => setSelectedPodcast(null)}
        />
      )}
    </div>
  );
}
