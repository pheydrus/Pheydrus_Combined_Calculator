/**
 * GET /api/get-results?id=<uuid>
 * Fetches a stored Pheydrus report from Vercel Blob by ID.
 * Used by the results page when accessed via a shareable link.
 *
 * Required env vars:
 *   BLOB_PUBLIC_READ_WRITE_TOKEN_READ_WRITE_TOKEN — from Vercel Blob dashboard
 */

import { list } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

async function blobGet(id: string): Promise<unknown | null> {
  const token = process.env.BLOB_PUBLIC_READ_WRITE_TOKEN_READ_WRITE_TOKEN;
  const { blobs } = await list({ prefix: `results/${id}.json`, limit: 1, token });
  const blob = blobs[0];
  if (!blob) return null;

  // Public blob — no auth needed to read
  const dataRes = await fetch(blob.url);
  if (!dataRes.ok) return null;

  return dataRes.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const id = req.query['id'];
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'id required' });
  }

  try {
    const data = await blobGet(id);
    if (!data) return res.status(404).json({ error: 'Report not found' });
    return res.status(200).json(data);
  } catch (err) {
    console.error('[get-results]', err);
    return res.status(500).json({ error: 'Failed to fetch report' });
  }
}
