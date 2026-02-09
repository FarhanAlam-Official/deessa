'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notifications } from '@/lib/notifications';

interface ShareButtonProps {
  title: string;
  url?: string;
}

export default function ShareButton({ title, url }: ShareButtonProps) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = async () => {
    const text = `Check out this podcast: ${title}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        notifications.showSuccess('Shared successfully!');
      } catch (error) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      notifications.showSuccess('Link copied to clipboard!');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="flex-1"
    >
      <Share2 className="w-4 h-4 mr-2" />
      Copy Link
    </Button>
  );
}
