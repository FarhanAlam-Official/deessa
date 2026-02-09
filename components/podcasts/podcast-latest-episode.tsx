'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Calendar, Clock, FileText, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Podcast } from '@/lib/types/podcast';
import { formatDistanceToNow } from 'date-fns';
import PodcastVideoModal from './podcast-video-modal';
import { notifications } from '@/lib/notifications';

interface PodcastLatestEpisodeProps {
  episode: Podcast;
}

export default function PodcastLatestEpisode({ episode }: PodcastLatestEpisodeProps) {
  const [showModal, setShowModal] = useState(false);
  const publishedDate = new Date(episode.publishedAt);

  return (
    <>
      <div className="bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-6">
          {/* Left - Image with Play Button */}
          <div className="md:col-span-2">
            <div className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer">
              <Image
                src={episode.thumbnailUrl}
                alt={episode.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Play Button Overlay */}
              <button
                onClick={() => setShowModal(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all"
                aria-label={`Play ${episode.title}`}
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-brand-primary ml-1" fill="currentColor" />
                </div>
              </button>
            </div>
          </div>

          {/* Right - Content */}
          <div className="md:col-span-3 flex flex-col">
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {episode.topics[0] && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-brand-primary text-white">
                  {episode.topics[0]}
                </span>
              )}
              <span className="flex items-center text-sm text-text-muted">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDistanceToNow(publishedDate, { addSuffix: true })}
              </span>
              <span className="flex items-center text-sm text-text-muted">
                <Clock className="w-4 h-4 mr-1" />
                {episode.duration}
              </span>
            </div>

            {/* Title */}
            <Link href={`/podcasts/${episode.slug}`}>
              <h3 className="text-2xl md:text-3xl font-heading font-bold text-text-main mb-3 hover:text-brand-primary transition-colors leading-tight">
                {episode.title}
              </h3>
            </Link>

            {/* Description */}
            <p className="text-text-muted leading-relaxed mb-6 flex-grow">
              {episode.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-border hover:bg-bg-soft"
              >
                <Link href={`/podcasts/${episode.slug}`}>
                  <FileText className="w-4 h-4 mr-2" />
                  Show Notes
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const url = `${window.location.origin}/podcasts/${episode.slug}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: episode.title, url });
                      notifications.showSuccess('Shared successfully!');
                    } catch (error) {
                      // User cancelled share
                    }
                  } else {
                    await navigator.clipboard.writeText(url);
                    notifications.showSuccess('Link copied to clipboard!');
                  }
                }}
                className="border-border hover:bg-bg-soft"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showModal && (
        <PodcastVideoModal
          youtubeId={episode.youtubeId}
          title={episode.title}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
