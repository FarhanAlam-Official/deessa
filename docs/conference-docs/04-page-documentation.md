# DEESSA Foundation — Conference Module: Page Documentation

> **Version:** 1.0.0  
> **Last Updated:** February 28, 2026  
> **Audience:** Frontend Developers, UI/UX Designers

---

## Table of Contents

1. [Public Pages Overview](#1-public-pages-overview)
2. [Page: Conference Landing](#2-page-conference-landing)
3. [Page: Registration Form](#3-page-registration-form)
4. [Page: Payment Options](#4-page-payment-options)
5. [Page: Pending Payment](#5-page-pending-payment)
6. [Page: Payment Success](#6-page-payment-success)
7. [Page: Registration Success](#7-page-registration-success)
8. [Page: Payment Failure](#8-page-payment-failure)
9. [Admin Pages](#9-admin-pages)
10. [Component Hierarchy](#10-component-hierarchy)

---

## 1. Public Pages Overview

| Page | Route | Rendering | Auth Required | Purpose |
|---|---|---|---|---|
| **Conference Landing** | `/conference` | SSR | No | Marketing page showcasing event |
| **Registration Form** | `/conference/register` | CSR | No | 4-step registration wizard |
| **Payment Options** | `/conference/register/payment-options` | CSR | No | Pay Now vs Pay Later choice |
| **Pending Payment** | `/conference/register/pending-payment` | CSR | No | Provider selection & payment init |
| **Payment Success** | `/conference/register/payment-success` | CSR | No | Post-payment verification & status |
| **Registration Success** | `/conference/register/success` | CSR | No | Free registration confirmation |
| **Payment Failure** | `/conference/register/failure` | CSR | No | Payment declined fallback |

---

## 2. Page: Conference Landing

### 2.1 Basic Information

**File**: `app/(public)/conference/page.tsx`  
**Rendering**: Server-Side Rendering (SSR)  
**Authentication**: None required  
**Purpose**: Public marketing page for the conference

### 2.2 Data Fetching

```typescript
import { getConferenceSettings } from '@/lib/actions/conference-settings'

export default async function ConferencePage() {
  const settings = await getConferenceSettings()
  
  return (
    // Render page with settings
  )
}
```

**Server Action Called**: `getConferenceSettings()`  
**Cache Strategy**: No caching (fresh data on every request)  
**Performance**: ~50-100ms (includes DB query)

### 2.3 Page Structure

```
ConferencePage (Server Component)
├─ Hero Section
│  ├─ Conference name (from settings.conferenceName)
│  ├─ Date display (from settings.dateDisplay)
│  ├─ Venue (from settings.venue)
│  └─ CTA button → /conference/register
│
├─ Why Attend Section
│  ├─ Networking card
│  ├─ Learning card
│  ├─ Innovation card
│  └─ Community card
│
├─ Agenda Section
│  └─ Timeline component
│     └─ Map over settings.agenda[]
│        └─ Time + Title + Description (only if active: true)
│
├─ Venue Section
│  ├─ Address (from settings.address)
│  ├─ Google Maps iframe (from settings.mapsUrl)
│  └─ Directions link
│
└─ CTA Banner
   ├─ Registration deadline (from settings.registrationDeadline)
   └─ Register button → /conference/register
```

### 2.4 Key Features

- **Dynamic Content**: All text pulled from database (no hardcoded strings)
- **SEO Optimized**: Server-rendered with proper meta tags
- **Responsive**: Mobile-first design with Tailwind breakpoints
- **Accessible**: Semantic HTML, ARIA labels, keyboard navigation

### 2.5 Environment Variables Used

None directly (settings fetched from database)

---

## 3. Page: Registration Form

### 3.1 Basic Information

**File**: `app/(public)/conference/register/page.tsx`  
**Rendering**: Client-Side Rendering (CSR)  
**Authentication**: None required  
**Purpose**: Multi-step wizard to collect attendee information

### 3.2 Component Architecture

```typescript
// Page wrapper (minimal)
export default function RegisterPage() {
  return <ConferenceRegistrationForm />
}

// Main form component (client)
'use client'
export function ConferenceRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<RegistrationFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Step navigation logic
  // Form submission logic
}
```

### 3.3 Form Steps

#### Step 1: Personal Details

**Component**: `Step1PersonalDetails`  
**Fields**:

- Full name (required, text)
- Email (required, email validation)
- Phone (required, with country code)
- Organization (optional, text)

**Validation**:

```typescript
const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  organization: z.string().optional()
})
```

#### Step 2: Participation

**Component**: `Step2Participation`  
**Fields**:

- Role (required, radio: attendee/speaker/panelist/volunteer/sponsor)
- Attendance mode (required, radio: in-person/online)
- Workshops (optional, multi-select checkboxes)

**Dynamic Workshop List**: Fetched from `settings.agenda` (filtered by active workshops)

#### Step 3: Additional Info

**Component**: `Step3AdditionalInfo`  
**Fields**:

- Dietary preference (optional, text)
- T-shirt size (optional, dropdown: XS/S/M/L/XL/XXL)
- How did you hear about us? (optional, multi-select)
- Emergency contact name (optional, text)
- Emergency contact phone (optional, text)

#### Step 4: Review & Submit

**Component**: `Step4Review`  
**Features**:

- Read-only summary of all entered data
- Edit buttons to go back to specific steps
- Terms & conditions checkbox (required)
- Newsletter opt-in checkbox (optional)

**Submission Logic**:

```typescript
const handleSubmit = async () => {
  setIsSubmitting(true)
  
  const result = await registerForConference(formData)
  
  if (result.success) {
    if (result.paymentRequired) {
      // Redirect to payment options with query params
      router.push(`/conference/register/payment-options?rid=${result.registrationId}&email=${formData.email}&amount=${result.paymentAmount}&currency=${result.paymentCurrency}`)
    } else {
      // Free registration - go to success page
      router.push('/conference/register/success')
    }
  } else {
    // Show error toast
  }
}
```

### 3.4 UI Components Used

| Component | Library | Purpose |
|---|---|---|
| `Input` | Shadcn/ui | Text inputs |
| `Label` | Shadcn/ui | Form labels |
| `RadioGroup` | Shadcn/ui | Radio button groups |
| `Checkbox` | Shadcn/ui | Checkboxes |
| `Select` | Shadcn/ui | Dropdown selects |
| `Button` | Shadcn/ui | Action buttons |
| `Card` | Shadcn/ui | Content containers |
| `useToast` | Shadcn/ui | Error notifications |

### 3.5 State Management

**Local State** (useState):

- `currentStep`: number (1-4)
- `formData`: Partial<RegistrationFormData>
- `isSubmitting`: boolean
- `errors`: Record<string, string>

**No Global State Needed**: Form state is self-contained and not shared across pages.

### 3.6 Progress Indicator

**Component**: `StepProgressBar`

```tsx
<StepProgressBar currentStep={currentStep} />

// Renders:
// 1 ─────● 2 ───── 3 ───── 4     (on step 2)
```

---

## 4. Page: Payment Options

### 4.1 Basic Information

**File**: `app/(public)/conference/register/payment-options/page.tsx`  
**Rendering**: Client-Side Rendering  
**Authentication**: None  
**Purpose**: Let user decide between immediate payment or deferred payment

### 4.2 URL Parameters

| Param | Required | Type | Description |
|---|---|---|---|
| `rid` | Yes | uuid | Registration ID |
| `email` | Yes | string | Registrant email |
| `amount` | Yes | number | Payment amount |
| `currency` | Yes | string | Currency code (NPR/USD) |
| `name` | Yes | string | Registrant name |
| `expiryHours` | Yes | number | Hours until expiry |

**Example**:

```
/conference/register/payment-options?rid=abc-123&email=user@example.com&amount=2500&currency=NPR&name=John%20Doe&expiryHours=24
```

### 4.3 Page Layout

```
PaymentOptionsPage
├─ Header
│  ├─ Success checkmark icon
│  └─ "Registration Received!" heading
│
├─ Info Card
│  ├─ Name
│  ├─ Email
│  ├─ Amount to pay (formatted with currency)
│  └─ Expiry warning (e.g., "Complete payment within 24 hours")
│
├─ Option 1: Pay Now (Primary Button)
│  └─ Link to /conference/register/pending-payment?rid=...&email=...
│
├─ Option 2: Pay Later (Secondary Button)
│  └─ Trigger: POST /api/conference/resend-payment-link
│  └─ Shows: "Email sent!" confirmation
│
└─ Footer
   └─ Contact support link
```

### 4.4 Pay Later Logic

```typescript
const handlePayLater = async () => {
  setSendingEmail(true)
  
  const response = await fetch('/api/conference/resend-payment-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationId: rid, email })
  })
  
  if (response.ok) {
    setEmailSent(true)
    // Show success message
  }
  
  setSendingEmail(false)
}
```

---

## 5. Page: Pending Payment

### 5.1 Basic Information

**File**: `app/(public)/conference/register/pending-payment/page.tsx`  
**Rendering**: Client-Side Rendering  
**Authentication**: None  
**Purpose**: Provider selection and payment session initiation

### 5.2 Data Fetching

```typescript
useEffect(() => {
  async function fetchRegistration() {
    const response = await fetch(
      `/api/conference/verify-registration?rid=${rid}&email=${email}`
    )
    const data = await response.json()
    
    if (data.ok) {
      setRegistration(data)
      // Check if expired
      if (data.expired) {
        setError('Registration expired. Please register again.')
      }
    }
  }
  
  fetchRegistration()
}, [rid, email])
```

### 5.3 Payment Provider Selection

```tsx
<div className="space-y-4">
  {availableProviders.map(provider => (
    <Card
      key={provider}
      className="cursor-pointer hover:border-primary"
      onClick={() => handlePaymentStart(provider)}
    >
      <CardContent className="p-6">
        {/* Provider logo */}
        {/* Provider name */}
        {/* Accepted payment methods */}
      </CardContent>
    </Card>
  ))}
</div>
```

**Available Providers** (from registration data):

- Stripe (if currency is USD or multi-currency enabled)
- Khalti (if currency is NPR)
- eSewa (if currency is NPR)

### 5.4 Payment Initiation Flow

```typescript
const handlePaymentStart = async (provider: string) => {
  setInitiatingPayment(true)
  
  const response = await fetch('/api/conference/start-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationId: rid, email, provider })
  })
  
  const data = await response.json()
  
  if (data.ok) {
    if (data.requiresFormSubmit) {
      // eSewa: Create hidden form and submit
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.redirectUrl
      
      Object.entries(data.formData).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value as string
        form.appendChild(input)
      })
      
      document.body.appendChild(form)
      form.submit()
    } else {
      // Stripe/Khalti: Direct redirect
      window.location.href = data.redirectUrl
    }
  } else {
    setError(data.error)
  }
  
  setInitiatingPayment(false)
}
```

### 5.5 States

- `loading`: Fetching registration data
- `initiatingPayment`: Creating payment session
- `expired`: Registration expired (show re-register CTA)
- `error`: API error (show error message + retry button)

---

## 6. Page: Payment Success

### 6.1 Basic Information

**File**: `app/(public)/conference/register/payment-success/page.tsx`  
**Rendering**: Client-Side Rendering  
**Authentication**: None  
**Purpose**: Verify payment and show confirmation status

### 6.2 URL Parameters

| Param | Provider | Description |
|---|---|---|
| `rid` | All | Registration ID |
| `session_id` | Stripe | Stripe Checkout Session ID |
| `pidx` | Khalti | Khalti payment index |

**Examples**:

```
/conference/register/payment-success?rid=abc-123&session_id=cs_live_...
/conference/register/payment-success?rid=abc-123&pidx=kdZJqDr...
```

### 6.3 Verification Flow

```typescript
useEffect(() => {
  if (hasVerified.current) return // Prevent double-verify (React StrictMode)
  hasVerified.current = true
  
  async function verifyPayment() {
    if (session_id) {
      // Stripe verification
      await fetch('/api/conference/confirm-stripe-session', {
        method: 'POST',
        body: JSON.stringify({ rid, sessionId: session_id })
      })
    } else if (pidx) {
      // Khalti verification
      await fetch('/api/payments/khalti/verify', {
        method: 'POST',
        body: JSON.stringify({ pidx, purchase_order_id: rid })
      })
    }
    
    // Start polling status
    startPolling()
  }
  
  verifyPayment()
}, [])
```

### 6.4 Polling Logic

```typescript
const fetchStatus = async () => {
  const response = await fetch(`/api/conference/status?rid=${rid}`)
  const data = await response.json()
  
  if (data.ok) {
    setStatus(data.status)
    setPaymentStatus(data.paymentStatus)
    
    // Stop polling if terminal state reached
    if (['confirmed', 'cancelled', 'expired'].includes(data.status)) {
      clearInterval(pollInterval)
    }
  }
}

// Poll every 5 seconds, max 18 times (90 seconds total)
const pollInterval = setInterval(() => {
  if (pollCount >= 18) {
    clearInterval(pollInterval)
    setStatus('timeout')
    return
  }
  
  fetchStatus()
  setPollCount(c => c + 1)
}, 5000)
```

### 6.5 UI States

| Status | Payment Status | UI Shown |
|---|---|---|
| Loading | - | Spinner + "Verifying payment..." |
| Processing | unpaid | Spinner + "Processing payment..." (polling) |
| Confirmed | paid | ✓ Success card + "Registration Confirmed!" |
| Review | review | ⚠️ Warning card + "Payment under review" |
| Cancelled | - | ✗ Error card + "Registration cancelled" |
| Expired | - | ✗ Error card + "Registration expired" |
| Timeout | - | ⏱️ Timeout card + "Verification taking longer than expected" |

### 6.6 Success State Content

```tsx
{status === 'confirmed' && (
  <Card className="border-green-500">
    <CardHeader>
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <CardTitle>Registration Confirmed!</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Thank you, {registration.fullName}!</p>
      <p>Confirmation email sent to: {registration.email}</p>
      <p>Attendance: {registration.attendanceMode}</p>
      
      <div className="mt-6 space-y-2">
        <Button onClick={() => router.push('/conference')}>
          Back to Conference Page
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

---

## 7. Page: Registration Success

### 7.1 Basic Information

**File**: `app/(public)/conference/register/success/page.tsx`  
**Rendering**: Client-Side Rendering  
**Authentication**: None  
**Purpose**: Confirmation page for FREE registrations (no payment required)

### 7.2 Content

```tsx
<div className="max-w-2xl mx-auto py-12 px-4">
  <Card className="border-green-500">
    <CardHeader>
      <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
      <CardTitle className="text-3xl">Registration Successful!</CardTitle>
    </CardHeader>
    
    <CardContent className="space-y-4">
      <p className="text-lg text-center">
        Thank you for registering for our conference.
      </p>
      
      <p className="text-center text-muted-foreground">
        You will receive a confirmation email shortly with event details.
      </p>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">What's Next?</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Check your email for confirmation</li>
          <li>Add the event to your calendar</li>
          <li>Review the agenda on the conference page</li>
        </ul>
      </div>
      
      <Button 
        className="w-full" 
        onClick={() => router.push('/conference')}
      >
        Return to Conference Page
      </Button>
    </CardContent>
  </Card>
</div>
```

---

## 8. Page: Payment Failure

### 8.1 Basic Information

**File**: `app/(public)/conference/register/failure/page.tsx`  
**Rendering**: Client-Side Rendering  
**Authentication**: None  
**Purpose**: Fallback page for explicit payment failures

### 8.2 URL Parameters

| Param | Description |
|---|---|
| `rid` | Registration ID (to enable retry) |
| `email` | Registrant email |
| `reason` | Optional failure reason from gateway |

### 8.3 Content

```tsx
<Card className="border-red-500">
  <CardHeader>
    <XCircle className="w-16 h-16 text-red-500 mx-auto" />
    <CardTitle>Payment Failed</CardTitle>
  </CardHeader>
  
  <CardContent className="space-y-4">
    <p>We couldn't process your payment.</p>
    
    {reason && (
      <Alert variant="destructive">
        <AlertDescription>{reason}</AlertDescription>
      </Alert>
    )}
    
    <div className="space-y-2">
      <Button 
        onClick={() => router.push(`/conference/register/pending-payment?rid=${rid}&email=${email}`)}
        className="w-full"
      >
        Try Again
      </Button>
      
      <Button 
        variant="outline"
        onClick={() => router.push('/conference')}
        className="w-full"
      >
        Return to Conference Page
      </Button>
    </div>
    
    <p className="text-sm text-muted-foreground text-center">
      Need help? Contact us at {settings.contactEmail}
    </p>
  </CardContent>
</Card>
```

---

## 9. Admin Pages

### 9.1 Admin: Registration List

**File**: `app/admin/conference/page.tsx`  
**Rendering**: Server-Side Rendering  
**Authentication**: Required (Supabase Auth)  
**Purpose**: Overview dashboard with stats and full table

**Components**:

- 4 stat cards (Total, By Mode, Confirmed, Awaiting Payment)
- DataTable with filtering and sorting
- CSV export button
- Link to settings page

### 9.2 Admin: Registration Detail

**File**: `app/admin/conference/[id]/page.tsx`  
**Rendering**: Server-Side Rendering  
**Authentication**: Required  
**Purpose**: Full PII view + admin actions

**Sections**:

1. Header with status badges
2. Personal information card
3. Participation details card
4. Additional information card
5. Payment information card (if applicable)
6. Admin notes (editable textarea)
7. Action buttons (confirm/cancel/mark paid/resend/extend)
8. Quick actions (copy ID, send custom email)

### 9.3 Admin: Conference Settings

**File**: `app/admin/conference/settings/page.tsx`  
**Rendering**: Client Component wrapper → `ConferenceSettingsForm`  
**Authentication**: Required  
**Purpose**: Configure all conference details

**Form Sections**:

1. Basic Information (name, dates, venue)
2. Agenda Management (add/edit/remove/reorder items)
3. Email Templates (3 templates with variables)
4. Payment Configuration (enable/disable, amount, currency, per-mode fees)
5. Registration Settings (expiry hours, deadline)

---

## 10. Component Hierarchy

### 10.1 Public Components

```
components/conference/
├─ conference-registration-form.tsx       [Client] Main orchestrator
│  ├─ step-progress-bar.tsx              [Client] Progress indicator
│  ├─ step1-personal-details.tsx         [Client] Form fields
│  ├─ step2-participation.tsx            [Client] Form fields
│  ├─ step3-additional-info.tsx          [Client] Form fields
│  └─ step4-review.tsx                   [Client] Review + submit
```

### 10.2 Admin Components

```
components/admin/
├─ conference-status-actions.tsx          [Client] Confirm/Cancel/Override buttons
├─ conference-quick-actions.tsx           [Client] Copy ID, Send Email, etc.
├─ conference-notes.tsx                   [Client] Admin notes textarea
└─ conference-settings-form.tsx           [Client] Settings configuration
```

### 10.3 Shared Components

```
components/ui/  (Shadcn/ui)
├─ button.tsx
├─ card.tsx
├─ input.tsx
├─ label.tsx
├─ select.tsx
├─ checkbox.tsx
├─ radio-group.tsx
├─ dialog.tsx
├─ alert.tsx
└─ ... (20+ UI primitives)
```

---

## Related Documentation

- **Previous**: [03: Database Schema](03-database-schema.md)
- **Next**: [05: API Documentation](05-api-documentation.md)
- **See Also**: [06: Payment Flows](06-payment-flows.md)

---

**Document Maintained By**: Development Partner  
**Last Reviewed**: February 28, 2026
