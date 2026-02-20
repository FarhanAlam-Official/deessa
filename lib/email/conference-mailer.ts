/**
 * Conference Email Service
 * Sends:
 *   1. sendConferenceRegistrationEmail — on successful registration (status: pending)
 *   2. sendConferenceConfirmationEmail — when admin confirms a registration
 *   3. sendConferenceCancellationEmail — when registration is cancelled
 *   4. sendConferencePaymentLinkEmail — payment link for pending_payment registrations
 *   5. sendCustomEmail — admin custom message
 */

"use server"

import nodemailer from "nodemailer"
import { ConferenceRegistrationTemplate } from "./templates/conference-registration"
import { ConferenceConfirmationTemplate } from "./templates/conference-confirmation"
import { ConferenceCancellationTemplate } from "./templates/conference-cancellation"

function createGmailTransporter() {
  const user = process.env.GOOGLE_EMAIL
  const pass = process.env.GOOGLE_APP_PASSWORD

  if (!user || !pass) {
    throw new Error("GOOGLE_EMAIL or GOOGLE_APP_PASSWORD not configured in environment")
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  })
}

export interface ConferenceEmailResult {
  success: boolean
  message: string
  messageId?: string
}

// ── 1. Registration Received (Pending) ──────────────────────────────────────
export async function sendConferenceRegistrationEmail(params: {
  fullName: string
  email: string
  registrationId: string
  attendanceMode: string
  role?: string
  workshops?: string[]
}): Promise<ConferenceEmailResult> {
  try {
    const transporter = createGmailTransporter()

    const html = ConferenceRegistrationTemplate(params)

    const info = await transporter.sendMail({
      from: `"DEESSA Foundation" <${process.env.GOOGLE_EMAIL}>`,
      to: params.email,
      subject: "We received your registration! — DEESSA National Conference 2026",
      html,
    })

    console.log("Conference registration email sent:", info.messageId)
    return { success: true, message: "Registration email sent", messageId: info.messageId }
  } catch (error) {
    console.error("Conference registration email error:", error)
    if (error instanceof Error && error.message.includes("not configured")) {
      // Gracefully degrade — log in dev, don't crash the registration
      console.warn("Email not configured — skipping email send.")
      return { success: false, message: "Email service not configured" }
    }
    return { success: false, message: "Failed to send registration email" }
  }
}

// ── 2. Registration Confirmed (by Admin) ────────────────────────────────────
export async function sendConferenceConfirmationEmail(params: {
  fullName: string
  email: string
  registrationId: string
  attendanceMode: string
  role?: string
  workshops?: string[]
}): Promise<ConferenceEmailResult> {
  try {
    const transporter = createGmailTransporter()

    const html = ConferenceConfirmationTemplate(params)

    const info = await transporter.sendMail({
      from: `"DEESSA Foundation" <${process.env.GOOGLE_EMAIL}>`,
      to: params.email,
      subject: "🎉 Your Registration is Confirmed! — DEESSA National Conference 2026",
      html,
    })

    console.log("Conference confirmation email sent:", info.messageId)
    return { success: true, message: "Confirmation email sent", messageId: info.messageId }
  } catch (error) {
    console.error("Conference confirmation email error:", error)
    return { success: false, message: "Failed to send confirmation email" }
  }
}

// ── 3. Registration Cancelled (by Admin) ────────────────────────────────────
export async function sendConferenceCancellationEmail(params: {
  fullName: string
  email: string
  registrationId: string
}): Promise<ConferenceEmailResult> {
  try {
    const transporter = createGmailTransporter()
    const html = ConferenceCancellationTemplate(params)
    const info = await transporter.sendMail({
      from: `"DEESSA Foundation" <${process.env.GOOGLE_EMAIL}>`,
      to: params.email,
      subject: "Your Registration Has Been Cancelled — DEESSA National Conference 2026",
      html,
    })
    console.log("Conference cancellation email sent:", info.messageId)
    return { success: true, message: "Cancellation email sent", messageId: info.messageId }
  } catch (error) {
    console.error("Conference cancellation email error:", error)
    return { success: false, message: "Failed to send cancellation email" }
  }
}

