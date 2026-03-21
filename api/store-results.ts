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
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN not set');

  const res = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-content-type': 'application/json',
      'x-add-random-suffix': '0',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Blob PUT failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { url: string };
  return json.url;
}

// ── Slack notification ────────────────────────────────────────────────────────

async function postToSlack(
  email: string,
  results: Results,
  intake: Intake,
  resultsUrl: string
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
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*<${resultsUrl}|View Full Report →>*` },
    },
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

  try {
    await blobPut(`results/${id}.json`, JSON.stringify({ results, intake, email, storedAt: new Date().toISOString() }));

    const appUrl = process.env.APP_URL ?? `https://${process.env.VERCEL_URL}`;
    const resultsUrl = `${appUrl}/client/results?id=${id}`;

    await postToSlack(email, results, intake, resultsUrl);

    return res.status(200).json({ ok: true, id });
  } catch (err) {
    console.error('[store-results]', err);
    return res.status(500).json({ error: 'Failed to store results' });
  }
}
