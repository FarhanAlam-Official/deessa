/**
 * Receipt Email Template
 * HTML email template for donation receipts
 */

export interface ReceiptEmailTemplateProps {
  donorName: string
  receiptNumber: string
  receiptUrl: string
  amount: number
  currency: string
}

export function ReceiptEmailTemplate({
  donorName,
  receiptNumber,
  receiptUrl,
  amount,
  currency,
}: ReceiptEmailTemplateProps): string {
  const currencySymbol = currency === "USD" ? "$" : "₨"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dessafoundation.org"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Donation Receipt</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #1f2937;
          line-height: 1.6;
          background: #f9fafb;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        
        .header-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .header-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .content {
          padding: 40px 20px;
        }
        
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
          color: #111827;
        }
        
        .greeting strong {
          color: #059669;
        }
        
        .receipt-box {
          background: #f0fdf4;
          border: 2px solid #86efac;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .receipt-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
        }
        
        .receipt-label {
          color: #6b7280;
          font-weight: 500;
        }
        
        .receipt-value {
          color: #111827;
          font-weight: 600;
        }
        
        .amount-display {
          font-size: 32px;
          font-weight: 700;
          color: #059669;
          text-align: center;
          margin: 20px 0;
          padding: 20px 0;
          border-top: 1px solid #d1fae5;
          border-bottom: 1px solid #d1fae5;
        }
        
        .message {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          font-size: 13px;
          color: #1e40af;
          line-height: 1.6;
        }
        
        .cta-button {
          display: inline-block;
          background: #059669;
          color: white;
          padding: 12px 30px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          margin: 20px 0;
        }
        
        .cta-button:hover {
          background: #047857;
        }
        
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        
        .next-steps {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .next-steps-title {
          font-weight: 600;
          color: #111827;
          margin-bottom: 12px;
          font-size: 14px;
        }
        
        .next-steps-list {
          list-style: none;
          font-size: 13px;
          color: #6b7280;
        }
        
        .next-steps-list li {
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
        }
        
        .next-steps-list li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #059669;
          font-weight: bold;
        }
        
        .footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        
        .footer-links {
          margin: 10px 0;
        }
        
        .footer-links a {
          color: #059669;
          text-decoration: none;
          margin: 0 10px;
        }
        
        .footer-links a:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 600px) {
          .content {
            padding: 20px;
          }
          
          .header {
            padding: 30px 20px;
          }
          
          .amount-display {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="header-title">Thank You! 🙏</div>
          <div class="header-subtitle">Your donation has been received</div>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="greeting">
            Dear <strong>${donorName}</strong>,
          </div>

          <p style="margin-bottom: 20px; font-size: 14px; color: #6b7280;">
            We are deeply grateful for your generous donation to Dessa Foundation. Your support enables us to continue our mission of creating positive change in communities across Nepal.
          </p>

          <!-- Receipt Details -->
          <div class="receipt-box">
            <div class="receipt-row">
              <span class="receipt-label">Receipt Number:</span>
              <span class="receipt-value">${receiptNumber}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Date:</span>
              <span class="receipt-value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="amount-display">
              ${currencySymbol}${amount.toFixed(2)}
            </div>
          </div>

          <!-- Tax Information -->
          <div class="message">
            <strong>Tax Deductibility:</strong> Dessa Foundation is a registered nonprofit organization. Your donation is tax-deductible to the extent permitted by law. Please keep this receipt for your tax records.
          </div>

          <!-- Download Receipt -->
          <div class="button-container">
            <a href="${receiptUrl}" class="cta-button">Download Full Receipt</a>
          </div>

          <!-- Next Steps -->
          <div class="next-steps">
            <div class="next-steps-title">What Happens Next?</div>
            <ul class="next-steps-list">
              <li>Your donation is being processed and allocated to our programs</li>
              <li>You'll receive regular updates about the impact of your contribution</li>
              <li>Your receipt is available for download anytime</li>
              <li>We'll keep you informed about our initiatives and progress</li>
            </ul>
          </div>

          <p style="margin: 20px 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
            If you have any questions about your donation or would like to learn more about our work, please don't hesitate to reach out to us.
          </p>

          <p style="margin: 20px 0; font-size: 13px; color: #111827; font-weight: 600;">
            With heartfelt gratitude,<br>
            The Dessa Foundation Team
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p style="margin-bottom: 10px;">
            Dessa Foundation | Making a Difference in Nepal
          </p>
          <div class="footer-links">
            <a href="${siteUrl}">Visit Website</a>
            <a href="${siteUrl}/contact">Contact Us</a>
            <a href="${siteUrl}/privacy">Privacy Policy</a>
          </div>
          <p style="margin-top: 15px; font-size: 11px; color: #9ca3af;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
