import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle, Heart, Download, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/ui/section"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Thank You - Donation Successful | Dessa Foundation",
  description: "Thank you for your generous donation to Dessa Foundation.",
}

function SuccessContent() {
  return (
    <div className="max-w-3xl mx-auto text-center">
      <div className="bg-green-50 border-4 border-green-500 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
        <CheckCircle className="size-16 text-green-600" />
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
        Thank You for Your Generosity!
      </h1>

      <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
        Your donation has been successfully processed. You&apos;re making a real difference in the lives of
        communities across Nepal.
      </p>

      <div className="bg-surface border border-border rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">What Happens Next?</h2>
        <div className="space-y-4 text-left">
          <div className="flex gap-4">
            <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">1</span>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">Receipt Sent</h3>
              <p className="text-foreground-muted text-sm">
                A tax-deductible receipt has been sent to your email address within 24 hours.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">2</span>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">Funds Allocated</h3>
              <p className="text-foreground-muted text-sm">
                Your donation will be allocated to our programs within 48 hours.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">3</span>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">Impact Updates</h3>
              <p className="text-foreground-muted text-sm">
                You&apos;ll receive regular updates about how your donation is creating change.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <Heart className="size-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-2">Want to Do More?</h3>
        <p className="text-foreground-muted mb-4">
          Share our mission with friends and family, or explore volunteer opportunities.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/get-involved">
              <ArrowRight className="mr-2 size-4" />
              Get Involved
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/stories">
              <Download className="mr-2 size-4" />
              Read Impact Stories
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/">Return to Homepage</Link>
        </Button>
      </div>

      <p className="text-sm text-foreground-muted mt-8">
        Questions about your donation?{" "}
        <Link href="/contact" className="text-primary hover:underline font-medium">
          Contact our team
        </Link>
      </p>
    </div>
  )
}

export default function DonationSuccessPage() {
  return (
    <Section className="py-16 md:py-24">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </Section>
  )
}
