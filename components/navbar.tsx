"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Heart, Menu, X, ChevronDown, Home, Users, Briefcase, Award, FileText, Podcast, Calendar, Mail, ClipboardList, ShoppingBag, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "About Us", icon: Users },
  { href: "/programs", label: "Programs", icon: Briefcase },
  { href: "/impact", label: "Our Impact", icon: Award },
  { href: "/podcasts", label: "Podcasts", icon: Podcast },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/stories", label: "Stories", icon: FileText },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hideNavbarLogo, setHideNavbarLogo] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleLogoFlying = () => setHideNavbarLogo(true)
    const handleLogoLanded = () => setHideNavbarLogo(false)
    
    window.addEventListener("intro-logo-flying", handleLogoFlying)
    window.addEventListener("intro-logo-landed", handleLogoLanded)
    
    return () => {
      window.removeEventListener("intro-logo-flying", handleLogoFlying)
      window.removeEventListener("intro-logo-landed", handleLogoLanded)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileMenuOpen])

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        scrolled 
          ? "bg-white/97 dark:bg-slate-950/97 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-slate-200/80 dark:border-slate-800/80" 
          : "bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900"
      )}
    >
      {/* Top accent bar */}
      <div className="h-0.5 bg-linear-to-r from-primary via-blue-400 to-primary" />

      {/* Main Navigation */}
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-18 items-center">
          
          {/* Logo Section */}
          <Link 
            href="/" 
            className="group shrink-0 absolute left-1/2 -translate-x-1/2 lg:relative lg:left-auto lg:translate-x-0 flex items-center gap-3"
          >
            <div 
              data-navbar-logo
              className={cn(
                "relative transition-all duration-300",
                hideNavbarLogo ? "opacity-0 scale-90" : "opacity-100 scale-100"
              )}
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Deessa Foundation"
                  width={64}
                  height={64}
                  className="object-contain group-hover:scale-110 transition-transform duration-300"
                  priority
                />
              </div>
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-lg font-black text-foreground leading-tight tracking-tight">Deessa</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Foundation</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center justify-center flex-1 ml-8">
            <div className="flex items-center gap-0.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-3.5 py-2 text-sm font-bold transition-all duration-300 rounded-lg group",
                      isActive 
                        ? "text-primary bg-primary/5" 
                        : "text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    {link.label}
                    <span 
                      className={cn(
                        "absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-primary transition-all duration-300",
                        isActive 
                          ? "w-5" 
                          : "w-0 group-hover:w-5"
                      )}
                    />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right section: CTAs + Mobile toggle */}
          <div className="ml-auto flex items-center gap-2.5">
            <Link
              href="/get-involved"
              className="hidden xl:inline-flex px-4 py-2 text-sm font-bold text-foreground/70 hover:text-primary transition-colors duration-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Get Involved
            </Link>

            {/* Donate button removed as requested */}

            {/* Mobile Menu Button */}
            <button 
              className={cn(
                "lg:hidden p-2.5 rounded-xl transition-all duration-300 relative z-50",
                mobileMenuOpen 
                  ? "bg-primary text-white shadow-lg shadow-primary/30" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <span className={cn(
                  "absolute h-0.5 w-5 bg-current rounded-full transition-all duration-300",
                  mobileMenuOpen ? "rotate-45" : "-translate-y-1.5"
                )} />
                <span className={cn(
                  "absolute h-0.5 w-5 bg-current rounded-full transition-all duration-300",
                  mobileMenuOpen ? "opacity-0 scale-0" : "opacity-100"
                )} />
                <span className={cn(
                  "absolute h-0.5 w-5 bg-current rounded-full transition-all duration-300",
                  mobileMenuOpen ? "-rotate-45" : "translate-y-1.5"
                )} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={() => setMobileMenuOpen(false)} />
      
      <div className={cn(
        "fixed top-18.5 left-0 right-0 bottom-0 z-40 lg:hidden transition-all duration-300",
        mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      )}>
        <div className="bg-white dark:bg-slate-950 shadow-2xl mx-3 mt-1 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <nav className="flex flex-col max-h-[calc(100vh-6rem)] overflow-y-auto">
            {/* Mobile Links */}
            <div className="p-3 space-y-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 active:bg-slate-100"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      isActive ? "bg-primary/10" : "bg-slate-100 dark:bg-slate-800"
                    )}>
                      <IconComponent className="size-4" />
                    </div>
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Mobile CTA Section */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
              <Link
                href="/get-involved"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-bold text-foreground bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-all duration-200 rounded-xl shadow-sm"
              >
                Get Involved
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
