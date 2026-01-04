-- Media Assets Table for tracking all uploaded files
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'document')),
  mime_type TEXT,
  size_bytes BIGINT,
  dimensions JSONB, -- {width: number, height: number, duration?: number}
  alt_text TEXT,
  caption TEXT,
  tags TEXT[],
  uploaded_by UUID, -- Admin user ID who uploaded the file
  usage_locations JSONB DEFAULT '[]'::jsonb, -- Array of {page: string, section: string, field: string}
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON public.media_assets(type);
CREATE INDEX IF NOT EXISTS idx_media_assets_bucket ON public.media_assets(bucket);
CREATE INDEX IF NOT EXISTS idx_media_assets_uploaded_by ON public.media_assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON public.media_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_is_deleted ON public.media_assets(is_deleted) WHERE is_deleted = false;

-- Create full-text search index for filename and tags
CREATE INDEX IF NOT EXISTS idx_media_assets_search ON public.media_assets USING gin(to_tsvector('english', filename || ' ' || COALESCE(alt_text, '') || ' ' || COALESCE(caption, '')));

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_media_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_media_assets_updated_at();

-- Grant permissions
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all media
CREATE POLICY "Authenticated users can view media"
  ON public.media_assets
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert media
CREATE POLICY "Authenticated users can insert media"
  ON public.media_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update media
CREATE POLICY "Authenticated users can update media"
  ON public.media_assets
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Authenticated users can delete media
CREATE POLICY "Authenticated users can delete media"
  ON public.media_assets
  FOR DELETE
  TO authenticated
  USING (true);

-- Add comment
COMMENT ON TABLE public.media_assets IS 'Tracks all media assets uploaded to the site with metadata and usage information';
