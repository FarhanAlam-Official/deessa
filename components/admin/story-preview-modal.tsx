"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Clock3, CalendarDays, Sparkles } from "lucide-react"
import Image from "next/image"

export interface StoryPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  story: {
    title: string
    excerpt: string
    content: string
    image?: string
    category: string
    read_time?: string
  }
}

export function StoryPreviewModal({ isOpen, onClose, story }: StoryPreviewModalProps) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-[95vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] overflow-y-auto p-0" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Story Preview</DialogTitle>
        </DialogHeader>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        {/* Story Header */}
        <div className="relative isolate overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0">
            {story.image && (
              <Image
                src={story.image}
                alt={story.title}
                fill
                className="object-cover opacity-60"
              />
            )}
            <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(18,53,80,0.15)_0%,rgba(2,6,23,0.78)_55%,rgba(2,6,23,0.96)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.25)_0%,rgba(2,6,23,0.08)_35%,rgba(2,6,23,0.7)_100%)]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-12 sm:px-8">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/40 bg-cyan-300/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-cyan-100">
                <Sparkles className="size-3.5" />
                {story.category}
              </div>

              <h1 className="mt-4 text-3xl leading-tight sm:text-4xl lg:text-5xl">
                {story.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/80">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {currentDate}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="size-4" />
                  {story.read_time || "5 min read"}
                </span>
              </div>

              <p className="mt-6 max-w-3xl text-balance text-base leading-relaxed text-white/90 sm:text-lg">
                {story.excerpt}
              </p>
            </div>
          </div>
        </div>

        {/* Story Content */}
        <div className="bg-gradient-to-b from-sky-50/70 via-white to-white p-6 sm:p-8">
          <article className="mx-auto max-w-6xl rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg md:p-9">
            {story.content ? (
              <div className="overflow-x-auto">
                <div
                  className="tiptap story-rich text-[1.05rem] leading-8 text-slate-700"
                  dangerouslySetInnerHTML={{ __html: story.content }}
                />
              </div>
            ) : (
              <p className="text-slate-500">No content yet. Start writing your story...</p>
            )}
          </article>

          {/* Preview Notice */}
          <div className="mx-auto mt-6 max-w-6xl rounded-lg border border-blue-200 bg-blue-50 p-4 text-center text-sm text-blue-900">
            <strong>Preview Mode:</strong> This is how your story will appear on the public site.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
