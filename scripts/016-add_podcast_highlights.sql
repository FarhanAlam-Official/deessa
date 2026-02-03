-- ===========================================
-- ADD PODCAST HIGHLIGHTS (YOUTUBE SHORTS)
-- ===========================================
-- Migration to add highlights field for storing YouTube Shorts URLs

-- Add highlights column to store array of YouTube Short URLs
ALTER TABLE public.podcasts 
ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.podcasts.highlights IS 'Array of YouTube Shorts URLs showcasing key moments from the episode';

-- Add constraint to limit to reasonable number of highlights (e.g., 10)
ALTER TABLE public.podcasts 
ADD CONSTRAINT highlights_max_10 CHECK (array_length(highlights, 1) IS NULL OR array_length(highlights, 1) <= 10);

-- Create index for searching within highlights
CREATE INDEX IF NOT EXISTS idx_podcasts_highlights ON public.podcasts USING GIN(highlights);

-- Add sample comment for format
COMMENT ON CONSTRAINT highlights_max_10 ON public.podcasts IS 'Limits highlights to maximum 10 YouTube Shorts URLs per episode';
