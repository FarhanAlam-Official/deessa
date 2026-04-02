"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Heart,
  Menu,
  X,
  Home,
  Users,
  Briefcase,
  Award,
  FileText,
  Calendar,
  Mail,
  ClipboardList,
  LayoutGrid,
  Star,
  Headphones,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const primaryNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "Who We Are", icon: Users },
  { href: "/our-story", label: "Our Story", icon: FileText },
  { href: "/#what-we-do", label: "What We Do", icon: LayoutGrid },
  { href: "/programs", label: "Programs", icon: Briefcase },
  { href: "/impact", label: "Impact", icon: Award },
  { href: "/stories", label: "Stories", icon: FileText },
  { href: "/events", label: "Events", icon: Calendar },
] as const

const secondaryNavLinks = [
  { href: "/impact", label: "Impact", icon: Award },
  { href: "/podcasts", label: "Podcasts", icon: Headphones },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/contact", label: "Contact", icon: Mail },
] as const

const mobileNavLinks = Array.from(
  new Map([...primaryNavLinks, ...secondaryNavLinks].map((link) => [link.href + link.label, link])).values()
)

const tabletQuickLinks = [
  { href: "/programs", label: "Programs", icon: Briefcase },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/contact", label: "Contact", icon: Mail },
] as const

function useHash() {
  const [hash, setHash] = useState("")
  useEffect(() => {
    const sync = () => setHash(typeof window !== "undefined" ? window.location.hash : "")
    sync()
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])
  return hash
}

function isNavLinkActive(pathname: string, hash: string, href: string) {
  if (href === "/") {
    return pathname === "/" && hash !== "#what-we-do"
  }
  if (href === "/#what-we-do") {
    return pathname === "/" && hash === "#what-we-do"
  }
  return pathname === href
}

