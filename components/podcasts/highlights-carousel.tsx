'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PodcastHighlightCard from './podcast-highlight-card';

interface HighlightsCarouselProps {
  highlights: string[];
}

export default function HighlightsCarousel({ highlights }: HighlightsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // Adjust based on card width
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      {/* Navigation Buttons */}
      <div className="flex gap-2 mb-6 justify-end">
        <button
          onClick={() => scroll('left')}
          className="w-9 h-9 rounded-full bg-white border-2 border-gray-200 hover:border-brand-primary hover:bg-brand-primary/5 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="w-9 h-9 rounded-full bg-white border-2 border-gray-200 hover:border-brand-primary hover:bg-brand-primary/5 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>
      
      {/* Scrollable Container */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {highlights.map((shortUrl, index) => (
            <div key={index} className="flex-shrink-0 w-[220px]">
              <PodcastHighlightCard 
                shortUrl={shortUrl}
                index={index + 1}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
