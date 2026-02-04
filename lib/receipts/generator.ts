/**
 * Receipt Generator
 * Generates PDF receipts for donations with organization details
 */

import { createClient } from "@/lib/supabase/server"
import { format } from "date-fns"

export interface ReceiptData {
  donationId: string
  donorName: string
  donorEmail: string
  donorPhone?: string
  amount: number
  currency: string
  paymentMethod: string
  paymentDate: Date
  isMonthly: boolean
}

export interface OrganizationDetails {
  name: string
  vat_registration_number: string
  pan_number: string
  swc_registration_number: string
  address: string
  phone: string
  email: string
  logo_url: string
  receipt_prefix: string
  receipt_number_start: number
}

/**
 * Get organization details from site settings
 */
export async function getOrganizationDetails(): Promise<OrganizationDetails> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "organization_details")
    .single()

  if (error || !data?.value) {
    return {
      name: "Dessa Foundation",
      vat_registration_number: "",
      pan_number: "",
      swc_registration_number: "",
      address: "",
      phone: "",
      email: "",
      logo_url: "",
      receipt_prefix: "RCP",
      receipt_number_start: 1000,
    }
  }

  return data.value as OrganizationDetails
}

/**
 * Generate next receipt number
 */
export async function generateReceiptNumber(): Promise<string> {
  const supabase = await createClient()
  const orgDetails = await getOrganizationDetails()

  // Get the highest receipt number currently in use
  const { data: donations, error } = await supabase
    .from("donations")
    .select("receipt_number")
    .not("receipt_number", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)

  let nextNumber = orgDetails.receipt_number_start

  if (!error && donations && donations.length > 0) {
    const lastReceipt = donations[0].receipt_number
    if (lastReceipt) {
      // Extract number from receipt (e.g., "RCP-2024-001" -> 1)
      const match = lastReceipt.match(/(\d+)$/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }
  }

  const year = new Date().getFullYear()
  return `${orgDetails.receipt_prefix}-${year}-${String(nextNumber).padStart(3, "0")}`
}

/**
 * Generate HTML for receipt (can be converted to PDF)
 */
export function generateReceiptHTML(
  receipt: ReceiptData & { receiptNumber: string; organizationDetails: OrganizationDetails },
): string {
  const formattedDate = format(receipt.paymentDate, "MMMM dd, yyyy")
  const currencySymbol = receipt.currency === "USD" ? "$" : "₨"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Donation Receipt - ${receipt.receiptNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #1f2937;
          line-height: 1.6;
          background: #f9fafb;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }
        
        .org-info {
          flex: 1;
        }
        
        .org-logo {
          max-width: 120px;
          height: auto;
          margin-bottom: 10px;
        }
        
        .org-name {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 5px;
        }
        
        .org-details {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.5;
        }
        
        .receipt-info {
          text-align: right;
        }
        
        .receipt-title {
          font-size: 28px;
          font-weight: 700;
          color: #059669;
          margin-bottom: 10px;
        }
        
        .receipt-number {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        
        .receipt-date {
          font-size: 14px;
          color: #6b7280;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }
        
        .info-label {
          color: #6b7280;
          font-weight: 500;
        }
        
        .info-value {
          color: #111827;
          font-weight: 600;
        }
        
        .amount-section {
          background: #f0fdf4;
          border: 2px solid #86efac;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        
        .amount-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .amount-label {
          font-size: 14px;
          color: #6b7280;
        }
        
        .amount-value {
          font-size: 32px;
          font-weight: 700;
          color: #059669;
        }
        
        .tax-statement {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          font-size: 13px;
          color: #1e40af;
          line-height: 1.6;
        }
        
        .donor-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .donor-field {
          font-size: 13px;
        }
        
        .donor-field-label {
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 3px;
        }
        
        .donor-field-value {
          color: #111827;
          font-weight: 600;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        
        .footer-text {
          margin-bottom: 10px;
        }
        
        .registration-numbers {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 10px;
          line-height: 1.5;
        }
        
        @media print {
          body {
            background: white;
          }
          .container {
            box-shadow: none;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="org-info">
            ${receipt.organizationDetails.logo_url ? `<img src="${receipt.organizationDetails.logo_url}" alt="Logo" class="org-logo">` : ""}
            <div class="org-name">${receipt.organizationDetails.name}</div>
            <div class="org-details">
              ${receipt.organizationDetails.address ? `<div>${receipt.organizationDetails.address}</div>` : ""}
              ${receipt.organizationDetails.phone ? `<div>Phone: ${receipt.organizationDetails.phone}</div>` : ""}
              ${receipt.organizationDetails.email ? `<div>Email: ${receipt.organizationDetails.email}</div>` : ""}
            </div>
          </div>
          <div class="receipt-info">
            <div class="receipt-title">RECEIPT</div>
            <div class="receipt-number">Receipt #: ${receipt.receiptNumber}</div>
            <div class="receipt-date">Date: ${formattedDate}</div>
          </div>
        </div>

        <!-- Donor Information -->
        <div class="section">
          <div class="section-title">Donor Information</div>
          <div class="donor-info">
            <div class="donor-field">
              <div class="donor-field-label">Full Name</div>
              <div class="donor-field-value">${receipt.donorName}</div>
            </div>
            <div class="donor-field">
              <div class="donor-field-label">Email</div>
              <div class="donor-field-value">${receipt.donorEmail}</div>
            </div>
            ${receipt.donorPhone ? `
            <div class="donor-field">
              <div class="donor-field-label">Phone</div>
              <div class="donor-field-value">${receipt.donorPhone}</div>
            </div>
            ` : ""}
          </div>
        </div>

        <!-- Donation Details -->
        <div class="section">
          <div class="section-title">Donation Details</div>
          <div class="info-row">
            <span class="info-label">Payment Method:</span>
            <span class="info-value">${receipt.paymentMethod}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Donation Type:</span>
            <span class="info-value">${receipt.isMonthly ? "Monthly Recurring" : "One-Time"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Currency:</span>
            <span class="info-value">${receipt.currency}</span>
          </div>
        </div>

        <!-- Amount Section -->
        <div class="amount-section">
          <div class="amount-row">
            <span class="amount-label">Amount Donated:</span>
            <span class="amount-value">${currencySymbol}${receipt.amount.toFixed(2)}</span>
          </div>
        </div>

        <!-- Tax Statement -->
        <div class="tax-statement">
          <strong>Tax Deductibility Notice:</strong> ${receipt.organizationDetails.name} is a registered nonprofit organization. 
          Your donation is tax-deductible to the extent permitted by law. 
          ${receipt.organizationDetails.pan_number ? `PAN: ${receipt.organizationDetails.pan_number}` : ""}
          ${receipt.organizationDetails.vat_registration_number ? `VAT Registration: ${receipt.organizationDetails.vat_registration_number}` : ""}
        </div>

        <!-- Thank You -->
        <div class="section">
          <p style="text-align: center; font-size: 16px; color: #059669; font-weight: 600; margin: 30px 0;">
            Thank you for your generous donation!
          </p>
          <p style="text-align: center; font-size: 13px; color: #6b7280; line-height: 1.6;">
            Your support makes a real difference in the lives of communities across Nepal. 
            We are committed to using your donation responsibly and transparently.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-text">
            This is an official receipt for your donation. Please keep it for your records.
          </div>
          <div class="registration-numbers">
            ${receipt.organizationDetails.swc_registration_number ? `<div>SWC Registration: ${receipt.organizationDetails.swc_registration_number}</div>` : ""}
            ${receipt.organizationDetails.pan_number ? `<div>PAN: ${receipt.organizationDetails.pan_number}</div>` : ""}
            ${receipt.organizationDetails.vat_registration_number ? `<div>VAT Registration: ${receipt.organizationDetails.vat_registration_number}</div>` : ""}
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Convert HTML to PDF using a simple approach
 * For production, consider using a service like Puppeteer or html2pdf
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  // This is a placeholder - in production you would use:
  // - puppeteer for server-side rendering
  // - html2pdf library
  // - or an external service like html2pdf.com API

  // For now, we'll return a simple implementation that can be enhanced
  // The actual PDF generation will be handled by a library
  throw new Error("PDF generation requires additional setup. See implementation notes.")
}
