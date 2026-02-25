# DEESSA Foundation — Conference Module Documentation

> **Version:** 1.0.0  
> **Last Updated:** February 28, 2026  
> **Documentation Suite**: Complete Technical & Operational Reference

---

## 📚 Documentation Index

This comprehensive documentation suite covers the DEESSA Foundation Conference Registration & Payment System from executive overview to technical implementation details.

### Quick Navigation by Role

**👔 For Executives & Program Managers**

- Start here: [**00: Executive Summary**](00-executive-summary.md)
- Key concerns: Cost, ownership, data protection, success metrics

**👨‍💼 For Project Managers & Product Owners**

- Start here: [**01: Overview**](01-overview.md) → [**10: Improvements & Risks**](10-improvements-risks.md)
- Key concerns: Feature scope, limitations, roadmap

**👨‍💻 For Developers**

- Start here: [**02: Architecture**](02-architecture.md) → [**03: Database Schema**](03-database-schema.md) → [**05: API Documentation**](05-api-documentation.md)
- Key resources: Code structure, API reference, payment flows

**🔧 For DevOps & Operations**

- Start here: [**09: Deployment & Operations**](09-deployment-operations.md)
- Key resources: Environment variables, runbooks, backup procedures

**🛡️ For Security & Compliance**

- Start here: [**08: Security**](08-security.md)
- Key concerns: Authentication, encryption, GDPR, PCI compliance

**📊 For Admins & Support Staff**

- Start here: [**07: Admin Documentation**](07-admin-documentation.md)
- Key tasks: Managing registrations, handling payments, troubleshooting

---

## 📖 Complete Documentation Files

### Part 1: Strategic Overview

#### [00: Executive Summary](00-executive-summary.md)

**Audience**: Non-technical stakeholders (directors, program managers, finance officers)

- What the system does and why it exists
- Operational ownership model (NGO vs Developer responsibilities)
- Financial impact and cost structure
- Data protection and compliance
- Success metrics and system maturity

**Read this if**: You need to understand business value without technical jargon.

---

#### [01: Overview](01-overview.md)

**Audience**: Technical leadership, project managers, new developers

- System scope and boundaries
- Complete technology stack breakdown
- Feature summary (public vs admin)
- Architecture Decision Records (ADRs)
- Testing and monitoring strategy

**Read this if**: You want a high-level technical introduction to the system.

---

### Part 2: Technical Architecture

#### [02: Architecture](02-architecture.md)

**Audience**: System architects, senior developers

- System topology diagram
- **Responsibility & ownership matrix** (critical for NGO)
- Component breakdown (frontend, backend, API, database)
- Integration points (Supabase, Stripe, Khalti, eSewa, Gmail)
- Scalability roadmap (Phase 1-4)
- Failure modes and resilience analysis

**Read this if**: You need to understand how components interact and who owns what.

---

#### [03: Database Schema](03-database-schema.md)

**Audience**: Database administrators, backend developers

- **Entity Relationship Diagram (ERD)** with ASCII art
- Complete `conference_registrations` table schema (30 columns)
- `site_settings` JSON structure
- `payment_events` idempotency table
- 5 indexes with performance characteristics
- Row-Level Security (RLS) policies
- Common query patterns with benchmarks

**Read this if**: You're working with the database directly or optimizing queries.

---

### Part 3: Frontend & API

#### [04: Page Documentation](04-page-documentation.md)

**Audience**: Frontend developers, UI/UX designers

- 11 pages documented (8 public + 3 admin)
- 4-step registration wizard breakdown
- Component hierarchy and state management
- URL parameters and routing
- Rendering modes (SSR vs CSR)
- Payment flow UI (polling, redirects, success/failure states)

**Read this if**: You're building or modifying the user interface.

---

#### [05: API Documentation](05-api-documentation.md)

**Audience**: Backend developers, integration engineers, QA testers

- 8 API endpoints with full cURL examples
- Request/response schemas (TypeScript types)
- Rate limiting table (10-120 req/min by endpoint)
- Error code reference with handling suggestions
- Authentication mechanisms (dual-key, Bearer token, HMAC)
- Testing scenarios with expected outcomes

**Read this if**: You're integrating with the API or testing endpoints.

---

#### [06: Payment Flows](06-payment-flows.md)

**Audience**: Developers implementing payment features, financial auditors

