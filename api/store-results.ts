/**
 * POST /api/store-results
 * Stores a client's Pheydrus results indexed by email in Vercel KV (Upstash Redis).
 * Called immediately after runAllCalculators() succeeds on the frontend.
 *
 * Required env vars:
 *   KV_REST_API_URL   — from Vercel KV dashboard
 *   KV_REST_API_TOKEN — from Vercel KV dashboard
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

async function kvSet(email: string, payload: unknown): Promise<void> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('KV env vars not configured');

  const key = `pheydrus:results:${email.toLowerCase().trim()}`;
  const value = JSON.stringify(payload);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['SET', key, value, 'EX', TTL_SECONDS]),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KV SET failed (${res.status}): ${text}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, results, intake } = (req.body ?? {}) as {
    email?: string;
    results?: unknown;
    intake?: unknown;
  };

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  if (!results || !intake) {
    return res.status(400).json({ error: 'results and intake required' });
  }

  try {
    await kvSet(email, { results, intake, storedAt: new Date().toISOString() });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[store-results]', err);
    return res.status(500).json({ error: 'Failed to store results' });
  }
}
