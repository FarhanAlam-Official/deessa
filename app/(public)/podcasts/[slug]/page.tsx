import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock, Calendar,Mail, Megaphone, Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';
import PodcastStickyPlayer from '@/components/podcasts/podcast-sticky-player';
import PodcastTranscript from '@/components/podcasts/podcast-transcript';
import PodcastShareCard from '@/components/podcasts/podcast-share-card';
import HighlightsCarousel from '@/components/podcasts/highlights-carousel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ShareButton from '@/components/share-button';
import { getPodcastBySlug, getRelatedPodcasts, getPodcastSlugs, incrementPodcastViews } from '@/lib/data/podcasts';
import { format } from 'date-fns';

interface PodcastDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = await getPodcastSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PodcastDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const podcast = await getPodcastBySlug(slug);

  if (!podcast) {
    return {
      title: 'Podcast Not Found | Deesha Foundation',
    };
  }

  return {
    title: `${podcast.title} | Deesha Foundation Podcast`,
    description: podcast.description,
    openGraph: {
      title: podcast.title,
      description: podcast.description,
      type: 'video.episode',
      images: [{ url: podcast.thumbnailUrl }],
    },
  };
}

export default async function PodcastDetailPage({ params }: PodcastDetailPageProps) {
  const { slug } = await params;
  const podcast = await getPodcastBySlug(slug);

  if (!podcast) {
    notFound();
  }

  // Increment view count (fire and forget)
  incrementPodcastViews(podcast.id).catch(console.error);

  // Get related podcasts
  const relatedPodcasts = podcast.relatedEpisodeIds.length > 0
    ? await getRelatedPodcasts(podcast.relatedEpisodeIds)
    : [];

  const hasGuest = podcast.guestName && podcast.guestBio;
  const publishedDate = new Date(podcast.publishedAt);

  // Helper function to limit bio to 35 words
  const limitWords = (text: string, wordLimit: number) => {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Sticky Player - Initially hidden, shows on scroll */}
      <PodcastStickyPlayer podcast={podcast} />

      {/* Episode Header - Centered Layout */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-12 text-center">
          {/* Episode Number and Date */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {podcast.episodeNumber && (
              <span className="inline-flex items-center px-4 py-1.5 rounded-md bg-brand-primary/10 text-brand-primary font-semibold uppercase text-xs tracking-wider">
                Episode {podcast.episodeNumber}
              </span>
            )}
            <span className="text-sm text-gray-500">
              {format(publishedDate, 'MMM dd, yyyy')}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-primary mb-6 leading-tight">
            {podcast.title}
          </h1>

          {/* Guest Info */}
          {hasGuest && (
            <p className="text-lg text-gray-600">
              Featuring <span className="font-semibold text-gray-900">{podcast.guestName}</span>
              {podcast.guestTitle && ` • ${podcast.guestTitle}`}
              <span className="mx-2">•</span>
              Duration: {podcast.duration}
            </p>
          )}
        </div>
      </header>

      {/* Video Player with Key Topics */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            {/* Video Player - Left Side */}
            <div className="lg:col-span-5">
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${podcast.youtubeId}?rel=0`}
                  title={podcast.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-lg shadow-xl"
                />
              </div>
            </div>

            {/* Key Topics & Timestamps - Right Side */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border p-6 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 bg-brand-primary/10 rounded flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-brand-primary rounded"></div>
                  </div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    Key Topics & Timestamps
                  </h2>
                </div>
                
                {/* Scrollable container */}
                <div className="space-y-4 overflow-y-auto flex-1 pr-2" style={{ maxHeight: '400px' }}>
                  {podcast.keyTopics && podcast.keyTopics.length > 0 ? (
                    podcast.keyTopics.map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <span className="text-brand-primary font-bold text-sm flex-shrink-0">{item.timestamp}</span>
                        <p className="text-gray-700 text-sm leading-relaxed">{item.topic}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic">No key topics available for this episode.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg border p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
                Description
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                {podcast.description ? (
                  <p>{podcast.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available for this episode.</p>
                )}
              </div>
            </div>

            {/* Highlights Section - YouTube Shorts */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
                    Episode Highlights
                  </h2>
                  <p className="text-sm text-gray-600">
                    Quick clips from the best moments
                  </p>
                </div>
                {podcast.highlights && podcast.highlights.length > 0 && (
                  <div className="px-3 py-1 bg-brand-primary/10 rounded-full">
                    <span className="text-sm font-bold text-brand-primary">
                      {podcast.highlights.length} {podcast.highlights.length === 1 ? 'Short' : 'Shorts'}
                    </span>
                  </div>
                )}
              </div>
              
              {podcast.highlights && podcast.highlights.length > 0 ? (
                <HighlightsCarousel highlights={podcast.highlights} />
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-base">No highlights available for this episode yet.</p>
                  <p className="text-gray-400 text-sm mt-2">Check back later for curated shorts!</p>
                </div>
              )}
            </div>

            {/* Show Notes */}
            <div className="bg-white rounded-lg border p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
                Show Notes
              </h2>
              {podcast.showNotes && podcast.showNotes.length > 0 ? (
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                  {podcast.showNotes.map((note, index) => (
                    <div key={index} className="space-y-2">
                      <h3 className="text-lg font-bold text-brand-primary">
                        {note.title}
                      </h3>
                      <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                        <p>{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No show notes available for this episode.</p>
              )}
            </div>

            {/* Transcript */}
            <div className="bg-white rounded-lg border p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
                Full Transcript
              </h2>
              {podcast.transcript ? (
                <PodcastTranscript transcript={podcast.transcript} />
              ) : (
                <p className="text-gray-500 italic">No transcript available for this episode yet.</p>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-28 space-y-6">
              {/* Guest Card */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-extrabold text-lg text-gray-900 mb-6">
                  Meet the Guest
                </h3>
                
                {hasGuest ? (
                  <div className="flex flex-col items-center text-center">
                    {/* Circular Guest Photo */}
                    {podcast.guestPhotoUrl && (
                      <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-brand-primary/10">
                        <img
                          src={podcast.guestPhotoUrl}
                          alt={podcast.guestName!}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Guest Name - Larger */}
                    <h4 className="font-extrabold text-2xl text-gray-900 mb-2">
                      {podcast.guestName}
                    </h4>
                    
                    {/* Guest Roles - Pipe separated */}
                    {podcast.guestRoles && podcast.guestRoles.length > 0 && (
                      <p className="text-md font-semibold text-brand-primary mb-3">
                        {podcast.guestRoles.join(' | ')}
                      </p>
                    )}
                    
                    {/* Limited Bio - Max 35 words */}
                    {podcast.guestBio && (
                      <p className="text-sm text-gray-600 leading-relaxed mb-4">
                        {limitWords(podcast.guestBio, 35)}
                      </p>
                    )}
                    
                    {/* Social Links - Always show all icons */}
                    <div className="flex gap-2 mt-2 flex-wrap justify-center">
                      {/* LinkedIn */}
                      {podcast.guestSocialLinks?.linkedin ? (
                        <a
                          href={podcast.guestSocialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-[#0077B5] flex items-center justify-center text-gray-600 hover:text-white transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      ) : (
                        <span
                          className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 cursor-not-allowed"
                          title="LinkedIn (Not provided)"
                        >
                          <Linkedin className="w-4 h-4" />
                        </span>
                      )}
                      
                      {/* X (Twitter) */}
                      {podcast.guestSocialLinks?.twitter ? (
                        <a
                          href={podcast.guestSocialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-black flex items-center justify-center text-gray-600 hover:text-white transition-colors"
                          title="X (Twitter)"
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      ) : (
                        <span
                          className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 cursor-not-allowed"
                          title="X (Not provided)"
                        >
                          <Twitter className="w-4 h-4" />
                        </span>
                      )}
                      
                      {/* Facebook */}
                      {podcast.guestSocialLinks?.facebook ? (
                        <a
                          href={podcast.guestSocialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-[#1877F2] flex items-center justify-center text-gray-600 hover:text-white transition-colors"
                          title="Facebook"
                        >
                          <Facebook className="w-4 h-4" />
                        </a>
                      ) : (
                        <span
                          className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 cursor-not-allowed"
                          title="Facebook (Not provided)"
                        >
                          <Facebook className="w-4 h-4" />
                        </span>
                      )}
                      
                      {/* Instagram */}
                      {podcast.guestSocialLinks?.instagram ? (
                        <a
                          href={podcast.guestSocialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#E1306C] hover:to-[#F77737] flex items-center justify-center text-gray-600 hover:text-white transition-all"
                          title="Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      ) : (
                        <span
                          className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 cursor-not-allowed"
                          title="Instagram (Not provided)"
                        >
                          <Instagram className="w-4 h-4" />
                        </span>
                      )}
                      
                      {/* Email */}
                      {podcast.guestSocialLinks?.email ? (
                        <a
                          href={`mailto:${podcast.guestSocialLinks.email}`}
                          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-700 flex items-center justify-center text-gray-600 hover:text-white transition-colors"
                          title="Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      ) : (
                        <span
                          className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 cursor-not-allowed"
                          title="Email (Not provided)"
                        >
                          <Mail className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-center py-4">No guest information available for this episode.</p>
                )}
              </div>

              {/* Related Episodes - Between Guest and Share */}
              {relatedPodcasts.length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-extrabold text-sm text-gray-500 uppercase tracking-wider mb-4">
                    Related Episodes
                  </h3>
                  <div className="space-y-4">
                    {relatedPodcasts.slice(0, 3).map((related) => (
                      <Link
                        key={related.id}
                        href={`/podcasts/${related.slug}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          <div className="w-24 h-24 relative rounded overflow-hidden flex-shrink-0">
                            <img
                              src={related.thumbnailUrl}
                              alt={related.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-brand-primary font-semibold uppercase mb-1 block">
                              Ep {related.episodeNumber}
                            </span>
                            <h4 className="font-semibold text-sm text-gray-900 group-hover:text-brand-primary transition-colors line-clamp-2 mb-1">
                              {related.title}
                            </h4>
                            <p className="text-xs text-gray-500">{related.duration}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Episode Card */}
              <PodcastShareCard title={podcast.title} description={podcast.description} />
            </div>
          </aside>
        </div>
      </section>

      {/* Bottom CTA Section - Story Submission */}
      <section className="bg-purple-600 py-16">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
              <Megaphone className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Have a story that needs to be heard?
          </h2>
          
          <p className="text-lg text-purple-100 mb-8">
            We are always looking for new voices and perspectives from the community. Suggest a topic or share your personal journey with us.
          </p>
          
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <Input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 rounded-lg border-0 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-300"
            />
            <Button 
              type="submit"
              className="px-8 py-3 bg-purple-800 hover:bg-purple-900 text-white font-semibold rounded-lg transition-colors"
            >
              Share Story
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
