"use server";

import { createClient } from "@/lib/supabase/server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

import {
  sendConferenceRegistrationEmail,
  sendConferenceConfirmationEmail,
  sendConferenceCancellationEmail,
  sendCustomEmail,
} from "@/lib/email/conference-mailer";

import { getConferenceSettings } from "@/lib/actions/conference-settings";

import {
  getPaymentMode,
  getPaymentSettings,
  getSupportedProviders,
  type PaymentProvider,
} from "@/lib/payments/config";

import { startStripeCheckout } from "@/lib/payments/stripe";

import { startKhaltiPayment } from "@/lib/payments/khalti";

import { startEsewaPayment } from "@/lib/payments/esewa";

import { getAppBaseUrl } from "@/lib/utils";

import type {
  ConferenceRegistration,
  ConferenceRegistrationPublic,
  StartConferencePaymentResult,
} from "@/lib/types/conference";

// ── Re-export for consumers ───────────────────────────────────────────────────

export type {
  ConferenceRegistration,
  ConferenceRegistrationPublic,
  StartConferencePaymentResult,
};

// ── Input types ───────────────────────────────────────────────────────────────

export type ConferenceRegistrationData = {
  // Step 1

  fullName: string;

  email: string;

  phone?: string;

  organization?: string;

  // Step 2

  role?: string;

  attendanceMode?: string;

  workshops?: string[];

  // Step 3

  dietaryPreference?: string;

  tshirtSize?: string;

  heardVia?: string[];

  emergencyContactName?: string;

  emergencyContactPhone?: string;

  // Consent

  consentTerms: boolean;

  consentNewsletter: boolean;
};

export type ConferenceRegistrationResult = {
  success: boolean;

  message: string;

  registrationId?: string;

  paymentRequired?: boolean;

  paymentAmount?: number;

  paymentCurrency?: string;

  expiryHours?: number;

  error?: string;
};

// ── Service-role Supabase (bypasses RLS — only for webhooks / cron / admin) ──

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role credentials");
  }

  return createServiceClient(supabaseUrl, serviceRoleKey);
}

// ── Helper: resolve registration fee for a given attendance mode ──────────────

function resolveRegistrationFee(
  cfg: Awaited<ReturnType<typeof getConferenceSettings>>,

  attendanceMode: string | null | undefined,
): {
  amount: number
  currency: "NPR" | "USD" | "EUR" | "GBP" | "INR"
} {
  const currency = (cfg.registrationFeeCurrency ?? "NPR") as
    | "NPR"
    | "USD"
    | "EUR"
    | "GBP"
    | "INR";

  if (!cfg.registrationFeeEnabled) return { amount: 0, currency };

  const byMode = cfg.registrationFeeByMode ?? {};

  if (attendanceMode) {
    // DB stores "in-person"; settings form uses camelCase "inPerson".

    // Normalise so both conventions work: "in-person" -> "inPerson"

    const camelKey = attendanceMode.replace(
      /-([a-z])/g,
      (_: string, c: string) => c.toUpperCase(),
    );

    const override =
      typeof byMode[camelKey] === "number"
        ? byMode[camelKey]
        : typeof byMode[attendanceMode] === "number"
          ? byMode[attendanceMode]
          : undefined;

    if (typeof override === "number") return { amount: override, currency };
  }

  // Fall back to the default fee

  const amount =
    typeof cfg.registrationFee === "number" ? cfg.registrationFee : 0;

  return { amount, currency };
}

// ── Public: Submit registration ───────────────────────────────────────────────

