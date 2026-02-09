-- ===========================================
-- ADD GUEST ROLES AND ENHANCE SOCIAL LINKS
-- ===========================================
-- Migration to add guest_roles field for podcast guests

-- Add guest_roles column to store up to 3 roles/titles
ALTER TABLE public.podcasts 
ADD COLUMN IF NOT EXISTS guest_roles TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.podcasts.guest_roles IS 'Array of up to 3 guest roles (e.g., "Teacher", "Scholar", "Community Worker")';

-- Add constraint to limit to 3 roles
ALTER TABLE public.podcasts 
ADD CONSTRAINT guest_roles_max_3 CHECK (array_length(guest_roles, 1) IS NULL OR array_length(guest_roles, 1) <= 3);

-- Create index for searching within guest_roles
CREATE INDEX IF NOT EXISTS idx_podcasts_guest_roles ON public.podcasts USING GIN(guest_roles);
