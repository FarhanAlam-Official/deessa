import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PodcastForm from '@/components/admin/podcast-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function NewPodcastPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/podcasts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Podcasts
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-text-main">Add New Podcast</h1>
        <p className="text-text-muted">Create a new podcast episode by pasting a YouTube URL</p>
      </div>

      <PodcastForm mode="create" />
    </div>
  );
}