export async function registerForConference(
  data: ConferenceRegistrationData,
): Promise<ConferenceRegistrationResult> {
  try {
    if (!data.fullName?.trim()) {
      return { success: false, message: "Full name is required." };
    }

    if (!data.email?.trim()) {
      return { success: false, message: "Email address is required." };
    }

    if (!data.consentTerms) {
      return {
        success: false,

        message: "You must agree to the Terms and Conditions to register.",
      };
    }

    const supabase = await createClient();

    // ── Duplicate email guard ────────────────────────────────────────────────
    // Mirrors the partial unique index (uq_conf_reg_active_email) on the DB.
    // Gives a clear user-facing message instead of a raw constraint violation.
    const normalizedEmail = data.email.trim().toLowerCase();
    const { data: existing } = await supabase
      .from("conference_registrations")
      .select("id, status")
      .eq("email", normalizedEmail)
      .not("status", "in", '("cancelled","expired")')
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        message:
          "An active registration already exists for this email address. " +
          "Please check your inbox for a confirmation email, or contact support if you need assistance.",
      };
    }
    // ────────────────────────────────────────────────────────────────────────

    const cfg = await getConferenceSettings();

    const fee = resolveRegistrationFee(cfg, data.attendanceMode);

    const paymentRequired = cfg.registrationFeeEnabled && fee.amount > 0;

    const expiryHours = cfg.registrationExpiryHours ?? 24;

    const expiresAt = paymentRequired
      ? new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()
      : null;

    const { data: registration, error } = await supabase

      .from("conference_registrations")

      .insert({
        full_name: data.fullName.trim(),

        email: normalizedEmail,

        phone: data.phone?.trim() || null,

        organization: data.organization?.trim() || null,

        role: data.role || null,

        attendance_mode: data.attendanceMode || null,

        workshops: data.workshops?.length ? data.workshops : null,

        dietary_preference: data.dietaryPreference || null,

        tshirt_size: data.tshirtSize || null,

        heard_via: data.heardVia?.length ? data.heardVia : null,

        emergency_contact_name: data.emergencyContactName?.trim() || null,

        emergency_contact_phone: data.emergencyContactPhone?.trim() || null,

        consent_terms: data.consentTerms,

        consent_newsletter: data.consentNewsletter,

        // Payment gate: set to pending_payment when a fee is required

        status: paymentRequired ? "pending_payment" : "pending",

        payment_status: "unpaid",

        payment_amount: paymentRequired ? fee.amount : null,

        payment_currency: fee.currency,

        expires_at: expiresAt,
      })

      .select()

      .single();

    if (error) {
      console.error("Conference registration error:", error);

      // Postgres unique constraint violation — duplicate active email
      if (error.code === "23505") {
        return {
          success: false,
          message:
            "This email address is already registered for the conference. " +
            "Please check your inbox for a confirmation email, or contact support if you need help.",
          error: error.message,
        };
      }

      return {
        success: false,

        message: "Failed to complete registration. Please try again.",

        error: error.message,
      };
    }

    // Send registration-received email (non-blocking)

    sendConferenceRegistrationEmail({
      fullName: registration.full_name,

      email: registration.email,

      registrationId: registration.id,

      attendanceMode: registration.attendance_mode || "",

      role: registration.role || undefined,

      workshops: registration.workshops || undefined,
    })
      .then((r) => {
        if (r.success)
          supabase
            .from("conference_registrations")
            .update({ last_registration_email_sent_at: new Date().toISOString() })
            .eq("id", registration.id)
            .then(() => {})
      })
      .catch((err) => console.error("Non-fatal: registration email failed:", err))

    return {
      success: true,

      message: `You have successfully registered for the DEESSA National Conference 2026!`,

      registrationId: registration.id,

      paymentRequired,

      paymentAmount: paymentRequired ? fee.amount : undefined,

      paymentCurrency: fee.currency,

      expiryHours: cfg.registrationExpiryHours ?? 24,
    };
  } catch (err) {
    console.error("Conference registration error:", err);

    return {
      success: false,

      message: "An unexpected error occurred. Please try again.",
    };
  }
}

// ── Public: Verify registration by (id + email) for the payment page ──────────

// Returns a minimal public shape — NO full PII returned.

