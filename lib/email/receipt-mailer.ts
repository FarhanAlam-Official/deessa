/**
 * Receipt Email Service
 * Sends donation receipt emails using Google Email (Gmail / Google Workspace).
 *
 * Structure mirrors conference-mailer.ts:
 *   - Shared `createGmailTransporter()` helper
 *   - Module-level `escapeHtml()` for inline templates
 *   - Display name in `from:` field
 *   - Graceful dev-mode fallback
 */

"use server"

import { ReceiptEmailTemplate } from "./templates/receipt"
import nodemailer from "nodemailer"

// ── Shared helpers (same pattern as conference-mailer.ts) ────────────────────

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
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface SendReceiptEmailParams {
  donorName: string
  donorEmail: string
  receiptNumber: string
  receiptUrl: string
  amount: number
  currency: string
  verificationId?: string
}

export interface EmailResult {
  success: boolean
  message: string
  messageId?: string
}

// ── 1. Send Donation Receipt ─────────────────────────────────────────────────

export async function sendReceiptEmail(params: SendReceiptEmailParams): Promise<EmailResult> {
  try {
    const transporter = createGmailTransporter()

    const emailHtml = ReceiptEmailTemplate({
      donorName: params.donorName,
      receiptNumber: params.receiptNumber,
      receiptUrl: params.receiptUrl,
      amount: params.amount,
      currency: params.currency,
      verificationId: params.verificationId,
    })

    const info = await transporter.sendMail({
      from: `"DEESSA Foundation" <${process.env.GOOGLE_EMAIL}>`,
      to: params.donorEmail,
      subject: `Your Donation Receipt — ${escapeHtml(params.receiptNumber)}`,
      html: emailHtml,
    })

    console.log("Receipt email sent:", info.messageId)
    return { success: true, message: "Receipt email sent successfully", messageId: info.messageId }
  } catch (error) {
    console.error("Receipt email error:", error)

    if (error instanceof Error && error.message.includes("not configured")) {
      // Gracefully degrade — log in dev, don't crash
      if (process.env.NODE_ENV === "development") {
        console.warn("Email not configured — logging receipt email (dev mode):", {
          to: params.donorEmail,
          receipt: params.receiptNumber,
        })
        return { success: true, message: "Email logged (development mode)" }
      }
      return { success: false, message: "Email service not configured" }
    }

    return { success: false, message: "Failed to send receipt email" }
  }
}

// ── 2. Test Configuration ────────────────────────────────────────────────────

export async function testGoogleEmailConfiguration(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const transporter = createGmailTransporter()
    await transporter.verify()

    return {
      success: true,
      message: `Gmail connection successful. Emails will be sent from: ${process.env.GOOGLE_EMAIL}`,
    }
  } catch (error) {
    console.error("Gmail configuration test failed:", error)
    return {
      success: false,
      message:
        error instanceof Error && error.message.includes("Invalid login")
          ? "Gmail authentication failed. Verify email and app password."
          : "Failed to verify Gmail configuration",
    }
  }
}
