"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface VideoModalState {
  youtubeId: string | null
  title: string | null
  isOpen: boolean
}

interface VideoModalContextType {
  videoModal: VideoModalState
  openVideoModal: (youtubeId: string, title: string) => void
  closeVideoModal: () => void
  /** ID of the currently playing inline (non-modal) video */
  activeInlineId: string | null
  setActiveInlineId: (id: string | null) => void
}

const VideoModalContext = createContext<VideoModalContextType | undefined>(undefined)

interface VideoModalProviderProps {
  children: ReactNode
}

export function VideoModalProvider({ children }: VideoModalProviderProps) {
  const [videoModal, setVideoModal] = useState<VideoModalState>({
    youtubeId: null,
    title: null,
    isOpen: false,
  })
  const [activeInlineId, setActiveInlineId] = useState<string | null>(null)

  const openVideoModal = (youtubeId: string, title: string) => {
    // Stop any inline card that is playing
    setActiveInlineId(null)
    setVideoModal({ youtubeId, title, isOpen: true })
  }

  const closeVideoModal = () => {
    setVideoModal({ youtubeId: null, title: null, isOpen: false })
  }

  return (
    <VideoModalContext.Provider value={{ videoModal, openVideoModal, closeVideoModal, activeInlineId, setActiveInlineId }}>
      {children}
    </VideoModalContext.Provider>
  )
}

export function useVideoModal() {
  const context = useContext(VideoModalContext)
  if (context === undefined) {
    throw new Error('useVideoModal must be used within a VideoModalProvider')
  }
  return context
}