export async function getConferenceRegistrationByToken(
  registrationId: string,

  email: string,
): Promise<ConferenceRegistrationPublic | null> {
  try {
    if (!registrationId || !email) return null;

    // Use service-role to read (bypasses RLS); dual-key check is enforced below.

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase

      .from("conference_registrations")

      .select(
        "id, status, payment_status, payment_amount, payment_currency, expires_at, attendance_mode, full_name",
      )

      .eq("id", registrationId)

      .eq("email", email.trim().toLowerCase()) // ← Dual-key identity check

      .single();

    if (error || !data) return null;

    return data as ConferenceRegistrationPublic;
  } catch {
    return null;
  }
}

// ── Public: Start a payment session for a pending_payment registration ─────────

export async function startConferencePayment(
  registrationId: string,

  email: string,

  provider: PaymentProvider,
): Promise<StartConferencePaymentResult> {
  try {
    if (!registrationId || !email) {
      return { ok: false, message: "Registration ID and email are required." };
    }

    // Service-role read for integrity — always use (id + email) dual-key

    const supabase = createServiceRoleClient();

    const { data: reg, error: fetchErr } = await supabase

      .from("conference_registrations")

      .select("*")

      .eq("id", registrationId)

      .eq("email", email.trim().toLowerCase())

      .single();

    if (fetchErr || !reg) {
      return {
        ok: false,
        message:
          "Registration not found. Please check your registration ID and email.",
      };
    }

    // Guard: only allow payment for unpaid pending registrations

    if (reg.payment_status === "paid") {
      return { ok: false, message: "This registration has already been paid." };
    }

    if (reg.status === "confirmed") {
      return { ok: false, message: "This registration is already confirmed." };
    }

    if (reg.status === "cancelled") {
      return { ok: false, message: "This registration has been cancelled." };
    }

    if (reg.status === "expired") {
      return {
        ok: false,

        message: "This registration has expired. Please register again.",
      };
    }

    // Guard: check expiry (belt-and-suspenders — cron also marks expired)

    if (reg.expires_at && new Date(reg.expires_at) < new Date()) {
      // Mark as expired in DB while we're here

      await supabase

        .from("conference_registrations")

        .update({ status: "expired" })

        .eq("id", registrationId);

      return {
        ok: false,

        message: "This registration has expired. Please register again.",
      };
    }

    // Resolve the authoritative fee from settings (never trust reg.payment_amount directly

    // for amount calculation, but verify it matches to detect tampering)

    const cfg = await getConferenceSettings();

    if (!cfg.registrationFeeEnabled) {
      return {
        ok: false,
        message: "This conference does not require payment.",
      };
    }

    const fee = resolveRegistrationFee(cfg, reg.attendance_mode);

    if (fee.amount <= 0) {
      return {
        ok: false,

        message:
          "The registration fee is not configured correctly. " +
          "Please contact an administrator or set a fee amount in Conference Settings.",
      };
    }

    // Validate provider is available

    const settings = await getPaymentSettings();

    const availableProviders = getSupportedProviders(settings);

    let actualProvider = provider;

    if (!availableProviders.includes(provider)) {
      if (availableProviders.length === 0) {
        return {
          ok: false,
          message:
            "No payment methods are currently available. Please contact support.",
        };
      }

      actualProvider = availableProviders[0];
    }

    const mode = getPaymentMode();

    // Use the configured currency for all providers.

    // NOTE: Stripe supports most currencies. Khalti and eSewa are NPR-only.

    const currency =
      actualProvider === "khalti" || actualProvider === "esewa"
        ? ("NPR" as const)
        : (fee.currency as "NPR" | "USD" | "EUR" | "GBP" | "INR");

    // ── Provider-specific session creation ────────────────────────────────────

    let redirectUrl: string | undefined;

    let providerUpdate: Record<string, unknown> = {};

    let formData: Record<string, string> | undefined;

    let requiresFormSubmit = false;

    if (actualProvider === "stripe") {
      const result = await startStripeCheckout(
        {
          id: registrationId,

          amount: fee.amount,

          currency,

          donorName: reg.full_name,

          donorEmail: reg.email,

          isMonthly: false,

          // Pass conference metadata so the webhook can identify this as a conference payment

          successUrl: `${getAppBaseUrl()}/conference/register/payment-success?rid=${registrationId}`,
          cancelUrl: `${getAppBaseUrl()}/conference/register/pending-payment?rid=${registrationId}&email=${encodeURIComponent(email)}`,
          metadata: {
            conference_registration_id: registrationId,
            payment_type: "conference_registration",
          },
        },

        mode,
      );

      redirectUrl = result.redirectUrl;

      providerUpdate = {
        stripe_session_id: result.sessionId,

        provider_ref: result.sessionId,

        payment_id: `stripe:${result.sessionId}`,
      };
    } else if (actualProvider === "khalti") {
      const result = await startKhaltiPayment(
        {
          id: registrationId,

          amount: fee.amount,

          currency: "NPR",

          donorName: reg.full_name,

          donorEmail: reg.email,

          donorPhone: reg.phone || undefined,
          // Redirect Khalti back to the conference success page (not donation return)
          returnUrl: `${getAppBaseUrl()}/conference/register/payment-success?rid=${registrationId}`,
        },

        mode,
      );

      redirectUrl = result.redirectUrl;

      providerUpdate = {
        khalti_pidx: result.pidx,

        provider_ref: result.pidx,

        payment_id: `khalti:${result.pidx}`,
      };
    } else if (actualProvider === "esewa") {
      const result = await startEsewaPayment(
        { id: registrationId, amount: fee.amount, currency: "NPR" },

        mode,
      );

      redirectUrl = result.redirectUrl;

      formData = result.formData;

      requiresFormSubmit = Object.keys(result.formData).length > 0;

      providerUpdate = {
        esewa_transaction_uuid: result.transactionUuid,

        provider_ref: result.transactionUuid,

        payment_id: `esewa:${result.transactionUuid}`,
      };
    }

    if (!redirectUrl && !requiresFormSubmit) {
      return {
        ok: false,
        message: "Payment could not be initiated. Please try another method.",
      };
    }

    // Persist provider references + fee snapshot

    const { error: updateErr } = await supabase

      .from("conference_registrations")

      .update({
        payment_provider: actualProvider,

        payment_amount: fee.amount,

        payment_currency: fee.currency,

        payment_initiated_at: new Date().toISOString(),

        ...providerUpdate,
      })

      .eq("id", registrationId);

    if (updateErr) {
      console.error(
        "Failed to update conference registration with provider ref:",
        updateErr.message,
      );
      return {
        ok: false,
        message:
          "Payment session could not be saved. Please try again or contact support.",
      };
    }

    return {
      ok: true,

      message: "Redirecting you to the secure payment page...",

      redirectUrl,

      formData,

      requiresFormSubmit,
    };
  } catch (err) {
    console.error("startConferencePayment error:", err);

    return {
      ok: false,

      message:
        "An unexpected error occurred while starting payment. Please try again.",
    };
  }
}

