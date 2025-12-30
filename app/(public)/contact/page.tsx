import type { Metadata } from "next"
import { Mail, Phone, MapPin, Clock, Send, Shield, Award } from "lucide-react"
import { Section } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import { ContactForm } from "@/components/contact-form"

export const metadata: Metadata = {
  title: "Contact Us - Dessa Foundation",
  description: "Get in touch with Dessa Foundation. We'd love to hear from you.",
}

const contactInfo = [
  {
    icon: MapPin,
    title: "Our Office",
    lines: ["Thamel, Kathmandu", "Nepal, 44600"],
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: ["info@dessafoundation.org", "support@dessafoundation.org"],
  },
  {
    icon: Phone,
    title: "Call Us",
    lines: ["+977 1-4123456", "+977 9841234567"],
  },
  {
    icon: Clock,
    title: "Office Hours",
    lines: ["Sun - Fri: 9:00 AM - 5:00 PM", "Saturday: Closed"],
  },
]

export default function ContactPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-[350px] relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuC5xzHfv2hii0hZm5knPtqnBhBXuF43kiNX-3L6bPoaNWoNJhuaBEp0UnvkJbxD_8jxmQHLjE0b1j-TMOJq_VOIrW9983EZgYM46P8MAwn7PzfzaLz2HsWKlKvt5lKXcXf_b6vms2V8NcnXaz9-_X8SNQsr6s7_GyimSfmkpcQ4Oh5YRcHnl1A7tisgSR5H6pZkE2H_RJ7Ed4vN8OmKIZ2WhCp5LlGraRVM17Ryo2wWWdRDFec31aYUj8Kv479a7Hlv2NIwScl7Eek")`,
            }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
            <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Get in Touch
            </span>
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
              We&apos;d Love to Hear From You
            </h1>
            <p className="text-white/90 text-lg font-medium max-w-2xl leading-relaxed">
              Have questions, ideas, or want to partner with us? Reach out today.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <Section className="bg-surface">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((item, index) => (
            <div
              key={index}
              className="bg-background p-6 rounded-xl border border-border text-center group hover:shadow-lg transition-shadow"
            >
              <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <item.icon className="size-5" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
              {item.lines.map((line, i) => (
                <p key={i} className="text-sm text-foreground-muted">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* Contact Form Section */}
      <Section className="bg-background">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Form */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Send Us a Message</h2>
            <p className="text-foreground-muted mb-8">
              Fill out the form below and we&apos;ll get back to you within 24 hours.
            </p>
            <ContactForm />
          </div>

          {/* Map Placeholder */}
          <div className="bg-surface rounded-2xl overflow-hidden border border-border h-[400px] lg:h-full min-h-[400px] relative">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("https://maps.googleapis.com/maps/api/staticmap?center=Thamel,Kathmandu,Nepal&zoom=15&size=600x400&maptype=roadmap&key=placeholder")`,
              }}
            />
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <div className="text-center p-8">
                <MapPin className="size-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Visit Our Office</h3>
                <p className="text-foreground-muted text-sm">Thamel, Kathmandu, Nepal</p>
                <Button asChild variant="outline" className="mt-4 rounded-full bg-transparent">
                  <a href="https://maps.google.com/?q=Thamel,Kathmandu,Nepal" target="_blank" rel="noopener noreferrer">
                    Open in Maps
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Organization Credentials */}
      <Section className="bg-surface">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Registered & Verified</h2>
          <p className="text-foreground-muted">Official documentation and registration certificates</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-background p-6 rounded-xl border border-border text-center">
            <div className="size-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
              <Shield className="size-7" />
            </div>
            <h3 className="font-bold text-foreground mb-2">SWC Registered</h3>
            <p className="text-sm text-foreground-muted mb-4">
              Officially registered with Nepal&apos;s Social Welfare Council
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="/deesa-resources/SWC.jpg" download>
                <Award className="size-3 mr-2" />
                View Certificate
              </a>
            </Button>
          </div>
          <div className="bg-background p-6 rounded-xl border border-border text-center">
            <div className="size-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
              <Award className="size-7" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Tax Registered</h3>
            <p className="text-sm text-foreground-muted mb-4">Valid PAN registration for transparency</p>
            <Button asChild variant="outline" size="sm">
              <a href="/deesa-resources/PAN.pdf" download>
                <Award className="size-3 mr-2" />
                View PAN
              </a>
            </Button>
          </div>
          <div className="bg-background p-6 rounded-xl border border-border text-center">
            <div className="size-14 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mx-auto mb-4">
              <Mail className="size-7" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Learn More</h3>
            <p className="text-sm text-foreground-muted mb-4">Download our complete organization bio</p>
            <Button asChild variant="outline" size="sm">
              <a href="/deesa-resources/deessa Foundation_ Short Bio -2.pdf" download>
                <Award className="size-3 mr-2" />
                Download Bio
              </a>
            </Button>
          </div>
        </div>
      </Section>

      {/* FAQ CTA */}
      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Send className="size-10 text-white/80 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Have a Quick Question?</h2>
          <p className="text-white/80 mb-2">
            Check our FAQ or email us directly at{" "}
            <a href="mailto:info@dessafoundation.org" className="underline">
              info@dessafoundation.org
            </a>
          </p>
        </div>
      </section>
    </>
  )
}
