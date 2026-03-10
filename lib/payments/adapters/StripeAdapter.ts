/**
 * Payment Architecture V2 - Stripe Provider Adapter
 * 
 * This adapter handles Stripe-specific payment verification and normalization.
 * It supports both one-time payments (checkout sessions) and subscription payments.
 * 
 * Key Features:
 * - Webhook signature verification using Stripe SDK
 * - Support for both checkout.session.completed and invoice.payment_succeeded events
 * - Amount conversion from minor units (cents) to major units (dollars)
 * - Mock mode support for development (signature verification bypassed)
 * - Comprehensive error handling with typed errors
 */

import Stripe from 'stripe'
import {
  BaseProviderAdapter,
  VerificationContext,
} from './ProviderAdapter'
import {
  VerificationResult,
  PaymentMetadata,
  NormalizedPayment,
  PaymentProvider,
  ProviderPaymentStatus,
} from '../core/types'
import {
  VerificationError,
  ConfigurationError,
} from '../core/errors'

/**
 * Stripe-specific configuration
 */
interface StripeConfig {
  secretKey: string
  webhookSecret?: string
  apiVersion: Stripe.LatestApiVersion
}

/**
 * Stripe Provider Adapter
 * 
 * Handles verification and normalization of Stripe webhook events.
 * Supports checkout sessions and subscription invoices.
 */
export class StripeAdapter extends BaseProviderAdapter {
  readonly provider: PaymentProvider = 'stripe'
  private stripe: Stripe
  private config: StripeConfig

  constructor(config?: Partial<StripeConfig>) {
    super()

    // Load configuration from environment or provided config
    const secretKey = config?.secretKey || process.env.STRIPE_SECRET_KEY
    const webhookSecret = config?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET

    if (!secretKey) {
      throw ConfigurationError.missingCredentials('stripe', 'STRIPE_SECRET_KEY')
    }

    this.config = {
      secretKey,
      webhookSecret,
      apiVersion: '2024-06-20',
    }

    // Initialize Stripe SDK
    this.stripe = new Stripe(this.config.secretKey, {
      apiVersion: this.config.apiVersion,
    })
  }

  /**
   * Verify Stripe webhook event
   * 
   * Performs signature verification and extracts payment data from the event.
   * Supports both checkout.session.completed and invoice.payment_succeeded events.
   * 
   * @param payload - Raw webhook event body (string or parsed object)
   * @param context - Verification context with headers and mode
   * @returns VerificationResult with normalized payment data
   * @throws VerificationError if verification fails
   */
  async verify(
    payload: unknown,
    context?: VerificationContext
  ): Promise<VerificationResult> {
    try {
      // Construct and verify the Stripe event
      const event = await this.constructEvent(payload, context)

      // Extract payment data based on event type
      return this.verifyEvent(event)
    } catch (error) {
      if (error instanceof VerificationError) {
        throw error
      }

      // Wrap unexpected errors
      throw VerificationError.providerAPIError(
        'stripe',
        error instanceof Error ? error.message : 'Unknown error',
        false
      )
    }
  }

