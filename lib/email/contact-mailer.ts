/**
 * Contact Form Email Service
 *
 * Sends two emails on every contact form submission:
 *   1. Internal notification → org team (GOOGLE_EMAIL)
 *   2. Confirmation reply → the person who submitted the form
 *
 * Uses the same Gmail transporter pattern as receipt-mailer.ts and
 * conference-mailer.ts (GOOGLE_EMAIL + GOOGLE_APP_PASSWORD).
 */

"use server"

import nodemailer from "nodemailer"

// ── Shared transporter ────────────────────────────────────────────────────────

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br>")
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContactEmailParams {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export interface EmailResult {
  success: boolean
  message: string
}

// ── 1. Internal notification email (to org team) ──────────────────────────────

function buildInternalEmail(params: ContactEmailParams): string {
  const orgEmail = process.env.GOOGLE_EMAIL || ""
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Form Submission</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .card { background: #ffffff; border-radius: 12px; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a1a2e; padding: 28px 32px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 13px; }
    .body { padding: 28px 32px; }
    .field { margin-bottom: 20px; }
    .field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 6px; }
    .field .value { font-size: 15px; color: #1a1a1a; }
    .message-box { background: #f8f8f8; border-left: 3px solid #4f46e5; border-radius: 0 8px 8px 0; padding: 14px 16px; font-size: 14px; color: #333; line-height: 1.7; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { padding: 16px 32px; background: #fafafa; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>📬 New Contact Form Submission</h1>
      <p>Received via the website contact form</p>
    </div>
    <div class="body">
      <div class="field">
        <label>From</label>
        <div class="value"><strong>${escapeHtml(params.name)}</strong> &lt;${escapeHtml(params.email)}&gt;</div>
      </div>
      ${params.phone ? `
      <div class="field">
        <label>Phone</label>
        <div class="value">${escapeHtml(params.phone)}</div>
      </div>` : ""}
      <div class="field">
        <label>Subject</label>
        <div class="value">${escapeHtml(params.subject)}</div>
      </div>
      <hr class="divider" />
      <div class="field">
        <label>Message</label>
        <div class="message-box">${escapeHtml(params.message)}</div>
      </div>
    </div>
    <div class="footer">
      Reply directly to this email to respond to ${escapeHtml(params.name)}.
    </div>
  </div>
</body>
</html>
`
}

// ── 2. Confirmation email (to the sender) ─────────────────────────────────────

function buildConfirmationEmail(params: ContactEmailParams): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We received your message</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .card { background: #ffffff; border-radius: 12px; max-width: 580px; margin: 0 auto; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0 0 8px; font-size: 22px; font-weight: 800; }
    .header p { color: rgba(255,255,255,0.85); margin: 0; font-size: 14px; }
    .body { padding: 32px; }
    .body p { color: #444; line-height: 1.7; margin: 0 0 16px; font-size: 15px; }
    .summary { background: #f8f8f8; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .summary-row { display: flex; gap: 12px; margin-bottom: 8px; font-size: 14px; }
    .summary-row:last-child { margin-bottom: 0; }
    .summary-label { font-weight: 700; color: #888; min-width: 70px; }
    .summary-value { color: #1a1a1a; }
    .message-box { background: #f0f0ff; border-left: 3px solid #4f46e5; border-radius: 0 8px 8px 0; padding: 14px 16px; font-size: 14px; color: #333; line-height: 1.7; margin: 8px 0 20px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { padding: 20px 32px; background: #fafafa; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>✅ Message Received</h1>
      <p>We'll get back to you within 24 hours</p>
    </div>
    <div class="body">
      <p>Hi <strong>${escapeHtml(params.name)}</strong>,</p>
      <p>Thank you for reaching out to DEESSA Foundation. We've received your message and will respond within <strong>24 hours</strong>.</p>

      <div class="summary">
        <div class="summary-row">
          <span class="summary-label">Subject</span>
          <span class="summary-value">${escapeHtml(params.subject)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Sent to</span>
          <span class="summary-value">support@dessafoundation.org</span>
        </div>
      </div>

      <p style="font-size:13px; color:#666; margin-bottom:6px;">Your message:</p>
      <div class="message-box">${escapeHtml(params.message)}</div>

      <hr class="divider" />
      <p style="font-size:14px;">For urgent matters, you can also reach us directly at <a href="mailto:support@dessafoundation.org" style="color:#4f46e5;">support@dessafoundation.org</a> or call us at <strong>+977 1-4123456</strong>.</p>
      <p style="font-size:14px;">Warm regards,<br /><strong>DEESSA Foundation Team</strong></p>
    </div>
    <div class="footer">
      DEESSA Foundation · Thamel, Kathmandu, Nepal 44600<br />
      This is an automated confirmation. Please do not reply to this email.<br />
      To reply, email <a href="mailto:support@dessafoundation.org" style="color:#4f46e5;">support@dessafoundation.org</a>
    </div>
  </div>
</body>
</html>
`
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Sends two emails:
 *   1. Internal notification to the org team's inbox
 *   2. Confirmation to the person who submitted the form
 *
 * Non-fatal — if email fails, the DB submission still succeeds.
 */
export async function sendContactEmails(params: ContactEmailParams): Promise<EmailResult> {
  try {
    const transporter = createGmailTransporter()
    const orgEmail = process.env.GOOGLE_EMAIL!
    const contactEmail = process.env.CONTACT_NOTIFY_EMAIL || orgEmail

    // Send both emails in parallel
    const [internalResult] = await Promise.allSettled([
      // 1. Internal notification (reply-to: sender so the team can reply directly)
      transporter.sendMail({
        from: `"DEESSA Foundation Website" <${orgEmail}>`,
        to: contactEmail,
        replyTo: `"${params.name}" <${params.email}>`,
        subject: `[Contact Form] ${params.subject} — ${params.name}`,
        html: buildInternalEmail(params),
      }),

      // 2. Confirmation to the sender
      transporter.sendMail({
        from: `"DEESSA Foundation" <${orgEmail}>`,
        to: params.email,
        subject: `We received your message — DEESSA Foundation`,
        html: buildConfirmationEmail(params),
      }),
    ])

    if (internalResult.status === "rejected") {
      console.error("Internal contact email failed:", internalResult.reason)
    }

    return { success: true, message: "Emails sent successfully" }
  } catch (error) {
    console.error("Contact email error:", error)

    // In development without credentials, warn and continue
    if (
      error instanceof Error &&
      error.message.includes("not configured") &&
      process.env.NODE_ENV === "development"
    ) {
      console.warn("Email not configured — skipping email send (dev mode):", {
        to: params.email,
        subject: params.subject,
      })
      return { success: true, message: "Email skipped (development mode — no credentials)" }
    }

    return { success: false, message: "Failed to send confirmation email" }
  }
}
