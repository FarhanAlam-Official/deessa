/**
 * Admin Donation Review Actions
 * Server actions for reviewing and approving/rejecting donations in REVIEW status
 */

"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { generateReceiptForDonation } from "./donation-receipt"
import nodemailer from "nodemailer"

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase service role env vars")
  return createServiceClient(url, key)
}

export type ReviewDonationInput = {
  donationId: string
  decision: "approve" | "reject"
  notes: string
}

export type ReviewDonationResult = {
  success: boolean
  message: string
  newStatus?: string
}

/**
 * Review a donation in REVIEW status
 * Approves or rejects the donation based on admin decision
 */
export async function reviewDonation(
  input: ReviewDonationInput
): Promise<ReviewDonationResult> {
  try {
    const supabase = await createClient()
    const serviceSupabase = getServiceSupabase()

    // Get current user (admin)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        message: "Unauthorized: No user session",
      }
    }

    // Verify admin user
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("user_id", user.id)
      .single()

    if (!adminUser) {
      return {
        success: false,
        message: "Unauthorized: Not an admin user",
      }
    }

    // Get donation details
    const { data: donation, error: fetchError } = await serviceSupabase
      .from("donations")
      .select("*")
      .eq("id", input.donationId)
      .single()

    if (fetchError || !donation) {
      return {
        success: false,
        message: "Donation not found",
      }
    }

    // Verify donation is in REVIEW status
    if (donation.payment_status !== "review") {
      return {
        success: false,
        message: `Donation is not in review status (current: ${donation.payment_status})`,
      }
    }

    if (input.decision === "approve") {
      // Approve: Update to CONFIRMED
      const { error: updateError } = await serviceSupabase
        .from("donations")
        .update({
          payment_status: "confirmed",
          confirmed_at: new Date().toISOString(),
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: input.notes,
        })
        .eq("id", input.donationId)
        .eq("payment_status", "review") // Conditional update for safety

      if (updateError) {
        console.error("Error updating donation:", updateError)
        return {
          success: false,
          message: "Failed to update donation status",
        }
      }

      // Trigger receipt generation (fire-and-forget)
      generateReceiptForDonation({ donationId: input.donationId })
        .then((result) => {
          if (!result.success) {
            console.error("Receipt generation failed after approval:", result.message)
          }
        })
        .catch((error) => {
          console.error("Receipt generation error after approval:", error)
        })

      // Log audit event
      await serviceSupabase.from("payment_events").insert({
        provider: "system",
        event_id: `review_approved:${input.donationId}:${Date.now()}`,
        donation_id: input.donationId,
        event_type: "review_approved",
        raw_payload: {
          admin_id: user.id,
          admin_email: user.email,
          notes: input.notes,
          timestamp: new Date().toISOString(),
        },
      })

      return {
        success: true,
        message: "Donation approved successfully",
        newStatus: "confirmed",
      }
    } else {
      // Reject: Update to FAILED
      const { error: updateError } = await serviceSupabase
        .from("donations")
        .update({
          payment_status: "failed",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: input.notes,
        })
        .eq("id", input.donationId)
        .eq("payment_status", "review") // Conditional update for safety

      if (updateError) {
        console.error("Error updating donation:", updateError)
        return {
          success: false,
          message: "Failed to update donation status",
        }
      }

      // Send donor notification email
      try {
        const googleEmail = process.env.GOOGLE_EMAIL
        const googleAppPassword = process.env.GOOGLE_APP_PASSWORD

        if (googleEmail && googleAppPassword) {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: googleEmail,
              pass: googleAppPassword,
            },
          })

          await transporter.sendMail({
            from: googleEmail,
            to: donation.donor_email,
            subject: "Donation Payment Issue - Action Required",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Donation Payment Issue</h2>
                <p>Dear ${donation.donor_name},</p>
                <p>We regret to inform you that we were unable to process your donation payment.</p>
                <p><strong>Reason:</strong> ${input.notes}</p>
                <p>If you would like to try again, please visit our donation page and submit a new donation.</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p>Thank you for your understanding.</p>
                <p>Best regards,<br>The Team</p>
              </div>
            `,
          })
        } else {
          console.warn("Email not configured - donor notification not sent")
        }
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError)
        // Don't fail the whole operation if email fails
      }

      // Log audit event
      await serviceSupabase.from("payment_events").insert({
        provider: "system",
        event_id: `review_rejected:${input.donationId}:${Date.now()}`,
        donation_id: input.donationId,
        event_type: "review_rejected",
        raw_payload: {
          admin_id: user.id,
          admin_email: user.email,
          notes: input.notes,
          timestamp: new Date().toISOString(),
        },
      })

      return {
        success: true,
        message: "Donation rejected and donor notified",
        newStatus: "failed",
      }
    }
  } catch (error) {
    console.error("Review donation error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Get review statistics for monitoring
 */
export async function getReviewStats() {
  try {
    const serviceSupabase = getServiceSupabase()

    const { data: donations } = await serviceSupabase
      .from("donations")
      .select("id, created_at, payment_status")
      .eq("payment_status", "review")

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const totalInReview = donations?.length || 0
    const oldReviews = donations?.filter(
      (d) => new Date(d.created_at) < oneDayAgo
    ).length || 0

    return {
      totalInReview,
      oldReviews,
      needsEscalation: oldReviews > 0,
    }
  } catch (error) {
    console.error("Get review stats error:", error)
    return {
      totalInReview: 0,
      oldReviews: 0,
      needsEscalation: false,
    }
  }
}
