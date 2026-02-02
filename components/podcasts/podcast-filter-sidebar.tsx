'use client';

import { useState } from 'react';
import { Video, Music, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface PodcastFilterSidebarProps {
  topics: string[];
  totalCount: number;
}

export default function PodcastFilterSidebar({ topics, totalCount }: PodcastFilterSidebarProps) {
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'video' | 'audio'>('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter Header Card */}
      <div className="bg-white rounded-lg border p-6 sticky top-24">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-brand-primary mr-2" />
          <h2 className="font-heading font-bold text-lg">Filter Library</h2>
        </div>

        <p className="text-sm text-text-muted mb-6">
          {totalCount} episode{totalCount !== 1 ? 's' : ''} available
        </p>

        {/* Format Filter */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-main mb-3">
            Format
          </label>
          <Tabs value={selectedFormat} onValueChange={(value: any) => setSelectedFormat(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="video" className="text-xs">
                <Video className="w-3 h-3 mr-1" />
                Video
              </TabsTrigger>
              <TabsTrigger value="audio" className="text-xs">
                <Music className="w-3 h-3 mr-1" />
                Audio
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Topics Filter */}
        {topics.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-text-main mb-3">
              Topics
            </label>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {topics.map((topic) => (
                <label
                  key={topic}
                  className="flex items-center cursor-pointer group"
                >
                  <Checkbox
                    id={`topic-${topic}`}
                    checked={selectedTopics.includes(topic)}
                    onCheckedChange={() => handleTopicToggle(topic)}
                    className="data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary"
                  />
                  <span className="ml-3 text-sm text-text-main group-hover:text-brand-primary transition-colors">
                    {topic}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {(selectedFormat !== 'all' || selectedTopics.length > 0) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedFormat('all');
              setSelectedTopics([]);
            }}
            className="w-full mt-6"
          >
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Support CTA Card */}
      <div className="bg-gradient-ocean rounded-lg p-6 text-white">
        <h3 className="font-heading font-bold text-lg mb-2">
          Support Our Mission
        </h3>
        <p className="text-sm text-white/90 mb-4">
          Help us create more content and programs for the autism community.
        </p>
        <Button
          asChild
          className="w-full bg-white text-brand-primary hover:bg-white/90"
        >
          <Link href="/donate">
            Donate Now
          </Link>
        </Button>
      </div>
    </div>
  );
}
