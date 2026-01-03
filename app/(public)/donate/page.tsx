import type { Metadata } from "next"
import Link from "next/link"
import { Heart, Shield, CreditCard, Repeat, CheckCircle, HelpCircle } from "lucide-react"
import { Section } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import { DonationForm } from "@/components/donation-form"
import { getPaymentMode, getPaymentSettings, getSupportedProviders } from "@/lib/payments/config"

export const metadata: Metadata = {
  title: "Donate - Dessa Foundation",
  description:
    "Support our mission to empower communities in Nepal through education, healthcare, and sustainable development.",
}

const donationTiers = [
  {
    amount: 25,
    impact: "School supplies for 5 children",
    icon: "📚",
  },
  {
    amount: 50,
    impact: "Medical checkup for a family",
    icon: "🏥",
  },
  {
    amount: 100,
    impact: "Teacher training workshop",
    icon: "👩‍🏫",
  },
  {
    amount: 250,
    impact: "Skills training for 3 women",
    icon: "✂️",
  },
  {
    amount: 500,
    impact: "Clean water for a village",
    icon: "💧",
  },
  {
    amount: 1000,
    impact: "Rebuild a classroom",
    icon: "🏫",
  },
]

const faqs = [
  {
    question: "How is my donation used?",
    answer: "88% of all donations go directly to programs. The remaining 12% covers essential operational costs.",
  },
  {
    question: "Is my donation tax-deductible?",
    answer: "Yes! Dessa Foundation is a registered 501(c)(3) nonprofit. You will receive a tax receipt via email.",
  },
  {
    question: "Can I donate to a specific program?",
    answer: "You can select a specific program during checkout, or leave it unrestricted for greatest impact.",
  },
  {
    question: "How do I cancel a recurring donation?",
    answer: "Contact us anytime at donate@dessafoundation.org and we'll process your request within 24 hours.",
  },
]

export default async function DonatePage() {
  const settings = await getPaymentSettings()
  const enabledProviders = getSupportedProviders(settings)
  const mode = getPaymentMode()

  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-[400px] relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuD7QgNEezbRHOt2MsvhmSehLCgOGp-3Um_oszh8418RlOSNyKzKOAhE5NsQkDGMiBytNLDU2yZh9PPHBg-AYg6BmnCa9iG8LQBC0_lkUqCrL4pJFU_So2-85IGkW34ZrQ6498mPet2J-ZYQLaHBN8o5wxwRN8c0jN5NXm81cUsCLvJIGZ-VL3p_FnKi-Nyw5LH9A9KrRzWbDzOsq255qtzgFx6N2X4ExaQ3QQWfCMH4LB-YcibEcm4plH8CXVi_GIywspD8opz3dl4")`,
            }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
            <Heart className="size-14 text-primary mb-4 fill-primary" />
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
              Your Generosity Changes Lives
            </h1>
            <p className="text-white/90 text-lg font-medium max-w-2xl leading-relaxed">
              Every donation, no matter the size, directly impacts families and communities across Nepal.
            </p>
          </div>
        </div>
      </section>

      {/* Donation Form Section */}
      <Section className="bg-gradient-to-b from-background via-surface/50 to-background py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Form Column - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <DonationForm
                tiers={donationTiers}
                enabledProviders={enabledProviders}
                primaryProvider={settings.primaryProvider}
                defaultCurrency={settings.defaultCurrency}
              />
            </div>
            
            {/* Info Sidebar - Takes 1 column on large screens */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <Shield className="size-5 text-primary" />
                  Secure & Trusted
                </h3>
                <p className="text-sm text-foreground-muted mb-4">
                  All payments are processed through industry-leading secure payment gateways. Your financial information is never stored on our servers.
                </p>
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold">Mode:</span>
                  <span className="uppercase px-2 py-1 bg-muted rounded">{mode}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-3">Why Donate?</h3>
                <ul className="space-y-2 text-sm text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="size-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>100% of funds go directly to programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="size-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Tax-deductible receipts provided</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="size-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Transparent impact reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="size-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Cancel anytime for monthly donations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Trust Indicators */}
      <Section className="bg-background">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center p-6">
            <div className="size-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
              <Shield className="size-7" />
            </div>
            <h3 className="font-bold text-foreground mb-2">100% Secure</h3>
            <p className="text-sm text-foreground-muted">Your payment is encrypted and processed securely.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6">
            <div className="size-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
              <CreditCard className="size-7" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Tax Deductible</h3>
            <p className="text-sm text-foreground-muted">Receive a tax receipt for your records immediately.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6">
            <div className="size-14 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
              <Repeat className="size-7" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Cancel Anytime</h3>
            <p className="text-sm text-foreground-muted">Monthly donations can be modified or cancelled anytime.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6">
            <div className="size-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4">
              <CheckCircle className="size-7" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Registered NGO</h3>
            <p className="text-sm text-foreground-muted">
              Officially registered with Nepal&apos;s Social Welfare Council.
            </p>
          </div>
        </div>
      </Section>

      {/* Impact Grid */}
      <Section className="bg-surface">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">See Your Impact</h2>
          <p className="text-foreground-muted max-w-2xl mx-auto">
            Here&apos;s how your donation translates into real change on the ground.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {donationTiers.map((tier) => (
            <div
              key={tier.amount}
              className="bg-background rounded-xl p-6 border border-border hover:border-primary/30 transition-colors text-center"
            >
              <span className="text-3xl mb-3 block">{tier.icon}</span>
              <div className="text-2xl font-black text-primary mb-1">${tier.amount}</div>
              <p className="text-sm text-foreground-muted">{tier.impact}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ Section */}
      <Section className="bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <HelpCircle className="size-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-surface rounded-xl p-6 border border-border">
                <h3 className="font-bold text-foreground mb-2 flex items-start gap-2">
                  <CheckCircle className="size-5 text-primary flex-shrink-0 mt-0.5" />
                  {faq.question}
                </h3>
                <p className="text-foreground-muted pl-7">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Alternative Ways */}
      <section className="bg-foreground py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Other Ways to Give</h2>
          <p className="text-gray-400 mb-8">Beyond online donations, there are many ways to support our mission.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              asChild
              variant="outline"
              className="rounded-full bg-transparent border-gray-600 text-white hover:bg-white hover:text-foreground"
            >
              <Link href="/contact">Corporate Partnerships</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full bg-transparent border-gray-600 text-white hover:bg-white hover:text-foreground"
            >
              <Link href="/get-involved">In-Kind Donations</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full bg-transparent border-gray-600 text-white hover:bg-white hover:text-foreground"
            >
              <Link href="/contact">Legacy Giving</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