- **Payment Gateway Comparison Table** (Stripe vs Khalti vs eSewa - 15 dimensions)
- Registration state machine diagram (Mermaid)
- Payment status state machine
- Dual-path verification sequence diagram
- Provider-specific implementation (Checkout Session, Khalti ePay, eSewa HMAC)
- 11 failure scenarios with detection and recovery

**Read this if**: You're working on payment integration or troubleshooting payment issues.

---

### Part 4: Administration & Security

#### [07: Admin Documentation](07-admin-documentation.md)

**Audience**: Admin users, support staff, program coordinators

- Admin dashboard walkthrough (list page, detail page, settings)
- All admin actions explained (confirm, cancel, mark paid, extend, resend)
- Quick actions guide (copy ID, custom email, notes)
- CSV export format and usage
- Common admin workflows (handling failed payments, manual confirmation, bulk operations)
- PII handling guidelines

**Read this if**: You're an admin user managing conference registrations.

---

#### [08: Security](08-security.md)

**Audience**: Security engineers, compliance officers, auditors

- Authentication architecture (Supabase Auth, dual-key, cron auth)
- Authorization model (RLS policies, service-role client)
- Payment security (PCI compliance, no local card storage)
- Data encryption (at rest, in transit)
- Rate limiting implementation
- Audit trails and logging
- GDPR compliance checklist
- Security best practices and threat model

**Read this if**: You're conducting security audit or ensuring compliance.

---

### Part 5: Operations & Maintenance

#### [09: Deployment & Operations](09-deployment-operations.md)

**Audience**: DevOps engineers, system administrators, operations staff

- **Complete environment variables reference** (17 variables with descriptions)
- Deployment checklist (pre-deploy, deploy, post-deploy, rollback)
- Database migration procedures
- **5 operational runbooks** (payment webhook fail, email not sent, registration expired, cron failure, amount mismatch)
- Monitoring & alerting setup (metrics, thresholds, tools)
- Backup & recovery procedures (RTO/RPO defined)
- Troubleshooting guide with debug commands

**Read this if**: You're responsible for deploying, operating, or maintaining the system.

---

### Part 6: Planning & Improvement

#### [10: Improvements, Risks & Limitations](10-improvements-risks.md)

**Audience**: Technical leadership, product owners, project planners

- **Known limitations** (16 functional/technical/business limitations documented)
- **Technical debt analysis** (monolith, duplicated code, in-memory rate limiting, lack of tests)
- Optimization opportunities (database queries, caching, lazy loading)
- **Risk analysis matrix** (technical, business, compliance, dependency risks with likelihood/impact/mitigation)
- 5-phase refactoring roadmap (10-week plan)
- Future enhancements backlog (user accounts, multi-event, QR check-in, certificates)

**Read this if**: You're planning improvements, managing technical debt, or prioritizing features.

---

### Part 7: Reference

#### [11: Appendix](11-appendix.md)

**Audience**: All stakeholders (reference material)

- **Glossary of 40+ terms** (RLS, webhook, idempotency, SSR, CSR, etc.)
- Complete file inventory (40+ files with purpose and auth requirements)
- Changelog (v1.0.0 initial release)
- Quick reference tables (status flow, email triggers, gateway comparison, admin actions)
- External resources (official docs, learning materials, tools, community support)
- Contributors and acknowledgments
- Versioning strategy (Semantic Versioning)

**Read this if**: You need to look up terminology, find specific files, or understand conventions.

---

## 🚀 Quick Start Guides

### For New Developers

1. Read [01: Overview](01-overview.md) to understand the tech stack
2. Read [02: Architecture](02-architecture.md) to understand system structure
3. Read [03: Database Schema](03-database-schema.md) to understand data model
4. Clone repository and set up local environment:

   ```bash
   git clone [repository-url]
   cd deessa-foundation
   pnpm install
   cp .env.example .env.local
   # Fill in environment variables
   pnpm dev
   ```

5. Read [05: API Documentation](05-api-documentation.md) to understand endpoints
6. Test registration flow: `http://localhost:3000/conference`

### For New Admins

1. Read [00: Executive Summary](00-executive-summary.md) for system overview
2. Read [07: Admin Documentation](07-admin-documentation.md) for admin features
3. Log in to admin dashboard: `https://deessa.org/admin/conference`
4. Practice on test registration (create test entry first)
5. Bookmark common workflows (confirm payment, export CSV, send email)