export function Navbar() {
  const pathname = usePathname()
  const hash = useHash()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hideNavbarLogo, setHideNavbarLogo] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const LOGO_ZONE_WIDTH = 220

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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = ""
      }
    }

    document.body.style.overflow = ""
    return undefined
  }, [mobileMenuOpen])

  const renderNavLink = (
    link: (typeof primaryNavLinks)[number] | (typeof secondaryNavLinks)[number],
    opts: { variant: "primary" | "secondary"; showDivider: boolean }
  ) => {
    const IconComponent = link.icon
    const active = isNavLinkActive(pathname, hash, link.href)
    const isSecondary = opts.variant === "secondary"
    const isPrimary = opts.variant === "primary"
    const isImpactLink = isSecondary && link.label === "Impact"

    return (
      <div key={link.href + link.label} className="flex items-center gap-0">
        {opts.showDivider && (
          <span
            className="hidden lg:flex w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1 shrink-0"
            aria-hidden
          />
        )}
        <Link
          href={link.href}
          className={cn(
            "group relative flex items-center gap-1.5 rounded-lg transition-colors duration-200",
            isSecondary
              ? "px-2.5 py-2 text-sm font-medium lg:text-[14px]"
              : "px-3 py-2 text-[15px] font-medium",
            active
              ? "text-primary"
              : "text-slate-600 dark:text-slate-400 hover:text-[#3FABDE]"
          )}
        >
          {isImpactLink && active ? (
            <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary">
              <Star className="size-2.5 fill-current text-white" />
            </span>
          ) : (
            <IconComponent className={cn(isSecondary ? "size-3.5" : "size-4", "shrink-0 opacity-80")} />
          )}
          <span>{link.label}</span>
          {isPrimary && (
            <span
              className={cn(
                "pointer-events-none absolute left-1/2 bottom-[-10px] -translate-x-1/2 transition-all duration-300",
                active ? "w-[70%] opacity-100" : "w-0 opacity-0 group-hover:w-[45%] group-hover:opacity-100"
              )}
            >
              <span className="absolute inset-0 h-[3px] rounded-full bg-gradient-to-r from-[#7ad8ff] via-[#3FABDE] to-[#2f95c8] shadow-[0_0_10px_rgba(63,171,222,0.55)]" />
              <span className="absolute inset-0 h-[6px] -translate-y-[1px] rounded-full bg-gradient-to-r from-transparent via-[#66d0ff]/80 to-transparent blur-[2px] animate-pulse" />
            </span>
          )}
        </Link>
      </div>
    )
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white shadow-sm"
          : "bg-white"
      )}
    >
      <div className="w-full px-0 pt-0">

        {/* Layered navbar shell */}
        <div className="relative w-full overflow-visible border-y border-slate-200/80 bg-white shadow-sm">
          {/* Layer 1 (top): Primary row */}
          <div className="relative z-20 bg-white">
            <div className="relative flex h-16 items-center gap-1 px-3 sm:px-4 lg:px-6">
            <Link
              href="/"
              className="group absolute left-1/2 flex shrink-0 -translate-x-1/2 items-center gap-3 lg:relative lg:left-auto lg:w-[220px] lg:translate-x-0"
            >
              <div
                className={cn(
                  "flex items-center gap-3 transition-all duration-300",
                  hideNavbarLogo ? "scale-90 opacity-0" : "scale-100 opacity-100"
                )}
              >
                <div data-navbar-logo className="relative shrink-0">
                  <div data-navbar-logo-target className="relative flex h-16 w-16 items-center p-1 justify-center sm:h-[72px] sm:w-[72px]">
                    <Image
                      src="/logo.png"
                      alt="Deesha Foundation"
                      width={96}
                      height={96}
                      className="object-contain pt-1 pl-4 transition-transform duration-200 scale-[3] group-hover:scale-[3.25]"
                      priority
                    />
                  </div>
                </div>
                <div className="hidden lg:flex" />
              </div>
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex lg:pl-1">
              <div className="flex flex-wrap items-center justify-center gap-x-0">
                {primaryNavLinks.map((link, i) =>
                  renderNavLink(link, { variant: "primary", showDivider: i > 0 })
                )}
              </div>
            </div>

              <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <div className="hidden items-center gap-1.5 lg:flex">
                <Link
                  href="/conference/register"
                  className="flex items-center gap-2 rounded-xl border border-primary/50 px-6 py-2.5 text-[15px] font-medium text-primary transition-colors duration-200 hover:bg-[#3FABDE]/20 hover:text-[#0B5F8A]"
                >
                  <ClipboardList className="size-3.5" />
                  Register
                </Link>

                <Button
                  asChild
                  className="h-11 rounded-xl bg-[#3FABDE] px-8 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:bg-[#2f9bca] hover:shadow-md"
                >
                  <Link href="/donate" className="flex items-center gap-1.5">
                    <Heart className="size-4 fill-current" />
                    Donate
                  </Link>
                </Button>
              </div>

              <button
                type="button"
                className={cn(
                  "relative z-50 rounded-lg p-2 transition-colors duration-200 lg:hidden",
                  mobileMenuOpen
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                )}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
              </div>
            </div>

            {/* Transition: organic white cut-out curve */}
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 -bottom-10 h-10 transition-all duration-300",
                scrolled ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0",
                "max-lg:opacity-0 max-lg:-translate-y-1"
              )}
            >
              <svg className="h-full w-full" viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                {/* Straight under logo area, rises near logo edge, then stays straight */}
                <path
                  d={`M0,0 L0,86 L${LOGO_ZONE_WIDTH - 54},86 C${LOGO_ZONE_WIDTH - 26},86 ${LOGO_ZONE_WIDTH - 10},24 ${LOGO_ZONE_WIDTH + 30},24 L1440,24 L1440,0 Z`}
                  fill="white"
                />
              </svg>
            </div>
          </div>

          {/* Layer 1.5 (tablet): Quick links and key actions */}
          <div className="hidden border-t border-slate-200/80 bg-white px-4 py-2.5 md:block lg:hidden">
            <div className="flex items-center gap-2 overflow-x-auto">
              {tabletQuickLinks.map((link) => {
                const IconComponent = link.icon
                const active = isNavLinkActive(pathname, hash, link.href)
                return (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-200",
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#3FABDE]/45 hover:bg-[#3FABDE]/10 hover:text-[#0B5F8A]"
                    )}
                  >
                    <IconComponent className="size-3.5" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}

              <Link
                href="/conference/register"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 text-sm text-primary transition-colors hover:bg-[#3FABDE]/15 hover:text-[#0B5F8A]"
              >
                <ClipboardList className="size-3.5" />
                <span>Register</span>
              </Link>

              <Link
                href="/donate"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#3FABDE] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2f9bca]"
              >
                <Heart className="size-3.5 fill-current" />
                <span>Donate</span>
              </Link>
            </div>
          </div>

          {/* Layer 2 (middle): Sub-nav tucked under the curve */}
          <div
            className={cn(
              "relative z-10 hidden overflow-hidden bg-[#f1f7fe] px-4 pt-3 pb-2 transition-all duration-300 dark:bg-slate-900 lg:block",
              scrolled ? "max-h-0 translate-y-[-8px] py-0 pt-0 pb-0 opacity-0" : "max-h-24 translate-y-0 opacity-100"
            )}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-0.5">
              {secondaryNavLinks.map((link, i) =>
                renderNavLink(link, { variant: "secondary", showDivider: i > 0 })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile/tablet drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-opacity duration-300",
          mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div
          className="absolute inset-0 bg-black/35"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden
        />

        <div
          className={cn(
            "absolute right-0 top-0 h-full w-[40vw] bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-950",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <nav className="flex h-full flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-5">
              <span className="text-base font-medium text-slate-900 dark:text-slate-100">Menu</span>
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-2 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-3 sm:p-4">
              <div className="grid gap-2 grid-cols-1">
                {mobileNavLinks.map((link) => {
                  const IconComponent = link.icon
                  const active = isNavLinkActive(pathname, hash, link.href)
                  return (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      className={cn(
                        "flex min-h-12 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors duration-200",
                        active
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-transparent text-slate-700 hover:border-[#3FABDE]/40 hover:bg-[#3FABDE]/12 hover:text-[#0B5F8A] dark:text-slate-300 dark:hover:bg-slate-900"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span
                        className={cn(
                          "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                          active ? "bg-primary/15 text-primary" : "bg-slate-100 text-slate-600"
                        )}
                      >
                        <IconComponent className="size-4" />
                      </span>
                      <span className="text-[15px]">{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="mt-auto grid gap-2 border-t border-slate-200 p-3 dark:border-slate-800 sm:p-4">
              <Link
                href="/conference/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-primary/50 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-[#3FABDE]/20 hover:text-[#0B5F8A]"
              >
                <ClipboardList className="size-4" />
                Register for Conference
              </Link>

              <Button
                asChild
                className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-primary/85 font-semibold shadow-md"
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
    </header>
  )
}
