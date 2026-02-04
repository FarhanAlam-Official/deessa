/**
 * PDF Generator Service
 * Converts HTML receipts to PDF using Puppeteer
 */

import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"

// Configure Chromium for serverless environments
// Only call setGraphicsMode if it exists (may not be available in all environments/versions)
if (typeof chromium.setGraphicsMode === "function") {
  try {
    chromium.setGraphicsMode(false)
  } catch (error) {
    // Silently fail if setGraphicsMode is not supported
    console.warn("Chromium setGraphicsMode not available:", error)
  }
}

export interface PDFGenerationOptions {
  html: string
  format?: "A4" | "Letter"
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
}

/**
 * Generate PDF from HTML string
 */
export async function generatePDFFromHTML(
  html: string,
  options?: Omit<PDFGenerationOptions, "html">,
): Promise<Buffer> {
  let browser

  try {
    // Determine if we're in a serverless environment
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME

    // Launch browser with appropriate configuration
    if (isServerless) {
      // Use Chromium binary for serverless (Vercel, AWS Lambda, etc.)
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      })
    } else {
      // Use local Chrome/Chromium for development
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
    }

    const page = await browser.newPage()

    // Set content
    await page.setContent(html, {
      waitUntil: "networkidle0",
    })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: options?.format || "A4",
      margin: options?.margin || {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      printBackground: true,
    })

    await browser.close()

    return Buffer.from(pdfBuffer)
  } catch (error) {
    console.error("PDF generation error:", error)
    if (browser) {
      await browser.close().catch(() => {
        // Ignore errors when closing
      })
    }
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Generate PDF from HTML with default receipt settings
 */
export async function generateReceiptPDF(html: string): Promise<Buffer> {
  return generatePDFFromHTML(html, {
    format: "A4",
    margin: {
      top: "20mm",
      right: "15mm",
      bottom: "20mm",
      left: "15mm",
    },
  })
}