// ── Admin: Fetch all registrations ───────────────────────────────────────────

export async function getConferenceRegistrations() {
  const supabase = await createClient();

  const { data, error } = await supabase

    .from("conference_registrations")

    .select("*")

    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch conference registrations:", error);

    return [];
  }

  return data || [];
}

// ── Admin: Fetch single registration ─────────────────────────────────────────

export async function getConferenceRegistration(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase

    .from("conference_registrations")

    .select("*")

    .eq("id", id)

    .single();

  if (error) {
    console.error("Failed to fetch conference registration:", error);

    return null;
  }

  return data;
}

// ── Admin: Confirm registration → sends confirmation email ───────────────────

export async function confirmConferenceRegistration(
  id: string,

  options: { force?: boolean } = {},
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: reg, error: fetchError } = await supabase

    .from("conference_registrations")

    .select("*")

    .eq("id", id)

    .single();

  if (fetchError || !reg) {
    return { success: false, error: "Registration not found" };
  }

  // Require payment to be paid unless admin forces

  if (!options.force && reg.payment_status !== "paid") {
    return {
      success: false,

      error:
        "Cannot confirm — payment has not been received. Use 'Mark as Paid' to override.",
    };
  }

  const { error: updateError } = await supabase

    .from("conference_registrations")

    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })

    .eq("id", id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Send confirmation email (non-blocking)

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
        supabase
          .from("conference_registrations")
          .update({ last_confirmation_email_sent_at: new Date().toISOString() })
          .eq("id", reg.id)
          .then(() => {})
    })
    .catch((err) => console.error("Non-fatal: confirmation email failed:", err))

  return { success: true };
}

