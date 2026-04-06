import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { google } from 'googleapis';

interface TranscriptResponse {
  transcription?: string;
  error?: string;
  message?: string;
}

interface ParsedArgs {
  url: string;
  titleOverride?: string;
  ctaOverride?: string;
  skipSlack: boolean;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function loadEnvFiles(): void {
  const candidates = [
    path.join(ROOT, '.env'),
    path.join(ROOT, '.env.local'),
    path.join(ROOT, 'carousel-project:', '.env'),
    path.join(ROOT, 'carousel-project:', '.env.local'),
    path.join(ROOT, 'carousel-project:', '.env_1.example'),
  ];

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      loadDotenv({ path: file, override: false });
    }
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  if (argv.length === 0) {
    printUsageAndExit('Missing required video URL argument.');
  }

  const result: ParsedArgs = {
    url: argv[0]!,
    skipSlack: false,
  };

  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i]!;
    const next = argv[i + 1];

    if (arg === '--title' && next) {
      result.titleOverride = next;
      i += 1;
      continue;
    }

    if (arg === '--cta' && next) {
      result.ctaOverride = next;
      i += 1;
      continue;
    }

    if (arg === '--no-slack') {
      result.skipSlack = true;
      continue;
    }

    printUsageAndExit(`Unknown option: ${arg}`);
  }

  return result;
}

function printUsageAndExit(message?: string): never {
  if (message) {
    console.error(`ERROR: ${message}`);
  }
  console.error(`
Usage:
  npm run transcript:send -- <video_url> [--title "Title"] [--cta "PORTAL"] [--no-slack]

Required env vars:
  GETTRANSCRIBE_KEY

Google auth (pick one):
  Option A: GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET + GOOGLE_OAUTH_REFRESH_TOKEN
  Option B: GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

Optional env vars:
  GOOGLE_DRIVE_FOLDER_ID       # Folder where the generated doc should live
  SLACK_TRANSCRIPT_WEBHOOK_URL # Dedicated webhook for transcript channel (recommended)
  SLACK_WEBHOOK_URL            # If present, script posts generated doc link to Slack
  SLACK_TRANSCRIPT_CHANNEL     # Defaults to #video-transcripts
`);
  process.exit(1);
}

function getGoogleAuthClient(): InstanceType<typeof google.auth.OAuth2> | InstanceType<typeof google.auth.JWT> {
  const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const oauthRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  // Prefer OAuth user credentials so created docs use the user's own Drive quota.
  if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
    const oauth = new google.auth.OAuth2({
      clientId: oauthClientId,
      clientSecret: oauthClientSecret,
    });
    oauth.setCredentials({ refresh_token: oauthRefreshToken });
    return oauth;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (email && privateKeyRaw) {
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    return new google.auth.JWT({
      email,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });
  }

  throw new Error(
    'Missing Google auth env vars. Set OAuth vars (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN) or service-account vars (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY).'
  );
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#x2019;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#x1f[0-9a-f]+;/gi, '')
    .replace(/&#\d+;/g, '');
}

function stripBasicHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function sanitizeForFilename(input: string): string {
  return input
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function capitalizeWord(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

function inferExplicitCaptionCTA(captionText: string | null): string | null {
  if (!captionText) return null;

  const patterns = [
    /\bcomment\s+([A-Za-z0-9_-]+)/i,
    /\bdm\s+me\s+([A-Za-z0-9_-]+)/i,
    /\bdm\s+([A-Za-z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = captionText.match(pattern);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

function inferDominantAstroOrNumber(text: string): string | null {
  if (!text.trim()) return null;

  const lower = text.toLowerCase();
  const counts = new Map<string, number>();

  const planets = [
    'sun',
    'moon',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
    'pluto',
  ];

  const signs = [
    'aries',
    'taurus',
    'gemini',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'scorpio',
    'sagittarius',
    'capricorn',
    'aquarius',
    'pisces',
  ];

  const addCount = (label: string, value: number) => {
    if (value > 0) counts.set(label, (counts.get(label) || 0) + value);
  };

  for (const planet of planets) {
    const matches = lower.match(new RegExp(`\\b${planet}\\b`, 'g'));
    addCount(capitalizeWord(planet), matches?.length || 0);
  }

  for (const sign of signs) {
    const forward = lower.match(new RegExp(`\\b${sign}\\s+rising\\b`, 'g'));
    const backward = lower.match(new RegExp(`\\brising\\s+${sign}\\b`, 'g'));
    addCount(`${capitalizeWord(sign)} Rising`, (forward?.length || 0) + (backward?.length || 0));
  }

  const numberMatches = lower.match(/\b\d{1,2}\b/g) || [];
  const numberFreq = new Map<string, number>();
  for (const n of numberMatches) {
    numberFreq.set(n, (numberFreq.get(n) || 0) + 1);
  }
  let topNumber: string | null = null;
  let topNumberCount = 0;
  for (const [num, cnt] of numberFreq.entries()) {
    if (cnt > topNumberCount) {
      topNumber = num;
      topNumberCount = cnt;
    }
  }
  if (topNumber && topNumberCount > 0) {
    addCount(`Number ${topNumber}`, topNumberCount);
  }

  let winner: string | null = null;
  let winnerCount = 0;
  for (const [label, count] of counts.entries()) {
    if (count > winnerCount) {
      winner = label;
      winnerCount = count;
    }
  }

  return winner;
}

async function fetchTranscription(url: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.gettranscribe.ai/transcriptions', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, language: 'en' }),
  });

  const raw = await res.text();
  let json: TranscriptResponse | null = null;
  try {
    json = JSON.parse(raw) as TranscriptResponse;
  } catch {
    throw new Error(`GetTranscribe returned non-JSON response (${res.status}): ${raw}`);
  }

  if (!res.ok) {
    throw new Error(
      `GetTranscribe API error (${res.status}): ${json?.error || json?.message || raw}`
    );
  }

  if (!json?.transcription || !json.transcription.trim()) {
    throw new Error(`GetTranscribe did not return transcription. Raw: ${raw}`);
  }

  return json.transcription.trim();
}

async function fetchOgTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        // Helps providers return the canonical page HTML rather than a minimal response.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const ogMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([\s\S]*?)["']\s*\/?\s*>/i
    );

    if (!ogMatch?.[1]) return null;

    return normalizeWhitespace(decodeHtmlEntities(stripBasicHtml(ogMatch[1])));
  } catch {
    return null;
  }
}

function deriveHumanTitleFromOg(ogTitle: string | null): string {
  if (!ogTitle) return 'Video Transcript';

  const instagramQuote = ogTitle.match(/on Instagram:\s*"([\s\S]+)"/i);
  if (instagramQuote?.[1]) {
    return normalizeWhitespace(instagramQuote[1]);
  }

  const generic = ogTitle
    .replace(/\s*\|\s*Instagram.*$/i, '')
    .replace(/\s*\|\s*TikTok.*$/i, '')
    .replace(/\s*\|\s*YouTube.*$/i, '')
    .trim();

  return generic || 'Video Transcript';
}

async function createGoogleDoc(title: string, bodyText: string): Promise<{ docId: string; docUrl: string }> {
  const auth = getGoogleAuthClient();

  const docs = google.docs({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  const createRes = await docs.documents.create({
    requestBody: { title },
  });

  const docId = createRes.data.documentId;
  if (!docId) {
    throw new Error('Google Docs API did not return a document ID.');
  }

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: bodyText,
          },
        },
      ],
    },
  });

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (folderId) {
    await drive.files.update({
      fileId: docId,
      addParents: folderId,
      removeParents: 'root',
      fields: 'id, parents',
    });
  }

  const docUrl = `https://docs.google.com/document/d/${docId}/edit`;
  return { docId, docUrl };
}

