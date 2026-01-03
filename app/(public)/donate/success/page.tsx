import type { Metadata } from "next"
import { Section } from "@/components/ui/section"
import { Suspense } from "react"
import { SuccessContent } from "./success-content"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Thank You - Donation Successful | Dessa Foundation",
  description: "Thank you for your generous donation to Dessa Foundation.",
}

export default function DonationSuccessPage() {
  return (
    <Section className="py-16 md:py-24">
      <Suspense
        fallback={
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-blue-50 border-4 border-blue-500 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
              <Loader2 className="size-16 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">Loading...</h1>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </Section>
  )
}
