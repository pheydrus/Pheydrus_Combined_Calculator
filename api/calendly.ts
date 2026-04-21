/**
 * POST /api/calendly
 * Handles Calendly webhook (invitee.created event).
 *
 * Flow:
 *   1. Verify Calendly HMAC signature
 *   2. Post booking notification to Slack
 *   3. Add subscriber to Flodesk (optional)
 *
 * Required env vars:
 *   SLACK_WEBHOOK_URL                  — Slack Incoming Webhook URL (fallback)
 *   SLACK_HJ_BOOKED_CALLS_WEBHOOK_URL  — Slack webhook for #hj-booked-calls (preferred)
 *   CALENDLY_WEBHOOK_SIGNING_KEY       — from Calendly webhook dashboard
 *
 * Optional env vars:
 *   FLODESK_API_KEY              — Flodesk API key (skip Flodesk if absent)
 *   FLODESK_SEGMENT_ID           — Legacy fallback Flodesk segment to add subscriber to
 *   FLODESK_HJ_CALENDLY_LEADS_SEGMENT_ID — Segment ID for HJ Calendly Leads
 *   FLODESK_HJ_CALENDLY_LEADS_SEGMENT_NAME — Segment name lookup fallback (default: HJ Calendly Leads)
 *   CALENDLY_TARGET_EVENT_SLUG   — Event slug to match (default: 1-1-alignment-strategy-call-report)
 */

import { createHmac } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

interface BookingInfo {
  inviteeEmail: string;
  hostEmail: string;
  eventTypeName: string;
}

async function postToSlack(info: BookingInfo): Promise<void> {
  const webhookUrl =
    process.env.SLACK_HJ_BOOKED_CALLS_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const text =
    `📅 *New Call Booked*\n` +
    `1. *Closer:* ${info.hostEmail}\n` +
    `2. *Invitee:* ${info.inviteeEmail}\n` +
    `3. *Event type:* ${info.eventTypeName}`;

  const slackRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!slackRes.ok) {
    const body = await slackRes.text();
    console.error('[calendly] Slack post failed:', slackRes.status, body);
  } else {
    console.log('[calendly] Slack post succeeded, webhook url prefix:', webhookUrl.slice(0, 40));
  }
}

// ── Flodesk subscriber add ────────────────────────────────────────────────────

async function addToFlodesk(name: string, email: string): Promise<void> {
  const apiKey = process.env.FLODESK_API_KEY;
  if (!apiKey) return;

  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ');

  const body: Record<string, unknown> = { email, first_name: firstName, last_name: lastName };
  const segmentId = process.env.FLODESK_SEGMENT_ID;
  if (segmentId) body['segment_ids'] = [segmentId];

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

function normalizeSegmentId(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/\/segment\/([^/?#]+)/i);
  if (urlMatch?.[1]) return urlMatch[1];
  return trimmed;
}

interface FlodeskSegment {
  id?: string;
  name?: string;
}

function parseFlodeskSegments(payload: unknown): FlodeskSegment[] {
  if (Array.isArray(payload)) return payload as FlodeskSegment[];
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (Array.isArray(p['data'])) return p['data'] as FlodeskSegment[];
    if (Array.isArray(p['segments'])) return p['segments'] as FlodeskSegment[];
  }
  return [];
}

async function resolveHJCalendlyLeadsSegmentId(apiKey: string): Promise<string | null> {
  const configured =
    normalizeSegmentId(process.env.FLODESK_HJ_CALENDLY_LEADS_SEGMENT_ID) ||
    normalizeSegmentId(process.env.FLODESK_SEGMENT_ID);
  if (configured) return configured;

  const desiredName = (process.env.FLODESK_HJ_CALENDLY_LEADS_SEGMENT_NAME || 'HJ Calendly Leads')
    .trim()
    .toLowerCase();

  const res = await fetch('https://api.flodesk.com/v1/segments', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn('[calendly] Flodesk segment lookup failed:', res.status, text);
    return null;
  }

  const payload = (await res.json()) as unknown;
  const segments = parseFlodeskSegments(payload);
  const match = segments.find(
    (segment) => typeof segment?.name === 'string' && segment.name.trim().toLowerCase() === desiredName
  );

  return match?.id || null;
}

function extractPathSlug(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const parts = url.pathname.split('/').filter(Boolean);
      return parts.length ? parts[parts.length - 1]!.toLowerCase() : null;
    }
  } catch {
    // Fall through to plain-path parsing.
  }

  const parts = trimmed.split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1]!.toLowerCase() : trimmed.toLowerCase();
}

