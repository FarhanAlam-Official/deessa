# Receipt: Stamp, Signature & Verification System — Implementation Plan

**Date:** March 3, 2026  
**Status:** Planning  
**Scope:** Two features, zero breaking changes to existing flow

---

## Overview

### Feature 1 — Stamp & Digital Signature on PDF
Place an official stamp PNG and an authorized signatory's digital signature PNG on every
donation receipt PDF, positioned in the footer above the signatory line.

### Feature 2 — Receipt Verification System
- Each receipt gets a permanent `verification_id` (UUID) stored in the DB
- Printed on the PDF both as human-readable text and as a QR code
- Public page `/verify/[id]` lets anyone (donor, employer, tax officer) confirm validity
- No token or auth required for verification — UUID entropy makes brute-force impossible

---

## Current Architecture (must not break)

| File | Role |
|---|---|
| `lib/receipts/generator.ts` | `OrganizationDetails` interface, `getOrganizationDetails()`, `generateReceiptNumber()` |
| `lib/receipts/receipt-document.tsx` | React PDF component — `ReceiptPDFData`, `ReceiptPDFOrganization`, `ReceiptDocument` |
| `lib/receipts/pdf-renderer.ts` | `renderReceiptToPDF(data)` → `Buffer` |
| `lib/receipts/service.ts` | `generateAndStoreReceipt()` — generates HTML + PDF, uploads to storage |
| `lib/actions/donation-receipt.ts` | Server action that calls `generateAndStoreReceipt()` |
| `app/api/receipts/download/route.ts` | Token-auth download — serves `.pdf` from storage or generates on-the-fly |
| `app/api/receipts/resend/route.ts` | Resend receipt email |
| `components/receipt-preview.tsx` | Success page inline PDF preview via blob URL iframe |
| `components/admin/organization-settings-form.tsx` | Admin UI to edit org settings stored in `site_settings` table |
| `scripts/payments-v2/*.sql` | DB migrations, numbered 020–028 |

### DB: `site_settings` table
Key `organization_details` holds a JSONB blob matching `OrganizationDetails`.  
All new org fields must be **optional (`?`)** in the interface — existing DB records must
deserialize without error.

### DB: `donations` table
Already has: `receipt_number`, `receipt_url`, `receipt_generated_at`, `confirmed_at`.  
Needs: `verification_id UUID` — added via new migration `029`.

### Storage: `receipts` bucket
Files: `{donationId}-{receiptNumber}.html` and `{donationId}-{receiptNumber}.pdf`  
New stamp/signature images stored in a **separate public bucket** `receipt-assets`
(or in the existing `public` bucket) so `@react-pdf/renderer` can fetch them as
`https://` URLs directly — it cannot access Supabase private bucket files.

---

## Phase 1 — Stamp & Digital Signature

### What changes

| File | Change |
|---|---|
| `lib/receipts/generator.ts` | Add `stamp_url?: string` and `signature_url?: string` to `OrganizationDetails` |
| `lib/receipts/receipt-document.tsx` | Add `stamp_url?` and `signature_url?` to `ReceiptPDFOrganization`; render both in footer |
| `components/admin/organization-settings-form.tsx` | Add two new URL inputs in Authorized Signatory card |

### What does NOT change
- `service.ts` — `orgDetails` is passed as-is; new fields flow through automatically  
- `pdf-renderer.ts` — no changes  
- `download/route.ts` — no changes  
- DB — no migration needed (fields live in the JSONB `site_settings` value)  
- All existing receipts — missing fields = no image rendered (guarded with `if (org.stamp_url)`)

### PDF Layout
```
Footer row:
  LEFT:  [signature PNG, ~120×40px]          RIGHT: [stamp PNG, ~80×80px, slight overlap]
         ─────────────────────────
         Dr. Jane Doe
         Executive Director
         Dessa Foundation
```

### Stamp image constraint
`@react-pdf/renderer` `<Image>` requires absolute `https://` URL or base64.  
- If `stamp_url` / `signature_url` start with `/` or are relative → skip rendering, log warning  
- Admin UI: show a small live preview (same pattern as `logo_url` already does)

