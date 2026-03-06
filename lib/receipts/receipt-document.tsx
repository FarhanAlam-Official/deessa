/**
 * Donation Receipt PDF Document — v2
 *
 * Redesigned with Deesha Foundation Ocean Blue branding.
 * Combines a clean professional layout with tax compliance.
 *
 * Uses @react-pdf/renderer for PDF generation.
 */

import React from "react"
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Path,
  Circle,
  Rect,
} from "@react-pdf/renderer"
import { getAppBaseUrl } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReceiptPDFOrganization {
  name: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  pan_number?: string
  vat_registration_number?: string
  swc_registration_number?: string
  ird_exemption_number?: string
  authorized_signatory_name?: string
  authorized_signatory_designation?: string
  stamp_url?: string
  signature_url?: string
}

export interface ReceiptPDFData {
  receiptNumber: string
  donationId: string
  paymentDate: Date
  // Donor
  donorName: string
  donorEmail: string
  donorPhone?: string
  // Donation
  amount: number
  currency: string
  paymentMethod: string
  isMonthly: boolean
  providerRef?: string
  // Organization
  organization: ReceiptPDFOrganization
  // Verification (optional for backward compatibility)
  verificationId?: string
  verificationQR?: string
}

// ---------------------------------------------------------------------------
// Shared helpers (numberToWords, amountToWords, getNepalFiscalYear)
// ---------------------------------------------------------------------------

function numberToWords(n: number, system: "indian" | "international" = "indian"): string {
  if (n === 0) return "Zero"

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ]
  const tensWords = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety",
  ]

  function below100(num: number): string {
    if (num < 20) return ones[num]
    const t = tensWords[Math.floor(num / 10)]
    const o = ones[num % 10]
    return o ? `${t} ${o}` : t
  }

  function below1000(num: number): string {
    if (num < 100) return below100(num)
    const h = ones[Math.floor(num / 100)]
    const rem = num % 100
    return rem ? `${h} Hundred ${below100(rem)}` : `${h} Hundred`
  }

  // Indian system: Thousand → Lakh → Crore
  function convertIndian(num: number): string {
    if (num === 0) return ""
    if (num < 1000) return below1000(num)
    if (num < 100_000) {
      const th = below1000(Math.floor(num / 1000))
      const rem = num % 1000
      return rem ? `${th} Thousand ${below1000(rem)}` : `${th} Thousand`
    }
    if (num < 10_000_000) {
      const lk = below100(Math.floor(num / 100_000))
      const rem = num % 100_000
      return rem ? `${lk} Lakh ${convertIndian(rem)}` : `${lk} Lakh`
    }
    const cr = below100(Math.floor(num / 10_000_000))
    const rem = num % 10_000_000
    return rem ? `${cr} Crore ${convertIndian(rem)}` : `${cr} Crore`
  }

  // International system: Thousand → Million → Billion
  function convertInternational(num: number): string {
    if (num === 0) return ""
    if (num < 1000) return below1000(num)
    if (num < 1_000_000) {
      const th = below1000(Math.floor(num / 1000))
      const rem = num % 1000
      return rem ? `${th} Thousand ${below1000(rem)}` : `${th} Thousand`
    }
    if (num < 1_000_000_000) {
      const mil = convertInternational(Math.floor(num / 1_000_000))
      const rem = num % 1_000_000
      return rem ? `${mil} Million ${convertInternational(rem)}` : `${mil} Million`
    }
    const bil = convertInternational(Math.floor(num / 1_000_000_000))
    const rem = num % 1_000_000_000
    return rem ? `${bil} Billion ${convertInternational(rem)}` : `${bil} Billion`
  }

  return system === "indian" ? convertIndian(n) : convertInternational(n)
}

