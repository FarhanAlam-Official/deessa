import type { Metadata } from "next"
import { FileText, Download, Image, Award, Newspaper, Mail } from "lucide-react"
import { Section } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResourceDownloads, brandResources, legalResources } from "@/components/resource-downloads"

export const metadata: Metadata = {
  title: "Press & Media Kit - Dessa Foundation",
  description:
    "Media resources, brand guidelines, and press materials for deessa Foundation. Download logos, photos, and official documents.",
}

const pressContacts = [
  {
    name: "Media Inquiries",
    email: "press@dessafoundation.org",
    role: "General press questions and interview requests",
  },
  {
    name: "Partnership Inquiries",
    email: "partnerships@dessafoundation.org",
    role: "Corporate partnerships and collaborations",
  },
]

const quickFacts = [
  { label: "Founded", value: "2015" },
  { label: "Location", value: "Kathmandu, Nepal" },
  { label: "Communities Served", value: "50+" },
  { label: "Beneficiaries", value: "10,000+" },
  { label: "Active Programs", value: "120+" },
  { label: "Team Members", value: "25+" },
]

export default function PressPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-[400px] relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuC5xzHfv2hii0hZm5knPtqnBhBXuF43kiNX-3L6bPoaNWoNJhuaBEp0UnvkJbxD_8jxmQHLjE0b1j-TMOJq_VOIrW9983EZgYM46P8MAwn7PzfzaLz2HsWKlKvt5lKXcXf_b6vms2V8NcnXaz9-_X8SNQsr6s7_GyimSfmkpcQ4Oh5YRcHnl1A7tisgSR5H6pZkE2H_RJ7Ed4vN8OmKIZ2WhCp5LlGraRVM17Ryo2wWWdRDFec31aYUj8Kv479a7Hlv2NIwScl7Eek")`,
            }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
            <Newspaper className="size-14 text-primary mb-4" />
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
              Press & Media Kit
            </h1>
            <p className="text-white/90 text-lg font-medium max-w-2xl leading-relaxed">
              Official brand resources, media materials, and press information for journalists, partners, and media
              professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <Section className="bg-surface">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Quick Facts</h2>
          <p className="text-foreground-muted">Key information about deessa Foundation</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
          {quickFacts.map((fact) => (
            <div key={fact.label} className="text-center">
              <div className="text-3xl font-black text-primary mb-2">{fact.value}</div>
              <div className="text-sm text-foreground-muted font-medium">{fact.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Brand Resources */}
      <Section className="bg-background">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Brand Resources</h2>
          <p className="text-foreground-muted max-w-2xl mx-auto">
            Download our official brand guidelines, logos, and organization materials for media use.
          </p>
        </div>
        <ResourceDownloads items={brandResources} />
      </Section>

      {/* Legal Documents */}
      <Section className="bg-surface">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Legal & Registration Documents</h2>
          <p className="text-foreground-muted">Official registration certificates and legal documentation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="size-10 flex items-center justify-center bg-green-100 rounded-lg text-green-600">
                  <Award className="size-5" />
                </div>
                SWC Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground-muted mb-4">
                Social Welfare Council registration certificate - Official NGO registration in Nepal.
              </p>
              <Button asChild variant="outline" className="w-full">
                <a href="/deesa-resources/SWC.jpg" download>
                  <Download className="size-4 mr-2" />
                  Download Certificate
                </a>
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="size-10 flex items-center justify-center bg-blue-100 rounded-lg text-blue-600">
                  <FileText className="size-5" />
                </div>
                PAN Certificate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground-muted mb-4">
                Permanent Account Number certificate - Tax registration documentation.
              </p>
              <Button asChild variant="outline" className="w-full">
                <a href="/deesa-resources/PAN.pdf" download>
                  <Download className="size-4 mr-2" />
                  Download PAN
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Photos & Media Assets */}
      <Section className="bg-background">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Photo Gallery</h2>
          <p className="text-foreground-muted">High-resolution images for media use</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            "https://lh3.googleusercontent.com/aida-public/AB6AXuC5xzHfv2hii0hZm5knPtqnBhBXuF43kiNX-3L6bPoaNWoNJhuaBEp0UnvkJbxD_8jxmQHLjE0b1j-TMOJq_VOIrW9983EZgYM46P8MAwn7PzfzaLz2HsWKlKvt5lKXcXf_b6vms2V8NcnXaz9-_X8SNQsr6s7_GyimSfmkpcQ4Oh5YRcHnl1A7tisgSR5H6pZkE2H_RJ7Ed4vN8OmKIZ2WhCp5LlGraRVM17Ryo2wWWdRDFec31aYUj8Kv479a7Hlv2NIwScl7Eek",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuD7QgNEezbRHOt2MsvhmSehLCgOGp-3Um_oszh8418RlOSNyKzKOAhE5NsQkDGMiBytNLDU2yZh9PPHBg-AYg6BmnCa9iG8LQBC0_lkUqCrL4pJFU_So2-85IGkW34ZrQ6498mPet2J-ZYQLaHBN8o5wxwRN8c0jN5NXm81cUsCLvJIGZ-VL3p_FnKi-Nyw5LH9A9KrRzWbDzOsq255qtzgFx6N2X4ExaQ3QQWfCMH4LB-YcibEcm4plH8CXVi_GIywspD8opz3dl4",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBIbSVU06T05e97h5HGkLrHkYStnbYQkwzmRg7ALv-ZL5hNuclSRAIiEtnFyuI9cRH-YMtR-pZure02gYDVPziahnspKrlKVKaXMbZwUUn87yG0Efk7pm2WexkU4XJGmqjWZamzPnj45Hun2vsvOwqa0lUsvGBO1uGIZ796D8JQqWkcR3tIdmjcm6xeqh8ifKgxRXTvLl4uX2mp4jPYf579vKODNowVZQ9m6SJr6u6huslju1OStRG3SpoUa0QzyBJa-hz5q4oOb7M",
          ].map((img, index) => (
            <div key={index} className="relative group overflow-hidden rounded-xl">
              <div
                className="h-64 bg-cover bg-center transition-transform group-hover:scale-105"
                style={{ backgroundImage: `url("${img}")` }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <a href={img} download>
                    <Image className="size-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Press Contacts */}
      <Section className="bg-surface">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Press Contacts</h2>
          <p className="text-foreground-muted">Get in touch with our media team</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {pressContacts.map((contact) => (
            <Card key={contact.name}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="size-12 flex items-center justify-center bg-primary/10 rounded-lg text-primary flex-shrink-0">
                    <Mail className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{contact.name}</h3>
                    <p className="text-sm text-foreground-muted mb-3">{contact.role}</p>
                    <Button asChild variant="outline" size="sm">
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Looking for Something Else?</h2>
          <p className="text-white/80 mb-8">
            If you need additional materials or have specific media requests, please reach out to our press team.
          </p>
          <Button asChild size="lg" variant="secondary">
            <a href="mailto:press@dessafoundation.org">Contact Press Team</a>
          </Button>
        </div>
      </section>
    </>
  )
}
