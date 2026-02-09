'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Play } from 'lucide-react';

interface PodcastHighlightCardProps {
  shortUrl: string;
  index: number;
}

interface VideoMetadata {
  title?: string;
  duration?: string;
}

export default function PodcastHighlightCard({ shortUrl, index }: PodcastHighlightCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata>({});
  const [imageError, setImageError] = useState(false);

  // Extract YouTube Shorts ID from various URL formats
  const getYouTubeShortId = (url: string) => {
    const patterns = [
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
      /youtu\.be\/([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const shortId = getYouTubeShortId(shortUrl);
  if (!shortId) return null;

  const thumbnailUrl = `https://i.ytimg.com/vi/${shortId}/hqdefault.jpg`;
  const fallbackThumbnail = `https://i.ytimg.com/vi/${shortId}/mqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${shortId}`;

  // Fetch video metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Using YouTube oEmbed API (no API key required)
        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${shortId}&format=json`
        );
        
        if (response.ok) {
          const data = await response.json();
          setMetadata({
            title: data.title,
          });
        }
      } catch (error) {
        // Silently fail - metadata is optional
        console.log('Could not fetch video metadata');
      }
    };

    fetchMetadata();
  }, [shortId]);

  return (
    <div className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-900 shadow-lg hover:shadow-2xl transition-all duration-300">
      {!isPlaying ? (
        <>
          {/* Thumbnail */}
          <img
            src={imageError ? fallbackThumbnail : thumbnailUrl}
            alt={metadata.title || `Highlight ${index}`}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
          
          {/* Play Button */}
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center group/btn"
            aria-label="Play video"
          >
            {/* Play button - White background with filled brand color icon */}
            <div className="w-16 h-16 rounded-full bg-white group-hover/btn:bg-white/95 flex items-center justify-center transform group-hover/btn:scale-110 transition-all duration-300 shadow-2xl">
              <Play className="w-8 h-8 text-brand-primary ml-1" fill="currentColor" />
            </div>
          </button>
          
          {/* Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            {metadata.title && (
              <p className="text-white text-xs font-medium line-clamp-2 leading-tight">
                {metadata.title}
              </p>
            )}
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-brand-primary/90 rounded text-white text-xs font-bold">
                  #{index}
                </span>
                <span className="text-white/80 text-xs font-medium">
                  Short
                </span>
              </div>
              
              {/* Open in YouTube Button */}
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white rounded-lg text-gray-900 text-xs font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ExternalLink className="w-3 h-3" />
                <span>YouTube</span>
              </a>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* YouTube Embed */}
          <iframe
            src={`${embedUrl}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={metadata.title || `Highlight ${index}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          
          {/* Close/Stop Button */}
          <button
            onClick={() => setIsPlaying(false)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center transition-all duration-200 z-10 shadow-xl backdrop-blur-sm"
            aria-label="Stop video"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
