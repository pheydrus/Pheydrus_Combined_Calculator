/**
 * POST /api/workbook-pdf
 * Generates a PDF of the workbook using Puppeteer + @sparticuz/chromium.
 * Accepts filled-in textarea/input values from the frontend and injects them
 * before rendering.
 *
 * Required env vars:
 *   VERCEL_URL  — automatically set by Vercel (used to load the HTML page)
 *   APP_URL     — optional override (e.g. https://yourapp.vercel.app)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { textareas = [], inputs = [] } = (req.body ?? {}) as {
    textareas?: string[];
    inputs?: string[];
  };

  // Build the URL of the workbook HTML file (it's a static public asset)
  const baseUrl =
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!baseUrl) {
    return res.status(500).json({ error: 'APP_URL or VERCEL_URL must be set' });
  }

  const htmlUrl = `${baseUrl}/pheydrus-workbook-v3_4.html`;

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(htmlUrl, { waitUntil: 'networkidle0', timeout: 30_000 });

    // Inject saved textarea/input values
    await page.evaluate(
      (textareaValues: string[], inputValues: string[]) => {
        const tas = document.querySelectorAll('textarea');
        tas.forEach((ta, i) => {
          if (i < textareaValues.length) ta.value = textareaValues[i];
        });
        const inps = document.querySelectorAll('input');
        inps.forEach((inp, i) => {
          if (i < inputValues.length) inp.value = inputValues[i];
        });
      },
      textareas,
      inputs
    );

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="pheydrus-workbook-v3_4.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).end(pdfBuffer);
  } catch (err) {
    console.error('[workbook-pdf] Error generating PDF:', err);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  } finally {
    if (browser) await browser.close();
  }
}
