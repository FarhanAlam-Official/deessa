/**
 * Receipt Email Template
 * HTML email template for donation receipts
 *
 * Design system matched to conference email template:
 * - Inline styles only (email-client safe, no <style> block)
 * - Ocean Blue brand colors (#3FABDE / #0B5F8A)
 * - DEESSA brand badge with Foundation name
 * - Ticket-style receipt with dashed dividers
 * - Consistent CTA button hierarchy
 * - Proper currency formatting with spacing
 */

import { getAppBaseUrl } from '@/lib/utils'

// ── Shared HTML escaping (same pattern as conference-registration.ts) ─────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export interface ReceiptEmailTemplateProps {
  donorName: string
  receiptNumber: string
  receiptUrl: string
  amount: number
  currency: string
  verificationId?: string
}

export function ReceiptEmailTemplate({
  donorName,
  receiptNumber,
  receiptUrl,
  amount,
  currency,
  verificationId,
}: ReceiptEmailTemplateProps): string {
  const currencyLabels: Record<string, { symbol: string; name: string }> = {
    NPR: { symbol: "Rs.", name: "Nepalese Rupee" },
    USD: { symbol: "$", name: "US Dollar" },
    EUR: { symbol: "€", name: "Euro" },
    GBP: { symbol: "£", name: "British Pound" },
    INR: { symbol: "₹", name: "Indian Rupee" },
  }
  const currencyInfo = currencyLabels[currency] || { symbol: currency, name: currency }
  const siteUrl = getAppBaseUrl()

  // Escape all user-supplied values before interpolating into HTML
  const safeDonorName = escapeHtml(donorName)
  const firstName = escapeHtml(donorName.split(" ")[0])
  const safeReceiptNumber = escapeHtml(receiptNumber)
  const safeVerificationId = verificationId ? escapeHtml(verificationId) : ""
  // Use Indian grouping (lakhs/crores) for NPR & INR, international (thousands/millions) for others
  const amountLocale = ["NPR", "INR"].includes(currency.toUpperCase()) ? "en-IN" : "en-US"
  const formattedAmount = amount.toLocaleString(amountLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const timeStr = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Donation Receipt — DEESSA Foundation</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Brand Badge -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#3FABDE;border-radius:12px;padding:10px 16px;">
                    <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">DEESSA</span>
                    <span style="color:rgba(255,255,255,0.8);font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-left:8px;">Foundation</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
              <table width="100%" cellpadding="0" cellspacing="0">

              <!-- Gradient Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#0B5F8A 0%,#3FABDE 50%,#0B5F8A 100%);padding:48px 40px;text-align:center;">
                  <div style="font-size:48px;margin-bottom:16px;">🙏</div>
                  <h1 style="margin:0 0 8px;color:#fff;font-size:28px;font-weight:800;line-height:1.2;">
                    Thank You, ${firstName}!
                  </h1>
                  <p style="margin:0;color:rgba(255,255,255,0.9);font-size:16px;line-height:1.5;">
                    Your generous donation to <strong>DEESSA Foundation</strong><br />has been successfully received and recorded.
                  </p>
                </td>
              </tr>

              <!-- Donation Confirmed badge -->
              <tr>
                <td align="center" style="padding:20px 40px 0;background:#fff;">
                  <span style="display:inline-block;background:#DCFCE7;color:#15803D;font-size:13px;font-weight:700;padding:6px 18px;border-radius:100px;border:1.5px solid #BBF7D0;letter-spacing:0.3px;">
                    ✓ &nbsp;Donation Confirmed
                  </span>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:32px 40px 40px;">

                  <!-- Personal message -->
                  <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">
                    Dear <strong>${safeDonorName}</strong>,<br /><br />
                    On behalf of everyone at <strong>DEESSA Foundation</strong>, we sincerely appreciate your contribution
                    of <strong>${currencyInfo.symbol}&nbsp;${formattedAmount}</strong>. Every donation, no matter the size,
                    directly fuels our mission to empower communities through education, healthcare, and sustainable development
                    across Nepal.<br /><br />
                    Your official donation receipt is attached below for your records.
                  </p>

                  <!-- Receipt Ticket Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E2E8F0;border-radius:16px;overflow:hidden;margin-bottom:28px;">
                    <!-- Ticket Header -->
                    <tr style="background:linear-gradient(90deg,#EFF8FF,#F8FAFC);">
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#3FABDE;text-transform:uppercase;letter-spacing:1px;">DONATION RECEIPT</p>
                        <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:#0F172A;">${dateStr}</p>
                        <p style="margin:2px 0 0;font-size:12px;color:#64748B;">at ${timeStr}</p>
                      </td>
                      <td style="padding:16px 20px;text-align:right;vertical-align:top;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">Receipt No.</p>
                        <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#0F172A;font-family:monospace;">${safeReceiptNumber}</p>
                      </td>
                    </tr>
                    ${verificationId ? `
                    <!-- Verification ID row -->
                    <tr>
                      <td colspan="2" style="padding:0 12px;">
                        <div style="border-top:1px solid #F1F5F9;"></div>
                      </td>
                    </tr>
                    <tr style="background:linear-gradient(90deg,#F8FAFC,#EFF8FF);">
                      <td colspan="2" style="padding:10px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">🔐 Verification ID</td>
                            <td style="text-align:right;font-size:13px;font-weight:700;color:#0B5F8A;font-family:monospace;letter-spacing:0.5px;">${safeVerificationId}</td>
                          </tr>
                        </table>
                        <p style="margin:4px 0 0;font-size:11px;color:#94A3B8;">Use this ID to verify your receipt at <a href="${siteUrl}/verify/${encodeURIComponent(verificationId)}" style="color:#3FABDE;">${siteUrl}/verify</a></p>
                      </td>
                    </tr>
                    ` : ''}
                    <!-- Dashed divider -->
                    <tr>
                      <td colspan="2" style="padding:0 12px;">
                        <div style="border-top:2px dashed #E2E8F0;"></div>
                      </td>
                    </tr>
                    <!-- Ticket Details -->
                    <tr>
                      <td colspan="2" style="padding:16px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;padding-bottom:4px;width:50%;">Donor Name</td>
                            <td style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;padding-bottom:4px;width:50%;">Currency</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px;font-weight:600;color:#0F172A;padding-bottom:14px;">${safeDonorName}</td>
                            <td style="font-size:14px;font-weight:600;color:#0F172A;padding-bottom:14px;">${currency} (${currencyInfo.name})</td>
                          </tr>
                          <tr>
                            <td style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;padding-bottom:4px;">Date</td>
                            <td style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;padding-bottom:4px;">Status</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px;font-weight:600;color:#0F172A;">${dateStr}</td>
                            <td style="font-size:14px;font-weight:600;color:#15803D;">✓ Completed</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- Dashed divider -->
                    <tr>
                      <td colspan="2" style="padding:0 12px;">
                        <div style="border-top:2px dashed #E2E8F0;"></div>
                      </td>
                    </tr>
                    <!-- Amount display -->
                    <tr>
                      <td colspan="2" style="padding:24px 20px;text-align:center;background:linear-gradient(180deg,#FAFBFC,#F0F8FF);">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;">Total Amount Donated</p>
                        <p style="margin:10px 0 0;font-size:38px;font-weight:800;color:#0B5F8A;letter-spacing:-0.5px;">${currencyInfo.symbol}&nbsp;${formattedAmount}</p>
                        <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">${currency} &middot; ${currencyInfo.name}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA: Download Receipt -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                    <tr>
                      <td align="center">
                        <a href="${receiptUrl}"
                           style="display:inline-block;background:linear-gradient(135deg,#0B5F8A,#3FABDE);color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:12px;padding:16px 44px;letter-spacing:0.3px;">
                          📄 &nbsp;Download Full Receipt
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Tax Info Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EFF8FF;border:1.5px solid #BAE0FF;border-radius:12px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0B5F8A;">📋 Tax Information</p>
                        <p style="margin:0;font-size:13px;color:#1E6FA8;line-height:1.7;">
                          DEESSA Foundation is a registered nonprofit organization in Nepal.
                          Your donation of <strong>${currencyInfo.symbol}&nbsp;${formattedAmount}</strong> is tax-deductible
                          under Section 12 of the Income Tax Act, 2058 (Nepal). Please download and retain
                          your receipt above for your tax filing records.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Your Impact Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:12px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#15803D;">💚 Your Impact Matters</p>
                        <p style="margin:0 0 6px;font-size:13px;color:#166534;line-height:1.7;">
                          Your donation to DEESSA Foundation helps us:
                        </p>
                        <table cellpadding="0" cellspacing="0" style="margin-top:4px;">
                          <tr>
                            <td style="padding:4px 8px 4px 0;font-size:13px;color:#166534;vertical-align:top;">🎓</td>
                            <td style="padding:4px 0;font-size:13px;color:#166534;line-height:1.5;">Provide quality education &amp; scholarships to underserved communities</td>
                          </tr>
                          <tr>
                            <td style="padding:4px 8px 4px 0;font-size:13px;color:#166534;vertical-align:top;">🏥</td>
                            <td style="padding:4px 0;font-size:13px;color:#166534;line-height:1.5;">Deliver healthcare access &amp; wellness programs in rural Nepal</td>
                          </tr>
                          <tr>
                            <td style="padding:4px 8px 4px 0;font-size:13px;color:#166534;vertical-align:top;">🌱</td>
                            <td style="padding:4px 0;font-size:13px;color:#166534;line-height:1.5;">Support sustainable livelihoods &amp; community development</td>
                          </tr>
                          <tr>
                            <td style="padding:4px 8px 4px 0;font-size:13px;color:#166534;vertical-align:top;">🤝</td>
                            <td style="padding:4px 0;font-size:13px;color:#166534;line-height:1.5;">Empower women, youth &amp; marginalized groups</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- What Happens Next -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:12px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0F172A;">📬 What Happens Next?</p>
                        <table cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="padding:6px 0;font-size:13px;color:#475569;line-height:1.6;">
                              <span style="color:#3FABDE;font-weight:700;">1.</span>&nbsp; Your donation is being allocated to active programs
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0;font-size:13px;color:#475569;line-height:1.6;">
                              <span style="color:#3FABDE;font-weight:700;">2.</span>&nbsp; We'll share impact updates via email &amp; our website
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0;font-size:13px;color:#475569;line-height:1.6;">
                              <span style="color:#3FABDE;font-weight:700;">3.</span>&nbsp; Your receipt is available for download anytime from the link above
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0;font-size:13px;color:#475569;line-height:1.6;">
                              <span style="color:#3FABDE;font-weight:700;">4.</span>&nbsp; You'll be added to our donor community for exclusive updates
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Secondary CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                    <tr>
                      <td align="center">
                        <a href="${siteUrl}/donate"
                           style="display:inline-block;background:#F0F4F8;color:#0B5F8A;font-size:14px;font-weight:600;text-decoration:none;border-radius:12px;padding:12px 32px;border:1.5px solid #E2E8F0;">
                          ❤️ &nbsp;Make Another Donation
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Contact line -->
                  <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;text-align:center;">
                    Have questions about your donation?<br />
                    <a href="mailto:deessa.social@gmail.com" style="color:#3FABDE;font-weight:600;">deessa.social@gmail.com</a>
                  </p>
                </td>
              </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 0;">
              <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">DEESSA Foundation — Empowering Communities Across Nepal</p>
              <p style="margin:0;font-size:11px;color:#CBD5E1;">
                <a href="${siteUrl}" style="color:#3FABDE;">deessafoundation.org.np</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