---

## Phase 2 — Verification ID + QR + Public Verify Page

### 2a — DB Migration (`029-add-verification-id-to-donations.sql`)

```sql
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS verification_id UUID
    DEFAULT gen_random_uuid();

-- Backfill existing rows that have a receipt_number (already issued receipts)
UPDATE donations
  SET verification_id = gen_random_uuid()
  WHERE verification_id IS NULL
    AND receipt_number IS NOT NULL;

-- Unique index — one verification ID per donation
CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_verification_id
  ON donations (verification_id)
  WHERE verification_id IS NOT NULL;

COMMENT ON COLUMN donations.verification_id IS
  'Public UUID for receipt verification at /verify/[id]. Permanent, non-expiring.';
```

Run as: `029-add-verification-id-to-donations.sql`

### 2b — QR Code generation

Install: `pnpm add qrcode`  (types: `pnpm add -D @types/qrcode`)  
New file: `lib/receipts/qr.ts`

```ts
import QRCode from "qrcode"

export async function verificationQRBase64(verificationId: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${verificationId}`
  // Returns "data:image/png;base64,..." — usable directly in @react-pdf/renderer <Image>
  return QRCode.toDataURL(url, { width: 80, margin: 1, color: { dark: "#111827", light: "#ffffff" } })
}
```

### 2c — Data flow changes

**`service.ts` `generateAndStoreReceipt()`**

1. After `receiptNumber` is generated, fetch `verification_id` from the donation row:
   ```ts
   const { data: donationRow } = await supabase
     .from("donations")
     .select("verification_id")
     .eq("id", donationId)
     .single()
   const verificationId = donationRow?.verification_id as string
   ```
2. Generate QR base64: `const qrBase64 = await verificationQRBase64(verificationId)`
3. Pass both into `ReceiptPDFData`

**`ReceiptPDFData` (in `receipt-document.tsx`)**

Add two new optional fields:
```ts
verificationId?: string
verificationQR?: string   // base64 data URL
```

**`download/route.ts` on-the-fly fallback**

Query also includes `verification_id`:
```ts
.select("donor_name, ..., verification_id")
```
Generate QR on-the-fly the same way.

### 2d — PDF layout additions

In `receipt-document.tsx` footer:

```
BOTTOM BAR (full width, light gray bg):
  LEFT:  [QR code 56×56pt]   "Scan to verify authenticity"
  RIGHT: Verification ID: 3f7a2b1c-...
         https://dessafoundation.org/verify/...
```

New styles: `verifyBar`, `qrImage`, `verifyText`, `verifyId`

### 2e — Public Verify Page (`app/(public)/verify/[id]/page.tsx`)

**Route:** `/verify/3f7a2b1c-9e4d-4b2a-8c1f-1234567890ab`  
**Auth:** None — fully public  
**Rate limit:** Reuse existing `checkRateLimit` (20 req/min per IP)

```
DB query:
  SELECT donor_name, amount, currency, receipt_number,
         receipt_generated_at, payment_status, is_monthly
  FROM donations
  WHERE verification_id = $1
    AND payment_status = 'completed'
    AND receipt_number IS NOT NULL
```

**Display:**
```
┌────────────────────────────────────────┐
│  ✅  VALID RECEIPT                      │
│  Dessa Foundation                       │
│                                         │
│  Receipt No:   RCP-2026-00012           │
│  Donor:        J*** D** (masked)        │
│  Amount:       NPR 5,000.00             │
│  Date:         March 3, 2026            │
│  Type:         One-Time Donation        │
│                                         │
│  Verification ID: 3f7a2b1c-...          │
└────────────────────────────────────────┘
```

Donor name masking: `"John Doe"` → `"J*** D**"` (first char + stars per word)  
If UUID not found or payment not completed → show "❌ Receipt not found or invalid"

---

## Complete Checklist

### Phase 1 — Stamp & Signature

- [ ] **`generator.ts`** — add `stamp_url?: string` and `signature_url?: string` to `OrganizationDetails`
- [ ] **`receipt-document.tsx`** — add fields to `ReceiptPDFOrganization`; add signature + stamp `<Image>` in footer with `https://` guard
- [ ] **`organization-settings-form.tsx`** — add Signature URL + Stamp URL inputs inside Authorized Signatory card, with live `<img>` preview on each
- [ ] Manual test: set URLs in admin → trigger a test donation → verify images appear in downloaded PDF
- [ ] Manual test: leave URLs blank → PDF generates without error (fallback guard)