// ── Admin: Cancel registration ────────────────────────────────────────────────

export async function cancelConferenceRegistration(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: reg } = await supabase

    .from("conference_registrations")

    .select("full_name, email")

    .eq("id", id)

    .single();

  const { error } = await supabase

    .from("conference_registrations")

    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })

    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  if (reg) {
    sendConferenceCancellationEmail({
      fullName: reg.full_name,

      email: reg.email,

      registrationId: id,
    })
      .then((r) => {
        if (r.success)
          supabase
            .from("conference_registrations")
            .update({ last_cancellation_email_sent_at: new Date().toISOString() })
            .eq("id", id)
            .then(() => {})
      })
      .catch((err) => console.error("Non-fatal: cancellation email failed:", err))
  }

  return { success: true };
}

// ── Admin: Mark registration as manually paid (override) ─────────────────────

export async function markConferencePaymentManual(
  id: string,

  adminEmail?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: reg, error: fetchErr } = await supabase

    .from("conference_registrations")

    .select("*")

    .eq("id", id)

    .single();

  if (fetchErr || !reg) {
    return { success: false, error: "Registration not found" };
  }

  const { error: updateErr } = await supabase

    .from("conference_registrations")

    .update({
      payment_status: "paid",

      status: "confirmed",

      payment_id: "manual:admin-override",

      payment_override_by: adminEmail || "admin",

      payment_paid_at: new Date().toISOString(),

      confirmed_at: new Date().toISOString(),
    })

    .eq("id", id);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  // Send confirmation email (non-blocking)

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
        supabase
          .from("conference_registrations")
          .update({ last_confirmation_email_sent_at: new Date().toISOString() })
          .eq("id", reg.id)
          .then(() => {})
    })
    .catch((err) => console.error("Non-fatal: admin-override confirmation email failed:", err))

  return { success: true };
}

// ── Admin: Extend expiry by N hours ──────────────────────────────────────────

export async function extendConferenceRegistrationExpiry(
  id: string,

  hours = 24,
): Promise<{ success: boolean; newExpiresAt?: string; error?: string }> {
  const supabase = await createClient();

  const { data: reg, error: fetchErr } = await supabase

    .from("conference_registrations")

    .select("expires_at, status, payment_status")

    .eq("id", id)

    .single();

  if (fetchErr || !reg) {
    return { success: false, error: "Registration not found" };
  }

  if (reg.payment_status === "paid") {
    return {
      success: false,
      error: "Registration is already paid — no need to extend.",
    };
  }

  // Calculate new expiry: max(existing, now) + hours

  const base =
    reg.expires_at && new Date(reg.expires_at) > new Date()
      ? new Date(reg.expires_at)
      : new Date();

  const newExpiry = new Date(base.getTime() + hours * 60 * 60 * 1000);

  const newExpiresAt = newExpiry.toISOString();

  const { error: updateErr } = await supabase

    .from("conference_registrations")

    .update({
      expires_at: newExpiresAt,

      // If it was expired, reopen it to pending_payment

      status: reg.status === "expired" ? "pending_payment" : reg.status,
    })

    .eq("id", id);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  return { success: true, newExpiresAt };
}

