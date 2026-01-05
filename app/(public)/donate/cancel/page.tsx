import type { Metadata } from "next"
import Link from "next/link"
import { XCircle, ArrowLeft, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/ui/section"

export const metadata: Metadata = {
  title: "Donation Cancelled | Dessa Foundation",
  description: "Your donation was cancelled.",
}

export default function DonationCancelPage() {
  return (
    <Section className="py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-orange-50 border-4 border-orange-500 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
          <XCircle className="size-16 text-orange-600" />
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
          Donation Cancelled
        </h1>

        <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
          Your donation was cancelled and no charges were made to your card.
        </p>

        <div className="bg-surface border border-border rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Still want to support our mission?
          </h2>
          <p className="text-foreground-muted mb-6">
            Your support makes a real difference in the lives of communities across Nepal.
            If you experienced any issues during checkout, please don&apos;t hesitate to reach out.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/donate">
                <Heart className="mr-2 size-5 fill-current" />
                Try Again
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-foreground-muted">
            Explore other ways to support our cause
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/get-involved">Volunteer with Us</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/programs">Learn About Our Programs</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12">
          <Button asChild variant="ghost">
            <Link href="/">
              <ArrowLeft className="mr-2 size-4" />
              Return to Homepage
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  )
}
