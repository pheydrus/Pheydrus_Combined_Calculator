import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';

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

function main(): void {
  loadEnvFiles();

  const forwardedArgs = process.argv.slice(2);
  const videoUrl = requireArgUrl(forwardedArgs);

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

  runCommand(
    'npx',
    ['tsx', 'scripts/upload-to-drive.ts', finalFile, driveFolderId],
    'Step 2/3: Upload video to Google Drive'
  );

  runCommand(
    'npx',
    ['tsx', 'scripts/transcript-to-gdoc-slack.ts', ...forwardedArgs],
    'Step 3/3: Generate transcript and notify Slack'
  );

  console.log('\nDONE: Full flow complete (download + Drive upload + transcript/slack).');
}

main();
