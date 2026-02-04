/**
 * Receipt Email Service - Google Email Configuration
 * Handles sending receipt emails using Google Email (Gmail/Google Workspace)
 */

"use server"

import { ReceiptEmailTemplate } from "./templates/receipt"
import nodemailer from "nodemailer"

export interface SendReceiptEmailParams {
  donorName: string
  donorEmail: string
  receiptNumber: string
  receiptUrl: string
  amount: number
  currency: string
}

export interface EmailResult {
  success: boolean
  message: string
  messageId?: string
}

/**
 * Send receipt email to donor using Google Email
 */
export async function sendReceiptEmail(params: SendReceiptEmailParams): Promise<EmailResult> {
  try {
    // Check if Google email is configured
    const googleEmail = process.env.GOOGLE_EMAIL
    const googleAppPassword = process.env.GOOGLE_APP_PASSWORD

    if (!googleEmail || !googleAppPassword) {
      console.warn("Google email not configured. Email would be sent to:", params.donorEmail)
      // In development, just log the email
      if (process.env.NODE_ENV === "development") {
        console.log("Email would be sent:", {
          to: params.donorEmail,
          subject: `Your Donation Receipt - ${params.receiptNumber}`,
        })
        return {
          success: true,
          message: "Email logged (development mode)",
        }
      }
      return {
        success: false,
        message: "Email service not configured",
      }
    }

    // Create transporter using Google Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: googleEmail,
        pass: googleAppPassword, // Use App Password, not regular password
      },
    })

    // Generate email HTML
    const emailHtml = ReceiptEmailTemplate({
      donorName: params.donorName,
      receiptNumber: params.receiptNumber,
      receiptUrl: params.receiptUrl,
      amount: params.amount,
      currency: params.currency,
    })

    // Send email
    const info = await transporter.sendMail({
      from: googleEmail,
      to: params.donorEmail,
      subject: `Your Donation Receipt - ${params.receiptNumber}`,
      html: emailHtml,
      replyTo: googleEmail,
    })

    console.log("Receipt email sent successfully:", info.messageId)

    return {
      success: true,
      message: "Receipt email sent successfully",
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Error sending receipt email:", error)

    if (error instanceof Error) {
      // Handle specific Gmail errors
      if (error.message.includes("Invalid login")) {
        return {
          success: false,
          message: "Gmail authentication failed. Check email and app password.",
        }
      }
      if (error.message.includes("ECONNREFUSED")) {
        return {
          success: false,
          message: "Network error. Check your internet connection.",
        }
      }
      return {
        success: false,
        message: `Failed to send email: ${error.message}`,
      }
    }

    return {
      success: false,
      message: "An unexpected error occurred while sending the email",
    }
  }
}

/**
 * Test Google email configuration
 * Call this to verify email setup is working
 */
export async function testGoogleEmailConfiguration(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const googleEmail = process.env.GOOGLE_EMAIL
    const googleAppPassword = process.env.GOOGLE_APP_PASSWORD

    if (!googleEmail || !googleAppPassword) {
      return {
        success: false,
        message: "Google email credentials not configured",
      }
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: googleEmail,
        pass: googleAppPassword,
      },
    })

    // Verify connection
    await transporter.verify()

    return {
      success: true,
      message: `Gmail connection successful. Emails will be sent from: ${googleEmail}`,
    }
  } catch (error) {
    console.error("Gmail configuration test failed:", error)

    if (error instanceof Error) {
      if (error.message.includes("Invalid login")) {
        return {
          success: false,
          message: "Gmail authentication failed. Verify email and app password.",
        }
      }
    }

    return {
      success: false,
      message: "Failed to verify Gmail configuration",
    }
  }
}