### For Operations Team

1. Read [09: Deployment & Operations](09-deployment-operations.md) completely
2. Save all 5 operational runbooks for quick access during incidents
3. Set up monitoring (Vercel logs, Supabase dashboard, UptimeRobot)
4. Schedule weekly database backup (manual CSV export)
5. Test rollback procedure in staging environment

### For Security Auditors

1. Read [08: Security](08-security.md) for authentication and authorization model
2. Read [03: Database Schema](03-database-schema.md) for RLS policies
3. Review PII handling in [07: Admin Documentation](07-admin-documentation.md)
4. Check GDPR compliance checklist in [08: Security](08-security.md)
5. Test payment flow with focus on data encryption and secure transmission

---

## 📊 System Quick Facts

| Category | Details |
|---|---|
| **Technology** | Next.js 14, TypeScript, Supabase (PostgreSQL), Stripe + Khalti + eSewa |
| **Hosting** | Vercel (serverless) |
| **Database** | 3 tables, 5 indexes, 30 columns in main table |
| **APIs** | 8 endpoints (6 public, 1 admin, 1 cron) |
| **Pages** | 11 pages (8 public, 3 admin) |
| **Email** | Nodemailer + Gmail SMTP (2000/day limit) |
| **Payments** | 3 gateways, dual-path verification, idempotency guaranteed |
| **Security** | Dual-key auth, RLS policies, HMAC webhooks, PCI compliant (via gateways) |
| **Deployment** | Auto-deploy on Git push, 2-5 min build time |
| **Backup** | Daily auto-backup (7-day retention), manual CSV export recommended |

---

## 🎯 Common Tasks by Role

### Developers

| Task | Documentation |
|---|---|
| Add new registration field | [04: Page Documentation](04-page-documentation.md) + [03: Database Schema](03-database-schema.md) |
| Add new payment gateway | [06: Payment Flows](06-payment-flows.md) |
| Optimize slow query | [03: Database Schema](03-database-schema.md) (query patterns section) |
| Add new API endpoint | [05: API Documentation](05-api-documentation.md) (follow existing patterns) |
| Fix email not sending | [09: Deployment & Operations](09-deployment-operations.md) (Runbook 3.2) |
| Debug webhook failure | [09: Deployment & Operations](09-deployment-operations.md) (Runbook 3.1) |

### Admins

| Task | Documentation |
|---|---|
| Confirm payment manually | [07: Admin Documentation](07-admin-documentation.md) (Section 2.3) |
| Export CSV for analysis | [07: Admin Documentation](07-admin-documentation.md) (Section 2.4) |
| Cancel registration | [07: Admin Documentation](07-admin-documentation.md) (Section 2.3) |
| Extend expiry time | [07: Admin Documentation](07-admin-documentation.md) (Section 2.3) |
| Send custom email | [07: Admin Documentation](07-admin-documentation.md) (Section 2.3) |
| Change conference pricing | [07: Admin Documentation](07-admin-documentation.md) (Section 3: Settings) |

### Operations

| Task | Documentation |
|---|---|
| Deploy to production | [09: Deployment & Operations](09-deployment-operations.md) (Section 2.1) |
| Run database migration | [09: Deployment & Operations](09-deployment-operations.md) (Section 2.2) |
| Restore from backup | [09: Deployment & Operations](09-deployment-operations.md) (Section 5.3) |
| Handle payment webhook failure | [09: Deployment & Operations](09-deployment-operations.md) (Runbook 3.1) |
| Fix cron not running | [09: Deployment & Operations](09-deployment-operations.md) (Runbook 3.4) |
| Set up monitoring alerts | [09: Deployment & Operations](09-deployment-operations.md) (Section 4.2) |

### Leadership

| Task | Documentation |
|---|---|
| Evaluate system ROI | [00: Executive Summary](00-executive-summary.md) (Section 4: Financial Impact) |
| Understand ownership model | [00: Executive Summary](00-executive-summary.md) (Section 3) + [02: Architecture](02-architecture.md) (Section 2) |
| Review security posture | [08: Security](08-security.md) |
| Plan future enhancements | [10: Improvements & Risks](10-improvements-risks.md) (Section 6) |
| Assess risks | [10: Improvements & Risks](10-improvements-risks.md) (Section 4) |
| Review limitations | [10: Improvements & Risks](10-improvements-risks.md) (Section 1) |

---

