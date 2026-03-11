/**
 * Activity Timeline Data Aggregator
 * Combines data from multiple sources into a unified chronological timeline
 */

export type TimelineEventType =
  | "system"
  | "admin"
  | "webhook"
  | "status_change"
  | "note_added"
  | "receipt"
  | "email"

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  actor: string // Admin name or "System"
  timestamp: string
  description: string
  metadata?: Record<string, any>
}

export interface Donation {
  id: string
  created_at: string
  confirmed_at?: string | null
  receipt_generated_at?: string | null
  receipt_sent_at?: string | null
  receipt_number?: string | null
  amount: number
  currency: string
  provider: string
  donor_email: string
}

export interface ReviewNote {
  id: string
  note_text: string
  created_at: string
  admin_users: {
    full_name: string
    email: string
  }
}

export interface StatusChange {
  id: string
  old_status: string
  new_status: string
  reason: string
  created_at: string
  admin_users: {
    full_name: string
  }
}

export interface PaymentEvent {
  id: string
  provider: string
  event_type: string
  created_at: string
  raw_payload?: any
}

export interface TimelineData {
  donation: Donation
  reviewNotes: ReviewNote[]
  statusChanges: StatusChange[]
  paymentEvents: PaymentEvent[]
}

/**
 * Build a unified activity timeline from multiple data sources
 * Returns events sorted chronologically (newest first)
 */
export function buildActivityTimeline(data: TimelineData): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // Add donation creation event
  events.push({
    id: `created-${data.donation.id}`,
    type: "system",
    actor: "System",
    timestamp: data.donation.created_at,
    description: "Donation created",
    metadata: {
      amount: data.donation.amount,
      currency: data.donation.currency,
      provider: data.donation.provider,
    },
  })

  // Add payment events (webhooks)
  data.paymentEvents.forEach((event) => {
    events.push({
      id: event.id,
      type: "webhook",
      actor: event.provider.charAt(0).toUpperCase() + event.provider.slice(1),
      timestamp: event.created_at,
      description: `${event.provider} webhook: ${event.event_type}`,
      metadata: event.raw_payload,
    })
  })

  // Add status changes
  data.statusChanges.forEach((change) => {
    events.push({
      id: change.id,
      type: "status_change",
      actor: change.admin_users.full_name,
      timestamp: change.created_at,
      description: `Changed status from ${change.old_status} to ${change.new_status}`,
      metadata: {
        reason: change.reason,
        oldStatus: change.old_status,
        newStatus: change.new_status,
      },
    })
  })

  // Add review notes
  data.reviewNotes.forEach((note) => {
    events.push({
      id: note.id,
      type: "note_added",
      actor: note.admin_users.full_name,
      timestamp: note.created_at,
      description: "Added review note",
      metadata: {
        notePreview: note.note_text.substring(0, 100) + (note.note_text.length > 100 ? "..." : ""),
        fullNote: note.note_text,
      },
    })
  })

  // Add receipt generation event
  if (data.donation.receipt_generated_at) {
    events.push({
      id: `receipt-${data.donation.id}`,
      type: "receipt",
      actor: "System",
      timestamp: data.donation.receipt_generated_at,
      description: `Receipt generated: ${data.donation.receipt_number}`,
      metadata: {
        receiptNumber: data.donation.receipt_number,
      },
    })
  }

  // Add receipt email sent event
  if (data.donation.receipt_sent_at) {
    events.push({
      id: `email-${data.donation.id}`,
      type: "email",
      actor: "System",
      timestamp: data.donation.receipt_sent_at,
      description: "Receipt email sent",
      metadata: {
        recipient: data.donation.donor_email,
      },
    })
  }

  // Add payment confirmation event
  if (data.donation.confirmed_at) {
    events.push({
      id: `confirmed-${data.donation.id}`,
      type: "system",
      actor: "System",
      timestamp: data.donation.confirmed_at,
      description: "Payment confirmed",
      metadata: {
        amount: data.donation.amount,
        currency: data.donation.currency,
      },
    })
  }

  // Sort by timestamp (newest first)
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

/**
 * Filter timeline events by type
 */
export function filterTimelineByType(
  events: TimelineEvent[],
  filter: "all" | "system" | "admin" | "webhooks"
): TimelineEvent[] {
  if (filter === "all") {
    return events
  }

  if (filter === "system") {
    return events.filter((e) => e.type === "system" || e.type === "receipt" || e.type === "email")
  }

  if (filter === "admin") {
    return events.filter((e) => e.type === "admin" || e.type === "status_change" || e.type === "note_added")
  }

  if (filter === "webhooks") {
    return events.filter((e) => e.type === "webhook")
  }

  return events
}
