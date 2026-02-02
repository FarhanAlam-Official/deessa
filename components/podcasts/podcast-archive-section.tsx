'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, Heart, Play, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Podcast } from '@/lib/types/podcast';
import { formatDistanceToNow } from 'date-fns';

interface PodcastArchiveSectionProps {
  episodes: Podcast[];
  totalCount: number;
}

export default function PodcastArchiveSection({ episodes, totalCount }: PodcastArchiveSectionProps) {
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'video' | 'audio'>('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [displayCount, setDisplayCount] = useState(12);

  // Get unique topics from all episodes
  const allTopics = Array.from(
    new Set(episodes.flatMap((ep) => ep.topics))
  ).sort();

  // Filter episodes
  const filteredEpisodes = episodes.filter((episode) => {
    // Format filter
    if (selectedFormat !== 'all') {
      if (selectedFormat === 'video' && episode.format !== 'video') return false;
      if (selectedFormat === 'audio' && episode.format !== 'audio') return false;
    }

    // Topics filter
    if (selectedTopics.length > 0) {
      if (!episode.topics.some((topic) => selectedTopics.includes(topic))) {
        return false;
      }
    }

    return true;
  });

  const displayedEpisodes = filteredEpisodes.slice(0, displayCount);
  const hasMore = displayCount < filteredEpisodes.length;

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  return (
    <div>
      {/* Section Header with Browse All Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-main">Episode Archive</h2>
        <Link
          href="/podcasts/episodes"
          className="text-brand-primary hover:text-brand-primary-dark font-semibold text-sm transition-colors duration-200"
        >
          Browse All Episodes →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar - Filters */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4">
                Filter Library
              </h3>

            {/* Format Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-text-main mb-3">FORMAT</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedFormat === 'video'}
                    onCheckedChange={() => setSelectedFormat(selectedFormat === 'video' ? 'all' : 'video')}
                  />
                  <span className="text-sm text-text-muted">Video</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedFormat === 'audio'}
                    onCheckedChange={() => setSelectedFormat(selectedFormat === 'audio' ? 'all' : 'audio')}
                  />
                  <span className="text-sm text-text-muted">Audio</span>
                </label>
              </div>
            </div>

            {/* Topics Filter */}
            <div>
              <h4 className="text-sm font-semibold text-text-main mb-3">TOPICS</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allTopics.map((topic) => (
                  <label key={topic} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={selectedTopics.includes(topic)}
                      onCheckedChange={() => handleTopicToggle(topic)}
                    />
                    <span className="text-sm text-text-muted capitalize">{topic}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Support CTA Card */}
          <div className="bg-white border-2 border-brand-primary rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-brand-primary" />
            </div>
            <h4 className="font-heading font-bold text-xl text-text-main mb-2">
              Support Our Mission
            </h4>
            <p className="text-sm text-text-muted leading-relaxed mb-4">
              Help us amplify voices and create positive change in our community.
            </p>
            <Button
              asChild
              size="sm"
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white"
            >
              <Link href="/donate">Donate Now</Link>
            </Button>
          </div>
        </div>
      </aside>

      {/* Right - Episode Grid */}
      <div className="lg:col-span-3">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-heading font-bold text-text-main">Episode Archive</h2>
          <p className="text-sm text-text-muted mt-1">
            Showing {displayedEpisodes.length} of {filteredEpisodes.length} episodes
          </p>
        </div>

        {/* Episodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedEpisodes.map((episode) => {
            const publishedDate = new Date(episode.publishedAt);

            return (
              <Link
                key={episode.id}
                href={`/podcasts/${episode.slug}`}
                className="flex flex-col bg-white rounded-xl border border-border/40 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-brand-primary/20 hover:border-brand-primary/50 hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-500 group h-full"
              >
                {/* Thumbnail with Play Button */}
                <div className="relative aspect-video overflow-hidden bg-gray-900">
                  <Image
                    src={episode.thumbnailUrl}
                    alt={episode.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Episode Badge */}
                  {episode.episodeNumber && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-brand-primary text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider shadow-lg">
                        EP {episode.episodeNumber}
                      </span>
                    </div>
                  )}
                  
                  {/* Duration Badge - Top Right */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded text-xs font-semibold">
                      {episode.duration} min
                    </span>
                  </div>
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-brand-primary ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {episode.topics[0] && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide text-brand-primary">
                        {episode.topics[0]}
                      </span>
                    )}
                    <span className="flex items-center text-xs text-text-muted">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(publishedDate, { addSuffix: true })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-heading font-bold text-text-main mb-2 group-hover:text-brand-primary transition-colors line-clamp-2">
                    {episode.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-text-muted leading-relaxed mb-4 line-clamp-2">
                    {episode.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="mt-auto flex items-center gap-2">
                    {/* Watch Button */}
                    <div className="flex-1 inline-flex items-center justify-center text-xs font-semibold text-white bg-brand-primary px-3 py-2 rounded-lg hover:bg-brand-primary-dark hover:shadow-lg hover:scale-105 transition-all duration-300 h-9 cursor-pointer">
                      Watch Episode
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    
                    {/* Share Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = `${window.location.origin}/podcasts/${episode.slug}`;
                        if (navigator.share) {
                          navigator.share({
                            title: episode.title,
                            text: episode.description,
                            url: url,
                          }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(url);
                        }
                      }}
                      className="flex items-center justify-center w-9 h-9 rounded-lg border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white hover:shadow-lg hover:scale-110 transition-all duration-300 flex-shrink-0"
                      title="Share episode"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-12 text-center">
            <Button
              onClick={() => setDisplayCount((prev) => prev + 12)}
              size="lg"
              variant="outline"
              className="min-w-[200px] border-border hover:bg-bg-soft"
            >
              Load More Stories
            </Button>
          </div>
        )}

        {/* No Results */}
        {filteredEpisodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted">No episodes found matching your filters.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
