"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Mail, MapPin, Phone, Facebook, Twitter, Instagram, Youtube, Settings, Target, GraduationCap, HeartHandshake, Shield, Users, FileText, Award, Calendar, Download } from "lucide-react"
import { NewsletterForm } from "@/components/newsletter-form"

const footerLinks = {
  about: [
    { label: "Our Mission", href: "/about", icon: Target },
    { label: "Our Team", href: "/about#team", icon: Users },
    { label: "Partners", href: "/about#partners", icon: HeartHandshake },
    { label: "Press & Media", href: "/press", icon: FileText },
    { label: "Annual Reports", href: "/impact#reports", icon: Award },
  ],
  programs: [
    { label: "Education", href: "/programs?category=education", icon: GraduationCap },
    { label: "Healthcare", href: "/programs?category=health", icon: Heart },
    { label: "Women Empowerment", href: "/programs?category=empowerment", icon: Users },
    { label: "Disaster Relief", href: "/programs?category=relief", icon: Shield },
  ],
  getInvolved: [
    { label: "Donate", href: "/donate", icon: Heart },
    { label: "Volunteer", href: "/get-involved#volunteer", icon: HeartHandshake },
    { label: "Become a Member", href: "/get-involved#member", icon: Users },
    { label: "Events", href: "/events", icon: Calendar },
  ],
  resources: [
    { label: "Brand Guidelines", href: "/deesa-resources/Deessa Brand Guidelines.pdf", download: true, icon: Download },
    { label: "Organization Bio", href: "/deesa-resources/deessa Foundation_ Short Bio -2.pdf", download: true, icon: Download },
    { label: "SWC Certificate", href: "/deesa-resources/SWC.jpg", download: true, icon: Download },
    { label: "Contact Us", href: "/contact", icon: Mail },
  ],
}

const socialLinks = [
  { 
    icon: Facebook, 
    href: "https://www.facebook.com/deessaFoundation", 
    label: "Facebook" 
  },
  { 
    icon: Twitter, 
    href: "#", 
    label: "Twitter",
    isAlert: true 
  },
  { 
    icon: Instagram, 
    href: "https://www.instagram.com/deessa.foundation?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", 
    label: "Instagram" 
  },
  { 
    icon: Youtube, 
    href: "https://www.youtube.com/@deessaFoundation", 
    label: "YouTube" 
  },
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

  const handleTwitterClick = () => {
    alert("🐦 We'll be on Twitter Soon! 🌟\n\nWe're excited to connect with you on Twitter!\nIn the meantime, follow us on our other social platforms to stay updated with our latest work and impact stories.\n\n💙 Thank you for your support!")
  }

  return (
    <footer className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Newsletter Section */}
      <div className="relative border-b border-gray-800/50 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Mail className="size-4" />
              <span>Newsletter</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Stay Connected
            </h3>
            <p className="text-gray-400 text-base mb-8 leading-relaxed">
              Get the latest updates on our impact, upcoming events, and new ways to make a difference in rural Nepal.
            </p>
            <div className="bg-white/5 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
              <NewsletterForm variant="stacked" className="max-w-md mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 py-12 lg:py-20">
        {/* Mission Statement + Contact row */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-16 mb-12 lg:mb-16">
          {/* Mission Statement */}
          <div className="lg:max-w-md">
            <h4 className="text-xl font-semibold text-white mb-4">Our Mission</h4>
            <p className="text-gray-400 leading-relaxed mb-6 text-base">
              Empowering communities in rural Nepal through sustainable education, healthcare, and livelihood
              initiatives since 2015.
            </p>
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg border border-primary/20">
              <p className="text-primary text-sm font-medium">Making a difference, one community at a time.</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="lg:ml-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Get in Touch</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-gray-800/50 hover:border-primary/30 transition-colors group">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                  <MapPin className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Location</p>
                  <p className="text-white text-sm font-medium">Kathmandu, Nepal</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-gray-800/50 hover:border-primary/30 transition-colors group">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                  <Mail className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Email</p>
                  <p className="text-white text-sm font-medium">info@deessafoundation.org</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-gray-800/50 hover:border-primary/30 transition-colors group">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                  <Phone className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Phone</p>
                  <p className="text-white text-sm font-medium">+977 1-4123456</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Target className="size-4 text-primary" />
              </div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">About</h3>
            </div>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => {
                const IconComponent = link.icon;
                return (
                  <li key={link.href}>
                    <Link href={link.href} className="flex items-center gap-2 text-gray-400 text-sm hover:text-primary transition-all duration-200 group">
                      <IconComponent className="size-3.5 opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" />
                      <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <GraduationCap className="size-4 text-primary" />
              </div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Programs</h3>
            </div>
            <ul className="space-y-3">
              {footerLinks.programs.map((link) => {
                const IconComponent = link.icon;
                return (
                  <li key={link.href}>
                    <Link href={link.href} className="flex items-center gap-2 text-gray-400 text-sm hover:text-primary transition-all duration-200 group">
                      <IconComponent className="size-3.5 opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" />
                      <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <HeartHandshake className="size-4 text-primary" />
              </div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Get Involved</h3>
            </div>
            <ul className="space-y-3">
              {footerLinks.getInvolved.map((link) => {
                const IconComponent = link.icon;
                return (
                  <li key={link.href}>
                    <Link href={link.href} className="flex items-center gap-2 text-gray-400 text-sm hover:text-primary transition-all duration-200 group">
                      <IconComponent className="size-3.5 opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" />
                      <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <FileText className="size-4 text-primary" />
              </div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Resources</h3>
            </div>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => {
                const IconComponent = link.icon;
                return (
                  <li key={link.href}>
                    {link.download ? (
                      <a
                        href={link.href}
                        download
                        className="flex items-center gap-2 text-gray-400 text-sm hover:text-primary transition-all duration-200 group"
                      >
                        <IconComponent className="size-3.5 opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" />
                        <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                      </a>
                    ) : (
                      <Link href={link.href} className="flex items-center gap-2 text-gray-400 text-sm hover:text-primary transition-all duration-200 group">
                        <IconComponent className="size-3.5 opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" />
                        <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-gray-800/50 bg-gradient-to-r from-black/50 to-gray-950/50 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <p className="text-gray-400 text-sm text-center sm:text-left">
                © {new Date().getFullYear()} deessa Foundation. All rights reserved.
              </p>
              <div className="h-4 w-px bg-gray-700 hidden sm:block"></div>
              <Link
                href="/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-primary transition-colors group"
              >
                <Settings className="size-3 group-hover:rotate-90 transition-transform duration-300" />
                <span>Admin</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs mr-2">Follow us:</span>
              {socialLinks.map((social) => (
                social.isAlert ? (
                  <button
                    key={social.label}
                    onClick={handleTwitterClick}
                    className="relative size-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-gray-400 hover:text-white border border-gray-700/50 hover:border-primary/50 transition-all duration-300 group overflow-hidden"
                    aria-label={social.label}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <social.icon className="size-4 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  </button>
                ) : (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative size-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-gray-400 hover:text-white border border-gray-700/50 hover:border-primary/50 transition-all duration-300 group overflow-hidden"
                    aria-label={social.label}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <social.icon className="size-4 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  </Link>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
