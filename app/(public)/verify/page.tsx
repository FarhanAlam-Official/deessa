"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ShieldCheck, 
  Search, 
  Lock, 
  Shield, 
  Clock, 
  FileCheck, 
  Phone, 
  Mail,
  ArrowRight,
  CheckCircle2,
  Loader2
} from "lucide-react"

export default function VerifyPage() {
  const [verificationId, setVerificationId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = verificationId.trim()
    if (!trimmed) return
    setIsLoading(true)
    router.push(`/verify/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[rgb(232,246,252)] via-white to-[rgb(232,246,252)]/30">
      {/* Hero Section */}
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-[rgb(63,171,222)]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[rgb(11,95,138)]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          {/* Shield Icon */}
          <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[rgb(63,171,222)] to-[rgb(11,95,138)] shadow-lg shadow-[rgb(63,171,222)]/25">
            <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.8} />
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[rgb(11,95,138)] mb-4 tracking-tight">
            Receipt Verification Portal
          </h1>
          <p className="text-base sm:text-lg text-[rgb(108,117,125)] max-w-xl mx-auto leading-relaxed">
            Securely verify the authenticity of your transaction or donation.
            <br className="hidden sm:inline" />
            Please enter the <span className="text-[rgb(63,171,222)] font-semibold">unique identifier</span> found on your official document.
          </p>
        </div>
      </section>

      {/* Verification Form Card */}
      <section className="relative max-w-xl mx-auto px-4 sm:px-6 -mt-2">
        <div className="bg-white rounded-2xl shadow-xl shadow-[rgb(63,171,222)]/8 border border-[rgb(63,171,222)]/10 p-6 sm:p-10">
          {/* Label */}
          <label 
            htmlFor="verification-input" 
            className="block text-sm font-bold text-[rgb(11,95,138)] uppercase tracking-wider mb-3"
          >
            Receipt Number / Unique ID
          </label>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-5">
            {/* Input with search icon */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(108,117,125)]" />
              <input
                id="verification-input"
                type="text"
                value={verificationId}
                onChange={(e) => setVerificationId(e.target.value)}
                placeholder="e.g. DF-2024-XXXXX"
                className="w-full pl-12 pr-4 py-4 text-base sm:text-lg rounded-xl border-2 border-gray-200 bg-[rgb(248,249,250)] focus:border-[rgb(63,171,222)] focus:ring-4 focus:ring-[rgb(63,171,222)]/15 focus:bg-white outline-none transition-all duration-200 text-[rgb(33,37,41)] placeholder:text-gray-400"
                autoComplete="off"
                autoFocus
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!verificationId.trim() || isLoading}
              className="group w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl text-white font-bold text-base sm:text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[rgb(63,171,222)] to-[rgb(11,95,138)] hover:from-[rgb(11,95,138)] hover:to-[rgb(63,171,222)] shadow-lg shadow-[rgb(63,171,222)]/25 hover:shadow-xl hover:shadow-[rgb(63,171,222)]/30 active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              {isLoading ? "Verifying..." : "Verify Receipt"}
            </button>
          </form>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-xs sm:text-sm text-[rgb(108,117,125)]">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[rgb(63,171,222)]" />
              Secure SSL
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[rgb(63,171,222)]" />
              Official Portal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[rgb(63,171,222)]" />
              Real-time Check
            </span>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {/* Instant Validation */}
          <div className="group text-center p-6 rounded-2xl bg-white border border-gray-100 hover:border-[rgb(63,171,222)]/20 hover:shadow-lg hover:shadow-[rgb(63,171,222)]/5 transition-all duration-300">
            <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-xl bg-[rgb(232,246,252)] group-hover:bg-gradient-to-br group-hover:from-[rgb(63,171,222)]/10 group-hover:to-[rgb(11,95,138)]/10 transition-colors duration-300">
              <FileCheck className="w-7 h-7 text-[rgb(63,171,222)]" />
            </div>
            <h3 className="text-lg font-bold text-[rgb(11,95,138)] mb-2">
              Instant Validation
            </h3>
            <p className="text-sm text-[rgb(108,117,125)] leading-relaxed">
              Immediate cross-reference with our secure global database.
            </p>
          </div>

          {/* Data Protection */}
          <div className="group text-center p-6 rounded-2xl bg-white border border-gray-100 hover:border-[rgb(63,171,222)]/20 hover:shadow-lg hover:shadow-[rgb(63,171,222)]/5 transition-all duration-300">
            <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-xl bg-[rgb(232,246,252)] group-hover:bg-gradient-to-br group-hover:from-[rgb(63,171,222)]/10 group-hover:to-[rgb(11,95,138)]/10 transition-colors duration-300">
              <Shield className="w-7 h-7 text-[rgb(63,171,222)]" />
            </div>
            <h3 className="text-lg font-bold text-[rgb(11,95,138)] mb-2">
              Data Protection
            </h3>
            <p className="text-sm text-[rgb(108,117,125)] leading-relaxed">
              Your information is protected by industry-standard encryption.
            </p>
          </div>

          {/* Expert Support */}
          <div className="group text-center p-6 rounded-2xl bg-white border border-gray-100 hover:border-[rgb(63,171,222)]/20 hover:shadow-lg hover:shadow-[rgb(63,171,222)]/5 transition-all duration-300">
            <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-xl bg-[rgb(232,246,252)] group-hover:bg-gradient-to-br group-hover:from-[rgb(63,171,222)]/10 group-hover:to-[rgb(11,95,138)]/10 transition-colors duration-300">
              <ShieldCheck className="w-7 h-7 text-[rgb(63,171,222)]" />
            </div>
            <h3 className="text-lg font-bold text-[rgb(11,95,138)] mb-2">
              Expert Support
            </h3>
            <p className="text-sm text-[rgb(108,117,125)] leading-relaxed">
              Direct assistance for any verification discrepancies found.
            </p>
          </div>
        </div>
      </section>

      {/* Verification Help Footer */}
      <section className="border-t border-gray-200 bg-[rgb(248,249,250)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Help Info */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-[rgb(63,171,222)]/10">
                <Phone className="w-4 h-4 text-[rgb(63,171,222)]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[rgb(11,95,138)] mb-1">Verification Help</h4>
                <p className="text-xs text-[rgb(108,117,125)] leading-relaxed">
                  Having trouble verifying your receipt?
                  <br />
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email: <a href="mailto:deessa.social@gmail.com" className="text-[rgb(63,171,222)] hover:underline">deessa.social@gmail.com</a>
                  </span>
                </p>
              </div>
            </div>

            {/* Footer Links */}
            <div className="flex items-center gap-6 text-xs text-[rgb(108,117,125)]">
              <Link href="/privacy" className="hover:text-[rgb(63,171,222)] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[rgb(63,171,222)] transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-[rgb(63,171,222)] transition-colors">
                Contact Us
              </Link>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-[rgb(108,117,125)]">
              &copy; {new Date().getFullYear()} Deessa Foundation. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
