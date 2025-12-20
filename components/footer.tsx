"use client"

import Link from "next/link"
import { Heart, Mail, MapPin, Phone, Facebook, Twitter, Instagram, Youtube, Settings } from "lucide-react"
import { NewsletterForm } from "@/components/newsletter-form"

const footerLinks = {
  about: [
    { label: "Our Mission", href: "/about" },
    { label: "Our Team", href: "/about#team" },
    { label: "Partners", href: "/about#partners" },
    { label: "Annual Reports", href: "/impact#reports" },
  ],
  programs: [
    { label: "Education", href: "/programs?category=education" },
    { label: "Healthcare", href: "/programs?category=health" },
    { label: "Women Empowerment", href: "/programs?category=empowerment" },
    { label: "Disaster Relief", href: "/programs?category=relief" },
  ],
  getInvolved: [
    { label: "Donate", href: "/donate" },
    { label: "Volunteer", href: "/get-involved#volunteer" },
    { label: "Become a Member", href: "/get-involved#member" },
    { label: "Events", href: "/events" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Contact Us", href: "/contact" },
  ],
}

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
]

export function Footer() {
  return (
    <footer className="relative bg-foreground text-white [&]:before:hidden [&]:after:hidden">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-6">
              Subscribe to our newsletter for updates on our work and ways to get involved.
            </p>
            <NewsletterForm variant="stacked" className="max-w-md mx-auto" />
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="size-10 flex items-center justify-center bg-primary rounded-xl text-white">
                <Heart className="size-5 fill-current" />
              </div>
              <div>
                <h2 className="text-lg font-black leading-none">deessa</h2>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Foundation</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              Empowering communities in rural Nepal through sustainable education, healthcare, and livelihood
              initiatives since 2015.
            </p>
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <MapPin className="size-4 text-primary" />
                <span>Kathmandu, Nepal</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="size-4 text-primary" />
                <span>info@deessafoundation.org</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="size-4 text-primary" />
                <span>+977 1-4123456</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">About</h3>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Programs</h3>
            <ul className="space-y-3">
              {footerLinks.programs.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Get Involved</h3>
            <ul className="space-y-3">
              {footerLinks.getInvolved.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} deessa Foundation. All rights reserved.</p>
            <Link
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-gray-600 text-xs hover:text-gray-400 transition-colors"
            >
              <Settings className="size-3" />
              <span>Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                className="size-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-colors"
                aria-label={social.label}
              >
                <social.icon className="size-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