export function amountToWords(amount: number, currency: string): string {
  const intPart = Math.floor(amount)
  const decPart = Math.round((amount - intPart) * 100)

  const currencyMap: Record<string, { main: string; sub: string }> = {
    NPR: { main: "Rupee", sub: "Paisa" },
    USD: { main: "Dollar", sub: "Cent" },
    EUR: { main: "Euro", sub: "Cent" },
    GBP: { main: "Pound", sub: "Penny" },
    INR: { main: "Rupee", sub: "Paisa" },
  }
  const names = currencyMap[currency] ?? { main: currency, sub: "Cent" }
  const mainPlural = intPart === 1 ? names.main : `${names.main}s`
  const subPlural = decPart === 1 ? names.sub : `${names.sub}s`

  const system = (currency === "NPR" || currency === "INR") ? "indian" : "international"
  const mainWords = numberToWords(intPart, system)
  if (decPart === 0) return `${mainWords} ${mainPlural} Only`

  const subWords = numberToWords(decPart, system)
  return `${mainWords} ${mainPlural} and ${subWords} ${subPlural} Only`
}

export function getNepalFiscalYear(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const adStart = month > 7 || (month === 7 && day >= 17) ? year : year - 1
  const bsStart = adStart + 57
  return `FY ${bsStart}/${bsStart + 1} BS (${adStart}/${adStart + 1} AD)`
}

// ---------------------------------------------------------------------------
// Helpers  (local copies for formatting)
// ---------------------------------------------------------------------------

