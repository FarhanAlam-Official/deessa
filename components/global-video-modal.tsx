"use client"

import { useVideoModal } from '@/contexts/VideoModalContext'
import PodcastVideoModal from '@/components/podcasts/podcast-video-modal'

export function GlobalVideoModal() {
  const { videoModal, closeVideoModal } = useVideoModal()

  if (!videoModal.isOpen || !videoModal.youtubeId || !videoModal.title) {
    return null
  }

  return (
    <PodcastVideoModal
      youtubeId={videoModal.youtubeId}
      title={videoModal.title}
      onClose={closeVideoModal}
    />
  )
}