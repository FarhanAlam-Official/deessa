// ── Conference settings types & defaults ──────────────────────────────────────
// This file has NO "use server" directive — it's safe to import from both
// client and server components.

export interface ConferenceEmailTemplate {
  subject: string
  body: string
}

export interface AgendaItem {
  id: string
  time: string
  title: string
  desc: string
  active: boolean
}

export interface ConferenceSettings {
  name: string
  dateDisplay: string
  dateStart: string
  dateEnd: string
  venue: string
  venueAddress: string
  mapsUrl: string
  contactEmail: string
  registrationDeadline: string
  agenda: AgendaItem[]
  emailTemplates: {
    general: ConferenceEmailTemplate
    reminder: ConferenceEmailTemplate
    directions: ConferenceEmailTemplate
  }

  // ── Payment Gate ──────────────────────────────────────────────────────────
  // Whether registration requires payment. false = completely free conference.
  registrationFeeEnabled: boolean
  // Fee in the specified currency. Read server-side only — never trusted from client.
  registrationFee: number
  registrationFeeCurrency: "NPR" | "USD" | "EUR" | "GBP" | "INR"
  // Per attendance-mode fees (optional). When set, overrides registrationFee.
  // e.g. { "in-person": 2500, "online": 0 }
  registrationFeeByMode: Record<string, number>
  // How long (hours) a pending_payment registration stays alive before expiry.
  registrationExpiryHours: number
}

export const CONFERENCE_DEFAULTS: ConferenceSettings = {
  name: "DEESSA National Conference 2026",
  dateDisplay: "Oct 15–17, 2026",
  dateStart: "2026-10-15",
  dateEnd: "2026-10-17",
  venue: "Hyatt Regency, Kathmandu, Nepal",
  venueAddress: "Taragaon, Bouddha, Kathmandu, Nepal",
  mapsUrl: "https://maps.app.goo.gl/hyattkathmandu",
  contactEmail: "deessa.social@gmail.com",
  registrationDeadline: "October 1st, 2026",
  agenda: [
    {
      id: "agenda-opening-ceremony",
      time: "09:00 AM",
      title: "Opening Ceremony & Keynote",
      desc: "Welcome address followed by keynote on the future of philanthropy.",
      active: true,
    },
    {
      id: "agenda-panel-future-of-innovation",
      time: "10:30 AM",
      title: "Panel: Future of Innovation",
      desc: "Expert panel discussion on emerging trends and new opportunities.",
      active: false,
    },
    {
      id: "agenda-networking-lunch",
      time: "12:00 PM",
      title: "Networking Lunch",
      desc: "Buffet lunch and structured networking circles.",
      active: false,
    },
    {
      id: "agenda-breakout-skills-lab",
      time: "01:30 PM",
      title: "Breakout Sessions: Skills Lab",
      desc: "Choose from 6 different skill-building workshops.",
      active: false,
    },
  ],
  // Payment gate — disabled by default so existing behaviour is unchanged until
  // an admin explicitly enables it and sets a fee in Conference Settings.
  registrationFeeEnabled: false,
  registrationFee: 0,
  registrationFeeCurrency: "NPR",
  registrationFeeByMode: {},
  registrationExpiryHours: 24,

  emailTemplates: {
    general: {
      subject: "DEESSA National Conference 2026 — Important Information",
      body: `We want to share some important information regarding the DEESSA National Conference 2026.

📅 Dates: {{dateDisplay}}
📍 Venue: {{venue}}
🎫 Your Registration ID: {{registrationId}}
🎟️ Attendance Mode: {{attendanceMode}}

If you have any questions or require any assistance before the event, please don't hesitate to reach out to us at {{contactEmail}}.

We look forward to seeing you at the conference!`,
    },
    reminder: {
      subject: "Reminder: DEESSA National Conference 2026 — See You Soon!",
      body: `This is a friendly reminder that the DEESSA National Conference 2026 is coming up!

📅 Conference Dates: {{dateDisplay}}
📍 Venue: {{venue}}
🎫 Your Registration ID: {{registrationId}}
🎟️ Attendance Mode: {{attendanceMode}}

Please plan your travel and accommodation accordingly.

If you have not yet arranged your travel or accommodation, we recommend doing so soon to secure the best options.

We look forward to welcoming you!`,
    },
    directions: {
      subject: "Getting to the DEESSA National Conference 2026",
      body: `Here is everything you need to know to get to the DEESSA National Conference 2026 venue.

🏨 Venue: {{venue}}
📍 Address: {{venueAddress}}
🗺️ Google Maps: {{mapsUrl}}

🚗 By Taxi / Private Vehicle:
The venue is approximately 8 km from Tribhuvan International Airport (roughly 25–35 minutes, depending on traffic). Ask for "Hyatt Regency Bouddha".

🚌 From Thamel (City Center):
Take a taxi or ride-hailing service directly to Hyatt Regency, Bouddha. Journey time is approximately 20–30 minutes.

🎫 Your Registration ID: {{registrationId}}
Please carry a printed or digital copy of your registration ID for check-in at the venue.

If you need further assistance, please contact us at {{contactEmail}}.

See you at the conference!`,
    },
  },
}