  /**
   * Construct and verify Stripe event from webhook payload
   * 
   * In live mode: Verifies webhook signature using Stripe SDK
   * In mock mode: Parses JSON without signature verification (development only)
   * 
   * @param payload - Raw webhook body
   * @param context - Verification context
   * @returns Verified Stripe event
   * @throws VerificationError if signature verification fails
   */
  private async constructEvent(
    payload: unknown,
    context?: VerificationContext
  ): Promise<Stripe.Event> {
    const mode = context?.mode || this.getPaymentMode()

    // In mock mode, skip signature verification (development only)
    if (mode === 'mock') {
      console.warn('StripeAdapter: Running in mock mode - signature verification bypassed')
      
      // Parse payload as JSON
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
      try {
        return JSON.parse(body) as Stripe.Event
      } catch (error) {
        throw VerificationError.invalidPayload(
          'stripe',
          'Failed to parse webhook payload as JSON'
        )
      }
    }

    // Live mode: Require signature verification
    if (!this.config.webhookSecret) {
      throw ConfigurationError.missingCredentials('stripe', 'STRIPE_WEBHOOK_SECRET')
    }

    // Extract signature from headers
    const signature = this.extractSignature(context?.headers)
    if (!signature) {
      throw VerificationError.signatureVerificationFailed(
        'stripe',
        'Missing Stripe-Signature header'
      )
    }

    // Get raw body for signature verification
    const rawBody = context?.rawBody || (typeof payload === 'string' ? payload : JSON.stringify(payload))

    // Verify signature using Stripe SDK
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.config.webhookSecret
      )
    } catch (error) {
      throw VerificationError.signatureVerificationFailed(
        'stripe',
        error instanceof Error ? error.message : 'Signature verification failed'
      )
    }
  }

  /**
   * Verify Stripe event and extract payment data
   * 
   * Handles different event types:
   * - checkout.session.completed: One-time payments
   * - invoice.payment_succeeded: Subscription payments
   * 
   * @param event - Verified Stripe event
   * @returns VerificationResult with payment data
   * @throws VerificationError if event type is unsupported or data is invalid
   */
  private async verifyEvent(event: Stripe.Event): Promise<VerificationResult> {
    switch (event.type) {
      case 'checkout.session.completed':
        return this.verifyCheckoutSession(event)
      
      case 'invoice.payment_succeeded':
        return this.verifyInvoicePayment(event)
      
      default:
        throw VerificationError.invalidPayload(
          'stripe',
          `Unsupported event type: ${event.type}`
        )
    }
  }

  /**
   * Verify checkout session completed event
   * 
   * Extracts donation ID from client_reference_id or metadata.
   * Validates payment status and amount.
   * 
   * @param event - Stripe checkout.session.completed event
   * @returns VerificationResult with payment data
   */
  private async verifyCheckoutSession(event: Stripe.Event): Promise<VerificationResult> {
    const session = event.data.object as Stripe.Checkout.Session

    // Extract donation ID from client_reference_id or metadata
    const donationId = session.client_reference_id || session.metadata?.donation_id
    if (!donationId) {
      throw VerificationError.invalidPayload(
        'stripe',
        'Missing donation ID in session (client_reference_id or metadata.donation_id)'
      )
    }

    // Validate payment status
    const paymentStatus = this.mapStripePaymentStatus(session.payment_status)
    
    // Extract amount and currency
    const amount = session.amount_total ? this.convertToMajorUnits(session.amount_total) : 0
    const currency = (session.currency || 'usd').toUpperCase()

    // Extract transaction ID (session ID or subscription ID)
    const transactionId = session.subscription && typeof session.subscription === 'string'
      ? session.subscription
      : session.id

    // Build metadata
    const metadata: Record<string, unknown> = {
      sessionId: session.id,
      subscriptionId: session.subscription || null,
      customerId: session.customer || null,
      mode: session.mode,
      paymentStatus: session.payment_status,
      eventId: event.id,
    }

    return {
      success: paymentStatus === 'paid',
      donationId,
      transactionId,
      amount,
      currency,
      status: paymentStatus,
      metadata,
    }
  }

  /**
   * Verify invoice payment succeeded event
   * 
   * Handles subscription payment confirmations.
   * Extracts donation ID from subscription metadata.
   * 
   * @param event - Stripe invoice.payment_succeeded event
   * @returns VerificationResult with payment data
   */
  private async verifyInvoicePayment(event: Stripe.Event): Promise<VerificationResult> {
    const invoice = event.data.object as Stripe.Invoice

    // For subscription invoices, we need to fetch the subscription to get metadata
    if (!invoice.subscription || typeof invoice.subscription !== 'string') {
      throw VerificationError.invalidPayload(
        'stripe',
        'Invoice is not associated with a subscription'
      )
    }

    // Fetch subscription to get donation ID from metadata
    let subscription: Stripe.Subscription
    try {
      subscription = await this.stripe.subscriptions.retrieve(invoice.subscription)
    } catch (error) {
      throw VerificationError.providerAPIError(
        'stripe',
        `Failed to retrieve subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      )
    }

    const donationId = subscription.metadata?.donation_id
    if (!donationId) {
      throw VerificationError.invalidPayload(
        'stripe',
        'Missing donation ID in subscription metadata'
      )
    }

    // Extract amount and currency from invoice
    const amount = invoice.amount_paid ? this.convertToMajorUnits(invoice.amount_paid) : 0
    const currency = (invoice.currency || 'usd').toUpperCase()

    // Build metadata
    const metadata: Record<string, unknown> = {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      customerId: invoice.customer || null,
      invoiceStatus: invoice.status,
      eventId: event.id,
    }

    return {
      success: invoice.status === 'paid',
      donationId,
      transactionId: invoice.subscription,
      amount,
      currency,
      status: invoice.status === 'paid' ? 'paid' : 'failed',
      metadata,
    }
  }

  /**
   * Process an already-verified Stripe event without re-verifying the signature.
   *
   * Use this method when the webhook signature has already been verified by the
   * outer request handler (e.g. the Next.js POST route) and you only need to
   * extract the VerificationResult from the parsed event object.  Calling
   * `verify()` in that context would fail because the raw body and
   * Stripe-Signature header are no longer available.
   *
   * @param event - A pre-verified Stripe.Event object
   * @returns VerificationResult with normalized payment data
   * @throws VerificationError if the event type is unsupported or data is invalid
   */
  async processVerifiedEvent(event: Stripe.Event): Promise<VerificationResult> {
    try {
      return await this.verifyEvent(event)
    } catch (error) {
      if (error instanceof VerificationError) {
        throw error
      }
      throw VerificationError.providerAPIError(
        'stripe',
        error instanceof Error ? error.message : 'Unknown error',
        false
      )
    }
  }

  /**
   * Extract metadata from Stripe webhook payload
   * 
   * @param payload - Stripe event object
   * @returns PaymentMetadata with extracted information
   */
  extractMetadata(payload: unknown): PaymentMetadata {
    const event = payload as Stripe.Event

    let transactionId = ''
    let donationId = ''

    // Extract transaction ID based on event type
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      transactionId = session.id
      donationId = session.client_reference_id || session.metadata?.donation_id || ''
    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      transactionId = invoice.id
      // Note: donation ID would need to be fetched from subscription metadata
    }

    return {
      provider: 'stripe',
      transactionId,
      eventId: event.id,
      timestamp: new Date(event.created * 1000),
      rawPayload: payload,
    }
  }

  /**
   * Normalize Stripe payload to common format
   * 
   * @param payload - Stripe event object
   * @returns NormalizedPayment with standardized structure
   */
  normalizePayload(payload: unknown): NormalizedPayment {
    const event = payload as Stripe.Event

    if (event.type === 'checkout.session.completed') {
      return this.normalizeCheckoutSession(event)
    } else if (event.type === 'invoice.payment_succeeded') {
      return this.normalizeInvoicePayment(event)
    }

    throw VerificationError.invalidPayload(
      'stripe',
      `Cannot normalize unsupported event type: ${event.type}`
    )
  }

  /**
   * Normalize checkout session to common format
   */
  private normalizeCheckoutSession(event: Stripe.Event): NormalizedPayment {
    const session = event.data.object as Stripe.Checkout.Session

    const donationId = session.client_reference_id || session.metadata?.donation_id || ''
    const amount = session.amount_total ? this.convertToMajorUnits(session.amount_total) : 0
    const currency = (session.currency || 'usd').toUpperCase()
    const status = this.mapStripePaymentStatus(session.payment_status)
    const transactionId = session.subscription && typeof session.subscription === 'string'
      ? session.subscription
      : session.id

    return {
      donationId,
      amount,
      currency,
      status,
      transactionId,
      eventId: event.id,
      metadata: {
        sessionId: session.id,
        subscriptionId: session.subscription || null,
        mode: session.mode,
      },
    }
  }

  /**
   * Normalize invoice payment to common format
   */
  private normalizeInvoicePayment(event: Stripe.Event): NormalizedPayment {
    const invoice = event.data.object as Stripe.Invoice

    const amount = invoice.amount_paid ? this.convertToMajorUnits(invoice.amount_paid) : 0
    const currency = (invoice.currency || 'usd').toUpperCase()
    const status = invoice.status === 'paid' ? 'paid' : 'failed'
    const transactionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.id

    return {
      donationId: '', // Will be populated from subscription metadata
      amount,
      currency,
      status,
      transactionId,
      eventId: event.id,
      metadata: {
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription || null,
        invoiceStatus: invoice.status,
      },
    }
  }

  /**
   * Map Stripe payment status to common status enum
   */
  private mapStripePaymentStatus(
    stripeStatus: string | null | undefined
  ): ProviderPaymentStatus {
    switch (stripeStatus) {
      case 'paid':
        return 'paid'
      case 'unpaid':
      case 'no_payment_required':
        return 'pending'
      default:
        return 'failed'
    }
  }

  /**
   * Extract Stripe-Signature header from request headers
   */
  private extractSignature(
    headers?: Record<string, string | string[] | undefined>
  ): string | null {
    if (!headers) return null

    const signature = headers['stripe-signature'] || headers['Stripe-Signature']
    
    if (Array.isArray(signature)) {
      return signature[0] || null
    }

    return signature || null
  }

  /**
   * Lookup transaction status for reconciliation
   * 
   * Retrieves the current status of a Stripe checkout session or subscription.
   * Used by the reconciliation system to check stuck donations.
   * 
   * @param sessionId - Stripe session ID or subscription ID
   * @param donationId - Donation ID for error reporting
   * @returns VerificationResult with current transaction status
   * @throws VerificationError if lookup fails
   */
  async lookupTransaction(
    sessionId: string,
    donationId: string
  ): Promise<VerificationResult> {
    try {
      // Try to retrieve as checkout session first
      let session: Stripe.Checkout.Session
      try {
        session = await this.stripe.checkout.sessions.retrieve(sessionId)
      } catch (error: any) {
        // If not found as session, try as subscription
        if (error.code === 'resource_missing') {
          return this.lookupSubscription(sessionId, donationId)
        }
        throw error
      }

      // Extract payment data from session
      const paymentStatus = this.mapStripePaymentStatus(session.payment_status)
      const amount = session.amount_total ? this.convertToMajorUnits(session.amount_total) : 0
      const currency = (session.currency || 'usd').toUpperCase()

      const transactionId = session.subscription && typeof session.subscription === 'string'
        ? session.subscription
        : session.id

      return {
        success: paymentStatus === 'paid',
        donationId,
        transactionId,
        amount,
        currency,
        status: paymentStatus,
        metadata: {
          sessionId: session.id,
          subscriptionId: session.subscription || null,
          mode: session.mode,
          paymentStatus: session.payment_status,
          lookupType: 'session',
        },
      }
    } catch (error) {
      throw VerificationError.providerAPIError(
        'stripe',
        `Failed to lookup transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      )
    }
  }

  /**
   * Lookup subscription status for reconciliation
   * 
   * @param subscriptionId - Stripe subscription ID
   * @param donationId - Donation ID for error reporting
   * @returns VerificationResult with current subscription status
   */
  private async lookupSubscription(
    subscriptionId: string,
    donationId: string
  ): Promise<VerificationResult> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)

      // Get the latest invoice to determine payment status
      let amount = 0
      let currency = 'USD'
      let paymentStatus: ProviderPaymentStatus = 'pending'

      if (subscription.latest_invoice) {
        const invoiceId = typeof subscription.latest_invoice === 'string'
          ? subscription.latest_invoice
          : subscription.latest_invoice.id

        const invoice = await this.stripe.invoices.retrieve(invoiceId)
        amount = invoice.amount_paid ? this.convertToMajorUnits(invoice.amount_paid) : 0
        currency = (invoice.currency || 'usd').toUpperCase()
        paymentStatus = invoice.status === 'paid' ? 'paid' : 'failed'
      }

      return {
        success: subscription.status === 'active' && paymentStatus === 'paid',
        donationId,
        transactionId: subscriptionId,
        amount,
        currency,
        status: paymentStatus,
        metadata: {
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          lookupType: 'subscription',
        },
      }
    } catch (error) {
      throw VerificationError.providerAPIError(
        'stripe',
        `Failed to lookup subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      )
    }
  }

  /**
   * Get payment mode from environment
   */
  private getPaymentMode(): 'live' | 'mock' {
    const mode = process.env.PAYMENT_MODE
    
    // Guardrail: never allow mock mode in production
    if (process.env.NODE_ENV === 'production' && mode !== 'live') {
      throw new Error(
        'PAYMENT_MODE must be "live" in production. Refusing to run with mock mode.'
      )
    }

    return mode === 'live' ? 'live' : 'mock'
  }
}

/**
 * Factory function to create StripeAdapter instance
 * 
 * @param config - Optional Stripe configuration
 * @returns StripeAdapter instance
 */
export function createStripeAdapter(config?: Partial<StripeConfig>): StripeAdapter {
  return new StripeAdapter(config)
}