## 🔍 Finding Specific Information

### Search by Keyword

| Looking for... | Check these files |
|---|---|
| **Environment variables** | [09: Deployment & Operations](09-deployment-operations.md) (Section 1) |
| **Database indexes** | [03: Database Schema](03-database-schema.md) (Section 3) |
| **Rate limiting rules** | [05: API Documentation](05-api-documentation.md) (Section 3) |
| **Payment gateway fees** | [06: Payment Flows](06-payment-flows.md) (Section 1.1) |
| **RLS policies** | [03: Database Schema](03-database-schema.md) (Section 5) |
| **Error codes** | [05: API Documentation](05-api-documentation.md) (Section 4) |
| **Operational runbooks** | [09: Deployment & Operations](09-deployment-operations.md) (Section 3) |
| **Security threats** | [08: Security](08-security.md) (Section 7) |
| **Technical debt** | [10: Improvements & Risks](10-improvements-risks.md) (Section 2) |
| **Glossary terms** | [11: Appendix](11-appendix.md) (Section 1) |

---

## 📝 Documentation Maintenance

### When to Update This Documentation

| Trigger | Files to Update | Priority |
|---|---|---|
| **New feature added** | 01-overview, 04-page-docs (if UI), 05-api-docs (if API), 11-appendix (changelog) | High |
| **Database schema changed** | 03-database-schema, 11-appendix (changelog), bump version | Critical |
| **Payment gateway added** | 06-payment-flows, 01-overview, 11-appendix | High |
| **Security vulnerability fixed** | 08-security, 10-improvements-risks, 11-appendix (changelog) | Critical |
| **Deployment procedure changed** | 09-deployment-operations | High |
| **Environment variable added** | 09-deployment-operations (Section 1) | Critical |
| **Known limitation fixed** | 10-improvements-risks (Section 1) | Medium |
| **Admin feature changed** | 07-admin-documentation | High |
| **After major incident** | 09-deployment-operations (add new runbook), 10-improvements-risks (update risks) | High |

### Documentation Review Schedule

- **Quarterly**: Review all files for accuracy, update metrics/stats
- **After each release**: Update 11-appendix changelog, bump relevant file versions
- **Annually**: Full audit, rewrite outdated sections

### Version Numbering

This documentation follows [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.0.0)
- Increment MAJOR for breaking changes
- Increment MINOR for new features
- Increment PATCH for bug fixes or documentation updates

**Current Version**: 1.0.0 (February 28, 2026)

---

## 🤝 Contributing to Documentation

### Style Guidelines

- Use **Markdown** formatting
- Include **tables** for structured data
- Use **code blocks** with language identifiers
- Add **cross-references** to related sections
- Use **bold** for important terms on first mention
- Keep sentences **concise** (max 2 lines)
- Use **bulleted lists** for 3+ related items

### File Structure Template

```markdown
# Title

> **Version:** X.Y.Z
> **Last Updated:** Month DD, YYYY
> **Audience:** Who should read this

---

## Table of Contents

1. [Section 1](#1-section-1)
2. [Section 2](#2-section-2)

---

## 1. Section 1

Content...

---

## Related Documentation

- **Previous**: [File](file.md)
- **Next**: [File](file.md)
- **See Also**: [File](file.md)
```

---

## 📞 Support & Contact

### For Technical Issues

- **Developer Support**: Contact development partner via DEESSA Foundation
- **Hosting Issues**: [Vercel Support](https://vercel.com/support)
- **Database Issues**: [Supabase Support](https://supabase.com/support)
- **Payment Issues**: Stripe/Khalti/eSewa merchant support

### For Documentation Issues

- Found outdated information? Contact development partner
- Suggest improvements? Create issue in project repository
- Need clarification? Refer to [11: Appendix](11-appendix.md) glossary first

---

## 📄 License & Copyright

**System**: Developed for DEESSA Foundation  
**Documentation**: © 2026 DEESSA Foundation  
**Maintainer**: Development Partner

This documentation is proprietary to DEESSA Foundation. Do not distribute without permission.

---

## 🎉 Acknowledgments

Special thanks to:

- DEESSA Foundation program team for requirements and testing
- Finance team for payment gateway setup
- Open-source community (Next.js, Supabase, Stripe, Tailwind CSS)

---

**Last Updated**: February 28, 2026  
**Documentation Version**: 1.0.0  
**System Version**: 1.0.0
