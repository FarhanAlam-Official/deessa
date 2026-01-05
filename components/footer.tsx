"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Mail, MapPin, Phone, Facebook, Twitter, Instagram, Youtube, Settings } from "lucide-react"
import { NewsletterForm } from "@/components/newsletter-form"

const footerLinks = {
  about: [
    { label: "Our Mission", href: "/about" },
    { label: "Our Team", href: "/about#team" },
    { label: "Partners", href: "/about#partners" },
    { label: "Press & Media", href: "/press" },
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
  resources: [
    { label: "Brand Guidelines", href: "/deesa-resources/Deessa Brand Guidelines.pdf", download: true },
    { label: "Organization Bio", href: "/deesa-resources/deessa Foundation_ Short Bio -2.pdf", download: true },
    { label: "SWC Certificate", href: "/deesa-resources/SWC.jpg", download: true },
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
  const [clickCount, setClickCount] = useState(0)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    const newCount = clickCount + 1

    // Clear existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
    }

    if (newCount === 3) {
      // Open admin in new tab
      window.open("/admin", "_blank", "noopener,noreferrer")
      setClickCount(0)
    } else {
      setClickCount(newCount)
      
      // Reset count after 1 second of no clicks
      clickTimeoutRef.current = setTimeout(() => {
        if (newCount === 1) {
          // Single click - navigate to home
          window.location.href = "/"
        }
        setClickCount(0)
      }, 1000)
    }
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div onClick={handleLogoClick} className="mb-6 inline-block cursor-pointer">
              <div className="w-24 h-24 flex items-center justify-center relative">
                <Image
                  src="/logo.png"
                  alt="deessa Foundation Logo"
                  width={96}
                  height={96}
                  className="object-contain scale-[250%]"
                />
              </div>
            </div>
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

          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  {link.download ? (
                    <a
                      href={link.href}
                      download
                      className="text-gray-400 text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  )}
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
