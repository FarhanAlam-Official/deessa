/**
 * QR Code Generation Utility for Receipt Verification
 * 
 * Generates QR codes containing verification URLs for donation receipts.
 * QR codes are rendered as base64 data URLs for embedding in PDF documents.
 */

import QRCode from 'qrcode';
import { getAppBaseUrl } from '@/lib/utils';

/**
 * Generate a QR code as base64 data URL for receipt verification
 * 
 * @param verificationId - UUID of the donation for verification
 * @returns Base64 data URL (data:image/png;base64,...) for use in @react-pdf/renderer
 * 
 * @example
 * const qrCode = await verificationQRBase64('123e4567-e89b-12d3-a456-426614174000');
 * // Returns: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 */
export async function verificationQRBase64(verificationId: string): Promise<string> {
  // Get base URL from environment (auto-detects Vercel deployments)
  const baseUrl = getAppBaseUrl();
  
  // Construct verification URL
  const verificationUrl = `${baseUrl}/verify/${verificationId}`;
  
  // Generate QR code as base64 data URL
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 80, // 80px width for good scanning at print size
    margin: 1, // Minimal margin
    color: {
      dark: '#111827', // gray-900 for high contrast
      light: '#FFFFFF', // white background
    },
    errorCorrectionLevel: 'M', // Medium error correction (15% recovery)
  });
  
  return qrCodeDataUrl;
}

/**
 * Generate verification URL for a given verification ID
 * 
 * @param verificationId - UUID of the donation for verification
 * @returns Full verification URL
 */
export function getVerificationUrl(verificationId: string): string {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/verify/${verificationId}`;
}