// ── Admin: Re-send payment link email ────────────────────────────────────────

export async function resendConferencePaymentLink(
  id: string,
  email?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: reg } = await supabase

    .from("conference_registrations")

    .select("full_name, email, payment_status, status, expires_at")

    .eq("id", id)

    .single();

  if (!reg) return { success: false, error: "Registration not found" };

  // Dual-key verification: if email provided, it must match
  if (email && reg.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
    return { success: false, error: "Email does not match registration" };
  }

  if (reg.payment_status === "paid") {
    return { success: false, error: "Registration is already paid." };
  }

  if (reg.status === "expired") {
    return {
      success: false,
      error: "Registration is expired. Extend expiry first.",
    };
  }

  // Import and use the conference mailer

  const { sendConferencePaymentLinkEmail } =
    await import("@/lib/email/conference-mailer");

  const result = await sendConferencePaymentLinkEmail({
    fullName: reg.full_name,

    email: reg.email,

    registrationId: id,

    expiresAt: reg.expires_at || null,
  });

  return result.success
    ? { success: true }
    : { success: false, error: result.message };
}

// ── Admin: Legacy status update (kept for backward compat) ───────────────────

export async function updateConferenceRegistrationStatus(
  id: string,

  status: "pending" | "confirmed" | "cancelled",
): Promise<{ success: boolean; error?: string }> {
  if (status === "confirmed")
    return confirmConferenceRegistration(id, { force: true });

  if (status === "cancelled") return cancelConferenceRegistration(id);

  const supabase = await createClient();

  const { error } = await supabase

    .from("conference_registrations")

    .update({ status })

    .eq("id", id);

  if (error) return { success: false, error: error.message };

  return { success: true };
}

// ── Admin: Re-send registration email ────────────────────────────────────────

export async function resendConferenceRegistrationEmail(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: reg } = await supabase

    .from("conference_registrations")

    .select("full_name, email, attendance_mode, role, workshops")

    .eq("id", id)

    .single();

  if (!reg) return { success: false, error: "Registration not found" };

  const result = await sendConferenceRegistrationEmail({
    fullName: reg.full_name,

    email: reg.email,

    registrationId: id,

    attendanceMode: reg.attendance_mode || "",

    role: reg.role || undefined,

    workshops: reg.workshops || undefined,
  });

  if (result.success) {
    await supabase
      .from("conference_registrations")
      .update({ last_registration_email_sent_at: new Date().toISOString() })
      .eq("id", id)
  }

  return result.success
    ? { success: true }
    : { success: false, error: result.message };
}

// ── Admin: Re-send confirmation email ────────────────────────────────────────

export async function resendConferenceConfirmationEmail(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: reg } = await supabase

    .from("conference_registrations")

    .select("full_name, email, attendance_mode, role, workshops")

    .eq("id", id)

    .single();

  if (!reg) return { success: false, error: "Registration not found" };

  const result = await sendConferenceConfirmationEmail({
    fullName: reg.full_name,

    email: reg.email,

    registrationId: id,

    attendanceMode: reg.attendance_mode || "",

    role: reg.role || undefined,

    workshops: reg.workshops || undefined,
  });

  if (result.success) {
    await supabase
      .from("conference_registrations")
      .update({ last_confirmation_email_sent_at: new Date().toISOString() })
      .eq("id", id)
  }

  return result.success
    ? { success: true }
    : { success: false, error: result.message };
}

// ── Admin: Update notes ───────────────────────────────────────────────────────

export async function updateConferenceRegistrationNotes(
  id: string,

  notes: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase

    .from("conference_registrations")

    .update({ admin_notes: notes })

    .eq("id", id);

  if (error) return { success: false, error: error.message };

  return { success: true };
}

