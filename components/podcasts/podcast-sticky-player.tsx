'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Podcast } from '@/lib/types/podcast';

interface PodcastStickyPlayerProps {
  podcast: Podcast;
}

export default function PodcastStickyPlayer({ podcast }: PodcastStickyPlayerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky player when user scrolls past 600px
      setIsVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={playerRef}
      className={`fixed top-0 left-0 right-0 z-40 bg-white border-b shadow-lg transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Progress Bar */}
      <div className="relative h-1 bg-bg-soft">
        <div
          className="absolute top-0 left-0 h-full bg-brand-primary transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleProgressChange}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Player Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="hidden sm:block w-16 h-16 rounded overflow-hidden flex-shrink-0">
            <img
              src={podcast.thumbnailUrl}
              alt={podcast.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Episode Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-text-main truncate">
              {podcast.title}
            </h3>
            <p className="text-xs text-text-muted">
              {podcast.episodeNumber && `Episode ${podcast.episodeNumber} • `}
              {podcast.duration}
            </p>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
            >
              <SkipBack className="w-4 h-4" />
              <span className="ml-1 text-xs">10s</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-brand-primary hover:bg-brand-primary-dark"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
            >
              <span className="mr-1 text-xs">10s</span>
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Time Display */}
          <div className="hidden md:flex items-center text-xs text-text-muted">
            <span>{formatTime(currentTime)}</span>
            <span className="mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Additional Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex"
              asChild
            >
              <a
                href={`https://www.youtube.com/watch?v=${podcast.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Maximize2 className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
