import type React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { IntroVideo } from "@/components/intro-video"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <IntroVideo />
      <Navbar />
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  )
}
