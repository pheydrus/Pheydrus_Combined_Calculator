/**
 * POST /api/store-results
 * Called immediately after runAllCalculators() succeeds on the frontend.
 * Saves the full report to Vercel Blob, posts a Slack notification,
 * and adds the subscriber to Flodesk.
 *
 * Required env vars:
 *   BLOB_READ_WRITE_TOKEN              — from Vercel Blob dashboard
 *   SLACK_WEBHOOK_URL                  — Slack Incoming Webhook URL
 *   APP_URL                            — e.g. https://yourapp.vercel.app
 *
 * Optional env vars:
 *   FLODESK_API_KEY                    — Flodesk API key
 *   FLODESK_CALCULATOR_SEGMENT_ID      — Flodesk "VIP Calculator" segment ID
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

// ── Vercel Blob ───────────────────────────────────────────────────────────────

async function blobPut(pathname: string, body: string): Promise<string> {
  const token = process.env.BLOB2_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB2_READ_WRITE_TOKEN not set');
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
        { type: 'mrkdwn', text: `*Name:*\n${name || '—'}` },
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

// ── Flodesk ───────────────────────────────────────────────────────────────────

async function addToFlodesk(name: string, email: string): Promise<void> {
  const apiKey = process.env.FLODESK_API_KEY;
  if (!apiKey) return;

  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ');

  const segmentId = process.env.FLODESK_CALCULATOR_SEGMENT_ID;
  const body: Record<string, unknown> = { email, first_name: firstName, last_name: lastName };
  if (segmentId) body['segments'] = [{ id: segmentId }];

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
    console.warn('[store-results] Flodesk add failed:', res.status, text);
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
    await blobPut(`results/${id}.json`, JSON.stringify({ results, intake, name: displayName, email, storedAt: new Date().toISOString() }));
    const appUrl = process.env.APP_URL ?? `https://${process.env.VERCEL_URL}`;
    resultsUrl = `${appUrl}/client/results?id=${id}`;
  } catch (blobErr) {
    blobDebug = blobErr instanceof Error ? blobErr.message : String(blobErr);
    console.error('[store-results] Blob save failed (continuing):', blobErr);
  }

  try {
    await Promise.all([
      postToSlack(displayName, email, results, intake, resultsUrl),
      addToFlodesk(displayName, email),
    ]);
    return res.status(200).json({ ok: true, id, blobDebug });
  } catch (err) {
    console.error('[store-results] Failed:', err);
    return res.status(500).json({ error: 'Failed to post results' });
  }
}
