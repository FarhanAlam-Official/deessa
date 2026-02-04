'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Podcast } from '@/lib/types/podcast';
import { Calendar, Search, Play, ArrowRight, Share2, Heart, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface EpisodesPageContentProps {
  episodes: Podcast[];
}

type SortOption = 'latest' | 'oldest' | 'episode-asc' | 'episode-desc';

const ITEMS_PER_PAGE = 12;

export default function EpisodesPageContent({ episodes }: EpisodesPageContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'video' | 'audio'>('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Get unique topics
  const allTopics = useMemo(() => {
    return Array.from(new Set(episodes.flatMap((ep) => ep.topics))).sort();
  }, [episodes]);

  // Filter and sort episodes
  const filteredEpisodes = useMemo(() => {
    let filtered = [...episodes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((ep) =>
        ep.title.toLowerCase().includes(query) ||
        ep.description.toLowerCase().includes(query) ||
        ep.guestName?.toLowerCase().includes(query)
      );
    }

    // Format filter
    if (selectedFormat !== 'all') {
      filtered = filtered.filter((ep) => ep.format === selectedFormat);
    }

    // Topics filter
    if (selectedTopics.length > 0) {
      filtered = filtered.filter((ep) =>
        ep.topics.some((topic) => selectedTopics.includes(topic))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'oldest':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case 'episode-asc':
          return (a.episodeNumber || 0) - (b.episodeNumber || 0);
        case 'episode-desc':
          return (b.episodeNumber || 0) - (a.episodeNumber || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [episodes, searchQuery, selectedFormat, selectedTopics, sortBy]);

  const visibleEpisodes = useMemo(() => {
    return filteredEpisodes.slice(0, displayCount);
  }, [filteredEpisodes, displayCount]);

  const hasMore = displayCount < filteredEpisodes.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const handleFilterChange = () => {
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
    handleFilterChange();
  };

  const activeFiltersCount = 
    (selectedFormat !== 'all' ? 1 : 0) + 
    selectedTopics.length + 
    (searchQuery ? 1 : 0);

  return (
    <div className="space-y-8">
      {/* Clean Filter Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar - Filters */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl border-2 border-gray-100 p-6 sticky top-24 space-y-6 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-primary" />
                Filters
              </h3>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-text-main mb-2">SEARCH</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search episodes..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleFilterChange();
                    }}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all text-sm"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-text-main mb-2">SORT BY</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortOption);
                    handleFilterChange();
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all cursor-pointer text-sm font-medium"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="episode-desc">Episode # (High to Low)</option>
                  <option value="episode-asc">Episode # (Low to High)</option>
                </select>
              </div>

              {/* Format Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-text-main mb-3">FORMAT</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={selectedFormat === 'all'}
                      onCheckedChange={() => {
                        setSelectedFormat('all');
                        handleFilterChange();
                      }}
                    />
                    <span className="text-sm text-text-muted">All</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={selectedFormat === 'video'}
                      onCheckedChange={() => {
                        setSelectedFormat(selectedFormat === 'video' ? 'all' : 'video');
                        handleFilterChange();
                      }}
                    />
                    <span className="text-sm text-text-muted">Video</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={selectedFormat === 'audio'}
                      onCheckedChange={() => {
                        setSelectedFormat(selectedFormat === 'audio' ? 'all' : 'audio');
                        handleFilterChange();
                      }}
                    />
                    <span className="text-sm text-text-muted">Audio</span>
                  </label>
                </div>
              </div>

              {/* Topics */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-text-main mb-3">TOPICS</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {allTopics.map((topic) => (
                    <label key={topic} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={selectedTopics.includes(topic)}
                        onCheckedChange={() => handleTopicToggle(topic)}
                      />
                      <span className="text-sm text-text-muted">{topic}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Active Filters Clear */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFormat('all');
                    setSelectedTopics([]);
                    handleFilterChange();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Filters ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Support CTA */}
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

        {/* Right Content - Episodes */}
        <div className="lg:col-span-3 space-y-6">
          {/* Episodes Grid */}
          {filteredEpisodes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleEpisodes.map((episode) => {
                  const publishedDate = new Date(episode.publishedAt);

                  return (
                    <Link
                      key={episode.id}
                      href={`/podcasts/${episode.slug}`}
                      className="flex flex-col bg-white rounded-xl border-2 border-gray-100 overflow-hidden shadow-md hover:shadow-xl hover:border-brand-primary hover:-translate-y-1 transition-all duration-300 group h-full"
                    >
                  {/* Thumbnail */}
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
                        <span className="bg-brand-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xl">
                          EP {episode.episodeNumber}
                        </span>
                      </div>
                    )}
                    
                    {/* Duration */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-bold">
                        {episode.duration} min
                      </span>
                    </div>
                    
                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 text-brand-primary ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    
                    {/* Gradient */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {episode.topics[0] && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-brand-primary bg-brand-primary/10 border border-brand-primary/30">
                          {episode.topics[0]}
                        </span>
                      )}
                      <span className="flex items-center text-xs text-text-muted font-semibold">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {formatDistanceToNow(publishedDate, { addSuffix: true })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-heading font-bold text-text-main mb-3 group-hover:text-brand-primary transition-colors line-clamp-2 leading-tight">
                      {episode.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-text-muted leading-relaxed mb-5 line-clamp-2">
                      {episode.description}
                    </p>

                    {/* Actions */}
                    <div className="mt-auto flex items-center gap-2">
                      <div className="flex-1 inline-flex items-center justify-center text-xs font-bold text-white bg-brand-primary px-4 py-2.5 rounded-lg hover:bg-brand-primary-dark hover:shadow-lg hover:scale-105 transition-all duration-300 h-10 cursor-pointer">
                        Watch Episode
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                      
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
                        className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white hover:shadow-lg hover:scale-110 transition-all duration-300 flex-shrink-0"
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

          {/* Load More */}
          {hasMore && (
            <div className="text-center py-8">
              <Button
                onClick={handleLoadMore}
                size="lg"
                variant="outline"
                className="min-w-[240px] border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-bold"
              >
                Load More Episodes ({filteredEpisodes.length - visibleEpisodes.length} remaining)
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-heading font-bold text-gray-800 mb-2">
            No Episodes Found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or search terms.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedFormat('all');
              setSelectedTopics([]);
              handleFilterChange();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg font-bold transition-all"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  </div>
    </div>
  );
}
