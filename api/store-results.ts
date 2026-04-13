/**
 * POST /api/store-results
 * Called immediately after runAllCalculators() succeeds on the frontend.
 * Saves the full report to Vercel Blob, posts a Slack notification,
 * and adds the subscriber to Flodesk.
 *
 * Required env vars:
 *   BLOB_PUBLIC_READ_WRITE_TOKEN_READ_WRITE_TOKEN              — from Vercel Blob dashboard
 *   SLACK_WEBHOOK_URL                  — Slack Incoming Webhook URL
 *   APP_URL                            — e.g. https://yourapp.vercel.app
 *
 * Optional env vars:
 *   FLODESK_API_KEY                    — Flodesk API key
 *   FLODESK_CALCULATOR_USED_SEGMENT_ID — Flodesk "Calculator-Used" segment ID (preferred)
 *   FLODESK_CALCULATOR_SEGMENT_ID      — Legacy fallback for old calculator segment config
 */

import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Results {
  diagnostic?: {
    finalGrade?: string;
    score?: number;
  };
}

interface Intake {
  marketingConsent?: boolean;
  desiredOutcome?: string;
  obstacle?: string;
  currentSituation?: string;
}

function maskEmail(email: string): string {
  const [localPart, domain = ''] = email.split('@');
  if (!localPart || !domain) return 'unknown';
  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}***@${domain}`;
}

function normalizeSegmentId(rawValue: string | undefined): string | null {
  if (!rawValue) return null;

  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/\/segment\/([^/?#]+)/i);
  if (urlMatch) return urlMatch[1];

  return trimmed;
}

function getCalculatorUsedSegmentConfig(): { id: string | null; source: string | null } {
  const preferred = process.env.FLODESK_CALCULATOR_USED_SEGMENT_ID;
  if (preferred) {
    return { id: normalizeSegmentId(preferred), source: 'FLODESK_CALCULATOR_USED_SEGMENT_ID' };
  }

  const legacy = process.env.FLODESK_CALCULATOR_SEGMENT_ID;
  if (legacy) {
    console.warn(
      '[store-results] Using legacy FLODESK_CALCULATOR_SEGMENT_ID. Rename it to FLODESK_CALCULATOR_USED_SEGMENT_ID.'
    );
    return { id: normalizeSegmentId(legacy), source: 'FLODESK_CALCULATOR_SEGMENT_ID' };
  }

  return { id: null, source: null };
}

// ── Vercel Blob ───────────────────────────────────────────────────────────────

async function blobPut(pathname: string, body: string): Promise<string> {
  const token = process.env.BLOB_PUBLIC_READ_WRITE_TOKEN_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_PUBLIC_READ_WRITE_TOKEN_READ_WRITE_TOKEN not set');
  const { url } = await put(pathname, body, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  });
  return url;
}

// ── Slack notification ────────────────────────────────────────────────────────

async function postToSlack(
  name: string,
  email: string,
  results: Results,
  resultsUrl: string | null
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const grade = results?.diagnostic?.finalGrade ?? '?';
  const score = results?.diagnostic?.score ?? '?';

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📊 New Pheydrus Report Submitted', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Name:*\n${name || '—'}` },
        { type: 'mrkdwn', text: `*Email:*\n${email}` },
        { type: 'mrkdwn', text: `*Overall Grade:*\n${grade}  (${score}/100)` },
      ],
    },
    { type: 'divider' },
    ...(resultsUrl
      ? [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*<${resultsUrl}|View Full Report →>*` },
          },
        ]
      : []),
  ];

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Slack post failed (${res.status}): ${text}`);
  }
}

// ── Flodesk ───────────────────────────────────────────────────────────────────

async function addToFlodesk(
  name: string,
  email: string,
  marketingConsent: boolean | undefined
): Promise<void> {
  const apiKey = process.env.FLODESK_API_KEY;
  const maskedEmail = maskEmail(email);
  if (!apiKey) {
    console.info(`[store-results] Flodesk sync skipped for ${maskedEmail}: FLODESK_API_KEY not set`);
    return;
  }

  if (!marketingConsent) {
    console.info(
      `[store-results] Flodesk sync skipped for ${maskedEmail}: marketing consent not granted`
    );
    return;
  }

  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ');

  const { id: segmentId, source: segmentSource } = getCalculatorUsedSegmentConfig();
  const body: Record<string, unknown> = { email, first_name: firstName, last_name: lastName };
  if (segmentId) body['segment_ids'] = [segmentId];

  if (segmentId && segmentSource) {
    console.info(
      `[store-results] Flodesk sync starting for ${maskedEmail}: Calculator-Used segment ${segmentId} via ${segmentSource}`
    );
  } else {
    console.info(
      `[store-results] Flodesk sync starting for ${maskedEmail}: no Calculator-Used segment configured, subscriber will be upserted only`
    );
  }

  const res = await fetch('https://api.flodesk.com/v1/subscribers', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn(`[store-results] Flodesk sync failed for ${maskedEmail}:`, res.status, text);
    return;
  }

  if (segmentId) {
    console.info(
      `[store-results] Flodesk sync complete for ${maskedEmail}: added to Calculator-Used segment ${segmentId}`
    );
  } else {
    console.info(
      `[store-results] Flodesk sync complete for ${maskedEmail}: subscriber saved without segment`
    );
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, results, intake } = (req.body ?? {}) as {
    name?: string;
    email?: string;
    results?: Results;
    intake?: Intake;
  };

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  if (!results || !intake) {
    return res.status(400).json({ error: 'results and intake required' });
  }

  const displayName = name ?? '';
  const id = randomUUID();

  // Try to save to Blob — if it fails, still send Slack without the link
  let resultsUrl: string | null = null;
  let blobDebug: string | null = null;
  try {
    await blobPut(
      `results/${id}.json`,
      JSON.stringify({
        results,
        intake,
        name: displayName,
        email,
        storedAt: new Date().toISOString(),
      })
    );
    const appUrl =
      process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    if (appUrl) {
      resultsUrl = `${appUrl}/client/results?id=${id}`;
    } else {
      console.warn(
        '[store-results] Neither APP_URL nor VERCEL_URL is set — cannot build results link'
      );
    }
  } catch (blobErr) {
    blobDebug = blobErr instanceof Error ? blobErr.message : String(blobErr);
    console.error('[store-results] Blob save failed (continuing):', blobErr);
  }

  try {
    await Promise.all([
      postToSlack(displayName, email, results, resultsUrl),
      addToFlodesk(displayName, email, intake.marketingConsent),
    ]);
    return res.status(200).json({ ok: true, id, blobDebug });
  } catch (err) {
    console.error('[store-results] Failed:', err);
    return res.status(500).json({ error: 'Failed to post results' });
  }
}
