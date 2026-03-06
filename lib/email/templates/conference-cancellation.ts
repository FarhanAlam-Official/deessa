/**
 * Conference Cancellation Email Template
 * Sent when admin cancels a registration
 * Theme: warm red-orange to clearly signal cancellation
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

interface ConferenceCancellationTemplateProps {
  fullName: string
  registrationId: string
}

export function ConferenceCancellationTemplate(props: ConferenceCancellationTemplateProps): string {
  const { fullName, registrationId } = props
  const shortId = escapeHtml(`DEESSA-2026-${registrationId.slice(0, 6).toUpperCase()}`)
  const firstName = fullName.split(" ")[0]
  const safeFullName = escapeHtml(fullName)
  const safeFirstName = escapeHtml(firstName)
  const siteUrl = getAppBaseUrl()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registration Cancelled — DEESSA National Conference 2026</title>
</head>
<body style="margin:0;padding:0;background:#FFF5F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5F5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Brand -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#DC2626,#B91C1C);border-radius:12px;padding:10px 16px;">
                    <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">DEESSA</span>
                    <span style="color:rgba(255,255,255,0.85);font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-left:8px;">Foundation</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(185,28,28,0.12);">

              <!-- Red-orange gradient header -->
              <tr>
                <td style="background:linear-gradient(135deg,#991B1B 0%,#DC2626 50%,#B91C1C 100%);padding:48px 40px;text-align:center;">
                  <!-- X icon circle — table-cell for email-safe centering -->
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                    <tr>
                      <td align="center" valign="middle"
                          style="width:72px;height:72px;background:rgba(255,255,255,0.25);border-radius:50%;font-size:34px;line-height:72px;text-align:center;font-weight:700;color:#fff;">
                        ✕
                      </td>
                    </tr>
                  </table>
                  <h1 style="margin:0 0 8px;color:#fff;font-size:28px;font-weight:800;line-height:1.2;text-shadow:0 1px 2px rgba(0,0,0,0.15);">
                    Registration Cancelled
                  </h1>
                  <p style="margin:0;color:rgba(255,255,255,0.92);font-size:15px;line-height:1.6;">
                    Hi ${safeFirstName}, your registration for the<br />
                    <strong>DEESSA National Conference 2026</strong><br />
                    has been cancelled.
                  </p>
                </td>
              </tr>

              <!-- Accent bar -->
              <tr>
                <td style="height:4px;background:linear-gradient(90deg,#991B1B,#DC2626,#EF4444);"></td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px 40px;">

                  <!-- Summary card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #FEE2E2;border-radius:14px;overflow:hidden;margin-bottom:28px;">
                    <tr style="background:#FFF5F5;">
                      <td style="padding:14px 20px;font-size:12px;font-weight:700;color:#EF4444;text-transform:uppercase;letter-spacing:0.6px;border-bottom:1px solid #FEE2E2;width:42%;">
                        Registration ID
                      </td>
                      <td style="padding:14px 20px;font-size:14px;font-weight:700;color:#1E293B;font-family:monospace;border-bottom:1px solid #FEE2E2;">
                        ${shortId}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:14px 20px;font-size:12px;font-weight:700;color:#EF4444;text-transform:uppercase;letter-spacing:0.6px;border-bottom:1px solid #FEE2E2;">
                        Attendee
                      </td>
                      <td style="padding:14px 20px;font-size:14px;color:#1E293B;border-bottom:1px solid #FEE2E2;">
                        ${safeFullName}
                      </td>
                    </tr>
                    <tr style="background:#FFF5F5;">
                      <td style="padding:14px 20px;font-size:12px;font-weight:700;color:#EF4444;text-transform:uppercase;letter-spacing:0.6px;">
                        Status
                      </td>
                      <td style="padding:14px 20px;">
                        <span style="display:inline-block;background:#FEE2E2;color:#DC2626;font-size:12px;font-weight:700;padding:4px 12px;border-radius:100px;">
                          Cancelled
                        </span>
                      </td>
                    </tr>
                  </table>

                  <!-- Re-register note -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;border:1.5px solid #FCA5A5;border-radius:14px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#991B1B;">🔄 &nbsp;Want to re-register?</p>
                        <p style="margin:0;font-size:13px;color:#7F1D1D;line-height:1.7;">
                          You can register again before early bird registration closes on <strong>October 1st, 2026</strong>.
                          If you believe this was done in error, please contact us immediately.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTAs -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                    <tr>
                      <td align="center" style="padding-bottom:12px;">
                        <a href="${siteUrl}/conference/register"
                           style="display:inline-block;background:linear-gradient(135deg,#DC2626,#B91C1C);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;padding:14px 36px;letter-spacing:0.3px;">
                          Register Again →
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <a href="mailto:conference@deessa.org.np?subject=Registration%20Cancellation%20Query%20%E2%80%94%20${shortId}"
                           style="display:inline-block;background:#F9FAFB;border:1.5px solid #E2E8F0;color:#374151;font-size:14px;font-weight:600;text-decoration:none;border-radius:12px;padding:12px 28px;">
                          Contact Support
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.7;text-align:center;">
                    Questions? Email us at
                    <a href="mailto:conference@deessa.org.np" style="color:#DC2626;">conference@deessa.org.np</a>
                  </p>
                </td>
              </tr>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 0;">
              <p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;">DEESSA Foundation — Empowering Communities Across Nepal</p>
              <p style="margin:0;font-size:11px;color:#CBD5E1;">
                <a href="${siteUrl}" style="color:#DC2626;">deessafoundation.org.np</a>
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
