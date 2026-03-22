/**
 * POST /api/store-results
 * Called immediately after runAllCalculators() succeeds on the frontend.
 * Saves the full report to Vercel Blob, then posts a Slack notification
 * with a shareable link to the results page.
 *
 * Required env vars:
 *   BLOB_READ_WRITE_TOKEN — from Vercel Blob dashboard
 *   SLACK_WEBHOOK_URL     — Slack Incoming Webhook URL
 *   APP_URL               — your production URL, e.g. https://yourapp.vercel.app
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
  desiredOutcome?: string;
  obstacle?: string;
  currentSituation?: string;
}

// ── Vercel Blob helpers ───────────────────────────────────────────────────────

async function blobPut(pathname: string, body: string): Promise<string> {
  const token = process.env.BLOB2_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
  const { url } = await put(pathname, body, {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  });
  return url;
}

// ── Slack notification ────────────────────────────────────────────────────────

async function postToSlack(
  email: string,
  results: Results,
  intake: Intake,
  resultsUrl: string | null
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const grade = results?.diagnostic?.finalGrade ?? '?';
  const score = results?.diagnostic?.score ?? '?';
  const goal = intake?.desiredOutcome ?? 'Not provided';
  const obstacle = intake?.obstacle ?? 'Not provided';
  const situation = intake?.currentSituation ?? '';

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📊 New Pheydrus Report Submitted', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Email:*\n${email}` },
        { type: 'mrkdwn', text: `*Overall Grade:*\n${grade}  (${score}/100)` },
        { type: 'mrkdwn', text: `*Situation:*\n${situation}` },
      ],
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*90-Day Goal:*\n${goal}` },
        { type: 'mrkdwn', text: `*Main Obstacle:*\n${obstacle}` },
      ],
    },
    { type: 'divider' },
    ...(resultsUrl ? [{
      type: 'section',
      text: { type: 'mrkdwn', text: `*<${resultsUrl}|View Full Report →>*` },
    }] : []),
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

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, results, intake } = (req.body ?? {}) as {
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

  const id = randomUUID();

  // Try to save to Blob — if it fails, still send Slack without the link
  let resultsUrl: string | null = null;
  let blobError: string | null = null;
  try {
    await blobPut(`results/${id}.json`, JSON.stringify({ results, intake, email, storedAt: new Date().toISOString() }));
    const appUrl = process.env.APP_URL ?? `https://${process.env.VERCEL_URL}`;
    resultsUrl = `${appUrl}/client/results?id=${id}`;
  } catch (blobErr) {
    blobError = blobErr instanceof Error ? blobErr.message : String(blobErr);
    console.error('[store-results] Blob save failed (continuing):', blobErr);
  }

  try {
    await postToSlack(email, results, intake, resultsUrl);
    return res.status(200).json({ ok: true, id, blobError });
  } catch (err) {
    console.error('[store-results] Slack post failed:', err);
    return res.status(500).json({ error: 'Failed to post results' });
  }
}
