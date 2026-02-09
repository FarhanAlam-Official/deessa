'use client';

import { User, Linkedin, Twitter, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PodcastGuestCardProps {
  name: string;
  title: string;
  bio: string;
  photoUrl: string | null;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    [key: string]: string | undefined;
  } | null;
}

export default function PodcastGuestCard({
  name,
  title,
  bio,
  photoUrl,
  socialLinks,
}: PodcastGuestCardProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-heading font-bold text-lg mb-4">Guest Profile</h3>

      {/* Guest Photo */}
      <div className="flex justify-center mb-4">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-24 h-24 rounded-full object-cover border-4 border-brand-primary/10"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-brand-primary/10 flex items-center justify-center">
            <User className="w-12 h-12 text-brand-primary" />
          </div>
        )}
      </div>

      {/* Guest Info */}
      <div className="text-center mb-4">
        <h4 className="font-heading font-bold text-lg text-text-main">
          {name}
        </h4>
        <p className="text-sm text-brand-primary font-medium">{title}</p>
      </div>

      {/* Bio */}
      <p className="text-sm text-text-main leading-relaxed mb-6">
        {bio}
      </p>

      {/* Social Links */}
      {socialLinks && Object.keys(socialLinks).length > 0 && (
        <div className="flex justify-center gap-2 pt-4 border-t">
          {socialLinks.linkedin && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hover:bg-brand-primary hover:text-white hover:border-brand-primary"
            >
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </Button>
          )}
          {socialLinks.twitter && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hover:bg-brand-primary hover:text-white hover:border-brand-primary"
            >
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </Button>
          )}
          {socialLinks.website && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hover:bg-brand-primary hover:text-white hover:border-brand-primary"
            >
              <a
                href={socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
