import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PodcastForm from '@/components/admin/podcast-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DeletePodcastButton from '@/components/admin/delete-podcast-button';

async function getPodcast(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('podcasts').select('*').eq('id', id).single();
  return data;
}

export default async function EditPodcastPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const podcast = await getPodcast(id);

  if (!podcast) {
    redirect('/admin/podcasts');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/podcasts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Podcasts
            </Link>
          </Button>
        </div>

        <DeletePodcastButton 
          podcastId={podcast.id} 
          podcastTitle={podcast.title}
          isPublished={podcast.published}
        />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-text-main">Edit Podcast</h1>
        <p className="text-text-muted">Update podcast episode details</p>
      </div>

      <PodcastForm mode="edit" podcast={podcast} />
    </div>
  );
}
