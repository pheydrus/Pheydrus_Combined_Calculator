import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import https from 'node:https';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function loadEnvFiles(): void {
  const candidates = [
    path.join(ROOT, '.env'),
    path.join(ROOT, '.env.local'),
    path.join(ROOT, 'transcribe-videos', '.env'),
    path.join(ROOT, 'transcribe-videos', '.env.local'),
  ];

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      loadDotenv({ path: file, override: false });
    }
  }
}

function resolvePythonCommand(): string {
  const inVenv = path.join(ROOT, '.venv', 'bin', 'python');
  if (fs.existsSync(inVenv)) return inVenv;
  return process.env.PYTHON_BIN || 'python3';
}

function runCommand(command: string, args: string[], label: string): string {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf-8',
    env: process.env,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout || '';
}

function requireArgUrl(argv: string[]): string {
  const first = argv[0];
  if (!first || first.startsWith('--')) {
    console.error('ERROR: Missing required video URL argument.');
    console.error('Usage: npm run transcript:send -- <video_url> [--title "Title"] [--cta "PORTAL"] [--no-slack]');
    process.exit(1);
  }
  return first;
}

function postJsonToSlack(webhookUrl: string, body: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(webhookUrl);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Slack returned ${res.statusCode}: ${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function postDriveLinkToSlack(driveViewUrl: string, videoUrl: string, skipSlack: boolean): Promise<void> {
  if (skipSlack) return;
  const webhookUrl = process.env.SLACK_TRANSCRIPT_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[transcript:send] No Slack webhook set; skipping Drive link notification.');
    return;
  }

  const channel = process.env.SLACK_TRANSCRIPT_CHANNEL || '#video-transcripts';
  const body = {
    channel,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📹 *Watermark-Free Video uploaded to Drive*\n*Drive:* <${driveViewUrl}|Open video>\n*Source:* <${videoUrl}|Original post>`,
        },
      },
    ],
  };

  await postJsonToSlack(webhookUrl, body);
  console.log('[transcript:send] Drive link posted to Slack.');
}

async function main(): Promise<void> {
  loadEnvFiles();

  const forwardedArgs = process.argv.slice(2);
  const videoUrl = requireArgUrl(forwardedArgs);
  const skipSlack = forwardedArgs.includes('--no-slack');

  const driveFolderId =
    process.env.WATERMARK_DRIVE_FOLDER_ID ||
    process.env.GOOGLE_DRIVE_WATERMARK_FOLDER_ID ||
    '1q4djcYMseUve15Jy0QZaiXEaBLFP-pX3';

  const python = resolvePythonCommand();

  const downloaderOutput = runCommand(
    python,
    ['watermark-free download/download_video.py', videoUrl, '--output-dir', 'watermark-free download'],
    'Step 1/3: Download watermark-free video'
  );

  const finalFileMatch = downloaderOutput.match(/FINAL_FILE=(.+)/);
  if (!finalFileMatch?.[1]) {
    console.error('ERROR: Download succeeded but FINAL_FILE path was not found in output.');
    process.exit(1);
  }

  const finalFile = finalFileMatch[1].trim();

  const uploadOutput = runCommand(
    'npx',
    ['tsx', 'scripts/upload-to-drive.ts', finalFile, driveFolderId],
    'Step 2/3: Upload video to Google Drive'
  );

  // Parse Drive view link and post it to Slack
  const driveViewMatch = uploadOutput.match(/WEB_VIEW=(.+)/);
  const driveViewUrl = driveViewMatch?.[1]?.trim();
  if (driveViewUrl) {
    await postDriveLinkToSlack(driveViewUrl, videoUrl, skipSlack);
  }

  runCommand(
    'npx',
    ['tsx', 'scripts/transcript-to-gdoc-slack.ts', ...forwardedArgs],
    'Step 3/3: Generate transcript and notify Slack'
  );

  console.log('\nDONE: Full flow complete (download + Drive upload + transcript/slack).');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
