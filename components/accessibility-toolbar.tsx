'use client';

import { useState, useEffect } from 'react';
import { Type, Contrast, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccessibilityToolbarProps {
  showTranscriptToggle?: boolean;
  onTranscriptToggle?: (show: boolean) => void;
}

export default function AccessibilityToolbar({
  showTranscriptToggle = false,
  onTranscriptToggle,
}: AccessibilityToolbarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Apply text size to body
  useEffect(() => {
    const body = document.body;
    body.classList.remove('text-normal', 'text-large', 'text-xlarge');
    body.classList.add(`text-${textSize}`);
  }, [textSize]);

  // Apply high contrast
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Handle transcript toggle
  const handleTranscriptToggle = () => {
    const newValue = !showTranscript;
    setShowTranscript(newValue);
    onTranscriptToggle?.(newValue);
  };

  const cycleTextSize = () => {
    const sizes: Array<'normal' | 'large' | 'xlarge'> = ['normal', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(textSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setTextSize(sizes[nextIndex]);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 size-12 rounded-full bg-brand-primary text-white shadow-lg hover:bg-brand-primary-dark transition-all duration-300 flex items-center justify-center"
        aria-label="Show accessibility tools"
      >
        <Type className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="bg-bg-soft border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Label */}
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-sm font-medium text-text-main hidden sm:inline">
              Accessibility Tools
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Text Size */}
            <Button
              variant="outline"
              size="sm"
              onClick={cycleTextSize}
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                textSize !== 'normal' && "bg-brand-primary/10 border-brand-primary text-brand-primary"
              )}
              aria-label={`Text size: ${textSize}`}
            >
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">
                {textSize === 'normal' && 'Normal'}
                {textSize === 'large' && 'Large'}
                {textSize === 'xlarge' && 'X-Large'}
              </span>
            </Button>

            {/* High Contrast */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHighContrast(!highContrast)}
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                highContrast && "bg-brand-primary/10 border-brand-primary text-brand-primary"
              )}
              aria-label={`High contrast: ${highContrast ? 'on' : 'off'}`}
              aria-pressed={highContrast}
            >
              <Contrast className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">
                {highContrast ? 'High Contrast' : 'Normal'}
              </span>
            </Button>

            {/* Transcript Toggle (conditional) */}
            {showTranscriptToggle && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTranscriptToggle}
                className={cn(
                  "flex items-center gap-2 transition-all duration-300",
                  showTranscript && "bg-brand-primary/10 border-brand-primary text-brand-primary"
                )}
                aria-label={`Transcript: ${showTranscript ? 'visible' : 'hidden'}`}
                aria-pressed={showTranscript}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">
                  {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                </span>
              </Button>
            )}

            {/* Divider */}
            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="hover:bg-red-50 hover:text-red-600"
              aria-label="Close accessibility tools"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions (appears on first use) */}
      {typeof window !== 'undefined' && !localStorage.getItem('accessibility-seen') && (
        <div className="bg-brand-primary/5 border-t border-brand-primary/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-text-muted">
                Use these tools to customize your reading experience. Changes persist across pages.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => localStorage.setItem('accessibility-seen', 'true')}
                className="text-xs hover:bg-transparent hover:text-brand-primary"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
