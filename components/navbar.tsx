"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Heart, Menu, X, ChevronRight, Sparkles, Home, Users, Briefcase, Award, FileText, Calendar, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "About", icon: Users },
  { href: "/programs", label: "Programs", icon: Briefcase },
  { href: "/impact", label: "Impact", icon: Award },
  { href: "/stories", label: "Stories", icon: FileText },
  { href: "/events", label: "Events", icon: Calendar },
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

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled 
          ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-md border-b border-slate-200 dark:border-slate-800" 
          : "bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/50"
      )}
    >
      {/* Main Navigation */}
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          
          {/* Logo Section - Leftmost */}
          <Link 
            href="/" 
            className="group flex-shrink-0 -ml-[5%]"
          >
            <div 
              data-navbar-logo
              className={cn(
                "relative transition-all duration-300",
                hideNavbarLogo ? "opacity-0 scale-90" : "opacity-100 scale-100"
              )}
            >
              <div className="relative w-24 h-24 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Deesha Foundation"
                  width={96}
                  height={96}
                  className="object-contain scale-[250%] group-hover:scale-[260%] transition-transform duration-200"
                  priority
                />
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium transition-all duration-300 rounded-md flex items-center gap-1.5 group",
                    pathname === link.href 
                      ? "text-primary" 
                      : "text-slate-600 dark:text-slate-400 hover:text-primary"
                  )}
                >
                  <IconComponent className="size-3.5" />
                  {link.label}
                  <span 
                    className={cn(
                      "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-300",
                      pathname === link.href 
                        ? "w-6" 
                        : "w-0 group-hover:w-6"
                    )}
                  />
                </Link>
              )})}
            </div>
          </div>

          {/* Desktop CTA Section */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            <Link
              href="/get-involved"
              className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors duration-200 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Get Involved
            </Link>
            
            <Button 
              asChild 
              className="bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow transition-all duration-200 rounded-md px-4 h-9 font-medium"
            >
              <Link href="/donate" className="flex items-center gap-1.5">
                <Heart className="size-3.5 fill-current" />
                <span>Donate</span>
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className={cn(
              "lg:hidden p-2 rounded-md transition-colors duration-200 relative z-50",
              mobileMenuOpen 
                ? "bg-primary text-white" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="fixed top-16 left-0 right-0 bottom-0 z-40 lg:hidden">
            <div className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-lg mx-4 mt-2 rounded-lg overflow-hidden">
              <nav className="flex flex-col max-h-[calc(100vh-5rem)] overflow-y-auto">
                {/* Mobile Links */}
                <div className="p-2">
                  {navLinks.map((link) => {
                    const IconComponent = link.icon;
                    return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200",
                        pathname === link.href 
                          ? "bg-primary/10 text-primary" 
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <IconComponent className="size-4" />
                      <span>{link.label}</span>
                    </Link>
                  )})}
                </div>

                {/* Mobile CTA Section */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <Link
                    href="/get-involved"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 rounded-md"
                  >
                    Get Involved
                  </Link>
                  
                  <Button 
                    asChild 
                    className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 rounded-md h-10 font-medium"
                  >
                    <Link 
                      href="/donate" 
                      className="flex items-center justify-center gap-1.5"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Heart className="size-4 fill-current" />
                      Donate
                    </Link>
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
