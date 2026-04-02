<div align="center">
  <img src="/public/logo.png" alt="deessa Foundation Logo" width="200"/>
  
# deessa Foundation
  
  **Empowering Nepal Through Sustainable Development**
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.0-green?style=flat&logo=supabase)](https://supabase.com/)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  
  **Website:** [deessa.org](https://deessa.org) | **Since:** 2015 | **Location:** Kathmandu, Nepal
  
  ---
  
  deessa Foundation is a non-profit organization dedicated to sustainable development, quality education, and social upliftment for the most vulnerable communities in Nepal.
  
  [Demo](#demo) • [Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Contributing](#contributing) • [License](#license)
  
</div>

## 🌟 About

Founded in 2015, deessa Foundation works to bridge the gap between potential and opportunity in Nepal's most remote communities. We focus on holistic community development through:

- **Education:** Building schools and providing educational resources
- **Healthcare:** Delivering medical supplies and health camps
- **Women's Empowerment:** Creating sustainable livelihoods through skill development
- **Disaster Relief:** Emergency response and reconstruction efforts

Our approach is community-driven, ensuring sustainable change that comes from within.

## 🎯 Mission & Vision

**Mission:** To empower marginalized communities through sustainable education, health, and livelihood initiatives, ensuring every voice is heard.

**Vision:** A self-reliant Nepal where every individual, regardless of background, has the opportunity to live with dignity, hope, and prosperity.

## ✨ Features

### Public Website

- **Responsive Design:** Works beautifully on all devices
- **Multi-language Support:** Available in English and Nepali
- **Donation System:** Secure online donations with multiple payment options
- **Event Management:** Registration and information for upcoming events
- **Story Showcase:** Impact stories from communities we serve
- **Volunteer Portal:** Opportunities to get involved

### Admin Dashboard

- **Role-Based Access Control:** Different permissions for Super Admin, Admin, Editor, and Finance roles
- **Content Management:** Manage projects, events, stories, and team members
- **Donation Tracking:** Monitor and manage all donations
- **Volunteer Management:** Review and manage volunteer applications
- **Analytics Dashboard:** Visualize impact metrics and statistics
- **Activity Logging:** Comprehensive audit trail of all admin actions

### Payment Integrations

- **Stripe:** International credit/debit card payments (USD)
- **Khalti:** Nepal's leading digital wallet (NPR)
- **eSewa:** Popular Nepali payment gateway (NPR)
- **Mock Mode:** For testing without real transactions

## 🛠 Tech Stack

| Category          | Technology                                                                              |
| ----------------- | --------------------------------------------------------------------------------------- |
| **Frontend**      | [Next.js 14](https://nextjs.org/) with App Router                                       |
| **Backend**       | [Supabase](https://supabase.com/) (Database, Auth, Storage)                             |
| **Styling**       | [Tailwind CSS](https://tailwindcss.com/) with custom design system                      |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) built on [Radix UI](https://www.radix-ui.com/)      |
| **Forms**         | [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation |
| **Payments**      | Stripe, Khalti, eSewa                                                                   |
| **Deployment**    | Vercel                                                                                  |
| **Analytics**     | Vercel Analytics                                                                        |

### Key Dependencies

- `@supabase/ssr` - Supabase SSR integration
- `lucide-react` - Icon library
- `recharts` - Data visualization
- `date-fns` - Date manipulation
- `embla-carousel-react` - Carousel component

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- pnpm >= 8.x
- Supabase account (for database and auth)

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/your-username/deessa-foundation.git
cd deessa-foundation
```

1. **Install dependencies:**

```bash
pnpm install
```

1. **Environment Setup:**
   Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API (for conference venue map)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Payment Providers (optional for development)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
KHALTI_SECRET_KEY=your_khalti_secret_key
ESEWA_MERCHANT_ID=your_esewa_merchant_id

# Payment Configuration
PAYMENT_MODE=mock # or 'live' for production
```

1. **Database Setup:**
   Run the SQL scripts in the `scripts/` directory in order:

- `001-create-tables.sql`
- `002-admin-schema.sql`

1. **Run Development Server:**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

- `pnpm dev` - Runs the app in development mode
- `pnpm build` - Builds the app for production
- `pnpm start` - Runs the built app in production mode
- `pnpm lint` - Runs ESLint for code quality checks

## 🏗 Project Structure

```
app/
├── (public)/          # Public pages (about, donate, events, etc.)
├── admin/             # Admin dashboard with protected routes
├── api/               # API routes for payments and webhooks
├── layout.tsx         # Root layout
└── page.tsx           # Homepage

components/
├── admin/             # Admin-specific components
├── ui/                # Reusable UI components (shadcn/ui)
├── contact-form.tsx   # Contact form component
├── donation-form.tsx  # Donation form with payment options
└── ...

lib/
├── actions/           # Server actions for data mutations
├── data/              # Data fetching utilities
├── payments/          # Payment provider integrations
├── supabase/          # Supabase client configurations
├── types/             # TypeScript type definitions
└── utils.ts           # Utility functions

data/
├── events.ts          # Static event data
├── projects.ts        # Static project data
├── stories.ts         # Static story data
├── team.ts            # Static team member data
└── ...

scripts/
├── 001-create-tables.sql  # Public forms schema
└── 002-admin-schema.sql   # Admin panel schema
```

## 🔐 Authentication & Authorization

The admin panel implements a robust role-based access control system:

| Role            | Permissions                                           |
| --------------- | ----------------------------------------------------- |
| **Super Admin** | Full access to all features including user management |
| **Admin**       | Manage content, view submissions, configure settings  |
| **Editor**      | Create and edit content (projects, events, stories)   |
| **Finance**     | View and manage donations and financial reports       |

Authentication is handled through Supabase Auth with additional admin user records stored in the database.

## 💳 Payment Processing

The platform supports multiple payment providers with a unified interface:

1. **Stripe** - For international donations in USD
2. **Khalti** - For Nepali users in NPR
3. **eSewa** - Alternative Nepali payment option

Each provider is implemented with both live and mock modes for development/testing.

### Payment Architecture V2

The payment system has been refactored to provide production-grade security and reliability:

- **Centralized Confirmation:** Single source of truth for payment state transitions
- **Provider Abstraction:** Clean adapter pattern for easy provider integration
- **Transactional Integrity:** Atomic database operations with row-level locking
- **Idempotent Processing:** Safe webhook replay handling
- **Async Post-Payment:** Non-blocking receipt generation and email delivery
- **Comprehensive Monitoring:** Detailed logging and alerting for payment issues

For detailed architecture documentation, see:

- [Design Document](docs/payments-v2/DESIGN.md)
- [Implementation Tasks](docs/payments-v2/TASKS.md)
- [API Documentation](docs/api/PAYMENTS_V2.md)

## 🔒 Security & Operations

### Credential Management

All payment credentials and API keys must be rotated quarterly for security. We provide comprehensive tools and documentation:

**Documentation:**

- [Credential Rotation Guide](docs/operations/CREDENTIAL_ROTATION_GUIDE.md) - Detailed step-by-step procedures
- [Rotation Checklist](docs/operations/CREDENTIAL_ROTATION_CHECKLIST.md) - Quick reference checklist

**Automation Scripts:**

- `scripts/generate-secrets.ps1` / `.sh` - Generate all required secrets
- `scripts/test-credentials.ps1` / `.sh` - Validate credential configuration

**Quick Start:**

```bash
# Generate new secrets
.\scripts\generate-secrets.ps1

# Test credential configuration
.\scripts\test-credentials.ps1
```

### Security Best Practices

- ✅ All credentials stored in environment variables (never in code)
- ✅ `.env` files excluded from version control
- ✅ Webhook signature verification for all providers
- ✅ Receipt downloads require authentication tokens
- ✅ Rate limiting on all payment endpoints
- ✅ Comprehensive audit logging for all payment events

### Credential Rotation Schedule

| Credential            | Rotation Frequency | Last Rotated |
| --------------------- | ------------------ | ------------ |
| Stripe Webhook Secret | Quarterly          | -            |
| Khalti Secret Key     | Quarterly          | -            |
| eSewa Secret Key      | Quarterly          | -            |
| Receipt Token Secret  | Quarterly          | -            |
| CRON Secret           | Quarterly          | -            |

**Next Rotation Due:** [Set after first rotation]

## 📊 Analytics & Reporting

The admin dashboard includes:

- Real-time donation tracking
- Impact statistics visualization
- Activity logs for audit trails
- Volunteer and contact submission management

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) and [Contributing Guidelines](CONTRIBUTING.md) for more details.

### Areas for Contribution

- UI/UX improvements
- New features for community engagement
- Localization (Nepali translation)
- Performance optimizations
- Documentation enhancements
- Bug fixes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all volunteers and supporters who make our work possible
- Gratitude to the open-source community for the amazing tools we use
- Recognition of the communities we serve for their resilience and partnership

## 📞 Contact

**deessa Foundation**

- **Address:** Kathmandu, Nepal
- **Email:** <info@deessa.org>
- **Phone:** +977-XXXXXXXXX
- **Social Media:** [Facebook](#) | [Twitter](#) | [Instagram](#)

---

<div align="center">
  
  Made with ❤️ for Nepal
  
  [Back to Top](#deessa-foundation)
  
</div>
