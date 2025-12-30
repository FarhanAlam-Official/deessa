"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Heart, Briefcase, Globe, CheckCircle, ArrowRight, Shield } from "lucide-react"
import { Section } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import { VolunteerForm } from "@/components/volunteer-form"

const volunteerRoles = [
  {
    title: "Field Volunteer",
    location: "Nepal (On-site)",
    commitment: "2-4 weeks minimum",
    description: "Work directly with communities on education and health programs.",
    icon: Users,
  },
  {
    title: "Remote Support",
    location: "Anywhere",
    commitment: "5-10 hours/week",
    description: "Help with translation, social media, graphic design, or fundraising.",
    icon: Globe,
  },
  {
    title: "Skills Trainer",
    location: "Nepal / Remote",
    commitment: "Project-based",
    description: "Share your expertise in vocational skills, IT, or business management.",
    icon: Briefcase,
  },
]

const membershipTiers = [
  {
    name: "Friend",
    price: 10,
    period: "/month",
    benefits: ["Monthly newsletter", "Impact updates", "Name on supporter wall"],
  },
  {
    name: "Champion",
    price: 25,
    period: "/month",
    benefits: ["All Friend benefits", "Exclusive event invites", "Direct project updates", "Annual gift from Nepal"],
    popular: true,
  },
  {
    name: "Ambassador",
    price: 100,
    period: "/month",
    benefits: [
      "All Champion benefits",
      "Visit invitation to Nepal",
      "Name a project milestone",
      "Personal impact call",
    ],
  },
]

export default function GetInvolvedPage() {
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined)

  const handleApplyClick = (roleTitle: string) => {
    setSelectedRole(roleTitle)
    setVolunteerModalOpen(true)
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-[400px] relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBIbSVU06T05e97h5HGkLrHkYStnbYQkwzmRg7ALv-ZL5hNuclSRAIiEtnFyuI9cRH-YMtR-pZure02gYDVPziahnspKrlKVKaXMbZwUUn87yG0Efk7pm2WexkU4XJGmqjWZamzPnj45Hun2vsvOwqa0lUsvGBO1uGIZ796D8JQqWkcR3tIdmjcm6xeqh8ifKgxRXTvLl4uX2mp4jPYf579vKODNowVZQ9m6SJr6u6huslju1OStRG3SpoUa0QzyBJa-hz5q4oOb7M")`,
            }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
            <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Join the Movement
            </span>
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
              Be the Change Nepal Needs
            </h1>
            <p className="text-white/90 text-lg font-medium max-w-2xl leading-relaxed">
              Your time, skills, and support can transform lives. Find your way to contribute.
            </p>
          </div>
        </div>
      </section>

      {/* Volunteer Section */}
      <Section className="bg-surface" id="volunteer">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Volunteer With Us</h2>
          <p className="text-foreground-muted max-w-2xl mx-auto">
            Whether on the ground in Nepal or remotely from anywhere in the world, your skills matter.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {volunteerRoles.map((role, index) => (
            <div
              key={index}
              className="bg-background rounded-2xl p-8 border border-border hover:shadow-xl transition-all group"
            >
              <div className="size-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <role.icon className="size-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{role.title}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-muted px-2 py-1 rounded-full text-foreground-muted font-medium">
                  {role.location}
                </span>
                <span className="text-xs bg-muted px-2 py-1 rounded-full text-foreground-muted font-medium">
                  {role.commitment}
                </span>
              </div>
              <p className="text-foreground-muted mb-6">{role.description}</p>
              <Button
                variant="outline"
                className="w-full rounded-full group-hover:bg-primary group-hover:text-white group-hover:border-primary bg-transparent"
                onClick={() => handleApplyClick(role.title)}
              >
                Apply Now
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* Membership Section */}
      <Section className="bg-background" id="member">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Become a Member</h2>
          <p className="text-foreground-muted max-w-2xl mx-auto">
            Join our community of supporters with recurring contributions and exclusive benefits.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {membershipTiers.map((tier, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 border-2 relative ${
                tier.popular
                  ? "bg-primary text-white border-primary shadow-xl shadow-primary/25 scale-105"
                  : "bg-surface border-border"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className={`text-xl font-bold mb-2 ${tier.popular ? "text-white" : "text-foreground"}`}>
                {tier.name}
              </h3>
              <div className="mb-6">
                <span className={`text-4xl font-black ${tier.popular ? "text-white" : "text-primary"}`}>
                  ${tier.price}
                </span>
                <span className={tier.popular ? "text-white/70" : "text-foreground-muted"}>{tier.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle
                      className={`size-5 flex-shrink-0 mt-0.5 ${tier.popular ? "text-white" : "text-primary"}`}
                    />
                    <span className={tier.popular ? "text-white/90" : "text-foreground-muted"}>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`w-full rounded-full ${tier.popular ? "bg-white text-primary hover:bg-white/90" : ""}`}
                variant={tier.popular ? "secondary" : "default"}
              >
                <Link href="/donate">
                  Join as {tier.name}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* Other Ways */}
      <Section className="bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Other Ways to Help</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background rounded-xl p-6 border border-border flex gap-4">
              <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                <Briefcase className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Corporate Partnership</h3>
                <p className="text-sm text-foreground-muted mb-3">
                  Align your CSR goals with meaningful impact in Nepal.
                </p>
                <Link href="/contact" className="text-sm font-bold text-primary hover:underline">
                  Learn More →
                </Link>
              </div>
            </div>
            <div className="bg-background rounded-xl p-6 border border-border flex gap-4">
              <div className="size-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
                <Heart className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">In-Kind Donations</h3>
                <p className="text-sm text-foreground-muted mb-3">Donate supplies, equipment, or services directly.</p>
                <Link href="/contact" className="text-sm font-bold text-primary hover:underline">
                  Get in Touch →
                </Link>
              </div>
            </div>
            <div className="bg-background rounded-xl p-6 border border-border flex gap-4">
              <div className="size-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0">
                <Globe className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Spread the Word</h3>
                <p className="text-sm text-foreground-muted mb-3">
                  Share our mission on social media and with your network.
                </p>
                <Link href="#" className="text-sm font-bold text-primary hover:underline">
                  Share Now →
                </Link>
              </div>
            </div>
            <div className="bg-background rounded-xl p-6 border border-border flex gap-4">
              <div className="size-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 flex-shrink-0">
                <Users className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Host a Fundraiser</h3>
                <p className="text-sm text-foreground-muted mb-3">Organize an event to raise funds for our programs.</p>
                <Link href="/contact" className="text-sm font-bold text-primary hover:underline">
                  Start Planning →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="bg-foreground py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Make a Difference?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            No matter how you choose to help, your contribution matters.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="rounded-full h-12 px-8">
              <Link href="/donate">
                <Heart className="mr-2 size-5 fill-current" />
                Donate Now
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full h-12 px-8 bg-transparent border-gray-600 text-white hover:bg-white hover:text-foreground"
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <VolunteerForm
        isOpen={volunteerModalOpen}
        onClose={() => {
          setVolunteerModalOpen(false)
          setSelectedRole(undefined)
        }}
        roleTitle={selectedRole}
      />
    </>
  )
}
