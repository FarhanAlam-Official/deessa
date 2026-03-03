"use server";

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

import { getPaymentMode } from "@/lib/payments/config";

import { generateReceiptForDonation } from "@/lib/actions/donation-receipt";

import { sendConferenceConfirmationEmail } from "@/lib/email/conference-mailer";

import { getPaymentService } from "@/lib/payments/core/PaymentService";

import { createStripeAdapter } from "@/lib/payments/adapters/StripeAdapter";

import type Stripe from "stripe";

// Create a service role client for webhooks (bypasses RLS)

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role credentials for webhook");
  }

  return createServiceClient(supabaseUrl, serviceRoleKey);
}

// ── V2 Payment Confirmation Helper ────────────────────────────────────────────

/**
 * Confirm donation payment using PaymentService V2
 * 
 * This is the new centralized payment confirmation flow that:
 * - Uses StripeAdapter for verification
 * - Routes through PaymentService for state management
 * - Enqueues async jobs for receipt generation
 * 
 * @param session - Stripe checkout session
 * @param eventId - Stripe event ID for idempotency
 * @returns True if payment was confirmed, false otherwise
 */
async function confirmDonationV2(
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<boolean> {
  try {
    // Extract donation ID from session
    const donationId = session.client_reference_id || session.metadata?.donation_id;
    
    if (!donationId) {
      console.warn('Stripe webhook V2: No donation ID found in session', session.id);
      return false;
    }

    // Process the already-verified Stripe event.
    // The webhook signature was verified once by the POST handler using the raw
    // request body and the Stripe-Signature header.  Those values are no longer
    // available here, so we call processVerifiedEvent() which skips the second
    // (redundant) signature check and goes straight to data extraction.
    const adapter = createStripeAdapter();
    const stripeEvent = {
      type: 'checkout.session.completed',
      data: { object: session },
      id: eventId,
    } as import('stripe').default.Event;
    const verificationResult = await adapter.processVerifiedEvent(stripeEvent);

    // Confirm donation through PaymentService
    const paymentService = getPaymentService();
    const result = await paymentService.confirmDonation({
      donationId,
      provider: 'stripe',
      verificationResult,
      eventId
    });

    if (!result.success) {
      console.error('Stripe webhook V2: Payment confirmation failed', {
        donationId,
        sessionId: session.id,
        error: result.error
      });
      return false;
    }

    // Log result
    console.log('Stripe webhook V2: Payment confirmed', {
      donationId,
      sessionId: session.id,
      status: result.status
    });

    // Generate receipt synchronously, same as V1 does.
    // enqueuePostPaymentJob() is a placeholder stub (no-op) — it does not
    // actually generate receipts or send emails yet.  Until the job queue is
    // fully implemented we must call generateReceiptForDonation() directly so
    // donors receive their receipts.
    if (result.status === 'confirmed' || result.status === 'already_processed') {
      try {
        const receiptResult = await generateReceiptForDonation({ donationId });
        if (receiptResult.success) {
          console.log(`Stripe webhook V2: Receipt generated for donation ${donationId}`, {
            receiptNumber: receiptResult.receiptNumber,
          });
        } else {
          console.error('Stripe webhook V2: Receipt generation failed', {
            donationId,
            reason: receiptResult.message,
          });
        }
      } catch (receiptError) {
        // Non-fatal: log but do NOT fail the webhook response.
        // A failed receipt must never cause Stripe to retry the payment webhook.
        console.error('Stripe webhook V2: Failed to generate receipt', {
          donationId,
          error: receiptError instanceof Error ? receiptError.message : 'Unknown error'
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Stripe webhook V2: Unexpected error', {
      sessionId: session.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

// ── V1 Payment Confirmation (Legacy) ──────────────────────────────────────────

/**
 * Legacy V1 payment confirmation flow
 * 
 * This is the original implementation that directly updates the database.
 * Kept as fallback during migration period.
 * 
 * @param supabase - Supabase client
 * @param session - Stripe checkout session
 * @param eventId - Stripe event ID for idempotency
 * @returns True if payment was confirmed, false otherwise
 */
async function confirmDonationV1(
  supabase: ReturnType<typeof createServiceRoleClient>,
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<boolean> {
  const donationId = session.client_reference_id || session.metadata?.donation_id;

  if (!donationId) {
    console.warn('checkout.session.completed: No donation ID found in session', session.id);
    return false;
  }

  // Idempotency / replay protection
  const recordEventOnce = async (donationId: string | null | undefined) => {
    try {
      const { error } = await supabase
        .from("payment_events")
        .insert({
          provider: "stripe",
          event_id: eventId,
          donation_id: donationId ?? null,
        });

      if (error) {
        if (
          (error as any).code === "23505" ||
          String((error as any).message || "")
            .toLowerCase()
            .includes("duplicate")
        ) {
          return { alreadyProcessed: true };
        }

        if (
          String((error as any).message || "")
            .toLowerCase()
            .includes("payment_events")
        ) {
          return { alreadyProcessed: false };
        }

        return { alreadyProcessed: false };
      }

      return { alreadyProcessed: false };
    } catch {
      return { alreadyProcessed: false };
    }
  };

  const recorded = await recordEventOnce(donationId);
  if (recorded.alreadyProcessed) return false;

  // Strict lookup: donation must match id
  const { data: donation, error: fetchError } = await supabase
    .from("donations")
    .select("*")
    .eq("id", donationId)
    .single();

  if (!donation) {
    console.error("checkout.session.completed: Donation not found", {
      donationId,
      sessionId: session.id,
      error: fetchError,
    });
    return false;
  }

  // Idempotency check: don't update if already completed or failed
  if (
    donation.payment_status === "completed" ||
    donation.payment_status === "failed"
  ) {
    return false;
  }

  // Only mark complete if Stripe says the checkout is paid
  if (session.payment_status !== "paid") {
    console.warn(
      "checkout.session.completed: Session not paid; keeping pending",
      {
        donationId,
        sessionId: session.id,
        payment_status: session.payment_status,
      }
    );
    return false;
  }

  // Fail-closed amount/currency check for one-time payments
  if (session.mode === "payment") {
    const donationCurrency = String(donation.currency || "").toLowerCase();
    const sessionCurrency = String(session.currency || "").toLowerCase();
    const expectedMinor = donation.amount
      ? Math.round(Number(donation.amount) * 100)
      : null;
    const actualMinor = session.amount_total ?? null;

    if (
      !expectedMinor ||
      actualMinor === null ||
      donationCurrency !== sessionCurrency ||
      expectedMinor !== actualMinor
    ) {
      console.error(
        "checkout.session.completed: Amount/currency mismatch; marking review",
        {
          donationId,
          sessionId: session.id,
          donationCurrency,
          sessionCurrency,
          expectedMinor,
          actualMinor,
        }
      );

      await supabase
        .from("donations")
        .update({
          payment_status: "review",
          stripe_session_id: session.id,
          provider: "stripe",
          provider_ref: session.id,
        })
        .eq("id", donationId);

      return false;
    }
  }

  // Update payment status
  const { error: updateError, data: updatedDonations } = await supabase
    .from("donations")
    .update({
      payment_status: "completed",
      payment_id: session.subscription
        ? `stripe:subscription:${session.subscription}`
        : `stripe:${session.id}`,
      provider: "stripe",
      provider_ref: session.id,
      stripe_session_id: session.id,
      stripe_subscription_id:
        session.subscription && typeof session.subscription === "string"
          ? session.subscription
          : null,
    })
    .eq("id", donationId)
    .select();

  const updatedDonation = updatedDonations?.[0];

  if (updateError) {
    console.error(
      "checkout.session.completed: Failed to update donation",
      {
        donationId,
        sessionId: session.id,
        error: updateError,
      }
    );
    return false;
  }

  // Generate receipt automatically after payment completion
  if (updatedDonation) {
    try {
      await generateReceiptForDonation({
        donationId: updatedDonation.id,
      });
      console.log(`Receipt generated for donation ${updatedDonation.id}`);
    } catch (receiptError) {
      console.error(
        "Failed to generate receipt for donation:",
        receiptError
      );
    }
  }

  return true;
}

// ── Conference payment confirmation helper ────────────────────────────────────

async function confirmConferenceRegistrationFromWebhook(
  supabase: ReturnType<typeof createServiceRoleClient>,

  registrationId: string,

  session: Stripe.Checkout.Session,

  eventId: string
): Promise<void> {
  // Idempotency check via payment_events

  try {
    const { error: eventErr } = await supabase

      .from("payment_events")

      .insert({
        provider: "stripe",

        event_id: eventId,

        conference_registration_id: registrationId,
      });

    if (eventErr) {
      if (
        (eventErr as any).code === "23505" ||
        String(eventErr.message).includes("duplicate")
      ) {
        console.log("Stripe webhook (conference): already processed", eventId);

        return;
      }
      // Log unexpected errors for observability, but continue processing
      console.warn("Stripe webhook (conference): payment_events insert failed (non-duplicate)", {
        eventId,
        error: eventErr,
      });
    }
  } catch {
    // Table may not have column yet — log and continue processing
    console.warn("Stripe webhook (conference): payment_events table error — continuing", eventId);
  }
  const { data: reg, error: fetchErr } = await supabase

    .from("conference_registrations")

    .select("*")

    .eq("id", registrationId)

    .single();

  if (fetchErr || !reg) {
    console.error(
      "Stripe webhook (conference): registration not found",
      registrationId
    );

    return;
  }

  // Idempotency: already confirmed or cancelled — skip

  if (
    reg.payment_status === "paid" ||
    reg.status === "confirmed" ||
    reg.status === "cancelled"
  ) {
    return;
  }

  // Fail-closed: only proceed when Stripe confirms the session is paid

  if (session.payment_status !== "paid") {
    console.warn("Stripe webhook (conference): session not paid", {
      registrationId,
      sessionId: session.id,
    });

    return;
  }

  // Amount verification (fail-closed)

  // Note: Stripe always returns amounts in the session currency. We compare

  // against the DB payment_amount * 100. If the DB currency was stored as "NPR"

  // but Stripe charged "USD" (due to a previous bug), the check would fail.

  // We now trust Stripe's session currency and update the DB currency if needed.

  if (reg.payment_amount !== null && session.mode === "payment") {
    const expectedMinor = Math.round(Number(reg.payment_amount) * 100);

    const actualMinor = session.amount_total ?? null;

    const sessionCurrency = String(session.currency || "").toLowerCase();

    const regCurrency = String(reg.payment_currency || "NPR").toLowerCase();

    // If currencies differ but amounts match numerically, sync the DB currency to Stripe's

    // (this handles cases where registration was saved with NPR but Stripe charged USD)

    if (actualMinor === null) {
      console.error(
        "Stripe webhook (conference): no amount_total in session — flagging for review",
        {
          registrationId,
          sessionId: session.id,
        }
      );

      await supabase

        .from("conference_registrations")

        .update({ payment_status: "review", payment_review_at: new Date().toISOString(), stripe_session_id: session.id })

        .eq("id", registrationId);

      return;
    }

    if (expectedMinor !== actualMinor) {
      console.error(
        "Stripe webhook (conference): amount mismatch — flagging for review",
        {
          registrationId,
          expectedMinor,
          actualMinor,
          regCurrency,
          sessionCurrency,
        }
      );

      await supabase

        .from("conference_registrations")

        .update({ payment_status: "review", payment_review_at: new Date().toISOString(), stripe_session_id: session.id })

        .eq("id", registrationId);

      return;
    }

    // Currency mismatch is non-fatal — sync DB to Stripe's currency and continue

    if (regCurrency !== sessionCurrency) {
      console.warn(
        "Stripe webhook (conference): currency mismatch — syncing DB currency to Stripe",
        {
          registrationId,
          regCurrency,
          sessionCurrency,
        }
      );

      const { error: currencyUpdateError } = await supabase

        .from("conference_registrations")

        .update({ payment_currency: sessionCurrency.toUpperCase() })

        .eq("id", registrationId)
      
      if (currencyUpdateError) {
        console.error("Stripe webhook (conference): failed to sync currency", {
          registrationId, regCurrency, sessionCurrency,
          error: currencyUpdateError
        })
        throw new Error(`Failed to update registration currency: ${currencyUpdateError.message}`)
      };
    }
  }

  // Confirm the registration

  const { error: updateErr } = await supabase

    .from("conference_registrations")

    .update({
      status: "confirmed",

      payment_status: "paid",

      payment_provider: "stripe",

      payment_id: `stripe:${session.id}`,

      provider_ref: session.id,

      stripe_session_id: session.id,

      payment_paid_at: new Date().toISOString(),

      confirmed_at: new Date().toISOString(),
    })

    .eq("id", registrationId);

  if (updateErr) {
    console.error("Stripe webhook (conference): failed to confirm", updateErr);

    throw new Error("Failed to update conference registration");
  }

  // Send confirmation email (non-blocking — failure must not fail the webhook)

  sendConferenceConfirmationEmail({
    fullName: reg.full_name,

    email: reg.email,

    registrationId: reg.id,

    attendanceMode: reg.attendance_mode || "",

    role: reg.role || undefined,

    workshops: reg.workshops || undefined,
  })
    .then((r) => {
      if (r.success)
        supabase.from("conference_registrations")
          .update({ last_confirmation_email_sent_at: new Date().toISOString() })
          .eq("id", registrationId).then(() => {})
    })
    .catch((err) =>
      console.error("Non-fatal: webhook confirmation email failed:", err)
    );

  console.log(
    "Stripe webhook (conference): confirmed registration",
    registrationId
  );
}

export async function POST(request: Request) {
  const mode = getPaymentMode();

  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    const body = await request.text();

    if (mode === "mock") {
      // In mock mode we trust local test payloads and skip signature verification.

      event = JSON.parse(body) as Stripe.Event;
    } else {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!secret) {
        console.error("STRIPE_WEBHOOK_SECRET is not configured");

        return NextResponse.json(
          { error: "Webhook not configured" },
          { status: 500 }
        );
      }

      if (!signature) {
        return NextResponse.json(
          { error: "Missing Stripe-Signature header" },
          { status: 400 }
        );
      }

      const Stripe = (await import("stripe")).default;

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2024-06-20",
      });

      try {
        event = stripe.webhooks.constructEvent(body, signature, secret);
      } catch (err) {
        console.error("Stripe webhook signature verification failed:", err);

        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    }
  } catch (err) {
    console.error("Stripe webhook parsing error:", err);

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Use service role client for webhooks to bypass RLS

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // ── Conference registration branch ───────────────────────────────────

        const conferenceRegistrationId =
          session.metadata?.conference_registration_id;

        if (conferenceRegistrationId) {
          await confirmConferenceRegistrationFromWebhook(
            supabase,
            conferenceRegistrationId,
            session,
            event.id
          );

          break;
        }

        // ── Donation branch with V1/V2 feature flag ──────────────────────────

        // Check if V2 is enabled via feature flag
        const isV2Enabled = process.env.PAYMENT_V2_ENABLED === 'true';

        if (isV2Enabled) {
          // Use V2 payment confirmation flow
          const confirmed = await confirmDonationV2(session, event.id);
          
          if (!confirmed) {
            // Return error so Stripe can retry
            return NextResponse.json(
              { error: "Failed to confirm donation" },
              { status: 500 }
            );
          }
        } else {
          // Use V1 payment confirmation flow (legacy)
          const confirmed = await confirmDonationV1(supabase, session, event.id);
          
          if (!confirmed) {
            // Return error so Stripe can retry
            return NextResponse.json(
              { error: "Failed to update donation status" },
              { status: 500 }
            );
          }
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        // ── Conference branch — keep payment_status = 'unpaid' so user can retry ──

        const conferenceRegistrationId =
          session.metadata?.conference_registration_id;

        if (conferenceRegistrationId) {
          // Don't change the registration status — session expired but the

          // registration itself may still be within its 24h window.

          // The cron job will handle true expiry when expires_at passes.

          console.log(
            "Stripe webhook (conference): payment session expired (no action)",
            conferenceRegistrationId
          );

          break;
        }

        const donationId =
          session.client_reference_id || session.metadata?.donation_id;

        if (!donationId) {
          break;
        }

        // Idempotency check for V1
        const recordEventOnce = async (donationId: string | null | undefined) => {
          try {
            const { error } = await supabase
              .from("payment_events")
              .insert({
                provider: "stripe",
                event_id: event.id,
                donation_id: donationId ?? null,
              });

            if (error) {
              if (
                (error as any).code === "23505" ||
                String((error as any).message || "")
                  .toLowerCase()
                  .includes("duplicate")
              ) {
                return { alreadyProcessed: true };
              }
              return { alreadyProcessed: false };
            }

            return { alreadyProcessed: false };
          } catch {
            return { alreadyProcessed: false };
          }
        };

        const recorded = await recordEventOnce(donationId);

        if (recorded.alreadyProcessed) break;

        const { data: donation } = await supabase

          .from("donations")

          .select("*")

          .eq("id", donationId)

          .single();

        if (!donation) break;

        // Only update if still pending

        if (donation.payment_status === "pending") {
          await supabase

            .from("donations")

            .update({
              payment_status: "failed",
            })

            .eq("id", donationId);
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Try to find donation via metadata

        const donationId = paymentIntent.metadata?.donation_id;

        if (!donationId) {
          break;
        }

        // Idempotency check for V1
        const recordEventOnce = async (donationId: string | null | undefined) => {
          try {
            const { error } = await supabase
              .from("payment_events")
              .insert({
                provider: "stripe",
                event_id: event.id,
                donation_id: donationId ?? null,
              });

            if (error) {
              if (
                (error as any).code === "23505" ||
                String((error as any).message || "")
                  .toLowerCase()
                  .includes("duplicate")
              ) {
                return { alreadyProcessed: true };
              }
              return { alreadyProcessed: false };
            }

            return { alreadyProcessed: false };
          } catch {
            return { alreadyProcessed: false };
          }
        };

        const recorded = await recordEventOnce(donationId);

        if (recorded.alreadyProcessed) break;

        const { data: donation } = await supabase

          .from("donations")

          .select("*")

          .eq("id", donationId)

          .single();

        if (!donation) break;

        // Only update if still pending

        if (donation.payment_status === "pending") {
          await supabase

            .from("donations")

            .update({
              payment_status: "failed",
            })

            .eq("id", donationId);
        }

        break;
      }

      // Subscription events for monthly donations

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;

        // Find donation via subscription metadata or customer metadata

        const donationId = subscription.metadata?.donation_id;

        if (!donationId) {
          console.warn(
            "customer.subscription.created: No donation ID in subscription metadata",
            subscription.id
          );

          break;
        }

        // Idempotency check for V1
        const recordEventOnce = async (donationId: string | null | undefined) => {
          try {
            const { error } = await supabase
              .from("payment_events")
              .insert({
                provider: "stripe",
                event_id: event.id,
                donation_id: donationId ?? null,
              });

            if (error) {
              if (
                (error as any).code === "23505" ||
                String((error as any).message || "")
                  .toLowerCase()
                  .includes("duplicate")
              ) {
                return { alreadyProcessed: true };
              }
              return { alreadyProcessed: false };
            }

            return { alreadyProcessed: false };
          } catch {
            return { alreadyProcessed: false };
          }
        };

        const recorded = await recordEventOnce(donationId);

        if (recorded.alreadyProcessed) break;

        const { data: donation } = await supabase

          .from("donations")

          .select("*")

          .eq("id", donationId)

          .single();

        if (donation) {
          await supabase

            .from("donations")

            .update({
              payment_id: `stripe:subscription:${subscription.id}`,

              provider: "stripe",

              provider_ref: subscription.id,

              stripe_subscription_id: subscription.id,
            })

            .eq("id", donationId);
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        // For subscription invoices, find the donation

        if (invoice.subscription && typeof invoice.subscription === "string") {
          // Check if V2 is enabled via feature flag
          const isV2Enabled = process.env.PAYMENT_V2_ENABLED === 'true';

          if (isV2Enabled) {
            // V2: Use StripeAdapter and PaymentService
            try {
              // Use processVerifiedEvent() — the signature was already verified by
              // the outer handler; re-calling verify() with empty headers/body fails.
              const adapter = createStripeAdapter();
              const invoiceEvent = {
                type: 'invoice.payment_succeeded',
                data: { object: invoice },
                id: event.id,
              } as import('stripe').default.Event;
              const verificationResult = await adapter.processVerifiedEvent(invoiceEvent);

              const paymentService = getPaymentService();
              const result = await paymentService.confirmDonation({
                donationId: verificationResult.donationId,
                provider: 'stripe',
                verificationResult,
                eventId: event.id
              });

              if (result.success && (result.status === 'confirmed' || result.status === 'already_processed')) {
                // Generate receipt synchronously (job queue is still a stub)
                try {
                  await generateReceiptForDonation({ donationId: verificationResult.donationId });
                } catch (receiptError) {
                  console.error('Stripe webhook V2: Failed to generate receipt for subscription', {
                    donationId: verificationResult.donationId,
                    error: receiptError instanceof Error ? receiptError.message : 'Unknown error'
                  });
                }
              }
            } catch (error) {
              console.error('Stripe webhook V2: Failed to process subscription invoice', {
                invoiceId: invoice.id,
                subscriptionId: invoice.subscription,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          } else {
            // V1: Legacy flow
            const recordEventOnce = async (donationId: string | null | undefined) => {
              try {
                const { error } = await supabase
                  .from("payment_events")
                  .insert({
                    provider: "stripe",
                    event_id: event.id,
                    donation_id: donationId ?? null,
                  });

                if (error) {
                  if (
                    (error as any).code === "23505" ||
                    String((error as any).message || "")
                      .toLowerCase()
                      .includes("duplicate")
                  ) {
                    return { alreadyProcessed: true };
                  }
                  return { alreadyProcessed: false };
                }

                return { alreadyProcessed: false };
              } catch {
                return { alreadyProcessed: false };
              }
            };

            const recorded = await recordEventOnce(null);

            if (recorded.alreadyProcessed) break;

            // Try to find donation by subscription ID in payment_id

            const { data: donations } = await supabase

              .from("donations")

              .select("*")

              .like("payment_id", `%subscription:${invoice.subscription}%`)

              .order("created_at", { ascending: false })

              .limit(1);

            if (donations && donations.length > 0) {
              // Update the most recent matching donation (query ordered by created_at DESC)

              const donation = donations[0];

              if (donation.payment_status !== "completed") {
                const { data: updatedDonations } = await supabase

                  .from("donations")

                  .update({
                    payment_status: "completed",

                    provider: "stripe",

                    provider_ref: invoice.subscription,

                    stripe_subscription_id: invoice.subscription,
                  })

                  .eq("id", donation.id)

                  .select();

                const updatedDonation = updatedDonations?.[0];

                // Generate receipt for subscription payment

                if (updatedDonation) {
                  try {
                    await generateReceiptForDonation({
                      donationId: updatedDonation.id,
                    });

                    console.log(
                      `Receipt generated for subscription donation ${updatedDonation.id}`
                    );
                  } catch (receiptError) {
                    console.error(
                      "Failed to generate receipt for subscription donation:",
                      receiptError
                    );
                  }
                }
              }
            }
          }
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        // For subscription invoices, mark donation as failed

        if (invoice.subscription && typeof invoice.subscription === "string") {
          // Idempotency check for V1
          const recordEventOnce = async (donationId: string | null | undefined) => {
            try {
              const { error } = await supabase
                .from("payment_events")
                .insert({
                  provider: "stripe",
                  event_id: event.id,
                  donation_id: donationId ?? null,
                });

              if (error) {
                if (
                  (error as any).code === "23505" ||
                  String((error as any).message || "")
                    .toLowerCase()
                    .includes("duplicate")
                ) {
                  return { alreadyProcessed: true };
                }
                return { alreadyProcessed: false };
              }

              return { alreadyProcessed: false };
            } catch {
              return { alreadyProcessed: false };
            }
          };

          const recorded = await recordEventOnce(null);

          if (recorded.alreadyProcessed) break;

          const { data: donations } = await supabase

            .from("donations")

            .select("*")

            .like("payment_id", `%subscription:${invoice.subscription}%`)

            .order("created_at", { ascending: false })

            .limit(1);

          if (donations && donations.length > 0) {
            const donation = donations[0];

            if (donation.payment_status === "pending") {
              await supabase

                .from("donations")

                .update({
                  payment_status: "failed",

                  provider: "stripe",

                  provider_ref: invoice.subscription,

                  stripe_subscription_id: invoice.subscription,
                })

                .eq("id", donation.id);
            }
          }
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Optionally handle subscription cancellation

        const donationId = subscription.metadata?.donation_id;

        if (donationId) {
          // Note: We don't change payment_status here as the subscription may have been active
        }

        break;
      }

      default:
        // Other events are acknowledged but not processed

        console.log("Unhandled Stripe webhook event type:", event.type);

        break;
    }
  } catch (err) {
    console.error("Error handling Stripe webhook event:", err);

    return NextResponse.json(
      { error: "Webhook handling error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
