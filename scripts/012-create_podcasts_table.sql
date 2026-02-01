-- ===========================================
-- PODCASTS TABLE MIGRATION
-- ===========================================
-- Create podcasts table with all necessary fields for episode management
-- Run this in Supabase SQL Editor

-- Drop existing table if it exists (for development only)
-- DROP TABLE IF EXISTS public.podcasts CASCADE;

-- Create podcasts table
CREATE TABLE IF NOT EXISTS public.podcasts (
  -- Primary fields
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Media fields
  youtube_id TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  duration TEXT NOT NULL, -- Format: "45:30" or "1:23:45"
  format TEXT NOT NULL CHECK (format IN ('video', 'audio', 'both')),
  
  -- Episode metadata
  episode_number INTEGER,
  topics TEXT[] DEFAULT '{}', -- Array of topic strings
  show_notes TEXT,
  transcript TEXT, -- Plain text transcript with timestamps
  
  -- Guest information
  guest_name TEXT,
  guest_title TEXT,
  guest_bio TEXT,
  guest_photo_url TEXT,
  guest_social_links JSONB DEFAULT '{}', -- {linkedin: "", twitter: "", website: ""}
  
  -- Related content
  related_episode_ids UUID[] DEFAULT '{}', -- Array of related podcast IDs
  
  -- Statistics
  view_count INTEGER DEFAULT 0,
  
  -- Publishing
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_podcasts_slug ON public.podcasts(slug);
CREATE INDEX IF NOT EXISTS idx_podcasts_published_at ON public.podcasts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcasts_featured ON public.podcasts(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_podcasts_published ON public.podcasts(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_podcasts_episode_number ON public.podcasts(episode_number);
CREATE INDEX IF NOT EXISTS idx_podcasts_topics ON public.podcasts USING GIN(topics);

-- Enable Row Level Security (RLS)
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Anyone can read published podcasts
CREATE POLICY "Anyone can view published podcasts"
  ON public.podcasts
  FOR SELECT
  USING (published = true);

-- Policy: Authenticated users can view all podcasts (for admin)
CREATE POLICY "Authenticated users can view all podcasts"
  ON public.podcasts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert podcasts
CREATE POLICY "Authenticated users can insert podcasts"
  ON public.podcasts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update podcasts
CREATE POLICY "Authenticated users can update podcasts"
  ON public.podcasts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete podcasts
CREATE POLICY "Authenticated users can delete podcasts"
  ON public.podcasts
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_podcasts_updated_at
  BEFORE UPDATE ON public.podcasts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for full-text search on podcasts
CREATE OR REPLACE FUNCTION search_podcasts(search_query TEXT)
RETURNS SETOF public.podcasts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.podcasts
  WHERE published = true
    AND (
      title ILIKE '%' || search_query || '%'
      OR description ILIKE '%' || search_query || '%'
      OR show_notes ILIKE '%' || search_query || '%'
      OR transcript ILIKE '%' || search_query || '%'
      OR guest_name ILIKE '%' || search_query || '%'
    )
  ORDER BY published_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_podcast_views(podcast_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.podcasts
  SET view_count = view_count + 1
  WHERE id = podcast_id;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON public.podcasts TO authenticated;
GRANT SELECT ON public.podcasts TO anon;
GRANT EXECUTE ON FUNCTION search_podcasts TO anon;
GRANT EXECUTE ON FUNCTION search_podcasts TO authenticated;
GRANT EXECUTE ON FUNCTION increment_podcast_views TO anon;
GRANT EXECUTE ON FUNCTION increment_podcast_views TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Podcasts table created successfully with RLS policies and search functions!';
END $$;
