/**
 * POST /api/store-results
 * Called immediately after runAllCalculators() succeeds on the frontend.
 * Posts the client's Pheydrus report to Slack right away — no Redis needed.
 *
 * Required env vars:
 *   SLACK_WEBHOOK_URL — Slack Incoming Webhook URL
 */

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

async function postToSlack(email: string, results: Results, intake: Intake): Promise<void> {
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

  try {
    await postToSlack(email, results, intake);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[store-results]', err);
    return res.status(500).json({ error: 'Failed to post results' });
  }
}
