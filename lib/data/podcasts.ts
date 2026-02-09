// Podcast Data Access Layer
// Server-side functions for fetching podcast data from Supabase

import { createClient } from '@/lib/supabase/server';
import { Podcast, PodcastRow, transformPodcastRow, PodcastFilters } from '@/lib/types/podcast';

/**
 * Get all published podcasts with optional filters
 */
export async function getPublishedPodcasts(
  filters?: PodcastFilters
): Promise<Podcast[]> {
  const supabase = await createClient();

  let query = supabase
    .from('podcasts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false });

  // Apply format filter
  if (filters?.format && filters.format !== 'all') {
    query = query.eq('format', filters.format);
  }

  // Apply topics filter (contains any of the selected topics)
  if (filters?.topics && filters.topics.length > 0) {
    query = query.overlaps('topics', filters.topics);
  }

  // Apply featured filter
  if (filters?.featured !== undefined) {
    query = query.eq('featured', filters.featured);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching podcasts:', error);
    return [];
  }

  if (!data) return [];

  // Transform to camelCase and apply search filter if needed
  let podcasts = data.map(transformPodcastRow);

  if (filters?.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    podcasts = podcasts.filter(
      (podcast) =>
        podcast.title.toLowerCase().includes(query) ||
        podcast.description.toLowerCase().includes(query) ||
        podcast.guestName?.toLowerCase().includes(query) ||
        podcast.showNotes?.toLowerCase().includes(query)
    );
  }

  return podcasts;
}

/**
 * Get a single podcast by slug
 */
export async function getPodcastBySlug(slug: string): Promise<Podcast | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('podcasts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error) {
    console.error(`Error fetching podcast with slug ${slug}:`, error);
    return null;
  }

  if (!data) return null;

  return transformPodcastRow(data as PodcastRow);
}

/**
 * Get featured podcast (for hero section)
 */
export async function getFeaturedPodcast(): Promise<Podcast | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('podcasts')
    .select('*')
    .eq('published', true)
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching featured podcast:', error);
    return null;
  }

  if (!data) return null;

  return transformPodcastRow(data as PodcastRow);
}

/**
 * Get all featured podcasts (for rotating hero section)
 */
export async function getFeaturedPodcasts(): Promise<Podcast[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('podcasts')
    .select('*')
    .eq('published', true)
    .eq('featured', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching featured podcasts:', error);
    return [];
  }

  if (!data) return [];

  return data.map(transformPodcastRow);
}

/**
 * Get latest podcasts (for homepage/stories page integration)
 */
export async function getLatestPodcasts(limit: number = 6): Promise<Podcast[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('podcasts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching latest podcasts:', error);
    return [];
  }

  if (!data) return [];

  return data.map(transformPodcastRow);
}

/**
 * Get related podcasts by IDs
 */
export async function getRelatedPodcasts(podcastIds: string[]): Promise<Podcast[]> {
  if (podcastIds.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('podcasts')
    .select('*')
    .in('id', podcastIds)
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching related podcasts:', error);
    return [];
  }

  if (!data) return [];

  return data.map(transformPodcastRow);
}

/**
 * Get all unique topics from podcasts (for filter sidebar)
 */
export async function getPodcastTopics(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('podcasts')
    .select('topics')
    .eq('published', true);

  if (error) {
    console.error('Error fetching podcast topics:', error);
    return [];
  }

  if (!data) return [];

  // Flatten and deduplicate topics
  const allTopics = data.flatMap((row) => row.topics || []);
  const uniqueTopics = Array.from(new Set(allTopics));

  return uniqueTopics.sort();
}

/**
 * Increment view count for a podcast
 */
export async function incrementPodcastViews(podcastId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_podcast_views', {
    podcast_id: podcastId,
  });

  if (error) {
    console.error('Error incrementing podcast views:', error);
  }
}

/**
 * Get podcast slugs for static generation
 * Uses createServerClient for build-time compatibility
 */
export async function getPodcastSlugs(): Promise<string[]> {
  try {
    // For build time, we need to use the service role client
    // that doesn't require cookies
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('podcasts')
      .select('slug')
      .eq('published', true);

    if (error) {
      console.error('Error fetching podcast slugs:', error);
      return [];
    }

    if (!data) return [];

    return data.map((row) => row.slug);
  } catch (error) {
    console.error('Error in getPodcastSlugs:', error);
    return [];
  }
}

/**
 * Get total podcast count
 */
export async function getPodcastCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('podcasts')
    .select('*', { count: 'exact', head: true })
    .eq('published', true);

  if (error) {
    console.error('Error fetching podcast count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Search podcasts using full-text search
 */
export async function searchPodcasts(query: string): Promise<Podcast[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('search_podcasts', {
    search_query: query,
  });

  if (error) {
    console.error('Error searching podcasts:', error);
    return [];
  }

  if (!data) return [];

  return data.map(transformPodcastRow);
}

/**
 * Get all highlights from all podcasts with episode metadata
 * Returns highlights sorted by episode publish date (latest first)
 */
export interface HighlightWithEpisode {
  highlightUrl: string;
  episodeId: string;
  episodeNumber: number | null;
  episodeTitle: string;
  episodeSlug: string;
  episodeThumbnail: string;
  publishedAt: string;
}

export async function getAllPodcastHighlights(limit?: number): Promise<HighlightWithEpisode[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('podcasts')
    .select('id, episode_number, title, slug, thumbnail_url, published_at, highlights')
    .eq('published', true)
    .not('highlights', 'is', null)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching podcast highlights:', error);
    return [];
  }

  if (!data) return [];

  // Flatten all highlights with episode metadata
  const allHighlights: HighlightWithEpisode[] = [];

  for (const podcast of data) {
    if (podcast.highlights && Array.isArray(podcast.highlights)) {
      for (const highlightUrl of podcast.highlights) {
        allHighlights.push({
          highlightUrl,
          episodeId: podcast.id,
          episodeNumber: podcast.episode_number,
          episodeTitle: podcast.title,
          episodeSlug: podcast.slug,
          episodeThumbnail: podcast.thumbnail_url,
          publishedAt: podcast.published_at,
        });
      }
    }
  }

  // Sort by published date (latest episodes first)
  allHighlights.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Apply limit if specified
  return limit ? allHighlights.slice(0, limit) : allHighlights;
}
