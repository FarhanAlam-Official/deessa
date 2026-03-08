/**
 * Conference Registration Email Template
 * Sent immediately on successful registration (status: pending)
 */

import { getAppBaseUrl } from '@/lib/utils'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

interface ConferenceRegistrationTemplateProps {
  fullName: string
  email: string
  registrationId: string
  attendanceMode: string
  role?: string
  workshops?: string[]
}

export function ConferenceRegistrationTemplate(props: ConferenceRegistrationTemplateProps): string {
  const { fullName, registrationId, attendanceMode, role, workshops } = props
  const shortId = escapeHtml(`DEESSA-2026-${registrationId.slice(0, 6).toUpperCase()}`)
  const firstName = fullName.split(" ")[0]
  const workshopList = workshops?.length ? workshops.join(", ") : "None selected"
  const safeFirstName = escapeHtml(firstName)
  const safeFullName = escapeHtml(fullName)
  const safeAttendanceMode = escapeHtml(attendanceMode || "—")
  const safeRole = escapeHtml(role || "Attendee")
  const safeWorkshopList = escapeHtml(workshopList)
  const siteUrl = getAppBaseUrl()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registration Received — DEESSA National Conference 2026</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header / Brand -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#3FABDE;border-radius:12px;padding:10px 16px;">
                    <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">DEESSA</span>
                    <span style="color:rgba(255,255,255,0.8);font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-left:8px;">Foundation</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
              <!-- Top bar -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tbody>
                  <tr>
                    <td style="background:linear-gradient(135deg,#3FABDE 0%,#0B5F8A 100%);padding:48px 40px;text-align:center;">
                      <!-- Check circle -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                        <tr>
                          <td style="width:72px;height:72px;background:rgba(255,255,255,0.2);border-radius:50%;text-align:center;vertical-align:middle;">
                            <span style="font-size:36px;color:#fff;line-height:1;">✓</span>
                          </td>
                        </tr>
                      </table>
                      <h1 style="margin:0 0 8px;color:#fff;font-size:28px;font-weight:800;line-height:1.2;">
                        You're On the List, ${safeFirstName}!
                      </h1>
                      <p style="margin:0;color:rgba(255,255,255,0.85);font-size:16px;line-height:1.5;">
                        We've received your registration for the<br /><strong>DEESSA National Conference 2026</strong>
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">

                  <!-- Status Notice -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E7;border:1.5px solid #F6C54B;border-radius:12px;margin-bottom:32px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:14px;color:#92680A;font-weight:600;">
                          ⏳ Pending Confirmation
                        </p>
                        <p style="margin:4px 0 0;font-size:13px;color:#92680A;line-height:1.5;">
                          Your registration is currently pending review. You'll receive another email once it's confirmed by our team.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Registration Summary -->
                  <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0F172A;text-transform:uppercase;letter-spacing:0.5px;">
                    Registration Summary
                  </h2>

                  <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E2E8F0;border-radius:12px;overflow:hidden;margin-bottom:32px;">
                    <tr style="background:#F8FAFC;">
                      <td style="padding:12px 20px;border-bottom:1px solid #E2E8F0;font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;width:40%;">
                        Registration ID
                      </td>
                      <td style="padding:12px 20px;border-bottom:1px solid #E2E8F0;font-size:14px;font-weight:600;color:#0F172A;font-family:monospace;">
                        ${shortId}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 20px;border-bottom:1px solid #E2E8F0;font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">
                        Full Name
                      </td>
                      <td style="padding:12px 20px;border-bottom:1px solid #E2E8F0;font-size:14px;color:#0F172A;">
                        ${safeFullName}
                      </td>
                    </tr>
                    <tr style="background:#F8FAFC;">
                      <td style="padding:12px 20px;border-bottom:1px solid #E2E8F0;font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">
                        Attendance Mode
                      </td>
                      <td style="padding:12px 20px;border-bottom:1px solid #E2E8F0;font-size:14px;color:#0F172A;text-transform:capitalize;">
                        ${safeAttendanceMode}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 20px;border-bottom:1px solid #E2E8F0;font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">
                        Role
                      </td>
                      <td style="padding:12px 20px;border-bottom:1px solid #E2E8F0;font-size:14px;color:#0F172A;text-transform:capitalize;">
                        ${safeRole}
                      </td>
                    </tr>
                    <tr style="background:#F8FAFC;">
                      <td style="padding:12px 20px;font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">
                        Workshops
                      </td>
                      <td style="padding:12px 20px;font-size:14px;color:#0F172A;">
                        ${safeWorkshopList}
                      </td>
                    </tr>
                  </table>

                  <!-- Event Details -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EFF8FF;border:1.5px solid #BAE0FF;border-radius:12px;margin-bottom:32px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#0B5F8A;">📅 Event Details</p>
                        <p style="margin:0 0 6px;font-size:13px;color:#1E6FA8;line-height:1.5;"><strong>Dates:</strong> October 15–17, 2026</p>
                        <p style="margin:0 0 6px;font-size:13px;color:#1E6FA8;line-height:1.5;"><strong>Venue:</strong> Hyatt Regency, Taragaon, Bouddha, Kathmandu</p>
                        <p style="margin:0;font-size:13px;color:#1E6FA8;line-height:1.5;"><strong>Online Access:</strong> Live-streamed for virtual attendees</p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                    <tr>
                      <td align="center">
                        <a href="${siteUrl}/conference"
                           style="display:inline-block;background:#3FABDE;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;padding:14px 36px;letter-spacing:0.3px;">
                          View Conference Details →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;text-align:center;">
                    Questions? Reach us at <a href="mailto:deessa.social@gmail.com" style="color:#3FABDE;">deessa.social@gmail.com</a>
                  </p>
                </td>
              </tr>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 0;">
              <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">DEESSA Foundation — Empowering Communities Across Nepal</p>
              <p style="margin:0;font-size:11px;color:#CBD5E1;">
                You're receiving this because you registered at
                <a href="${siteUrl}" style="color:#3FABDE;">deessafoundation.org.np</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