function isTargetCalendlyEvent(payload: CalendlyWebhookBody['payload']): boolean {
  const configuredSlug =
    extractPathSlug(process.env.CALENDLY_TARGET_EVENT_SLUG) ||
    '1-1-alignment-strategy-call-report';

  const eventTypeValue =
    typeof payload.event_type === 'string' ? payload.event_type : payload.event_type?.slug;
  const eventTypeSchedulingUrl =
    typeof payload.event_type === 'object' ? payload.event_type?.scheduling_url : undefined;
  const eventTypeUri = typeof payload.event_type === 'object' ? payload.event_type?.uri : undefined;

  const scheduledEventTypeValue =
    typeof payload.scheduled_event?.event_type === 'string'
      ? payload.scheduled_event.event_type
      : payload.scheduled_event?.event_type?.slug;

  const eventTypeSlug =
    extractPathSlug(eventTypeValue) ||
    extractPathSlug(eventTypeSchedulingUrl) ||
    extractPathSlug(eventTypeUri) ||
    extractPathSlug(typeof payload.event_type === 'object' ? payload.event_type?.name : undefined);

  const scheduledEventSlug =
    extractPathSlug(payload.invitee?.scheduling_url) ||
    extractPathSlug(scheduledEventTypeValue) ||
    extractPathSlug(payload.scheduled_event?.name) ||
    extractPathSlug(payload.scheduled_event?.uri);

  const candidates = [eventTypeSlug, scheduledEventSlug].filter(Boolean) as string[];
  if (!candidates.length) return false;

  return candidates.some((value) => value.includes(configuredSlug));
}

async function addToFlodeskHJCalendlyLeads(name: string, email: string): Promise<void> {
  const apiKey = process.env.FLODESK_API_KEY;
  if (!apiKey) return;

  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ');

  const body: Record<string, unknown> = { email, first_name: firstName, last_name: lastName };
  const segmentId = await resolveHJCalendlyLeadsSegmentId(apiKey);
  if (!segmentId) {
    console.warn('[calendly] Could not resolve HJ Calendly Leads segment ID; subscriber was not assigned to segment.');
  } else {
    body['segment_ids'] = [segmentId];
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
    console.warn('[calendly] Flodesk add failed for HJ Calendly Leads:', res.status, text);
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalendlyWebhookBody {
  event: string;
  payload: {
    invitee: {
      name: string;
      email: string;
      scheduling_url?: string;
    };
    event_type?:
      | string
      | {
          slug?: string;
          name?: string;
          scheduling_url?: string;
          uri?: string;
          profile?: { owner?: string; name?: string };
        };
    scheduled_event?: {
      name?: string;
      uri?: string;
      event_memberships?: Array<{ user_email?: string }>;
      event_type?:
        | string
        | {
            slug?: string;
            scheduling_url?: string;
            uri?: string;
          };
    };
  };
}

function extractBookingInfo(payload: CalendlyWebhookBody['payload']): BookingInfo {
  const inviteeEmail = payload.invitee.email;

  // Host email: prefer event_memberships (v2 API), fallback to event_type profile owner
  const memberEmail = payload.scheduled_event?.event_memberships?.[0]?.user_email;
  const profileOwner =
    typeof payload.event_type === 'object' ? payload.event_type?.profile?.owner : undefined;
  const hostEmail = memberEmail || profileOwner || 'unknown';

  // Event type name
  const eventTypeName =
    (typeof payload.event_type === 'object' ? payload.event_type?.name : undefined) ||
    payload.scheduled_event?.name ||
    'Unknown Event';

  return { inviteeEmail, hostEmail, eventTypeName };
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
  const shouldAddToHJCalendlyLeads = isTargetCalendlyEvent(body.payload);
  const bookingInfo = extractBookingInfo(body.payload);

  try {
    await postToSlack(bookingInfo);

    if (shouldAddToHJCalendlyLeads) {
      await addToFlodeskHJCalendlyLeads(name, email);
    } else {
      await addToFlodesk(name, email);
    }
  } catch (err) {
    // Don't fail Calendly's webhook retry loop — log and return 200
    console.error('[calendly] Error processing webhook:', err);
  }

  return res.status(200).json({ ok: true });
}
