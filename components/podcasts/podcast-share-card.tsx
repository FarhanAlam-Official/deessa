'use client';

import { Copy, Share2, Mail } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface PodcastShareCardProps {
  title: string;
  description?: string | null;
}

export default function PodcastShareCard({ title, description }: PodcastShareCardProps) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast.success({
        title: 'Link copied!',
        description: 'Episode link has been copied to your clipboard.',
      });
    } catch (err) {
      showToast.error({
        title: 'Failed to copy',
        description: 'Please try again or copy the URL manually.',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description || '',
          url: window.location.href,
        });
        // Don't show toast for native share as it has its own UI
      } catch (err) {
        // User cancelled - don't show error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast.success({
          title: 'Link copied!',
          description: 'Sharing not supported. Link copied to clipboard instead.',
        });
      } catch (err) {
        showToast.error({
          title: 'Failed to share',
          description: 'Please try copying the link manually.',
        });
      }
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Check out: ${title}`);
    const body = encodeURIComponent(`I thought you might be interested in this podcast episode:\n\n${title}\n${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    
    showToast.info({
      title: 'Opening email client',
      description: 'Composing email with episode link...',
    });
  };

  return (
    <div className="bg-brand-primary rounded-lg p-6 text-white text-center">
      <h3 className="font-extrabold text-lg mb-4">
        Share this Episode
      </h3>
      <div className="flex gap-3 justify-center">
        <button 
          onClick={handleCopyLink}
          className="group w-12 h-12 bg-white text-brand-primary rounded-full font-semibold hover:bg-gray-50 hover:shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center cursor-pointer"
          title="Copy Link"
        >
          <Copy className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        </button>
        <button 
          onClick={handleShare}
          className="group w-12 h-12 bg-white text-brand-primary rounded-full font-semibold hover:bg-gray-50 hover:shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center cursor-pointer"
          title="Share"
        >
          <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        </button>
        <button 
          onClick={handleEmail}
          className="group w-12 h-12 bg-white text-brand-primary rounded-full font-semibold hover:bg-gray-50 hover:shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center cursor-pointer"
          title="Email"
        >
          <Mail className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
}
