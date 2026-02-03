'use client';

import { useState } from 'react';
import { Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PodcastTranscriptProps {
  transcript: string;
}

export default function PodcastTranscript({ transcript }: PodcastTranscriptProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Parse transcript to handle timestamps (format: [00:00] Text)
  const parseTranscript = () => {
    const lines = transcript.split('\n').filter(line => line.trim());
    return lines;
  };

  const transcriptLines = parseTranscript();
  
  // Filter lines based on search query
  const filteredLines = searchQuery
    ? transcriptLines.filter(line =>
        line.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transcriptLines;

  // Highlight search term in text
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={index} className="bg-accent-education/30 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Extract timestamp from line if exists
  const extractTimestamp = (line: string): { timestamp: string | null; text: string } => {
    const timestampMatch = line.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(.*)/);
    if (timestampMatch) {
      return { timestamp: timestampMatch[1], text: timestampMatch[2] };
    }
    return { timestamp: null, text: line };
  };

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-text-main mb-4 flex items-center">
        <FileText className="w-6 h-6 mr-2 text-brand-primary" />
        Full Transcript
      </h2>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
        <Input
          type="text"
          placeholder="Search transcript..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Transcript Content */}
      <div className="bg-white rounded-lg border p-6 max-h-[600px] overflow-y-auto">
        {filteredLines.length === 0 ? (
          <p className="text-center text-text-muted py-8">
            No matches found for &quot;{searchQuery}&quot;
          </p>
        ) : (
          <div className="space-y-4">
            {filteredLines.map((line, index) => {
              const { timestamp, text } = extractTimestamp(line);
              
              return (
                <div
                  key={index}
                  className="group hover:bg-bg-soft rounded px-3 py-2 -mx-3 transition-colors"
                >
                  <div className="flex gap-4">
                    {timestamp && (
                      <button
                        className="flex-shrink-0 text-xs font-mono text-brand-primary hover:text-brand-primary-dark font-medium"
                        onClick={() => {
                          // In a real implementation, this would seek to the timestamp
                          console.log('Seek to:', timestamp);
                        }}
                      >
                        {timestamp}
                      </button>
                    )}
                    <p className="text-sm text-text-main leading-relaxed">
                      {highlightText(text)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-sm text-text-muted mt-4 text-center">
          {filteredLines.length} result{filteredLines.length !== 1 ? 's' : ''} found
        </p>
      )}
    </div>
  );
}
