/**
 * PDF Renderer
 *
 * Thin server-side wrapper around @react-pdf/renderer.
 * Converts a ReceiptDocument React element to a PDF Buffer.
 *
 * This replaces the Puppeteer/Chromium pipeline for new receipts.
 * ~3MB bundle, no headless browser, works in Vercel Edge/Lambda environments.
 */

import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { ReceiptDocument, type ReceiptPDFData } from "./receipt-document"

/**
 * Render a donation receipt to a PDF Buffer.
 *
 * @param data - All receipt data (donor, org, payment, amounts)
 * @returns PDF as a Node.js Buffer ready to upload or stream
 */
export async function renderReceiptToPDF(data: ReceiptPDFData): Promise<Buffer> {
  const element = ReceiptDocument({ data })
  const arrayBuffer = await renderToBuffer(element as any)
  return Buffer.from(arrayBuffer)
}