function formatAmount(amount: number, currency: string): string {
  // Use Indian grouping (lakhs/crores) for NPR & INR, international (thousands/millions) for others
  const locale = ["NPR", "INR"].includes(currency.toUpperCase()) ? "en-IN" : "en-US"
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${currency} ${formatted}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function isValidUrl(url: string | undefined): boolean {
  if (!url) return false
  return /^(https?:\/\/|data:)/.test(url)
}

// ---------------------------------------------------------------------------
// Brand Colors
// ---------------------------------------------------------------------------

const C = {
  // Primary brand
  ocean: "#3FABDE",       // Ocean Blue
  oceanDark: "#0B5F8A",   // Deep Ocean
  oceanLight: "#E8F6FC",  // Light Ocean bg
  oceanSoft: "#C7E9F7",   // Soft Ocean border
  oceanPale: "#F0F9FE",   // Very pale ocean

  // Neutrals
  dark: "#111827",
  medium: "#374151",
  muted: "#6b7280",
  light: "#9ca3af",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
  bg: "#f9fafb",
  white: "#ffffff",

  // Accent
  gold: "#D97706",
  goldLight: "#FEF3C7",
  goldBorder: "#FCD34D",
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.dark,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    backgroundColor: C.white,
  },
  // page-level wrapper to keep things on one page
  pageInner: {
    flex: 1,
  },

  // ── Top accent bar ──────────────────────────────────────────────────
  accentBar: {
    height: 5,
    backgroundColor: C.ocean,
  },

  // ── Content wrapper (horizontal padding) ────────────────────────────
  content: {
    paddingHorizontal: 38,
  },

  // ── Header ──────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 18,
    paddingBottom: 14,
    marginBottom: 0,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  logo: {
    width: 95,
    height: 36,
    objectFit: "contain",
    marginBottom: 5,
  },
  orgName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    color: C.oceanDark,
    marginBottom: 1,
  },
  orgTagline: {
    fontSize: 7,
    color: C.ocean,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  orgDetail: {
    fontSize: 7.5,
    color: C.muted,
    marginBottom: 1,
    lineHeight: 1.3,
  },

  headerRight: {
    alignItems: "flex-end",
  },
  receiptTitleBar: {
    backgroundColor: C.ocean,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  receiptTitleText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: C.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  receiptMetaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 4,
  },
  receiptMetaLabel: {
    fontSize: 8,
    color: C.muted,
    marginRight: 4,
  },
  receiptMetaValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: C.dark,
  },

  // ── Divider ─────────────────────────────────────────────────────────
  divider: {
    height: 1.5,
    backgroundColor: C.ocean,
    marginBottom: 16,
    opacity: 0.3,
  },
  dividerStrong: {
    height: 2,
    backgroundColor: C.ocean,
    marginBottom: 14,
  },

  // ── Section header ──────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
    marginTop: 6,
  },
  sectionIconBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: C.oceanLight,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: C.oceanDark,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // ── Field grid ──────────────────────────────────────────────────────
  grid2: {
    flexDirection: "row",
    marginBottom: 12,
  },
  gridCell: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 7,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  fieldValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: C.dark,
    marginBottom: 7,
  },

  // ── Tax ID row ──────────────────────────────────────────────────────
  taxIdRow: {
    flexDirection: "row",
    backgroundColor: C.oceanPale,
    borderWidth: 1,
    borderColor: C.oceanSoft,
    borderStyle: "solid",
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  taxIdItem: {
    flex: 1,
    alignItems: "center",
  },
  taxIdLabel: {
    fontSize: 6.5,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  taxIdValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: C.oceanDark,
  },
  taxIdDivider: {
    width: 1,
    backgroundColor: C.oceanSoft,
    marginHorizontal: 10,
  },

  // ── Donation details table ──────────────────────────────────────────
  table: {
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.oceanPale,
    borderBottomWidth: 1,
    borderBottomColor: C.oceanSoft,
    borderBottomStyle: "solid",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: C.oceanDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    borderBottomStyle: "solid",
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 9,
    color: C.dark,
  },
  tableCellBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: C.dark,
  },
  tableCellMuted: {
    fontSize: 7.5,
    color: C.muted,
    marginTop: 2,
  },

  // ── Amount box ──────────────────────────────────────────────────────
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.oceanLight,
    borderWidth: 1.5,
    borderColor: C.ocean,
    borderStyle: "solid",
    borderRadius: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 9,
    marginBottom: 5,
  },
  amountWordsCol: {
    flex: 1,
    marginRight: 16,
  },
  amountWordsLabel: {
    fontSize: 7,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  amountWordsText: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 9,
    color: C.oceanDark,
    lineHeight: 1.4,
  },
  amountFigureCol: {
    alignItems: "flex-end",
  },
  amountFigureLabel: {
    fontSize: 7,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  amountFigure: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: C.oceanDark,
  },

  // ── Legal / Tax notice ──────────────────────────────────────────────
  legalBox: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
    borderRadius: 4,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  legalText: {
    fontSize: 7.5,
    color: C.muted,
    lineHeight: 1.5,
    textAlign: "center",
  },
  legalTextBold: {
    fontFamily: "Helvetica-Bold",
    color: C.medium,
  },

  // ── Signatory + stamp ──────────────────────────────────────────────
  signatoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 9,
    marginBottom: 12,
  },
  signatoryLeft: {
    alignItems: "flex-start",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: C.dark,
    borderBottomStyle: "solid",
    width: 150,
    marginBottom: 6,
  },
  signatureImage: {
    width: 120,
    height: 40,
    objectFit: "contain",
    marginBottom: 6,
  },
  signatoryName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: C.dark,
  },
  signatoryDesignation: {
    fontSize: 7.5,
    color: C.ocean,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  signatoryOrg: {
    fontSize: 7.5,
    color: C.muted,
    fontFamily: "Helvetica-Oblique",
    marginTop: 1,
  },
  stampImage: {
    width: 72,
    height: 72,
    objectFit: "contain",
    marginBottom: 4,
  },
  stampLabel: {
    fontSize: 7,
    color: C.muted,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },

  // ── Verification bar ────────────────────────────────────────────────
  verificationBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.oceanPale,
    borderWidth: 1,
    borderColor: C.oceanSoft,
    borderStyle: "solid",
    borderRadius: 6,
    padding: 11,
    marginBottom: 12,
  },
  verificationLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  verificationQR: {
    width: 95,
    height: 95,
    objectFit: "contain",
    marginRight: 10,
    backgroundColor: "#FFFFFF",
    padding: 4,
    borderRadius: 4,
  },
  verificationTextGroup: {},
  verificationLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: C.oceanDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  verificationSub: {
    fontSize: 7,
    color: C.muted,
    marginBottom: 1,
    lineHeight: 1.4,
  },
  verificationRight: {
    alignItems: "flex-end",
  },
  verificationIdLabel: {
    fontSize: 6.5,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  verificationId: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: C.oceanDark,
    marginBottom: 2,
  },
  verificationUrl: {
    fontSize: 6.5,
    color: C.ocean,
  },

  // ── Thank-you footer ────────────────────────────────────────────────
  thankYouBar: {
    backgroundColor: C.ocean,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: "auto",
  },
  thankYouText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: C.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  footerSmall: {
    fontSize: 6.5,
    color: C.oceanSoft,
    marginTop: 4,
    letterSpacing: 0.3,
  },
})

