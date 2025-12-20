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
    <header className="sticky top-0 z-50 w-full bg-surface/95 backdrop-blur-md border-b border-border transition-all duration-300">
      <div className="px-4 md:px-8 py-4 flex items-center justify-between mx-auto max-w-[1400px] w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div 
            data-navbar-logo
            className={cn(
              "w-52 h-10 flex items-center justify-center relative overflow-hidden transition-opacity duration-300",
              hideNavbarLogo ? "opacity-0" : "opacity-100"
            )}
          >
            <Image
              src="/logo.png"
              alt="Deesha Foundation Logo"
              width={80}
              height={80}
              className="object-contain scale-[250%]"
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex flex-1 justify-center">
          <nav className="flex items-center gap-6 bg-background px-6 py-2.5 rounded-full border border-border">
            {navLinks.slice(0, 6).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-bold transition-colors",
                  pathname === link.href ? "text-primary" : "text-foreground-muted hover:text-primary",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex gap-4 items-center">
          <Link
            href="/get-involved"
            className="text-sm font-bold text-foreground hover:text-primary transition-colors underline decoration-2 decoration-transparent hover:decoration-primary underline-offset-4"
          >
            Get Involved
          </Link>
          <Button asChild className="rounded-full h-11 px-7 shadow-xl">
            <Link href="/donate">Donate Now</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface border-t border-border">
          <nav className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "py-3 px-4 rounded-lg text-sm font-bold transition-colors",
                  pathname === link.href ? "bg-primary/10 text-primary" : "text-foreground hover:bg-background",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild className="mt-4 rounded-full">
              <Link href="/donate">Donate Now</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
