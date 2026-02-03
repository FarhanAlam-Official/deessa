-- ===========================================
-- ADD KEY TOPICS AND STRUCTURED SHOW NOTES
-- ===========================================
-- Migration to add key_topics field and update show_notes structure

-- Add key_topics column to store timestamp-topic pairs
ALTER TABLE public.podcasts 
ADD COLUMN IF NOT EXISTS key_topics TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.podcasts.key_topics IS 'Line-based format: HH:MM - Topic description (one per line)';

-- Update show_notes comment to indicate structured format
COMMENT ON COLUMN public.podcasts.show_notes IS 'JSONB array of up to 5 note objects: [{title, content}]';

-- Optionally migrate existing show_notes from TEXT to JSONB
-- If you have existing data, you may want to convert it
-- ALTER TABLE public.podcasts ALTER COLUMN show_notes TYPE JSONB USING 
--   CASE 
--     WHEN show_notes IS NULL THEN NULL
--     WHEN show_notes = '' THEN NULL
--     ELSE jsonb_build_array(jsonb_build_object('title', 'Note 1', 'content', show_notes))
--   END;

-- For now, let's keep show_notes as TEXT and handle JSON parsing in the application
-- This provides backward compatibility

-- Create index for searching within key_topics
CREATE INDEX IF NOT EXISTS idx_podcasts_key_topics ON public.podcasts USING GIN(to_tsvector('english', key_topics));
