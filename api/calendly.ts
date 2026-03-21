/**
 * POST /api/calendly
 * Handles Calendly webhook (invitee.created event).
 *
 * Flow:
 *   1. Verify Calendly HMAC signature
 *   2. Look up stored Pheydrus results by invitee email
 *   3. Post summary to Slack
 *   4. Add subscriber to Flodesk (optional)
 *
 * Required env vars:
 *   KV_REST_API_URL              — Vercel KV
 *   KV_REST_API_TOKEN            — Vercel KV
 *   SLACK_WEBHOOK_URL            — Slack Incoming Webhook URL
 *   CALENDLY_WEBHOOK_SIGNING_KEY — from Calendly webhook dashboard
 *
 * Optional env vars:
 *   FLODESK_API_KEY              — Flodesk API key (skip Flodesk if absent)
 *   FLODESK_SEGMENT_ID           — Flodesk segment to add subscriber to
 */

import { createHmac } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── KV helpers ────────────────────────────────────────────────────────────────

async function kvGet(email: string): Promise<StoredPayload | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  const key = `pheydrus:results:${email.toLowerCase().trim()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['GET', key]),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { result: string | null };
  return json.result ? (JSON.parse(json.result) as StoredPayload) : null;
}

// ── Calendly signature verification ──────────────────────────────────────────

function verifySignature(rawBody: string, header: string): boolean {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!signingKey) return true; // skip verification if key not set (dev)

  // Header format: "t=<timestamp>,v1=<signature>"
  const parts: Record<string, string> = {};
  for (const part of header.split(',')) {
    const idx = part.indexOf('=');
    if (idx > 0) parts[part.slice(0, idx)] = part.slice(idx + 1);
  }

  const timestamp = parts['t'];
  const v1 = parts['v1'];
  if (!timestamp || !v1) return false;

  const expected = createHmac('sha256', signingKey)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  return expected === v1;
}

// ── Slack notification ────────────────────────────────────────────────────────

async function postToSlack(name: string, email: string, data: StoredPayload | null): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  let blocks: unknown[];

  if (data) {
    const grade = data.results?.diagnostic?.finalGrade ?? '?';
    const score = data.results?.diagnostic?.score ?? '?';
    const goal = data.intake?.desiredOutcome ?? 'Not provided';
    const obstacle = data.intake?.obstacle ?? 'Not provided';
    const situation = data.intake?.currentSituation ?? '';

    blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📅 New Pheydrus Call Booked', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Name:*\n${name}` },
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
        text: {
          type: 'mrkdwn',
          text: `_Pheydrus report found ✓ — results stored ${data.storedAt ? new Date(data.storedAt).toLocaleDateString() : 'recently'}_`,
        },
      },
    ];
  } else {
    blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📅 New Pheydrus Call Booked', emoji: true },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${name}* (${email}) just booked — _no Pheydrus report found for this email_ (may have used a different address on the form).`,
        },
      },
    ];
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
}

// ── Flodesk subscriber add ────────────────────────────────────────────────────

async function addToFlodesk(name: string, email: string): Promise<void> {
  const apiKey = process.env.FLODESK_API_KEY;
  if (!apiKey) return;

  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ');

  const body: Record<string, unknown> = { email, first_name: firstName, last_name: lastName };
  const segmentId = process.env.FLODESK_SEGMENT_ID;
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
    console.warn('[calendly] Flodesk add failed:', res.status, text);
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoredPayload {
  results: {
    diagnostic?: {
      finalGrade?: string;
      score?: number;
    };
  };
  intake: {
    desiredOutcome?: string;
    obstacle?: string;
    currentSituation?: string;
  };
  storedAt?: string;
}

interface CalendlyWebhookBody {
  event: string;
  payload: {
    invitee: {
      name: string;
      email: string;
    };
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // Verify Calendly signature
  const sigHeader = req.headers['calendly-webhook-signature'] as string | undefined;
  const rawBody = JSON.stringify(req.body);

  if (sigHeader && !verifySignature(rawBody, sigHeader)) {
    console.warn('[calendly] Signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const body = req.body as CalendlyWebhookBody;

  // Only handle new bookings
  if (body.event !== 'invitee.created') {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const { name, email } = body.payload.invitee;

  try {
    const stored = await kvGet(email);
    await Promise.all([postToSlack(name, email, stored), addToFlodesk(name, email)]);
  } catch (err) {
    // Don't fail Calendly's webhook retry loop — log and return 200
    console.error('[calendly] Error processing webhook:', err);
  }

  return res.status(200).json({ ok: true });
}
