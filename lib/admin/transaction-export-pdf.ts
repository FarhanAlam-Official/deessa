/**
 * Transaction Export PDF Renderer
 * 
 * Server-side wrapper around @react-pdf/renderer
 * Converts TransactionExportDocument to PDF Buffer
 */

import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { TransactionExportDocument, type TransactionExportData } from "./transaction-export-document"

/**
 * Render transaction export to PDF Buffer
 * 
 * @param data - Transaction export data
 * @returns PDF as Node.js Buffer
 */
export async function renderTransactionExportToPDF(data: TransactionExportData): Promise<Buffer> {
  const element = TransactionExportDocument({ data })
  const arrayBuffer = await renderToBuffer(element as any)
  return Buffer.from(arrayBuffer)
}
