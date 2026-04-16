/**
 * POST /api/submit-profile
 * Creates a student profile in the Notion clients database.
 *
 * Required env vars:
 *   NOTION_API_KEY         — Notion integration token
 *   NOTION_CLIENTS_DB_ID  — Target database ID
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_CLIENTS_DB_ID;

  if (!apiKey || !dbId) {
    console.error('[submit-profile] Notion env vars not set');
    return res.status(500).json({ error: 'Notion env vars not set' });
  }

  const { firstName, lastName, email } = (req.body ?? {}) as {
    firstName?: string;
    lastName?: string;
    email?: string;
  };

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'firstName, lastName, and email are required' });
  }

  const notionRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties: {
        'Client Last Name': {
          title: [{ text: { content: lastName } }],
        },
        'Client First Name': {
          rich_text: [{ text: { content: firstName } }],
        },
        'Client Email': {
          email: email,
        },
        'AW, BG, or HJ Student': {
          rich_text: [{ text: { content: 'BG' } }],
        },
      },
    }),
  });

  if (!notionRes.ok) {
    const text = await notionRes.text();
    console.error('[submit-profile] Notion API error:', notionRes.status, text);
    return res.status(502).json({ error: 'Failed to create Notion profile' });
  }

  return res.status(200).json({ ok: true });
}