// ---------------------------------------------------------------------------
// SVG Icons (inline)
// ---------------------------------------------------------------------------

function UserIcon() {
  return (
    <Svg width="12" height="12" viewBox="0 0 24 24">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={C.ocean}
        strokeWidth={2}
        fill="none"
      />
      <Circle cx="12" cy="7" r="4" stroke={C.ocean} strokeWidth={2} fill="none" />
    </Svg>
  )
}

function CreditCardIcon() {
  return (
    <Svg width="12" height="12" viewBox="0 0 24 24">
      <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke={C.ocean} strokeWidth={2} fill="none" />
      <Path d="M1 10h22" stroke={C.ocean} strokeWidth={2} fill="none" />
    </Svg>
  )
}

function ShieldIcon() {
  return (
    <Svg width="12" height="12" viewBox="0 0 24 24">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={C.ocean}
        strokeWidth={2}
        fill="none"
      />
    </Svg>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionIconBox}>{icon}</View>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value}</Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Main Document
// ---------------------------------------------------------------------------

export function ReceiptDocumentV2({ data }: { data: ReceiptPDFData }) {
  const {
    receiptNumber,
    paymentDate,
    donorName,
    donorEmail,
    donorPhone,
    amount,
    currency,
    paymentMethod,
    isMonthly,
    providerRef,
    organization: org,
    verificationId,
    verificationQR,
  } = data

  const fiscalYear = getNepalFiscalYear(paymentDate)
  const words = amountToWords(amount, currency)
  const formattedAmount = formatAmount(amount, currency)
  const formattedDate = formatDate(paymentDate)
  const donationType = isMonthly ? "Monthly Recurring" : "One-Time"

  // Currency symbol
  const currencySymbol: Record<string, string> = {
    NPR: "Rs.",
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
  }
  const symbol = currencySymbol[currency] || currency

  // Tax IDs
  const taxItems: Array<{ label: string; value: string }> = []
  if (org.pan_number) taxItems.push({ label: "PAN", value: org.pan_number })
  if (org.swc_registration_number) taxItems.push({ label: "SWC Reg.", value: org.swc_registration_number })
  if (org.vat_registration_number) taxItems.push({ label: "VAT Reg.", value: org.vat_registration_number })
  if (org.ird_exemption_number) taxItems.push({ label: "IRD Exemption", value: org.ird_exemption_number })

  // Get base URL with automatic Vercel deployment detection
  const appUrl = getAppBaseUrl()

  return (
    <Document
      title={`Donation Receipt ${receiptNumber}`}
      author={org.name}
      subject="Official Donation Receipt"
      creator="Deesha Foundation Receipt System"
    >
      <Page size="A4" style={s.page}>

        {/* ── Top accent bar ───────────────────────────────────────── */}
        <View style={s.accentBar} />

        <View style={s.content}>

          {/* ── Header ─────────────────────────────────────────────── */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Image src={`${appUrl}/logo.png`} style={s.logo} />
              {org.address && <Text style={s.orgDetail}>{org.address}</Text>}
              {org.phone && <Text style={s.orgDetail}>Tel: {org.phone}</Text>}
              {org.email && <Text style={s.orgDetail}>{org.email}</Text>}
              {org.website && <Text style={s.orgDetail}>{org.website}</Text>}
            </View>

            <View style={s.headerRight}>
              {/* Highlighted title bar */}
              <View style={s.receiptTitleBar}>
                <Text style={s.receiptTitleText}>Donation Receipt</Text>
              </View>
              <View style={s.receiptMetaRow}>
                <Text style={s.receiptMetaLabel}>Receipt No:</Text>
                <Text style={s.receiptMetaValue}>{receiptNumber}</Text>
              </View>
              <View style={s.receiptMetaRow}>
                <Text style={s.receiptMetaLabel}>Issue Date:</Text>
                <Text style={s.receiptMetaValue}>{formattedDate}</Text>
              </View>
              <View style={s.receiptMetaRow}>
                <Text style={s.receiptMetaLabel}>Fiscal Year:</Text>
                <Text style={s.receiptMetaValue}>{fiscalYear}</Text>
              </View>
            </View>
          </View>

          {/* ── Strong divider ──────────────────────────────────────── */}
          <View style={s.dividerStrong} />

          {/* ── Tax ID bar (if any) ─────────────────────────────────── */}
          {taxItems.length > 0 && (
            <View style={s.taxIdRow}>
              {taxItems.map((item, idx) => (
                <React.Fragment key={item.label}>
                  {idx > 0 && <View style={s.taxIdDivider} />}
                  <View style={s.taxIdItem}>
                    <Text style={s.taxIdLabel}>{item.label}</Text>
                    <Text style={s.taxIdValue}>{item.value}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          )}

          {/* ── Donor Information ───────────────────────────────────── */}
          <SectionHeader icon={<UserIcon />} title="Donor Information" />
          <View style={s.grid2}>
            <View style={s.gridCell}>
              <FieldRow label="Donor Name" value={donorName} />
              <FieldRow label="Email Address" value={donorEmail} />
            </View>
            <View style={s.gridCell}>
              {donorPhone && <FieldRow label="Phone Number" value={donorPhone} />}
              <FieldRow label="Donation Type" value={donationType} />
            </View>
          </View>

          {/* ── Donation Details (table) ────────────────────────────── */}
          <SectionHeader icon={<CreditCardIcon />} title="Donation Details" />

          <View style={s.table}>
            {/* Table header */}
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderText, { flex: 2.5 }]}>Description</Text>
              <Text style={[s.tableHeaderText, { flex: 1, textAlign: "center" }]}>Method</Text>
              <Text style={[s.tableHeaderText, { flex: 1.2, textAlign: "center" }]}>Ref ID</Text>
              <Text style={[s.tableHeaderText, { flex: 0.7, textAlign: "center" }]}>Currency</Text>
              <Text style={[s.tableHeaderText, { flex: 1, textAlign: "right" }]}>Amount</Text>
            </View>

            {/* Table row */}
            <View style={s.tableRow}>
              <View style={{ flex: 2.5 }}>
                <Text style={s.tableCellBold}>
                  {isMonthly ? "Monthly Donation" : "Charitable Donation"}
                </Text>
                <Text style={s.tableCellMuted}>
                  {isMonthly
                    ? "Recurring monthly contribution"
                    : "One-time charitable contribution"}
                </Text>
              </View>
              <Text style={[s.tableCell, { flex: 1, textAlign: "center" }]}>
                {paymentMethod}
              </Text>
              <Text style={[s.tableCell, { flex: 1.2, textAlign: "center", fontSize: 7.5 }]}>
                {providerRef || "—"}
              </Text>
              <Text style={[s.tableCell, { flex: 0.7, textAlign: "center" }]}>
                {currency}
              </Text>
              <Text style={[s.tableCellBold, { flex: 1, textAlign: "right" }]}>
                {symbol} {amount.toLocaleString(["NPR", "INR"].includes(currency.toUpperCase()) ? "en-IN" : "en-US", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* ── Amount in words + total ─────────────────────────────── */}
          <View style={s.amountRow}>
            <View style={s.amountWordsCol}>
              <Text style={s.amountWordsLabel}>Amount in Words</Text>
              <Text style={s.amountWordsText}>{words}</Text>
            </View>
            <View style={s.amountFigureCol}>
              <Text style={s.amountFigureLabel}>Total Amount Received</Text>
              <Text style={s.amountFigure}>{formattedAmount}</Text>
            </View>
          </View>

          {/* ── Legal declaration ───────────────────────────────────── */}
          <View style={s.legalBox}>
            <Text style={s.legalText}>
              <Text style={s.legalTextBold}>Legal Declaration: </Text>
              All donations made to {org.name} are exempt from tax under Section 12 of
              the Income Tax Act, 2058 (Nepal). No goods or services were provided in
              exchange for this contribution. This receipt serves as official
              acknowledgment for tax purposes.
            </Text>
            {(org.pan_number || org.swc_registration_number) && (
              <Text style={[s.legalText, { marginTop: 4, fontFamily: "Helvetica-Bold", color: C.medium }]}>
                {org.pan_number ? `PAN: ${org.pan_number}` : ""}
                {org.pan_number && org.swc_registration_number ? "  |  " : ""}
                {org.swc_registration_number ? `SWC: ${org.swc_registration_number}` : ""}
              </Text>
            )}
          </View>

          {/* ── Verification bar ────────────────────────────────────── */}
          {verificationId && (
            <View style={s.verificationBar}>
              <View style={s.verificationLeft}>
                {verificationQR && isValidUrl(verificationQR) ? (
                  <Image src={verificationQR} style={s.verificationQR} />
                ) : (
                  <View style={[s.verificationQR, { backgroundColor: C.oceanSoft, borderRadius: 4 }]} />
                )}
                <View style={s.verificationTextGroup}>
                  <Text style={s.verificationLabel}>Verify Authenticity</Text>
                  <Text style={s.verificationSub}>
                    Scan the QR code to verify this receipt
                  </Text>
                  <Text style={s.verificationSub}>
                    via our secure donor portal.
                  </Text>
                </View>
              </View>
              <View style={s.verificationRight}>
                <Text style={s.verificationIdLabel}>Verification ID</Text>
                <Text style={s.verificationId}>{verificationId}</Text>
                <Text style={s.verificationUrl}>
                  {appUrl}/verify/{verificationId}
                </Text>
              </View>
            </View>
          )}

          {/* ── Signatory ───────────────────────────────────────────── */}
          <View style={s.signatoryRow}>
            <View style={s.signatoryLeft}>
              {isValidUrl(org.stamp_url) ? (
                <View>
                  <Image src={org.stamp_url} style={s.stampImage} />
                  <Text style={s.stampLabel}>{org.name}</Text>
                </View>
              ) : null}
            </View>

            <View style={{ alignItems: "center" }}>
              {isValidUrl(org.signature_url) ? (
                <Image src={org.signature_url} style={s.signatureImage} />
              ) : (
                <View style={s.signatureLine} />
              )}
              <Text style={s.signatoryName}>
                {org.authorized_signatory_name || "Authorized Signatory"}
              </Text>
              {org.authorized_signatory_designation && (
                <Text style={s.signatoryDesignation}>
                  {org.authorized_signatory_designation}
                </Text>
              )}
              <Text style={s.signatoryOrg}>{org.name}</Text>
            </View>
          </View>

        </View>

        {/* ── Bottom bar ────────────────────────────────────────────── */}
        <View style={s.thankYouBar}>
          <Text style={s.thankYouText}>
            Thank you for your generous support!
          </Text>
          <Text style={s.footerSmall}>
            This is a computer-generated document and does not require a physical signature. Copyright © {paymentDate.getFullYear()} {org.name}. All Rights Reserved.
          </Text>
        </View>

      </Page>
    </Document>
  )
}

// Backward-compatible alias so existing consumers (pdf-renderer, etc.) keep working
export const ReceiptDocument = ReceiptDocumentV2
