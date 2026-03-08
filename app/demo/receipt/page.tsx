"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { ReceiptPDFData } from "@/lib/receipts/receipt-document"
import { createClient } from "@/lib/supabase/client"
import QRCode from "qrcode"

// ---------------------------------------------------------------------------
// Mock data (org fields are overwritten on mount with real admin settings)
// ---------------------------------------------------------------------------
const MOCK_DATA: ReceiptPDFData = {
  receiptNumber: "RCP-2026-00042",
  donationId: "d9f1c2a3-4b5e-6f7a-8b9c-0d1e2f3a4b5c",
  paymentDate: new Date("2026-03-04"),
  donorName: "Aarav Sharma",
  donorEmail: "aarav.sharma@example.com",
  donorPhone: "+977-9841234567",
  amount: 15000,
  currency: "NPR",
  paymentMethod: "eSewa",
  isMonthly: false,
  providerRef: "TXN-ESW-2026030412345",
  organization: {
    name: "Deesha Foundation",
    address: "Kathmandu, Nepal",
    phone: "+977-1-4XXXXXX",
    email: "deessa.social@gmail.com",
    website: "https://dessafoundation.org",
    pan_number: "123456789",
    swc_registration_number: "SWC-12345",
    authorized_signatory_name: "Sita Devi Acharya",
    authorized_signatory_designation: "Executive Director",
  },
  verificationId: "d9f1c2a3-4b5e-6f7a-8b9c-0d1e2f3a4b5c",
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ReceiptDemoPage() {
  const [data, setData] = useState<ReceiptPDFData>(MOCK_DATA)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [renderCount, setRenderCount] = useState(0)
  const blobRef = useRef<string | null>(null)

  // Fetch real organization details from admin settings on mount
  useEffect(() => {
    async function fetchOrgDetails() {
      try {
        const supabase = createClient()
        const { data: row } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "organization_details")
          .single()

        if (row?.value) {
          const org = row.value as Record<string, string>
          setData((prev) => ({
            ...prev,
            organization: {
              ...prev.organization,
              // Overwrite with real values from admin settings
              ...(org.name && { name: org.name }),
              ...(org.address && { address: org.address }),
              ...(org.phone && { phone: org.phone }),
              ...(org.email && { email: org.email }),
              ...(org.website && { website: org.website }),
              ...(org.pan_number && { pan_number: org.pan_number }),
              ...(org.vat_registration_number && { vat_registration_number: org.vat_registration_number }),
              ...(org.swc_registration_number && { swc_registration_number: org.swc_registration_number }),
              ...(org.ird_exemption_number && { ird_exemption_number: org.ird_exemption_number }),
              ...(org.authorized_signatory_name && { authorized_signatory_name: org.authorized_signatory_name }),
              ...(org.authorized_signatory_designation && { authorized_signatory_designation: org.authorized_signatory_designation }),
              ...(org.logo_url && { logo_url: org.logo_url }),
              ...(org.stamp_url && { stamp_url: org.stamp_url }),
              ...(org.signature_url && { signature_url: org.signature_url }),
            },
          }))
        }
      } catch (err) {
        console.warn("Could not fetch org details from admin settings:", err)
      }
    }
    fetchOrgDetails()
  }, [])

  // Generate QR then render PDF
  const renderPdf = useCallback(async (currentData: ReceiptPDFData) => {
    setPdfLoading(true)
    setPdfError(null)

    try {
      // Step 1: Generate QR code client-side
      let qrDataUrl: string | undefined
      if (currentData.verificationId) {
        const verifyUrl = `${window.location.origin}/verify/${currentData.verificationId}`
        qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 120,
          margin: 1,
          color: { dark: "#0B5F8A", light: "#FFFFFF" },
          errorCorrectionLevel: "M",
        })
      }

      const dataWithQR = { ...currentData, verificationQR: qrDataUrl }

      // Step 2: dynamic import so @react-pdf/renderer loads client-side only
      const [{ pdf: pdfFn }, { ReceiptDocumentV2 }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/receipts/receipt-document"),
      ])

      const blob = await pdfFn(ReceiptDocumentV2({ data: dataWithQR })).toBlob()

      // Revoke previous URL
      if (blobRef.current) URL.revokeObjectURL(blobRef.current)
      const url = URL.createObjectURL(blob)
      blobRef.current = url
      setBlobUrl(url)
      setRenderCount((c) => c + 1)
    } catch (err: any) {
      console.error("PDF render error:", err)
      setPdfError(err?.message || "Failed to render PDF")
    } finally {
      setPdfLoading(false)
    }
  }, [])

  useEffect(() => {
    renderPdf(data)
  }, [data, renderPdf])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current)
    }
  }, [])

  // ── Toggle helpers ────────────────────────────────────────────────
  const toggleMonthly = () => setData((d) => ({ ...d, isMonthly: !d.isMonthly }))

  const cycleCurrency = () => {
    const currencies = ["NPR", "USD", "EUR", "GBP", "INR"]
    setData((d) => {
      const idx = currencies.indexOf(d.currency)
      return { ...d, currency: currencies[(idx + 1) % currencies.length] }
    })
  }

  const cycleAmount = () => {
    const amounts = [500, 1000, 5000, 15000, 100000, 1500000]
    setData((d) => {
      const idx = amounts.indexOf(d.amount)
      return { ...d, amount: amounts[(idx + 1) % amounts.length] }
    })
  }

  const cycleMethod = () => {
    const methods = ["eSewa", "Khalti", "Stripe", "Bank Transfer"]
    setData((d) => {
      const idx = methods.indexOf(d.paymentMethod)
      return { ...d, paymentMethod: methods[(idx + 1) % methods.length] }
    })
  }

  const handleDownload = () => {
    if (!blobUrl) return
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = `${data.receiptNumber}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
          <h1 className="text-base font-bold text-gray-800 mr-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#3FABDE] text-white text-xs font-bold">
              v2
            </span>
            Receipt Design Preview
          </h1>

          <button
            onClick={cycleAmount}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
          >
            💰 {data.currency} {data.amount.toLocaleString()}
          </button>

          <button
            onClick={cycleCurrency}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
          >
            🌍 {data.currency}
          </button>

          <button
            onClick={cycleMethod}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition"
          >
            💳 {data.paymentMethod}
          </button>

          <button
            onClick={toggleMonthly}
            className="px-3 py-1.5 text-xs font-medium rounded-md border transition"
            style={{
              background: data.isMonthly ? "#E8F6FC" : "#f3f4f6",
              color: data.isMonthly ? "#0B5F8A" : "#374151",
              borderColor: data.isMonthly ? "#3FABDE" : "#d1d5db",
            }}
          >
            {data.isMonthly ? "🔄 Monthly ✓" : "☝️ One-Time"}
          </button>

          <button
            onClick={handleDownload}
            disabled={!blobUrl || pdfLoading}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#0B5F8A] text-white hover:bg-[#0a5278] disabled:opacity-40 transition ml-auto"
          >
            ⬇ Download PDF
          </button>

          <span className="text-[10px] text-gray-400 hidden lg:inline">
            Renders: {renderCount}
          </span>
        </div>
      </div>

      {/* ── PDF Preview ──────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        {pdfError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-700 font-medium mb-2">PDF Render Error</p>
            <p className="text-red-500 text-sm font-mono break-all">{pdfError}</p>
          </div>
        ) : pdfLoading || !blobUrl ? (
          <div className="flex items-center justify-center h-[85vh] bg-white rounded-xl shadow border">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-[3px] border-gray-300 border-t-[#3FABDE] rounded-full animate-spin mb-3" />
              <p className="text-gray-500 text-sm">Rendering PDF…</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
            <iframe
              key={renderCount}
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              title="Receipt PDF Preview"
              className="w-full border-0"
              style={{ height: "85vh", minHeight: 700 }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
