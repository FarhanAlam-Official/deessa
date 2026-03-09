"use server";

import { NextResponse } from "next/server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

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

// ══════════════════════════════════════════════════════════════════════════════
// Payment Confirmation
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Confirm donation payment using centralized PaymentService
 * 
 * This is the production payment confirmation flow that:
 * - Uses StripeAdapter for signature verification and payload normalization
 * - Routes through PaymentService for transactional state management
 * - Enforces idempotency via payment_events ledger
 * - Performs fail-closed amount/currency verification
 * - Generates receipts inline (with error tracking for manual retry)
 * 
 * Architecture:
 * - Webhook signature verified once by POST handler
 * - StripeAdapter.processVerifiedEvent() extracts and normalizes data
 * - PaymentService.confirmDonation() handles atomic DB transaction
 * - Receipt generation is fire-and-forget (non-blocking)
 * 
 * @param session - Stripe checkout session
 * @param eventId - Stripe event ID for idempotency
 * @returns True if payment was confirmed, false otherwise
 */
async function confirmDonation(
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<boolean> {
  try {
    // Extract donation ID from session
    const donationId = session.client_reference_id || session.metadata?.donation_id;
    
    if (!donationId) {
      console.warn('Stripe webhook: No donation ID found in session', session.id);
      return false;
    }

    // Process the already-verified Stripe event.
    // The webhook signature was verified once by the POST handler using the raw
    // request body and the Stripe-Signature header. Those values are no longer
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
      console.error('Stripe webhook: Payment confirmation failed', {
        donationId,
        sessionId: session.id,
        error: result.error
      });
      return false;
    }

    // Log successful payment confirmation
    console.log('Stripe webhook: Payment confirmed', {
      donationId,
      sessionId: session.id,
      status: result.status
    });

    // Generate receipt inline (fire-and-forget with error tracking)
    if (result.status === 'confirmed' || result.status === 'already_processed') {
      try {
        const receiptResult = await generateReceiptForDonation({ donationId });
        if (receiptResult.success) {
          console.log('Stripe webhook: Receipt generated', {
            donationId,
            receiptNumber: receiptResult.receiptNumber,
          });
        } else {
          console.error('Stripe webhook: Receipt generation failed', {
            donationId,
            reason: receiptResult.message,
          });
        }
      } catch (receiptError) {
        // Non-fatal: log but do NOT fail the webhook response.
        console.error('Stripe webhook: Receipt generation error', {
          donationId,
          error: receiptError instanceof Error ? receiptError.message : 'Unknown error',
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Stripe webhook: Unexpected error', {
      sessionId: session.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Conference Registration Payment Confirmation
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Confirm conference registration payment
 * 
 * Note: Conference payments use a separate flow from donations and have not yet
 * been migrated to use PaymentService. This is intentional to avoid scope creep.
 * 
 * Future work: Refactor conference payments to use PaymentService for consistency.
 * 
 * @param supabase - Supabase service role client
 * @param registrationId - Conference registration ID
 * @param session - Stripe checkout session
 * @param eventId - Stripe event ID for idempotency
 */

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
      if ((eventErr as any).code === "23505" || String(eventErr.message).includes("duplicate")) {
        // Already processed - skip silently
        return;
      }
      // Log unexpected errors for observability, but continue processing
      console.warn("Stripe webhook (conference): payment_events insert failed", {
        eventId,
        error: eventErr.message,
      });
    }
  } catch {
    // Table may not have column yet — continue processing
    console.warn("Stripe webhook (conference): payment_events table error");
  }
  const { data: reg, error: fetchErr } = await supabase

    .from("conference_registrations")

    .select("*")

    .eq("id", registrationId)

    .single();

  if (fetchErr || !reg) {
    console.error("Stripe webhook (conference): registration not found", registrationId);
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
      console.error("Stripe webhook (conference): no amount_total in session", {
        registrationId,
        sessionId: session.id,
      });

      await supabase
        .from("conference_registrations")
        .update({ 
          payment_status: "review", 
          payment_review_at: new Date().toISOString(), 
          stripe_session_id: session.id 
        })
        .eq("id", registrationId);

      return;
    }

    if (expectedMinor !== actualMinor) {
      console.error("Stripe webhook (conference): amount mismatch", {
        registrationId,
        expected: expectedMinor,
        actual: actualMinor,
      });

      await supabase
        .from("conference_registrations")
        .update({ 
          payment_status: "review", 
          payment_review_at: new Date().toISOString(), 
          stripe_session_id: session.id 
        })
        .eq("id", registrationId);

      return;
    }

    // Currency mismatch is non-fatal — sync DB to Stripe's currency and continue
    if (regCurrency !== sessionCurrency) {
      const { error: currencyUpdateError } = await supabase
        .from("conference_registrations")
        .update({ payment_currency: sessionCurrency.toUpperCase() })
        .eq("id", registrationId);
      
      if (currencyUpdateError) {
        console.error("Stripe webhook (conference): failed to sync currency", {
          registrationId,
          error: currencyUpdateError.message,
        });
        throw new Error(`Failed to update registration currency: ${currencyUpdateError.message}`);
      }
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
      if (r.success) {
        supabase
          .from("conference_registrations")
          .update({ last_confirmation_email_sent_at: new Date().toISOString() })
          .eq("id", registrationId)
          .then(() => {});
      }
    })
    .catch((err) => console.error("Conference confirmation email failed:", err));

  console.log("Stripe webhook (conference): confirmed", registrationId);
}

// ══════════════════════════════════════════════════════════════════════════════
// Webhook Handler
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Stripe webhook handler
 * 
 * Processes Stripe webhook events for:
 * - Donation payments (one-time and subscriptions)
 * - Conference registration payments
 * 
 * Security:
 * - Verifies webhook signature using STRIPE_WEBHOOK_SECRET
 * - Uses service role client to bypass RLS
 * - Implements idempotency via payment_events table
 * 
 * Performance:
 * - Target response time: < 2 seconds
 * - Receipt generation is fire-and-forget (non-blocking)
 * - Returns 200 OK immediately after confirmation
 */

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    console.log("Stripe webhook: Incoming request", {
      hasSignature: !!signature,
      url: request.url,
      method: request.method,
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    });

    const body = await request.text();

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

    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      console.error("Stripe webhook error: STRIPE_SECRET_KEY is not configured");

      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey, {
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
  } catch (err) {
    console.error("Stripe webhook parsing error:", err);

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Use service role client for webhooks to bypass RLS

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("Stripe webhook: checkout.session.completed received", {
          id: event.id,
          livemode: event.livemode,
        });

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

        // ── Donation payment confirmation ────────────────────────────────────

        const confirmed = await confirmDonation(session, event.id);
        if (!confirmed) {
          // Return error so Stripe can retry
          return NextResponse.json(
            { error: "Failed to confirm donation" },
            { status: 500 }
          );
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

        const donationId = subscription.metadata?.donation_id;

        if (!donationId) {
          console.warn('Stripe webhook: No donation ID in subscription metadata');
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

        // For subscription invoices, confirm the recurring donation payment
        if (invoice.subscription && typeof invoice.subscription === "string") {
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
              // Generate receipt inline (fire-and-forget)
              try {
                const receiptResult = await generateReceiptForDonation({ donationId: verificationResult.donationId });
                if (receiptResult.success) {
                  console.log('Stripe webhook: Subscription receipt generated', {
                    donationId: verificationResult.donationId,
                    receiptNumber: receiptResult.receiptNumber,
                  });
                } else {
                  console.error('Stripe webhook: Subscription receipt failed', {
                    donationId: verificationResult.donationId,
                    reason: receiptResult.message,
                  });
                }
              } catch (receiptError) {
                console.error('Stripe webhook: Subscription receipt error', {
                  donationId: verificationResult.donationId,
                  error: receiptError instanceof Error ? receiptError.message : 'Unknown error',
                });
              }
            }
          } catch (error) {
            console.error('Stripe webhook: Failed to process subscription invoice', {
              invoiceId: invoice.id,
              subscriptionId: invoice.subscription,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
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
        // Unhandled event types are acknowledged but not processed
        console.log("Stripe webhook: Unhandled event type", {
          id: event.id,
          type: event.type,
        });
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
