'use client';

import { useState, useEffect } from 'react';
import { Play, Youtube, Radio, Podcast as PodcastIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Podcast } from '@/lib/types/podcast';
import PodcastVideoModal from './podcast-video-modal';

interface PodcastMainHeroProps {
  episodes: Podcast[];
}

export default function PodcastMainHero({ episodes }: PodcastMainHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const episode = episodes[currentIndex];
  const hasMultipleEpisodes = episodes.length > 1;

  // Auto-rotate through featured episodes every 60 seconds
  useEffect(() => {
    if (!hasMultipleEpisodes || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % episodes.length);
    }, 60000);

    return () => clearInterval(interval);
  }, [episodes.length, hasMultipleEpisodes, isPaused]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + episodes.length) % episodes.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 15000); // Resume after 15s
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % episodes.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 15000); // Resume after 15s
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 15000); // Resume after 15s
  };

  return (
    <>
      <section className="py-12 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-text-main mb-6">
              DEESSA Voices – <span className="text-brand-primary">Stories of Resilience</span>
            </h1>
            
            <p className="text-lg text-text-muted leading-relaxed mb-8">
              Join us as we explore powerful stories, amplify diverse voices, and spark
              conversations that matter. Each episode brings you closer to the heart of our
              mission for inclusion and community empowerment.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Button
                size="lg"
                onClick={() => setShowModal(true)}
                className="bg-brand-primary hover:bg-brand-primary-dark text-white px-8 py-6 text-lg font-semibold"
              >
                <Play className="w-5 h-5 mr-2" fill="currentColor" />
                {hasMultipleEpisodes ? 'Play Featured' : 'Play Latest'}
              </Button>

              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-text-muted uppercase tracking-wide">
                  Listen On:
                </span>
                <div className="flex items-center gap-3">
                  <button
                    className="w-10 h-10 rounded-full bg-bg-soft hover:bg-brand-primary/10 flex items-center justify-center transition-colors"
                    aria-label="Listen on Podcast"
                  >
                    <PodcastIcon className="w-5 h-5 text-text-main" />
                  </button>
                  <button
                    className="w-10 h-10 rounded-full bg-bg-soft hover:bg-brand-primary/10 flex items-center justify-center transition-colors"
                    aria-label="Listen on Radio"
                  >
                    <Radio className="w-5 h-5 text-text-main" />
                  </button>
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-10 h-10 rounded-full bg-bg-soft hover:bg-brand-primary/10 flex items-center justify-center transition-colors"
                    aria-label="Watch on YouTube"
                  >
                    <Youtube className="w-5 h-5 text-text-main" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Video Player */}
          <div className="relative">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
              <iframe
                key={episode.id}
                src={`https://www.youtube.com/embed/${episode.youtubeId}?rel=0&modestbranding=1`}
                title={episode.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Carousel Indicators - Only show if multiple episodes */}
            {hasMultipleEpisodes && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {episodes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-brand-primary'
                        : 'w-2 bg-border hover:bg-text-muted'
                    }`}
                    aria-label={`Go to episode ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

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
