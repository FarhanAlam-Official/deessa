'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import AllHighlightsCard from './all-highlights-card';
import Link from 'next/link';
import type { HighlightWithEpisode } from '@/lib/data/podcasts';

interface AllHighlightsSectionProps {
  highlights: HighlightWithEpisode[];
}

export default function AllHighlightsSection({ highlights }: AllHighlightsSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft =
        direction === 'left'
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  if (!highlights || highlights.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-brand-primary" />
          <h2 className="text-3xl font-heading font-bold text-text-main">
            Podcast Highlights
          </h2>
        </div>
        <Link
          href="/podcasts/highlights"
          className="text-brand-primary hover:text-brand-primary-dark font-semibold text-sm transition-colors duration-200"
        >
          Watch All Highlights →
        </Link>
      </div>

      {/* Carousel Container */}
      <div className="relative group/carousel">
        {/* Left Navigation Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 hover:scale-110"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-800" />
        </button>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {highlights.map((highlight, index) => (
            <div key={`${highlight.episodeId}-${index}`} className="flex-shrink-0 w-[280px]">
              <AllHighlightsCard
                highlightUrl={highlight.highlightUrl}
                episodeNumber={highlight.episodeNumber}
                episodeTitle={highlight.episodeTitle}
                episodeSlug={highlight.episodeSlug}
                index={index + 1}
              />
            </div>
          ))}
        </div>

        {/* Right Navigation Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 hover:scale-110"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-gray-800" />
        </button>
      </div>
    </section>
  );
}
