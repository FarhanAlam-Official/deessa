"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Heart, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/programs", label: "Programs" },
  { href: "/impact", label: "Impact" },
  { href: "/stories", label: "Stories" },
  { href: "/events", label: "Events" },
  { href: "/get-involved", label: "Get Involved" },
  { href: "/contact", label: "Contact" },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hideNavbarLogo, setHideNavbarLogo] = useState(false)

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

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/95 backdrop-blur-lg border-b border-border/50 shadow-sm transition-all duration-300">
      <div className="px-4 md:px-8 py-4 flex items-center justify-between mx-auto max-w-[1400px] w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <div 
            data-navbar-logo
            className={cn(
              "w-52 h-10 flex items-center justify-center relative overflow-hidden transition-all duration-300",
              hideNavbarLogo ? "opacity-0 scale-95" : "opacity-100 scale-100 group-hover:scale-105"
            )}
          >
            <Image
              src="/logo.png"
              alt="deessa Foundation Logo"
              width={80}
              height={80}
              className="object-contain scale-[250%]"
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex flex-1 justify-center">
          <nav className="flex items-center gap-1 bg-background/60 backdrop-blur-sm px-3 py-2 rounded-full border border-border/60 shadow-sm">
            {navLinks.slice(0, 6).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-bold rounded-full transition-all duration-200",
                  pathname === link.href 
                    ? "text-primary bg-primary/10" 
                    : "text-foreground-muted hover:text-primary hover:bg-primary/5"
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex gap-3 items-center">
          <Link
            href="/get-involved"
            className="relative text-sm font-bold text-foreground hover:text-primary transition-all duration-200 px-3 py-2 rounded-full hover:bg-primary/5 group"
          >
            Get Involved
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full" />
          </Link>
          <Button asChild className="rounded-full h-11 px-7 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <Link href="/donate" className="flex items-center gap-2">
              <Heart className="size-4 fill-current" />
              Donate Now
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2.5 text-foreground hover:bg-primary/5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface/95 backdrop-blur-lg border-t border-border/50 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col p-4 gap-1.5 max-h-[calc(100vh-80px)] overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  pathname === link.href 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-foreground hover:bg-background/80 hover:shadow-sm"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary" />
                )}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-border/50">
              <Button asChild className="w-full rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                <Link href="/donate" className="flex items-center justify-center gap-2">
                  <Heart className="size-4 fill-current" />
                  Donate Now
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
