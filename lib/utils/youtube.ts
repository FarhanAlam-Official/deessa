/**
 * Extracts YouTube video ID from various URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Generates YouTube thumbnail URL from video ID
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'maxres'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

/**
 * Fetches YouTube video metadata using oEmbed API
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<{
  title: string;
  thumbnailUrl: string;
  authorName: string;
  authorUrl: string;
} | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      title: data.title,
      thumbnailUrl: data.thumbnail_url,
      authorName: data.author_name,
      authorUrl: data.author_url,
    };
  } catch (error) {
    console.error('Failed to fetch YouTube metadata:', error);
    return null;
  }
}

/**
 * Generates a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