async function postToSlack(docTitle: string, docUrl: string, sourceUrl: string, cta: string | null): Promise<void> {
  const webhookUrl = process.env.SLACK_TRANSCRIPT_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn(
      '[transcript:send] No Slack webhook set (SLACK_TRANSCRIPT_WEBHOOK_URL or SLACK_WEBHOOK_URL); skipping Slack post.'
    );
    return;
  }

  const channel = process.env.SLACK_TRANSCRIPT_CHANNEL || '#video-transcripts';
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'New Transcript Doc Ready', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Channel:*
${channel}` },
        { type: 'mrkdwn', text: `*CTA:*
${cta || 'Not detected'}` },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Title:* ${docTitle}\n*Doc:* <${docUrl}|Open document>\n*Source:* <${sourceUrl}|Open video>`,
      },
    },
  ];

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, blocks }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Slack post failed (${res.status}): ${text}`);
  }

  // Some incoming webhooks are pinned to a specific channel and ignore the "channel" field.
  if (!process.env.SLACK_TRANSCRIPT_WEBHOOK_URL) {
    console.warn(
      '[transcript:send] Using SLACK_WEBHOOK_URL fallback. If posts land in the wrong channel, create a dedicated webhook and set SLACK_TRANSCRIPT_WEBHOOK_URL.'
    );
  }
}

function buildDocBody(title: string, sourceUrl: string, cta: string | null, transcript: string): string {
  const now = new Date().toISOString();

  return [
    'Transcript Intake',
    '',
    `Title: ${title}`,
    `Source URL: ${sourceUrl}`,
    `Detected CTA: ${cta || 'Not detected'}`,
    `Generated At (UTC): ${now}`,
    '',
    'Transcript',
    '',
    transcript,
    '',
  ].join('\n');
}

async function saveLocalCopy(title: string, bodyText: string): Promise<string> {
  const outputDir = path.join(ROOT, 'carousel-project:', 'transcripts');
  fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${timestamp} - ${sanitizeForFilename(title)}.md`;
  const outputPath = path.join(outputDir, fileName);

  fs.writeFileSync(outputPath, bodyText, 'utf-8');
  return outputPath;
}

async function main(): Promise<void> {
  loadEnvFiles();

  const args = parseArgs(process.argv.slice(2));
  const getTranscribeKey = process.env.GETTRANSCRIBE_KEY;

  if (!getTranscribeKey) {
    throw new Error('Add your GETTRANSCRIBE_KEY to the .env file first.');
  }

  const transcript = await fetchTranscription(args.url, getTranscribeKey);
  const ogTitle = await fetchOgTitle(args.url);

  const inferredTitle = deriveHumanTitleFromOg(ogTitle);
  const explicitCaptionCTA = inferExplicitCaptionCTA(ogTitle);
  const dominantTerm = inferDominantAstroOrNumber(`${ogTitle || ''}\n${transcript}`);

  const cta = (args.ctaOverride || explicitCaptionCTA || '').toUpperCase() || null;
  const docTitle = args.titleOverride || cta || dominantTerm || inferredTitle;

  const bodyText = buildDocBody(docTitle, args.url, cta, transcript);
  const localPath = await saveLocalCopy(docTitle, bodyText);
  const { docUrl } = await createGoogleDoc(docTitle, bodyText);

  if (!args.skipSlack) {
    await postToSlack(docTitle, docUrl, args.url, cta);
  }

  console.log('OK: Transcript processed successfully.');
  console.log(`Google Doc: ${docUrl}`);
  console.log(`Local Copy: ${localPath}`);
  console.log(`Title Used: ${docTitle}`);
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`ERROR: ${message}`);
  process.exit(1);
});