// ── 4. Custom admin email ─────────────────────────────────────────────────────
export async function sendCustomEmail(params: {
  to: string
  toName: string
  subject: string
  body: string
}): Promise<ConferenceEmailResult> {
  try {
    const transporter = createGmailTransporter()
    const { to, toName, subject, body } = params

    // Wrap plain text body in a minimal branded HTML template
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td align="center" style="padding-bottom:20px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background:#3FABDE;border-radius:12px;padding:10px 16px;">
                <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">DEESSA</span>
                <span style="color:rgba(255,255,255,0.8);font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-left:8px;">Foundation</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:4px;background:linear-gradient(90deg,#3FABDE,#2D8FBF);"></td></tr>
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 8px;font-size:15px;color:#0F172A;">Dear ${toName},</p>
                  <div style="font-size:15px;color:#334155;line-height:1.7;white-space:pre-wrap;">${body.replace(/\n/g, "<br/>")}</div>
                  <hr style="margin:32px 0;border:none;border-top:1px solid #E2E8F0;"/>
                  <p style="margin:0;font-size:12px;color:#94A3B8;">
                    DEESSA Foundation &mdash; DEESSA National Conference 2026<br/>
                    <a href="mailto:conference@deessa.org.np" style="color:#3FABDE;">conference@deessa.org.np</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const info = await transporter.sendMail({
      from: `"DEESSA Foundation" <${process.env.GOOGLE_EMAIL}>`,
      to,
      subject,
      html,
    })
    console.log("Custom conference email sent:", info.messageId)
    return { success: true, message: "Custom email sent", messageId: info.messageId }
  } catch (error) {
    console.error("Custom conference email error:", error)
    return { success: false, message: "Failed to send custom email" }
  }
}

// ── 5. Payment Link Email ──────────────────────────────────────────────────────
export async function sendConferencePaymentLinkEmail(params: {
  fullName: string
  email: string
  registrationId: string
  expiresAt: string | null
}): Promise<ConferenceEmailResult> {
  try {
    const transporter = createGmailTransporter()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const paymentUrl = `${siteUrl}/complete-payment?rid=${params.registrationId}`
    const shortId = `DEESSA-2026-${params.registrationId.slice(0, 6).toUpperCase()}`

    let expiryNote = ""
    if (params.expiresAt) {
      const exp = new Date(params.expiresAt)
      const diffMs = exp.getTime() - Date.now()
      const diffHrs = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))
      expiryNote = `<p style="margin:12px 0 0;font-size:13px;color:#DC2626;font-weight:600;">⚠️ This link expires in approximately ${diffHrs} hour${diffHrs !== 1 ? 's' : ''}. Please complete payment before then.</p>`
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding-bottom:20px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:#3FABDE;border-radius:12px;padding:10px 16px;">
              <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">DEESSA</span>
              <span style="color:rgba(255,255,255,0.8);font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-left:8px;">Foundation</span>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="height:4px;background:linear-gradient(90deg,#3FABDE,#2D8FBF);"></td></tr>
            <tr><td style="padding:36px 40px;">
              <h2 style="margin:0 0 4px;font-size:22px;color:#0F172A;font-weight:800;">Complete Your Registration</h2>
              <p style="margin:0 0 24px;font-size:14px;color:#64748B;">DEESSA National Conference 2026</p>
              <p style="margin:0 0 16px;font-size:15px;color:#334155;">Dear <strong>${params.fullName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">Thank you for registering for the DEESSA National Conference 2026. Your registration has been received and is <strong>pending payment</strong>. Please complete payment to confirm your spot.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:12px;background:#F8FAFC;border:1px solid #E2E8F0;">
                <tr><td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;">Registration ID</p>
                  <p style="margin:0;font-size:16px;font-weight:700;font-family:monospace;color:#0F172A;">${shortId}</p>
                </td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr><td align="center">
                  <a href="${paymentUrl}" style="display:inline-block;background:#3FABDE;color:#fff;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:-0.2px;">Complete Payment →</a>
                </td></tr>
              </table>
              ${expiryNote}
              <p style="margin:24px 0 0;font-size:13px;color:#94A3B8;">Or copy this link: <a href="${paymentUrl}" style="color:#3FABDE;word-break:break-all;">${paymentUrl}</a></p>
              <hr style="margin:32px 0;border:none;border-top:1px solid #E2E8F0;"/>
              <p style="margin:0;font-size:12px;color:#94A3B8;">DEESSA Foundation &mdash; DEESSA National Conference 2026<br/><a href="mailto:conference@deessa.org.np" style="color:#3FABDE;">conference@deessa.org.np</a></p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

    const info = await transporter.sendMail({
      from: `"DEESSA Foundation" <${process.env.GOOGLE_EMAIL}>`,
      to: params.email,
      subject: "⏳ Complete Your Payment — DEESSA National Conference 2026",
      html,
    })
    console.log("Payment link email sent:", info.messageId)
    return { success: true, message: "Payment link email sent", messageId: info.messageId }
  } catch (error) {
    console.error("Payment link email error:", error)
    return { success: false, message: "Failed to send payment link email" }
  }
}
