/**
 * PDF Generator Service
 * Converts HTML receipts to PDF using Puppeteer
 */

import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"
import fs from "fs"
import path from "path"

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

function getLocalBrowserExecutablePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH

  const platform = process.platform
  const candidates: string[] = []

  if (platform === "win32") {
    const programFiles = process.env.PROGRAMFILES
    const programFilesX86 = process.env["PROGRAMFILES(X86)"]
    const localAppData = process.env.LOCALAPPDATA

    if (programFiles) {
      candidates.push(path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"))
      candidates.push(path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"))
    }
    if (programFilesX86) {
      candidates.push(path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"))
      candidates.push(path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"))
    }
    if (localAppData) {
      candidates.push(path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"))
      candidates.push(path.join(localAppData, "Microsoft", "Edge", "Application", "msedge.exe"))
    }
  } else if (platform === "darwin") {
    candidates.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    candidates.push("/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge")
    candidates.push("/Applications/Chromium.app/Contents/MacOS/Chromium")
  } else {
    candidates.push("/usr/bin/google-chrome")
    candidates.push("/usr/bin/google-chrome-stable")
    candidates.push("/usr/bin/chromium")
    candidates.push("/usr/bin/chromium-browser")
    candidates.push("/snap/bin/chromium")
    candidates.push("/opt/google/chrome/chrome")
  }

  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate)) return candidate
    } catch {
      // ignore
    }
  }

  return undefined
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
      // Use local Chrome/Edge/Chromium for development.
      // puppeteer-core does not bundle a browser, so we must provide an executablePath.
      const executablePath = getLocalBrowserExecutablePath()
      if (!executablePath) {
        throw new Error(
          "No local Chrome/Edge executable found. Set PUPPETEER_EXECUTABLE_PATH (or CHROME_PATH) to your browser executable.",
        )
      }

      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        executablePath,
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