### Phase 2 — Verification

- [ ] **`029-add-verification-id-to-donations.sql`** — create and run migration
- [ ] Verify: `SELECT verification_id FROM donations LIMIT 5` — all have UUIDs
- [ ] **`pnpm add qrcode`** + **`pnpm add -D @types/qrcode`**
- [ ] **`lib/receipts/qr.ts`** — create `verificationQRBase64()` helper
- [ ] **`receipt-document.tsx`** — add `verificationId?` + `verificationQR?` to `ReceiptPDFData` and `ReceiptPDFOrganization`; add verification bar to PDF
- [ ] **`lib/receipts/service.ts`** — fetch `verification_id` from DB after number generation; generate QR base64; pass both to `renderReceiptToPDF`
- [ ] **`app/api/receipts/download/route.ts`** — add `verification_id` to on-the-fly query; generate QR and pass into `renderReceiptToPDF`
- [ ] **`app/(public)/verify/[id]/page.tsx`** — create public verify page (server component, DB lookup, masked display, rate limit)
- [ ] Add `NEXT_PUBLIC_APP_URL` to `.env` if not already present (used in QR URL)
- [ ] Manual test: complete a test donation → open PDF → scan QR → lands on verify page → shows VALID
- [ ] Manual test: visit `/verify/00000000-0000-0000-0000-000000000000` → shows invalid
- [ ] Manual test: rapid-fire 25 requests to verify page → rate limit kicks in at 20

### Both Phases — Before Merging

- [ ] Run `get_errors` on all modified files
- [ ] Existing receipts in storage (`.pdf` from before this change) still download correctly
- [ ] Receipt email still sends with correct token URL
- [ ] Admin settings page saves and reloads correctly

---

## Files Touch Map

```
Phase 1 only:
  MODIFY  lib/receipts/generator.ts                  (+2 optional fields)
  MODIFY  lib/receipts/receipt-document.tsx          (+2 Image renders in footer)
  MODIFY  components/admin/organization-settings-form.tsx  (+2 inputs)

Phase 2 only:
  CREATE  scripts/payments-v2/029-add-verification-id-to-donations.sql
  CREATE  lib/receipts/qr.ts
  MODIFY  lib/receipts/receipt-document.tsx          (+verificationId, +verificationQR, +verify bar)
  MODIFY  lib/receipts/service.ts                    (+fetch verificationId, +QR generation)
  MODIFY  app/api/receipts/download/route.ts         (+verificationId in query, +QR in on-the-fly)
  CREATE  app/(public)/verify/[id]/page.tsx
  MODIFY  .env                                        (+NEXT_PUBLIC_APP_URL if missing)

NOT touched:
  lib/receipts/pdf-renderer.ts
  lib/actions/donation-receipt.ts
  app/api/receipts/resend/route.ts
  components/receipt-preview.tsx
  lib/payments/** (entire payments pipeline)
```

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Stamp/signature PNG is a private Supabase URL | Medium | Admin UI note + `https://` guard in PDF renderer skips silently |
| QR generation adds latency to webhook | Low | `qrcode` is sync-capable; ~15ms typical |
| `verification_id` NULL on very old donations | Low | `DEFAULT gen_random_uuid()` + backfill UPDATE in migration |
| Verify page exposes donor data | Low | Name masking + only show completed+receipted donations |
| Brute-force UUID enumeration | Negligible | 122 bits entropy = ~5×10³⁶ combinations; rate limit is extra guard |

---

## Execution Order

1. Run Phase 1 first — purely additive, no DB changes, instant rollback by clearing URLs
2. Run migration `029` on local first, verify backfill, then production
3. Run Phase 2 code changes
4. Deploy together (migration + code) in one release
