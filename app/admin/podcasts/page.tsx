import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Eye, EyeOff, Star, Video, Music, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

async function getPodcasts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('podcasts')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function AdminPodcastsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const podcasts = await getPodcasts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Podcasts</h1>
          <p className="text-text-muted">Manage podcast episodes and videos</p>
        </div>
        <Button asChild className="bg-brand-primary hover:bg-brand-primary-dark">
          <Link href="/admin/podcasts/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Podcast
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Episode</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Topics</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {podcasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-text-muted">
                    No podcasts found. Add your first episode.
                  </TableCell>
                </TableRow>
              ) : (
                podcasts.map((podcast) => (
                  <TableRow key={podcast.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <img
                          src={podcast.thumbnail_url}
                          alt={podcast.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                        <div>
                          <div className="font-medium text-text-main line-clamp-1">
                            {podcast.title}
                          </div>
                          {podcast.episode_number && (
                            <div className="text-xs text-text-muted">
                              Episode {podcast.episode_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {podcast.format === 'video' ? (
                          <>
                            <Video className="w-3 h-3 mr-1" />
                            Video
                          </>
                        ) : (
                          <>
                            <Music className="w-3 h-3 mr-1" />
                            Audio
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {podcast.topics?.slice(0, 2).map((topic: string) => (
                          <Badge key={topic} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {podcast.topics?.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{podcast.topics.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {podcast.featured ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Star className="h-4 w-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {podcast.published ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Eye className="w-3 h-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-text-muted">
                        {podcast.view_count || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-text-muted">
                        {formatDistanceToNow(new Date(podcast.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/podcasts/${podcast.slug}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/podcasts/${podcast.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {podcasts.length > 0 && (
        <div className="text-sm text-text-muted">
          Total: {podcasts.length} episode{podcasts.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
