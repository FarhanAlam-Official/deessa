# PaymentService - Core Payment Confirmation Engine

## Overview

The `PaymentService` is the **single source of truth** for all payment state transitions in the Payment Architecture V2. It implements centralized payment confirmation logic with transactional integrity, idempotency, and fail-closed verification.

## Key Features

- ✅ **Transactional Integrity**: All state changes occur within database transactions
- ✅ **Row-Level Locking**: Prevents race conditions with `SELECT FOR UPDATE`
- ✅ **Idempotency**: Duplicate webhook events are safely ignored
- ✅ **Fail-Closed Verification**: Amount/currency mismatches trigger manual review
- ✅ **State Machine Enforcement**: Invalid state transitions are prevented
- ✅ **Comprehensive Error Handling**: Structured error responses with rollback

## Architecture Principles

1. **Single Source of Truth** — Only PaymentService may transition donation states
2. **Fail-Closed Security** — Uncertain verification results in REVIEW, never SUCCESS
3. **Idempotent by Default** — All payment events can be safely replayed
4. **Transaction-First Design** — All state changes occur within database transactions

## Usage

### Basic Confirmation

```typescript
import { getPaymentService } from '@/lib/payments/core'
import type { ConfirmDonationInput } from '@/lib/payments/core'

const paymentService = getPaymentService()

const input: ConfirmDonationInput = {
  donationId: 'uuid-here',
  provider: 'stripe',
  verificationResult: {
    success: true,
    donationId: 'uuid-here',
    transactionId: 'pi_1234567890',
    amount: 100.00,
    currency: 'USD',
    status: 'paid',
    metadata: {},
  },
  eventId: 'evt_1234567890', // For idempotency
}

const result = await paymentService.confirmDonation(input)

if (result.success) {
  console.log(`Payment ${result.status}`) // 'confirmed', 'review', or 'failed'
} else {
  console.error(`Error: ${result.error}`)
}
```

### Handling Different Outcomes

#### Successful Confirmation

```typescript
const result = await paymentService.confirmDonation(input)

if (result.status === 'confirmed') {
  // Payment verified and confirmed
  // Receipt generation will be triggered automatically
  console.log('Payment confirmed!')
}
```

#### Amount Mismatch (Review Required)

```typescript
const result = await paymentService.confirmDonation(input)

if (result.status === 'review') {
  // Payment requires manual review
  console.log(`Review reason: ${result.metadata?.reviewReason}`)
  console.log('Expected:', result.metadata?.mismatchDetails?.expectedAmount)
  console.log('Actual:', result.metadata?.mismatchDetails?.actualAmount)
  // Admin will be notified automatically
}
```

#### Failed Payment

```typescript
const result = await paymentService.confirmDonation(input)

if (result.status === 'failed') {
  // Payment verification failed
  console.log('Payment failed')
}
```

#### Idempotent Replay

```typescript
const result = await paymentService.confirmDonation(input)

if (result.status === 'already_processed') {
  // This event was already processed (duplicate webhook)
  console.log('Event already processed - ignoring')
}
```

## State Machine

### Valid States

- `initiated` - Donation record created, payment not yet started
- `pending` - Payment initiated with provider, awaiting confirmation
- `confirmed` - Payment verified and confirmed
- `review` - Payment requires manual review (amount mismatch, etc.)
- `failed` - Payment verification failed
- `refunded` - Payment was refunded (admin action)

### Valid Transitions

| From      | To        | Trigger                    |
|-----------|-----------|----------------------------|
| PENDING   | CONFIRMED | Verification succeeds      |
| PENDING   | REVIEW    | Amount/currency mismatch   |
| PENDING   | FAILED    | Verification fails         |

### Invalid Transitions (Prevented)

- CONFIRMED → PENDING (cannot un-confirm)
- CONFIRMED → FAILED (cannot fail after confirmation)
- FAILED → CONFIRMED (cannot confirm after failure)

## Error Handling

The service throws structured errors that can be caught and handled:

```typescript
import { PaymentError, StateTransitionError, TransactionError } from '@/lib/payments/core'

try {
  const result = await paymentService.confirmDonation(input)
} catch (error) {
  if (error instanceof StateTransitionError) {
    console.error('Invalid state transition:', error.currentStatus, '→', error.attemptedStatus)
  } else if (error instanceof TransactionError) {
    console.error('Transaction failed:', error.message)
    if (error.isRetryable) {
      // Retry logic here
    }
  } else if (error instanceof PaymentError) {
    console.error('Payment error:', error.code, error.message)
  }
}
```

## Implementation Details

### Verification Logic

1. **Row Locking**: Donation row is locked with `SELECT FOR UPDATE`
2. **State Validation**: Current state must be `PENDING`
3. **Idempotency Check**: Query `payment_events` for duplicate `event_id`
4. **Amount Verification**: Compare expected vs actual (in minor units)
5. **Currency Verification**: Compare expected vs actual (case-insensitive)
6. **Conditional Update**: `WHERE payment_status = 'pending'` prevents race conditions
7. **Payment Record**: Insert into `payments` table
8. **Event Record**: Insert into `payment_events` for idempotency

### Race Condition Prevention

The service uses conditional updates to prevent race conditions:

```sql
UPDATE donations
SET payment_status = 'confirmed', ...
WHERE id = $1 AND payment_status = 'pending'
```

If the update affects 0 rows, it means another process already updated the donation (race condition detected).

### Idempotency Guarantee

The service checks `payment_events` table before processing:

```sql
SELECT id FROM payment_events
WHERE provider = $1 AND event_id = $2
```

If a record exists, the event has already been processed and is safely ignored.

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **Requirement 2.1**: Single source of truth for payment confirmation
- **Requirement 2.2**: Centralized PaymentService component
- **Requirement 2.4**: Row-level locking with SELECT FOR UPDATE
- **Requirement 4.1**: Idempotency checking via payment_events
- **Requirement 4.2**: Duplicate event detection
- **Requirement 4.3**: Event record insertion within transaction
- **Requirement 5.1**: Atomic database transactions
- **Requirement 5.2**: Row locking during confirmation
- **Requirement 5.4**: Conditional updates with WHERE clause
- **Requirement 7.2**: Valid state transitions (PENDING → CONFIRMED/REVIEW/FAILED)
- **Requirement 7.3**: Invalid transition prevention
- **Requirement 7.5**: State machine enforcement
- **Requirement 8.2**: Amount verification
- **Requirement 8.3**: Currency verification
- **Requirement 13.1**: Conditional update for race prevention
- **Requirement 13.2**: Race condition detection

## Next Steps

This implementation is part of Phase 1 of the Payment Architecture V2 rollout. Next phases will add:

- **Phase 2**: Provider adapters (Stripe, Khalti, eSewa)
- **Phase 3**: Webhook integration
- **Phase 4**: Async job system for receipt generation
- **Phase 5**: Security hardening
- **Phase 6**: Status endpoints and admin UI

## Testing

Unit tests for this service will be implemented in Phase 9 (Testing & Validation). See `PaymentService.example.ts` for usage examples.

## Support

For questions or issues, refer to:
- Design document: `.kiro/specs/payment-architecture-v2/design.md`
- Requirements: `.kiro/specs/payment-architecture-v2/requirements.md`
- Tasks: `.kiro/specs/payment-architecture-v2/tasks.md`
