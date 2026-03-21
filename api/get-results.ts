/**
 * GET /api/get-results?id=<uuid>
 * Fetches a stored Pheydrus report from Vercel Blob by ID.
 * Used by the results page when accessed via a shareable link.
 *
 * Required env vars:
 *   BLOB_READ_WRITE_TOKEN — from Vercel Blob dashboard
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

async function blobGet(id: string): Promise<unknown | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  // List blobs with this ID prefix to get the public URL
  const listRes = await fetch(
    `https://blob.vercel-storage.com?prefix=results/${id}.json&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!listRes.ok) return null;

  const list = (await listRes.json()) as { blobs: { url: string }[] };
  const blob = list.blobs[0];
  if (!blob) return null;

  // Fetch the blob content from its public URL
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
