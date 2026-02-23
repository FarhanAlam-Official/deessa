import type React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { IntroVideo } from "@/components/intro-video"
import { VideoModalProvider } from "@/contexts/VideoModalContext"
import { GlobalVideoModal } from "@/components/global-video-modal"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <VideoModalProvider>
      <div className="relative flex min-h-screen w-full flex-col">
        <IntroVideo />
        <Navbar />
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </div>
      <GlobalVideoModal />
    </VideoModalProvider>
  )
}
