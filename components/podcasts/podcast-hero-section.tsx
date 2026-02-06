'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Youtube, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Podcast } from '@/lib/types/podcast';

interface PodcastHeroSectionProps {
  featuredPodcast: Podcast | null;
}

export default function PodcastHeroSection({ featuredPodcast }: PodcastHeroSectionProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  if (!featuredPodcast) {
    return (
      <section className="bg-gradient-ocean py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <Music className="w-4 h-4 mr-2" />
            Podcast Series
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-6">
            Living With Autism
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Stories, insights, and conversations about autism, inclusion, and creating a more understanding world.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-ocean py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-white">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <Music className="w-4 h-4 mr-2" />
              Latest Episode
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold mb-6">
              Living With{' '}
              <span className="text-accent-education">Autism</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
              Stories, insights, and conversations about autism, inclusion, and creating a more understanding world.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                asChild
                size="lg"
                className="bg-white text-brand-primary hover:bg-white/90 font-semibold"
              >
                <Link href={`/podcasts/${featuredPodcast.slug}`}>
                  <Play className="w-5 h-5 mr-2" />
                  Play Latest Episode
                </Link>
              </Button>
            </div>

            {/* Listen On Platforms */}
            <div className="flex items-center gap-4">
              <span className="text-white/80 text-sm">Listen on:</span>
              <a
                href="https://www.youtube.com/@DeeshaFoundation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-accent-education transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Right Column - Featured Video */}
          <div className="relative">
            <div className="aspect-video bg-black/20 rounded-xl overflow-hidden shadow-2xl">
              {!isVideoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              )}
              <iframe
                src={`https://www.youtube.com/embed/${featuredPodcast.youtubeId}`}
                title={featuredPodcast.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsVideoLoaded(true)}
                className="w-full h-full"
              />
            </div>

            {/* Episode Info Overlay */}
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-md rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-accent-education text-white rounded uppercase tracking-wide">
                  {featuredPodcast.format}
                </span>
                <span className="text-white/80 text-xs">
                  {featuredPodcast.duration}
                </span>
              </div>
              <h3 className="font-heading font-bold text-white text-lg line-clamp-2">
                {featuredPodcast.title}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