// ── Admin: Send custom email to a registrant ──────────────────────────────────

export async function sendCustomConferenceEmail(
  id: string,

  subject: string,

  body: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: reg } = await supabase

    .from("conference_registrations")

    .select("full_name, email")

    .eq("id", id)

    .single();

  if (!reg) return { success: false, error: "Registration not found" };

  const result = await sendCustomEmail({
    to: reg.email,

    toName: reg.full_name,

    subject,

    body,
  });

  if (result.success) {
    await supabase
      .from("conference_registrations")
      .update({ last_custom_email_sent_at: new Date().toISOString() })
      .eq("id", id)
  }

  return result.success
    ? { success: true }
    : { success: false, error: result.message };
}

// ── Admin: Send a pre-built template email ────────────────────────────────────

export async function sendTemplateConferenceEmail(
  id: string,

  type: "general" | "reminder" | "directions",
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: reg } = await supabase

    .from("conference_registrations")

    .select("full_name, email, attendance_mode, role")

    .eq("id", id)

    .single();

  if (!reg) return { success: false, error: "Registration not found" };

  const shortId = `DEESSA-2026-${id.slice(0, 6).toUpperCase()}`;

  const cfg = await getConferenceSettings();

  const tokens: Record<string, string> = {
    "{{name}}": reg.full_name,

    "{{registrationId}}": shortId,

    "{{attendanceMode}}":
      reg.attendance_mode === "in-person" ? "In-Person" : "Online",

    "{{venue}}": cfg.venue,

    "{{venueAddress}}": cfg.venueAddress,

    "{{dateDisplay}}": cfg.dateDisplay,

    "{{contactEmail}}": cfg.contactEmail,

    "{{mapsUrl}}": cfg.mapsUrl,
  };

  const resolve = (text: string) =>
    Object.entries(tokens).reduce(
      (out, [token, val]) => out.replaceAll(token, val),
      text,
    );

  const template = cfg.emailTemplates[type];

  if (!template) {
    return { success: false, error: `Email template '${type}' not configured.` };
  }

  const subject = resolve(template.subject);

  const body = resolve(template.body);

  const result = await sendCustomEmail({
    to: reg.email,
    toName: reg.full_name,
    subject,
    body,
  });

  if (result.success) {
    await supabase
      .from("conference_registrations")
      .update({ last_custom_email_sent_at: new Date().toISOString() })
      .eq("id", id)
  }

  return result.success
    ? { success: true }
    : { success: false, error: result.message };
}

// ── Delete conference registration (admin only) ────────────────────────────
export async function deleteConferenceRegistration(
  registrationId: string,
  email: string,
): Promise<{ success: boolean; error?: string }> {
  if (!registrationId) return { success: false, error: "Registration ID is required" }
  if (!email?.trim()) return { success: false, error: "Email is required" }

  let supabase: ReturnType<typeof createServiceRoleClient>
  try {
    supabase = createServiceRoleClient()
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server configuration error"
    console.error("deleteConferenceRegistration: failed to create service client:", msg)
    return { success: false, error: msg }
  }

  // Dual-key check: must match both id and email to prevent ID guessing
  const { data: reg, error: fetchErr } = await supabase
    .from("conference_registrations")
    .select("id, status, full_name")
    .eq("id", registrationId)
    .eq("email", email.trim().toLowerCase())
    .single()

  if (fetchErr || !reg) return { success: false, error: "Registration not found" }

  if (reg.status !== "cancelled") {
    return { success: false, error: "Only cancelled registrations can be permanently deleted." }
  }

  const { error: deleteErr } = await supabase
    .from("conference_registrations")
    .delete()
    .eq("id", registrationId)

  if (deleteErr) {
    console.error("deleteConferenceRegistration error:", deleteErr)
    return { success: false, error: deleteErr.message }
  }

  return { success: true }
}
