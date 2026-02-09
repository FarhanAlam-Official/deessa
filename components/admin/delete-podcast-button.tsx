'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import notifications from '@/lib/notifications';

interface DeletePodcastButtonProps {
  podcastId: string;
  podcastTitle: string;
  isPublished?: boolean;
}

export default function DeletePodcastButton({
  podcastId,
  podcastTitle,
  isPublished = false,
}: DeletePodcastButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/podcasts/${podcastId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete podcast');
      }

      notifications.showSuccess('Podcast deleted successfully');
      router.push('/admin/podcasts');
      router.refresh();
    } catch (error) {
      console.error('Error deleting podcast:', error);
      notifications.showError({
        description: error instanceof Error ? error.message : 'Failed to delete podcast'
      });
      setIsDeleting(false);
      setOpen(false);
    }
  };

  const handleUnpublish = async () => {
    setIsUnpublishing(true);

    try {
      const response = await fetch(`/api/admin/podcasts/${podcastId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published: false }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unpublish podcast');
      }

      notifications.showSuccess('Podcast unpublished successfully');
      setOpen(false);
      router.push('/admin/podcasts');
      router.refresh();
    } catch (error) {
      console.error('Error unpublishing podcast:', error);
      notifications.showError({
        description: error instanceof Error ? error.message : 'Failed to unpublish podcast'
      });
    } finally {
      setIsUnpublishing(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Podcast
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div>
                  This action cannot be undone. This will permanently delete the podcast episode{' '}
                  <span className="font-semibold text-foreground">&quot;{podcastTitle}&quot;</span>{' '}
                  and remove all associated data from the server.
                </div>
                {isPublished && (
                  <div className="text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-900">
                    💡 Tip: Consider unpublishing the podcast first if you might want to restore it later. You can unpublish it below instead of deleting.
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={isDeleting || isUnpublishing}>
              Cancel
            </AlertDialogCancel>
            {isPublished && (
              <Button
                variant="outline"
                onClick={handleUnpublish}
                disabled={isDeleting || isUnpublishing}
                className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-500 dark:hover:bg-amber-950/30"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                {isUnpublishing ? 'Unpublishing...' : 'Unpublish Instead'}
              </Button>
            )}
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || isUnpublishing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
