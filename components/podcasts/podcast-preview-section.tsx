'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Podcast } from '@/lib/types/podcast';
import { Calendar, Play, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PodcastPreviewSectionProps {
  podcasts: Podcast[];
}

export default function PodcastPreviewSection({ podcasts }: PodcastPreviewSectionProps) {
  // Show only 6 most recent episodes
  const previewPodcasts = podcasts.slice(0, 6);

  return (
    <section className="py-20 bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-brand-primary to-blue-500 text-white rounded-full mb-5 shadow-lg">
            <Sparkles className="w-4 h-4" />
            <span className="font-bold text-sm uppercase tracking-wider">Recent Episodes</span>
          </div>
          
          <h2 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
            <span className="bg-gradient-to-r from-brand-primary via-blue-600 to-brand-primary bg-clip-text text-transparent">
              Latest Conversations
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-text-muted leading-relaxed font-semibold">
            Discover inspiring stories and transformative discussions from our most recent episodes.
          </p>
        </div>

        {/* Episodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
          {previewPodcasts.map((episode) => {
            const publishedDate = new Date(episode.publishedAt);

            return (
              <Link
                key={episode.id}
                href={`/podcasts/${episode.slug}`}
                className="flex flex-col bg-white rounded-2xl border-2 border-blue-100 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-brand-primary/30 hover:border-brand-primary hover:-translate-y-2 hover:scale-[1.03] transition-all duration-500 group h-full"
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

        {/* Browse All CTA */}
        <div className="text-center">
          <Link
            href="/podcasts/episodes"
            className="inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-brand-primary via-blue-500 to-brand-primary hover:from-blue-600 hover:via-brand-primary hover:to-blue-600 text-white rounded-2xl font-bold text-xl transition-all duration-500 shadow-2xl hover:shadow-3xl hover:scale-105 transform group bg-[length:200%_200%] bg-left hover:bg-right"
          >
            <span className="relative">
              Browse All {podcasts.length} Episodes
              <span className="absolute -bottom-1 left-0 w-0 h-1 bg-white rounded-full transition-all duration-300 group-hover:w-full"></span>
            </span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
          </Link>
          
          <p className="text-sm text-gray-600 mt-4 font-semibold">
            Explore our complete archive with powerful search and filters
          </p>
        </div>
      </div>
    </section>
  );
}
