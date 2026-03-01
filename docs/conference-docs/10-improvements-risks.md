# DEESSA Foundation — Conference Module: Improvements, Risks & Limitations

> **Version:** 1.0.0  
> **Last Updated:** February 28, 2026  
> **Audience:** Technical Leadership, Product Owners, Stakeholders

---

## Table of Contents

1. [Known Limitations](#1-known-limitations)
2. [Technical Debt](#2-technical-debt)
3. [Optimization Opportunities](#3-optimization-opportunities)
4. [Risk Analysis](#4-risk-analysis)
5. [Refactoring Roadmap](#5-refactoring-roadmap)
6. [Future Enhancements](#6-future-enhancements)

---

## 1. Known Limitations

### 1.1 Functional Limitations

| Limitation                             | Impact                                                   | Workaround                          | Effort to Fix                  |
| -------------------------------------- | -------------------------------------------------------- | ----------------------------------- | ------------------------------ |
| **No user accounts**                   | Users cannot view past registrations                     | Users must save confirmation emails | Medium (3-5 days)              |
| **Single conference only**             | Cannot run multiple concurrent events                    | Must modify data model              | High (1-2 weeks)               |
| **No refund automation**               | Refunds must be processed manually via gateway dashboard | Admin manually refunds + updates DB | Medium (2-3 days)              |
| **No discount codes**                  | Cannot offer early-bird or group discounts               | Manually adjust pricing in settings | Low (1-2 days)                 |
| **No partial payments**                | Cannot split payment across methods                      | User must pay full amount at once   | High (1 week)                  |
| **No guest limit per attendance mode** | Cannot cap "In-person" to 500 seats                      | Manual monitoring required          | Low (1 day)                    |
| **No waitlist**                        | When sold out, users are rejected                        | Must manually manage waitlist       | Medium (2-3 days)              |
| **Limited custom fields**              | Registration form fixed (8 fields)                       | Requires code changes to add fields | Medium (depends on field type) |
| **No certificate generation**          | Cannot auto-generate attendance certificates             | Buy from external service or build  | High (1-2 weeks)               |
| **No QR code check-in**                | No automated event check-in                              | Manual list-based check-in          | Medium (3-4 days)              |

### 1.2 Technical Limitations

| Limitation                      | Impact                                                                        | Severity              |
| ------------------------------- | ----------------------------------------------------------------------------- | --------------------- | --- | -------------------------- | -------------------------------------------- | ------ |
| **6228-line monolith**          | Hard to maintain, slow TypeScript compilation                                 | High                  |
| **In-memory rate limiting**     | Resets on serverless function cold start, ineffective for distributed systems | Medium                |
| **No request ID tracing**       | Hard to debug issues across function invocations                              | Medium                |
| **No structured logging**       | Logs are plain console statements, hard to search                             | Medium                |
| **No integration tests**        | Only manual testing, risk of regressions                                      | High                  |
| **No load testing**             | Unknown performance under 1000+ concurrent users                              | Medium                |
| **Email rate limit (2000/day)** | Cannot send >2000 emails from Gmail                                           | Low (unlikely to hit) |
| **Fixed 24-hour expiry**        | Not configurable per event                                                    | Low                   |
| **Amount stored as NUMERIC**    | NUMERIC provides exact precision; no floating-point issues                    | Low                   |     | **No webhook retry logic** | If webhook fails 3 times, no manual re-queue | Medium |

### 1.3 Business Limitations

| Limitation                 | Impact                                                     | Priority to Address              |
| -------------------------- | ---------------------------------------------------------- | -------------------------------- |
| **No multi-event support** | Cannot reuse system for other conferences/workshops        | High (if NGO expands)            |
| **No reporting dashboard** | Admins export CSV manually for analysis                    | Medium (nice-to-have)            |
| **No payment analytics**   | Cannot track conversion rates, abandonment                 | Low (can extract from DB)        |
| **No user segmentation**   | Cannot email specific groups (e.g., "In-person attendees") | Medium                           |
| **No attendance tracking** | Cannot mark who attended vs. who registered                | Low (unless certificates needed) |
| **No feedback collection** | Post-conference survey must be separate tool               | Low (use external form)          |

---

## 2. Technical Debt

### 2.1 Code Structure Debt

**Issue**: Single 6228-line file (`app/api/conference/route.ts` equivalent as monolith)

**Impact**:

- 10+ second TypeScript compilation
- Hard to navigate and maintain
- Merge conflicts likely with multiple developers
- Functions duplicated across API routes

**Suggested Refactoring**:

```
lib/conference/
├── services/
│   ├── registration-service.ts      # Core registration logic
│   ├── payment-service.ts            # Payment gateway orchestration
│   ├── email-service.ts              # Email template + send logic
│   └── settings-service.ts           # Settings retrieval + caching
├── validators/
│   ├── registration-schema.ts        # Zod schemas
│   └── payment-schema.ts
├── gateways/
│   ├── stripe.ts                     # Stripe integration
│   ├── khalti.ts                     # Khalti integration
│   └── esewa.ts                      # eSewa integration
└── db/
    ├── queries.ts                    # Prepared SQL queries
    └── models.ts                     # TypeScript types
```

**Estimated Effort**: 1 week (high risk of introducing bugs during refactor)

---

### 2.2 Duplicate Code

**Issue**: Functions like `sendEmail()`, `getSettings()`, `createSupabaseServerClient()` duplicated across multiple API routes

**Locations**:

- `/api/conference/*.ts` (5+ routes)
- `/api/admin/conference/*.ts` (3+ routes)
- `/api/cron/*.ts` (1 route)

**Solution**:

```typescript
// lib/supabase/server.ts
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

// lib/email/send.ts
export async function sendEmail(to: string, subject: string, html: string) {
  // Single implementation
}

// Then import everywhere:
import { createServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
```

**Estimated Effort**: 2 days

---

### 2.3 In-Memory Rate Limiting

**Issue**: Current rate limiter stores request counts in JavaScript `Map` object, which resets on serverless cold start

**Code**:

```typescript
const requestCounts = new Map<string, { count: number; resetAt: number }>();
```

**Problem**:

- Each serverless function instance has its own memory
- Vercel may spawn 10+ instances under load
- User can bypass limit by triggering new instance

**Solution** (Redis-based):

```typescript
// lib/rate-limit.ts
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

export async function checkRateLimit(
  key: string,
  limit: number,
  window: number,
): Promise<boolean> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, window);
  }
  return count <= limit;
}

// Usage:
const allowed = await checkRateLimit(`api:start-payment:${email}`, 10, 60);
if (!allowed) {
  return new Response(JSON.stringify({ error: "RATE_LIMIT_EXCEEDED" }), {
    status: 429,
  });
}
```

**Cost**: Upstash Redis free tier (10,000 requests/day)  
**Estimated Effort**: 1 day

---

### 2.4 No Request Tracing

**Issue**: When user reports issue ("my payment didn't work"), hard to trace request across multiple function invocations

**Current Logs**:

```
[POST] /api/conference/start-payment
[POST] /api/conference/webhooks/stripe
[POST] /api/conference/verify-registration
```

**Cannot correlate** which requests belong to same user flow.

**Solution** (Add request ID header):

```typescript
// middleware.ts
import { nanoid } from "nanoid";

export function middleware(req: NextRequest) {
  const reqId = nanoid();
  req.headers.set("X-Request-ID", reqId);
  return NextResponse.next();
}

// In API routes:
export async function POST(req: Request) {
  const reqId = req.headers.get("X-Request-ID");
  console.log(`[${reqId}] Starting payment...`);
  // Now logs include: [abc123xyz] Starting payment...
}
```

**Estimated Effort**: 1 day

---

### 2.5 Lack of Tests

**Current State**:

- 0 unit tests
- 0 integration tests
- 0 end-to-end tests

**Risk**: Regressions when making changes (e.g., payment logic breaks after small refactor)

**Recommended Test Coverage**:

**Unit Tests** (Jest + @testing-library/react):

```typescript
// __tests__/lib/conference/payment-service.test.ts
describe("calculateAmount", () => {
  it('returns USD for "In-person"', () => {
    expect(calculateAmount("In-person", 20, 800)).toEqual({
      amount: 20,
      currency: "USD",
    });
  });

  it('returns NPR for "Virtual"', () => {
    expect(calculateAmount("Virtual", 20, 800)).toEqual({
      amount: 800,
      currency: "NPR",
    });
  });
});
```

**Integration Tests** (Playwright or Cypress):

```typescript
// tests/e2e/registration-flow.spec.ts
test("user can register and pay with Stripe", async ({ page }) => {
  await page.goto("/conference/register");
  await page.fill('[name="fullName"]', "John Doe");
  await page.fill('[name="email"]', "john@example.com");
  await page.selectOption('[name="attendanceMode"]', "In-person");
  await page.click('button:has-text("Register")');

  await page.click("text=Stripe");
  await page.waitForURL(/checkout.stripe.com/);

  // Fill Stripe test card
  await page.fill('[name="cardNumber"]', "4242424242424242");
  // ... complete payment

  await expect(page).toHaveURL(/\/conference\/success/);
});
```

**Estimated Effort**: 1-2 weeks (initial setup + writing tests)

---

## 3. Optimization Opportunities

### 3.1 Database Query Optimization

**Current Issue**: N+1 query problem in admin list page

```typescript
// Current (BAD): Fetches settings separately
const { data: registrations } = await supabase
  .from("conference_registrations")
  .select("*");

const settings = await getSettingsFromDB(); // Separate query
```

**Optimized**:

```typescript
// Fetch all in parallel
const [registrationsResult, settingsResult] = await Promise.all([
  supabase.from("conference_registrations").select("*"),
  getSettingsFromDB(),
]);
```

**Expected Improvement**: 50% faster page load (combined query latency)

---

### 3.2 Email Template Caching

**Current Issue**: Email HTML templates rebuilt on every send

```typescript
// Current: Rebuilds HTML each time
function sendRegistrationEmail(user: User, settings: Settings) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Welcome ${user.fullName}</h1>
        ...
      </body>
    </html>
  `;
  return sendEmail(user.email, "Registration Confirmed", html);
}
```

**Optimized** (template caching):

```typescript
// Pre-compile templates at build time
import Handlebars from "handlebars";
const registrationTemplate = Handlebars.compile(
  fs.readFileSync("templates/registration.html", "utf-8"),
);

function sendRegistrationEmail(user: User, settings: Settings) {
  const html = registrationTemplate({ user, settings });
  return sendEmail(user.email, "Registration Confirmed", html);
}
```

**Expected Improvement**: 20-30% faster email send time

---

### 3.3 Settings Caching

**Current Issue**: Settings fetched from database on every API request (5+ times per registration flow)

**Optimized** (Redis cache):

```typescript
// lib/settings-cache.ts
const CACHE_TTL = 300; // 5 minutes

export async function getCachedSettings(): Promise<Settings> {
  const cached = await redis.get("conference:settings");
  if (cached) return JSON.parse(cached);

  const settings = await getSettingsFromDB();
  await redis.setex("conference:settings", CACHE_TTL, JSON.stringify(settings));
  return settings;
}

// Invalidate on settings update
export async function invalidateSettingsCache() {
  await redis.del("conference:settings");
}
```

**Expected Improvement**: 80% reduction in database load

---

### 3.4 Lazy Load Admin Dashboard

**Current Issue**: Admin dashboard loads ALL registrations at once (slow for 500+ registrations)

**Optimized** (pagination + virtual scrolling):

```typescript
// API: Add pagination
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;
  const offset = (page - 1) * limit;

  const { data, count } = await supabase
    .from("conference_registrations")
    .select("*", { count: "exact" })
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  return Response.json({ data, total: count, page, limit });
}

// Frontend: Virtual table (react-window)
import { FixedSizeList } from "react-window";

function AdminList() {
  const [registrations, setRegistrations] = useState([]);
  const [page, setPage] = useState(1);

  // Load data on scroll
  // Render only visible rows
}
```

**Expected Improvement**: Instant page load regardless of registration count

---

## 4. Risk Analysis

### 4.1 Technical Risks

| Risk                       | Likelihood | Impact   | Mitigation                                       |
| -------------------------- | ---------- | -------- | ------------------------------------------------ |
| **Database failure**       | Low        | Critical | Daily backups, 2-hour RTO with Supabase restore  |
| **Payment gateway outage** | Medium     | High     | Support 3 gateways, fallback to manual payment   |
| **Vercel downtime**        | Low        | High     | Deploy to secondary platform (Netlify) as backup |
| **Email service failure**  | Medium     | Medium   | Implement retry logic, use Sendgrid as fallback  |
| **Cron job failure**       | Medium     | Low      | Registrations don't expire (acceptable delay)    |
| **DDoS attack**            | Medium     | Medium   | Vercel has built-in DDoS protection              |
| **Data breach**            | Low        | Critical | RLS policies, no PII in logs, encrypted at rest  |
| **Serverless cold starts** | High       | Low      | Users may experience 1-2s delay (acceptable)     |
| **Stripe webhook miss**    | Medium     | Medium   | Dual-path verification (polling + webhook)       |
| **Gmail rate limit hit**   | Low        | Medium   | Unlikely (<2000 registrations/day), use Sendgrid |

### 4.2 Business Risks

| Risk                      | Likelihood | Impact   | Mitigation                                                               |
| ------------------------- | ---------- | -------- | ------------------------------------------------------------------------ |
| **Conference cancelled**  | Low        | Low      | System allows admin to cancel + refund all                               |
| **Pricing error**         | Medium     | High     | Manual review before launch, test payments                               |
| **Overbooking**           | Low        | High     | Implement seat limits (requires dev work)                                |
| **Payment disputes**      | Medium     | Medium   | Clear refund policy, keep detailed payment logs                          |
| **User data loss**        | Low        | Critical | Daily backups, 30-day retention                                          |
| **Fraud registrations**   | Low        | Medium   | Manual review via admin dashboard, mark as spam                          |
| **Developer unavailable** | High       | Medium   | Good documentation, code should be maintainable by any Next.js developer |

### 4.3 Compliance Risks

| Risk                             | Likelihood | Impact   | Mitigation                                                                           |
| -------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------ |
| **GDPR violation**               | Low        | High     | Data retention policy (auto-delete after N months), privacy policy, explicit consent |
| **Payment data exposure**        | Low        | Critical | No card data stored locally, gateway handles PCI compliance                          |
| **Accessibility non-compliance** | Medium     | Low      | Add ARIA labels, keyboard navigation, screen reader support                          |
| **Email spam complaints**        | Low        | Medium   | Clear unsubscribe mechanism, send only transactional emails                          |

### 4.4 Dependency Risks

| Dependency       | Risk                           | Current Version | Update Strategy                             |
| ---------------- | ------------------------------ | --------------- | ------------------------------------------- |
| **Next.js**      | Major version breaking changes | 14.1.0          | Pin to 14.x, test before upgrading          |
| **Supabase JS**  | API changes                    | 2.39.0          | Pin to 2.x, review changelog before upgrade |
| **Stripe SDK**   | Deprecations                   | 14.14.0         | Monitor Stripe API version changes          |
| **Tailwind CSS** | Class name changes             | 3.4.1           | Pin to 3.x, minimal risk                    |
| **Zod**          | Schema API changes             | 3.22.4          | Low risk (stable library)                   |

**Approach**: Pin major versions in `package.json`, test minor updates in staging before production.

---

## 5. Refactoring Roadmap

### Phase 1: Code Organization (Week 1-2)

- [ ] Extract services into `lib/conference/services/`
- [ ] Extract validators into `lib/conference/validators/`
- [ ] Extract payment gateways into `lib/conference/gateways/`
- [ ] Move database queries into `lib/conference/db/`
- [ ] Add barrel exports for clean imports

### Phase 2: Infrastructure (Week 3)

- [ ] Replace in-memory rate limiting with Redis (Upstash)
- [ ] Add request ID tracing middleware
- [ ] Implement structured logging (Pino or Winston)
- [ ] Add settings caching (Redis)

### Phase 3: Testing (Week 4-5)

- [ ] Set up Jest + Testing Library
- [ ] Write unit tests for core services (80%+ coverage)
- [ ] Set up Playwright for E2E tests
- [ ] Write integration tests for payment flows
- [ ] Add CI/CD pipeline (GitHub Actions)

### Phase 4: Features (Week 6-8)

- [ ] Add user accounts (optional login to view registrations)
- [ ] Add discount code system
- [ ] Add QR code check-in system
- [ ] Add attendance certificates (PDF generation)
- [ ] Add reporting dashboard (charts/graphs)

### Phase 5: Scale & Polish (Week 9-10)

- [ ] Load testing (JMeter or k6)
- [ ] Performance optimization (Lighthouse 90+ score)
- [ ] Accessibility audit (WCAG 2.1 AA compliance)
- [ ] Security penetration testing
- [ ] Documentation update

---

## 6. Future Enhancements

### 6.1 High Priority (Next 3-6 months)

**Multi-Event Support**:

```sql
-- New schema
CREATE TABLE conferences (
  id uuid PRIMARY KEY,
  name text,
  slug text UNIQUE,
  start_date timestamptz,
  end_date timestamptz,
  settings jsonb
);

ALTER TABLE conference_registrations
ADD COLUMN conference_id uuid REFERENCES conferences(id);

-- Then URL: /conference/{slug}/register
```

**User Accounts**:

- Users can log in with email
- View all their past registrations
- Download receipts
- Update registration details

**Advanced Reporting**:

- Registration trends over time (line chart)
- Payment method breakdown (pie chart)
- Attendance mode split (bar chart)
- Conversion funnel (registrations → payments)

### 6.2 Medium Priority (6-12 months)

**Automated Refunds**:

- Admin clicks "Refund" button
- System calls gateway API
- Updates database status
- Sends refund confirmation email

**Discount Codes**:

```typescript
interface DiscountCode {
  code: string; // e.g., "EARLYBIRD"
  type: "percentage" | "fixed";
  value: number; // 20 (for 20% off) or 5 (for $5 off)
  validFrom: Date;
  validUntil: Date;
  maxUses: number;
  usedCount: number;
}

// Apply at checkout
const discount = await validateDiscountCode(code);
const finalAmount = applyDiscount(baseAmount, discount);
```

**Waitlist Management**:

- When sold out, users join waitlist
- Admin can "promote" waitlist to confirmed
- Automated email: "Spot available, register now"

**QR Check-In**:

- Generate QR code per registration (encode registration ID)
- Admin scans QR at event entrance
- System marks as "attended"
- Can later filter "attended vs. no-show"

### 6.3 Low Priority (Nice-to-have)

**Mobile App** (React Native):

- Admins can check-in attendees via phone
- View real-time registration stats

**Slack/Discord Integration**:

- Post notification when new registration arrives
- Daily summary at 9 AM

**Custom Branding**:

- Uploadable logo/banner
- Custom color scheme
- White-label for partner organizations

**Multi-Language**:

- English / Nepali / Hindi
- Translate registration form + emails

**Analytics Dashboard**:

- Google Analytics integration
- Conversion tracking (views → registrations → payments)
- A/B testing different registration flows

---

## Summary: What to Prioritize

### If Resources are Limited (Pick 3)

1. **Refactor monolith into services** (reduces maintenance burden)
2. **Add integration tests** (prevents regressions)
3. **Implement Redis rate limiting** (improves security)

### If Planning Next Conference

1. **Test with 50 dummy registrations** (stress test)
2. **Set up monitoring/alerts** (catch issues early)
3. **Run security audit** (PCI compliance check)

### If Expanding System

1. **Multi-event support** (reusable platform)
2. **User accounts** (better UX)
3. **Advanced reporting** (data-driven decisions)

---

## Related Documentation

- **Previous**: [09: Deployment & Operations](09-deployment-operations.md)
- **Next**: [11: Appendix](11-appendix.md)
- **See Also**: [02: Architecture](02-architecture.md), [03: Database Schema](03-database-schema.md)

---

**Document Maintained By**: Development Partner  
**Last Reviewed**: February 28, 2026  
**Next Review**: Quarterly or after major incident
