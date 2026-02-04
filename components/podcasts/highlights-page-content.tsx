'use client';

import { useState, useMemo } from 'react';
import AllHighlightsCard from './all-highlights-card';
import type { HighlightWithEpisode } from '@/lib/data/podcasts';
import { Search, ArrowUpDown, Plus } from 'lucide-react';

interface HighlightsPageContentProps {
  highlights: HighlightWithEpisode[];
}

type SortOption = 'latest' | 'oldest' | 'episode-asc' | 'episode-desc';

const ITEMS_PER_PAGE = 10;

export default function HighlightsPageContent({ highlights }: HighlightsPageContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEpisode, setSelectedEpisode] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Get unique episodes for filter dropdown
  const episodes = useMemo(() => {
    const episodeMap = new Map();
    highlights.forEach((h) => {
      const key = h.episodeId;
      if (!episodeMap.has(key)) {
        episodeMap.set(key, {
          id: h.episodeId,
          number: h.episodeNumber,
          title: h.episodeTitle,
        });
      }
    });
    return Array.from(episodeMap.values()).sort((a, b) => 
      (b.number || 0) - (a.number || 0)
    );
  }, [highlights]);

  // Filter and sort highlights
  const filteredHighlights = useMemo(() => {
    let filtered = [...highlights];

    // Filter by episode
    if (selectedEpisode !== 'all') {
      filtered = filtered.filter((h) => h.episodeId === selectedEpisode);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((h) =>
        h.episodeTitle.toLowerCase().includes(query)
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
  }, [highlights, selectedEpisode, searchQuery, sortBy]);

  // Get visible highlights based on displayCount
  const visibleHighlights = useMemo(() => {
    return filteredHighlights.slice(0, displayCount);
  }, [filteredHighlights, displayCount]);

  const hasMore = displayCount < filteredHighlights.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const handleFilterChange = () => {
    setDisplayCount(ITEMS_PER_PAGE);
  };

  return (
    <div className="space-y-8">
      {/* Filters Section - Improved Design */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search - Improved */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Episodes
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by episode title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleFilterChange();
                }}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Episode Filter - Improved */}
          <div className="w-full lg:w-80">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Episode
            </label>
            <select
              value={selectedEpisode}
              onChange={(e) => {
                setSelectedEpisode(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all bg-white shadow-sm cursor-pointer"
            >
              <option value="all">All Episodes ({highlights.length} highlights)</option>
              {episodes.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.number ? `Ep ${String(ep.number).padStart(2, '0')}` : 'Episode'} · {ep.title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By - Improved */}
          <div className="w-full lg:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ArrowUpDown className="w-4 h-4 inline mr-1" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                handleFilterChange();
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all bg-white shadow-sm cursor-pointer"
            >
              <option value="latest">🕐 Latest First</option>
              <option value="oldest">📅 Oldest First</option>
              <option value="episode-desc">📊 Episode (High → Low)</option>
              <option value="episode-asc">📈 Episode (Low → High)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Info - Improved */}
        <div className="mt-6 pt-5 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary/10 px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-700">
                Showing <span className="font-bold text-brand-primary text-lg">{visibleHighlights.length}</span>
                {filteredHighlights.length > visibleHighlights.length && (
                  <span className="text-gray-500"> of {filteredHighlights.length}</span>
                )}
                {filteredHighlights.length < highlights.length && (
                  <span className="text-gray-500"> (filtered from {highlights.length})</span>
                )}
              </span>
            </div>
          </div>
          {(selectedEpisode !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedEpisode('all');
                setSearchQuery('');
                handleFilterChange();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid of Highlights - Improved Layout */}
      {filteredHighlights.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {visibleHighlights.map((highlight, index) => (
              <AllHighlightsCard
                key={`${highlight.episodeId}-${index}`}
                highlightUrl={highlight.highlightUrl}
                episodeNumber={highlight.episodeNumber}
                episodeTitle={highlight.episodeTitle}
                episodeSlug={highlight.episodeSlug}
                index={index + 1}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="text-sm text-gray-500">
                Showing {visibleHighlights.length} of {filteredHighlights.length} highlights
              </div>
              <button
                onClick={handleLoadMore}
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-brand-primary text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                Load {Math.min(ITEMS_PER_PAGE, filteredHighlights.length - visibleHighlights.length)} More Highlights
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
              <div className="text-xs text-gray-400">
                {filteredHighlights.length - visibleHighlights.length} remaining
              </div>
            </div>
          )}

          {/* All Loaded Message */}
          {!hasMore && filteredHighlights.length > ITEMS_PER_PAGE && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">All highlights loaded! ({filteredHighlights.length} total)</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              No Highlights Found
            </h3>
            <p className="text-gray-500 mb-6 text-lg">
              Try adjusting your filters or search terms to find what you're looking for
            </p>
            <button
              onClick={() => {
                setSelectedEpisode('all');
                setSearchQuery('');
                handleFilterChange();
              }}
              className="inline-flex items-center gap-2 px-8 py-3 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
