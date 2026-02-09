-- ===================================================
-- SEED SCRIPT: Existing Podcast Data
-- ===================================================
-- This script seeds the database with existing hardcoded podcast episodes
-- Run this in Supabase SQL Editor after creating the podcasts table

-- Insert Episode 1
INSERT INTO public.podcasts (
  slug,
  title,
  description,
  youtube_id,
  thumbnail_url,
  duration,
  format,
  episode_number,
  topics,
  show_notes,
  transcript,
  featured,
  published,
  published_at
) VALUES (
  'understanding-autism-basics',
  'Understanding Autism: The Basics',
  'An introduction to autism spectrum disorder, breaking down common misconceptions and highlighting the beauty of neurodiversity.',
  'dQw4w9WgXcQ',
  'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  '45:30',
  'video',
  1,
  ARRAY['Autism Basics', 'Neurodiversity', 'Education'],
  '<p>In this inaugural episode, we explore the fundamentals of autism spectrum disorder.</p><h3>Key Topics</h3><ul><li>What is autism?</li><li>Common misconceptions</li><li>Celebrating neurodiversity</li></ul>',
  E'[00:00] Welcome to Living With Autism podcast\n[02:15] What is autism spectrum disorder?\n[10:30] Breaking down common myths\n[25:00] Understanding sensory processing\n[35:45] Celebrating neurodiversity\n[43:00] Closing thoughts',
  true,
  true,
  NOW() - INTERVAL '30 days'
);

-- Insert Episode 2
INSERT INTO public.podcasts (
  slug,
  title,
  description,
  youtube_id,
  thumbnail_url,
  duration,
  format,
  episode_number,
  topics,
  show_notes,
  published,
  published_at
) VALUES (
  'sensory-processing-everyday-life',
  'Sensory Processing in Everyday Life',
  'Exploring how individuals with autism experience the world through their senses and practical strategies for sensory-friendly environments.',
  'dQw4w9WgXcQ',
  'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  '38:15',
  'video',
  2,
  ARRAY['Sensory Processing', 'Daily Living', 'Strategies'],
  '<p>Understanding sensory processing differences and creating supportive environments.</p>',
  true,
  NOW() - INTERVAL '23 days'
);

-- Insert Episode 3
INSERT INTO public.podcasts (
  slug,
  title,
  description,
  youtube_id,
  thumbnail_url,
  duration,
  format,
  episode_number,
  topics,
  show_notes,
  published,
  published_at
) VALUES (
  'communication-connection',
  'Communication and Connection',
  'Diverse ways individuals with autism communicate and how we can better understand and support various communication styles.',
  'dQw4w9WgXcQ',
  'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  '42:00',
  'video',
  3,
  ARRAY['Communication', 'AAC', 'Connection'],
  '<p>Exploring different communication methods and fostering meaningful connections.</p>',
  true,
  NOW() - INTERVAL '16 days'
);

-- Insert Episode 4 (Teaser)
INSERT INTO public.podcasts (
  slug,
  title,
  description,
  youtube_id,
  thumbnail_url,
  duration,
  format,
  episode_number,
  topics,
  published,
  published_at
) VALUES (
  'building-inclusive-communities',
  'Building Inclusive Communities',
  'How communities can embrace and support individuals with autism, creating spaces where everyone belongs.',
  'dQw4w9WgXcQ',
  'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  '40:22',
  'video',
  4,
  ARRAY['Inclusion', 'Community', 'Advocacy'],
  true,
  NOW() - INTERVAL '9 days'
);

-- Insert Episode 5 (Teaser)
INSERT INTO public.podcasts (
  slug,
  title,
  description,
  youtube_id,
  thumbnail_url,
  duration,
  format,
  episode_number,
  topics,
  published,
  published_at
) VALUES (
  'education-advocacy',
  'Education and Advocacy',
  'Navigating the education system and advocating for appropriate support and accommodations.',
  'dQw4w9WgXcQ',
  'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  '36:45',
  'video',
  5,
  ARRAY['Education', 'Advocacy', 'IEP'],
  true,
  NOW() - INTERVAL '2 days'
);

-- Insert Episode 6 (Teaser)
INSERT INTO public.podcasts (
  slug,
  title,
  description,
  youtube_id,
  thumbnail_url,
  duration,
  format,
  episode_number,
  topics,
  published,
  published_at
) VALUES (
  'celebrating-autistic-strengths',
  'Celebrating Autistic Strengths',
  'Recognizing and nurturing the unique strengths, talents, and perspectives of autistic individuals.',
  'dQw4w9WgXcQ',
  'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  '44:10',
  'video',
  6,
  ARRAY['Strengths', 'Talent', 'Neurodiversity'],
  true,
  NOW()
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully seeded 6 podcast episodes!';
END $$;
