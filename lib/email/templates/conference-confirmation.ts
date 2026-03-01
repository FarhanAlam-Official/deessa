/**
 * Conference Confirmation Email Template
 * Sent when admin sets status to "confirmed"
 */

interface ConferenceConfirmationTemplateProps {
  fullName: string
  registrationId: string
  attendanceMode: string
  role?: string
  workshops?: string[]
}

export function ConferenceConfirmationTemplate(props: ConferenceConfirmationTemplateProps): string {
  const { fullName, registrationId, attendanceMode, role, workshops } = props

  // Escape all user-supplied values before interpolating into HTML
  const escapeHtml = (str: string): string =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")

  const shortId = `DEESSA-2026-${registrationId.slice(0, 6).toUpperCase()}`
  const firstName = escapeHtml(fullName.split(" ")[0])
  const safeFullName = escapeHtml(fullName)
  const safeRole = escapeHtml(role ?? "")
  const safeAttendanceMode = escapeHtml(attendanceMode ?? "")
  const workshopList = workshops?.length ? workshops.map(escapeHtml).join(", ") : "None selected"
  const isInPerson = attendanceMode === "in-person"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://deessafoundation.org.np"

  // Google Calendar link
  const gcalTitle = encodeURIComponent("DEESSA National Conference 2026")
  const gcalDates = encodeURIComponent("20261015T000000Z/20261018T000000Z") // Oct 15–17 (end exclusive)
  const gcalDetails = encodeURIComponent(`Your registration: ${shortId}`)
  const gcalLocation = encodeURIComponent("Hyatt Regency, Kathmandu, Nepal")
  const gcalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalDates}&details=${gcalDetails}&location=${gcalLocation}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registration Confirmed — DEESSA National Conference 2026</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Brand -->
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
              <table width="100%" cellpadding="0" cellspacing="0">

              <!-- Celebration Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#0B5F8A 0%,#3FABDE 50%,#0B5F8A 100%);padding:48px 40px;text-align:center;">
                  <div style="font-size:48px;margin-bottom:16px;">🎉</div>
                  <h1 style="margin:0 0 8px;color:#fff;font-size:30px;font-weight:800;line-height:1.2;">
                    You're Confirmed, ${firstName}!
                  </h1>
                  <p style="margin:0;color:rgba(255,255,255,0.9);font-size:16px;line-height:1.5;">
                    Your spot at the <strong>DEESSA National Conference 2026</strong><br />is officially secured.
                  </p>
                </td>
              </tr>

              <!-- Confirmed badge row -->
              <tr>
                <td align="center" style="padding:20px 40px 0;background:#fff;">
                  <span style="display:inline-block;background:#DCFCE7;color:#15803D;font-size:13px;font-weight:700;padding:6px 18px;border-radius:100px;border:1.5px solid #BBF7D0;letter-spacing:0.3px;">
                    ✓ &nbsp;Registration Confirmed
                  </span>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:32px 40px 40px;">

                  <!-- Ticket Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E2E8F0;border-radius:16px;overflow:hidden;margin-bottom:32px;">
                    <!-- Ticket Header -->
                    <tr style="background:linear-gradient(90deg,#EFF8FF,#F8FAFC);">
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#3FABDE;text-transform:uppercase;letter-spacing:1px;">DEESSA NATIONAL CONFERENCE 2026</p>
                        <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#0F172A;">Oct 15–17, 2026</p>
                        <p style="margin:2px 0 0;font-size:13px;color:#64748B;">Hyatt Regency, Kathmandu, Nepal</p>
                      </td>
                      <td style="padding:16px 20px;text-align:right;vertical-align:top;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">ID</p>
                        <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#0F172A;font-family:monospace;">${shortId}</p>
                      </td>
                    </tr>
                    <!-- Dashed divider -->
                    <tr>
                      <td colspan="2" style="padding:0 12px;">
                        <div style="border-top:2px dashed #E2E8F0;"></div>
                      </td>
                    </tr>
                    <!-- Ticket Details -->
                    <tr>
                      <td colspan="2" style="padding:16px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;padding-bottom:4px;width:50%;">Attendee</td>
                            <td style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;padding-bottom:4px;width:50%;">Mode</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px;font-weight:600;color:#0F172A;padding-bottom:12px;">${safeFullName}</td>
                            <td style="font-size:14px;font-weight:600;color:#0F172A;padding-bottom:12px;text-transform:capitalize;">${safeAttendanceMode || "—"}</td>
                          </tr>
                          <tr>
                            <td style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;padding-bottom:4px;">Role</td>
                            <td style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;padding-bottom:4px;">Workshop(s)</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px;font-weight:600;color:#0F172A;text-transform:capitalize;">${safeRole || "Attendee"}</td>
                            <td style="font-size:14px;font-weight:600;color:#0F172A;">${workshopList}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Buttons -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                    <tr>
                      <td align="center" style="padding-bottom:12px;">
                        <a href="${gcalLink}"
                           style="display:inline-block;background:#3FABDE;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;padding:14px 36px;">
                          📅 &nbsp;Add to Google Calendar
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <a href="${siteUrl}/conference"
                           style="display:inline-block;background:#F0F4F8;color:#0F172A;font-size:14px;font-weight:600;text-decoration:none;border-radius:12px;padding:12px 28px;">
                          View Conference Info
                        </a>
                      </td>
                    </tr>
                  </table>

                  ${isInPerson ? `
                  <!-- Venue Details for In-Person -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:12px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#15803D;">🗺️ Getting There</p>
                        <p style="margin:0 0 4px;font-size:13px;color:#166534;line-height:1.6;"><strong>Venue:</strong> Hyatt Regency Kathmandu</p>
                        <p style="margin:0 0 4px;font-size:13px;color:#166534;line-height:1.6;"><strong>Address:</strong> Taragaon, Bouddha, Kathmandu 44621, Nepal</p>
                        <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;"><strong>Check-in opens:</strong> 8:00 AM, October 15, 2026</p>
                      </td>
                    </tr>
                  </table>
                  ` : `
                  <!-- Online Access Info -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EFF8FF;border:1.5px solid #BAE0FF;border-radius:12px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1E6FA8;">💻 Online Access</p>
                        <p style="margin:0;font-size:13px;color:#1E6FA8;line-height:1.6;">
                          Your unique streaming link will be sent 24 hours before the event begins.
                          Keep an eye on your inbox!
                        </p>
                      </td>
                    </tr>
                  </table>
                  `}

                  <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;text-align:center;">
                    Questions? <a href="mailto:conference@deessa.org.np" style="color:#3FABDE;">conference@deessa.org.np</a>
                  </p>
                </td>
              </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 0;">
              <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">DEESSA Foundation — Empowering Communities Across Nepal</p>
              <p style="margin:0;font-size:11px;color:#CBD5E1;">
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
