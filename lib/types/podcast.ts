// Podcast Types and Interfaces

export interface PodcastGuest {
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  roles: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    email?: string;
    website?: string;
    [key: string]: string | undefined;
  };
}

export interface ShowNote {
  title: string;
  content: string;
}

export interface KeyTopic {
  timestamp: string;
  topic: string;
}

export interface Podcast {
  id: string;
  slug: string;
  title: string;
  description: string;
  youtubeId: string;
  thumbnailUrl: string;
  duration: string;
  format: 'video' | 'audio' | 'both';
  episodeNumber: number | null;
  topics: string[];
  showNotes: ShowNote[];
  keyTopics: KeyTopic[];
  transcript: string | null;
  highlights: string[]; // YouTube Shorts URLs
  guestName: string | null;
  guestTitle: string | null;
  guestRoles: string[];
  guestBio: string | null;
  guestPhotoUrl: string | null;
  guestSocialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    email?: string;
    website?: string;
    [key: string]: string | undefined;
  } | null;
  relatedEpisodeIds: string[];
  viewCount: number;
  featured: boolean;
  published: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Database row type (snake_case)
export interface PodcastRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  youtube_id: string;
  thumbnail_url: string;
  duration: string;
  format: 'video' | 'audio' | 'both';
  episode_number: number | null;
  topics: string[];
  show_notes: string | null;
  key_topics: string | null;
  transcript: string | null;
  highlights: string[]; // YouTube Shorts URLs
  guest_name: string | null;
  guest_title: string | null;
  guest_bio: string | null;
  guest_photo_url: string | null;
  guest_social_links: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    [key: string]: string | undefined;
  } | null;
  related_episode_ids: string[];
  view_count: number;
  featured: boolean;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

// Transform database row to camelCase object
export function transformPodcastRow(row: PodcastRow): Podcast {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    youtubeId: row.youtube_id,
    thumbnailUrl: row.thumbnail_url,
    duration: row.duration,
    format: row.format,
    episodeNumber: row.episode_number,
    topics: row.topics,
    showNotes: parseShowNotes(row.show_notes),
    keyTopics: parseKeyTopics(row.key_topics),
    transcript: row.transcript,
    highlights: row.highlights || [],
    guestName: row.guest_name,
    guestTitle: row.guest_title,
    guestRoles: row.guest_roles || [],
    guestBio: row.guest_bio,
    guestPhotoUrl: row.guest_photo_url,
    guestSocialLinks: row.guest_social_links,
    relatedEpisodeIds: row.related_episode_ids,
    viewCount: row.view_count,
    featured: row.featured,
    published: row.published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Parse key topics from text format to array of objects
export function parseKeyTopics(keyTopicsText: string | null): KeyTopic[] {
  if (!keyTopicsText) return [];
  
  const lines = keyTopicsText.split('\n').filter(line => line.trim());
  const keyTopics: KeyTopic[] = [];
  
  for (const line of lines) {
    // Match format: HH:MM - Topic or HH:MM Topic (dash is optional)
    // Flexible regex to handle various dash types, whitespace, or no dash
    const match = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*[\-–—]?\s*(.+)$/);
    if (match && match[2] && match[2].trim()) {
      keyTopics.push({
        timestamp: match[1].trim(),
        topic: match[2].trim()
      });
    }
  }
  
  return keyTopics;
}

// Parse show notes from JSON string to array of objects
export function parseShowNotes(showNotesText: string | null): ShowNote[] {
  if (!showNotesText) return [];
  
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(showNotesText);
    if (Array.isArray(parsed)) {
      return parsed.filter(note => note.title && note.content);
    }
  } catch (e) {
    // If not JSON, treat as single note for backward compatibility
    return [{ title: 'Note 1', content: showNotesText }];
  }
  
  return [];
}

// Podcast card props (for display purposes)
export interface PodcastCardProps {
  podcast: Podcast;
  variant?: 'primary' | 'secondary';
  showTopics?: boolean;
  onPlay?: (podcast: Podcast) => void;
}

// Filter options for podcast list
export interface PodcastFilters {
  format?: 'video' | 'audio' | 'both' | 'all';
  topics?: string[];
  searchQuery?: string;
  featured?: boolean;
}
