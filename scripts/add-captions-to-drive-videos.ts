/**
 * add-captions-to-drive-videos.ts
 *
 * For each video in a Google Drive folder:
 *   1. Download the video temporarily
 *   2. Transcribe audio via OpenAI Whisper → SRT
 *   3. Mux the SRT as a soft subtitle track (no video/audio re-encode)
 *   4. Re-upload the captioned video to Drive (new file, original untouched)
 *
 * Usage:
 *   npx tsx scripts/add-captions-to-drive-videos.ts <drive_folder_id_or_file_link>
 *
 * Accepts:
 *   - A Drive folder ID (processes all videos in the folder)
 *   - A Drive file link: https://drive.google.com/file/d/FILE_ID/view
 *   - A bare Drive file ID (detects automatically — shorter than folder IDs are ambiguous, so
 *     the script checks whether the ID belongs to a file or folder via the Drive API)
 *
 * Required env vars:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REFRESH_TOKEN
 *   OPENAI_API_KEY
 *
 * Optional env vars:
 *   CAPTION_LANGUAGE   — ISO-639-1 code (default: en)
 *   DRY_RUN            — set to "true" to list files without processing
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { config as loadDotenv } from 'dotenv';
import { google } from 'googleapis';
import OpenAI from 'openai';

// ── Setup ─────────────────────────────────────────────────────────────────────

loadDotenv({ path: '.env.local', override: false });
loadDotenv({ path: '.env', override: false });

const RAW_ARG = process.argv[2] || process.env.CAPTION_DRIVE_FOLDER_ID;
if (!RAW_ARG) {
  console.error('Usage: npx tsx scripts/add-captions-to-drive-videos.ts <drive_folder_id_or_file_link>');
  process.exit(1);
}

// Extract Drive file/folder ID from a full URL or bare ID
function extractDriveId(raw: string): string {
  // https://drive.google.com/file/d/FILE_ID/view or /d/FILE_ID
  const fileMatch = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch?.[1]) return fileMatch[1];
  // https://drive.google.com/drive/folders/FOLDER_ID
  const folderMatch = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) return folderMatch[1];
  // Bare ID
  return raw.trim();
}

const DRIVE_ID = extractDriveId(RAW_ARG);
const LANGUAGE = process.env.CAPTION_LANGUAGE || 'en';
const DRY_RUN = process.env.DRY_RUN === 'true';

// Resolve ffmpeg — use imageio_ffmpeg binary if system ffmpeg not found
function getFfmpegPath(): string {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return 'ffmpeg';
  } catch {
    try {
      const result = execSync(
        'python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"',
        { encoding: 'utf8' }
      ).trim();
      if (result && fs.existsSync(result)) return result;
    } catch {
      // fall through
    }
    throw new Error(
      'ffmpeg not found. Install it with `brew install ffmpeg` or `pip install imageio-ffmpeg`.'
    );
  }
}

// ── Google Drive auth ─────────────────────────────────────────────────────────

function buildDriveClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Google OAuth env vars (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN).'
    );
  }
  const auth = new google.auth.OAuth2({ clientId, clientSecret });
  auth.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth });
}

// ── List videos in folder ────────────────────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

async function resolveFiles(drive: ReturnType<typeof buildDriveClient>): Promise<{ files: DriveFile[]; parentFolderId: string }> {
  // First, check if the ID is a file or a folder
  let meta: Awaited<ReturnType<typeof drive.files.get>> | null = null;
  try {
    meta = await drive.files.get({
      fileId: DRIVE_ID,
      fields: 'id, name, mimeType, parents',
      supportsAllDrives: true,
    });
  } catch {
    // File not accessible via Drive API (e.g. public file not shared with OAuth account)
    // Treat as a single video file — downloadFile has a public HTTP fallback
    // Use GOOGLE_DRIVE_FOLDER_ID as upload target if available
    const fallbackFolder = process.env.GOOGLE_DRIVE_FOLDER_ID ?? DRIVE_ID;
    return {
      files: [{ id: DRIVE_ID, name: 'source.mp4', mimeType: 'video/mp4' }],
      parentFolderId: fallbackFolder,
    };
  }

  const mimeType = meta.data.mimeType ?? '';
  const isFolder = mimeType === 'application/vnd.google-apps.folder';

  if (!isFolder) {
    // Single file
    const parentFolderId = meta.data.parents?.[0] ?? DRIVE_ID;
    return {
      files: [{ id: meta.data.id!, name: meta.data.name!, mimeType }],
      parentFolderId,
    };
  }

  // Folder — list all videos inside
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${DRIVE_ID}' in parents and mimeType contains 'video/' and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageSize: 100,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      ...(pageToken ? { pageToken } : {}),
    });

    for (const f of res.data.files ?? []) {
      if (f.id && f.name && f.mimeType) {
        files.push({ id: f.id, name: f.name, mimeType: f.mimeType });
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return { files, parentFolderId: DRIVE_ID };
}

// ── Download file ─────────────────────────────────────────────────────────────

async function downloadFile(
  drive: ReturnType<typeof buildDriveClient>,
  fileId: string,
  destPath: string
): Promise<void> {
  // Try Drive API first (works when file is shared with the OAuth account)
  try {
    const res = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );
    await new Promise<void>((resolve, reject) => {
      const dest = fs.createWriteStream(destPath);
      (res.data as NodeJS.ReadableStream).pipe(dest);
      dest.on('finish', resolve);
      dest.on('error', reject);
    });
    return;
  } catch (driveErr) {
    // Fall through to public HTTP download
    console.warn(`  Drive API download failed (${(driveErr as Error).message}), trying public HTTP download...`);
  }

  // Fallback: public two-step download (handles Google virus-scan confirmation page)
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const firstRes = await fetch(directUrl, { redirect: 'follow' });
  const html = await firstRes.text();

  // Check for virus-scan confirmation form
  const confirmMatch = html.match(/name="confirm"\s+value="([^"]+)"/);
  const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);

  let downloadUrl: string;
  if (confirmMatch?.[1] && uuidMatch?.[1]) {
    downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirmMatch[1]}&uuid=${uuidMatch[1]}`;
  } else if (firstRes.headers.get('content-type')?.startsWith('video/')) {
    // Small file — first response was the file itself
    const buffer = Buffer.from(html, 'binary');
    fs.writeFileSync(destPath, buffer);
    return;
  } else {
    // Try direct usercontent URL without confirmation
    downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
  }

  const fileRes = await fetch(downloadUrl, { redirect: 'follow' });
  if (!fileRes.ok) throw new Error(`Public download failed: HTTP ${fileRes.status}`);
  const arrayBuf = await fileRes.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuf));
}

// ── Whisper transcription → SRT ───────────────────────────────────────────────

async function transcribeToSrt(openai: OpenAI, audioPath: string): Promise<string> {
  const file = fs.createReadStream(audioPath);
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'srt',
    language: LANGUAGE,
  });
  // Whisper returns SRT as a string when response_format is 'srt'
  return transcription as unknown as string;
}

function transcribeToSrtLocalWhisper(audioPath: string): string {
  const dir = path.dirname(audioPath);

  // Write a temp Python script to avoid shell quoting issues with -c one-liners
  const scriptPath = path.join(dir, '_whisper_transcribe.py');
  const pyCode = `
import whisper
from whisper.utils import get_writer
import os, sys

audio_path = sys.argv[1]
out_dir = sys.argv[2]

model = whisper.load_model("base")
result = model.transcribe(audio_path, language="en")
writer = get_writer("srt", out_dir)
writer(result, audio_path)
`.trimStart();

  fs.writeFileSync(scriptPath, pyCode, 'utf8');

  // Ensure imageio_ffmpeg binary is on PATH so Whisper can find ffmpeg
  // The binary is named ffmpeg-macos-aarch64-vX.X, not 'ffmpeg', so we create a symlink
  let tmpBinDir = '';
  try {
    const ffmpegBin = execSync(
      'python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"',
      { encoding: 'utf8' }
    ).trim();
    if (ffmpegBin && fs.existsSync(ffmpegBin)) {
      tmpBinDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ffmpeg-bin-'));
      const symlinkPath = path.join(tmpBinDir, 'ffmpeg');
      try { fs.symlinkSync(ffmpegBin, symlinkPath); } catch { /* already exists */ }
    }
  } catch { /* ffmpeg already on PATH */ }

  const env = { ...process.env };
  if (tmpBinDir) env.PATH = `${tmpBinDir}:${env.PATH}`;

  try {
    execSync(`python3 "${scriptPath}" "${audioPath}" "${dir}"`, { stdio: 'pipe', env });
  } finally {
    try { fs.unlinkSync(scriptPath); } catch { /* ignore */ }
    if (tmpBinDir) try { fs.rmSync(tmpBinDir, { recursive: true }); } catch { /* ignore */ }
  }

  const srtPath = `${audioPath.replace(/\.[^/.]+$/, '')}.srt`;
  if (!fs.existsSync(srtPath)) {
    throw new Error('Local Whisper did not generate an SRT file.');
  }

  return fs.readFileSync(srtPath, 'utf8');
}

// ── Extract audio from video for Whisper ─────────────────────────────────────

function extractAudio(ffmpeg: string, videoPath: string, audioPath: string): void {
  execSync(
    `"${ffmpeg}" -y -i "${videoPath}" -vn -acodec libmp3lame -ar 16000 -ac 1 -q:a 5 "${audioPath}"`,
    { stdio: 'pipe' }
  );
}

// ── Burn subtitle into video (hardcoded, always visible) ──────────────────────
//
// Style: small white text with black outline, bottom-center, high MarginV so it
// sits BELOW any existing text overlays (title cards, TikTok stickers, etc.).
// Matches the caption look in attached reference image:
//   - Font: Arial, small size with fixed PlayRes to prevent oversized scaling
//   - White fill, thin black outline (no box)
//   - Lower-third placement to stay below top text overlays
//
const CAPTION_STYLE =
  'PlayResX=1080,PlayResY=1920,FontName=Arial,FontSize=8,PrimaryColour=&H00FFFFFF,' +
  'OutlineColour=&H00000000,BorderStyle=1,Outline=1,Shadow=0,MarginL=24,MarginR=24,' +
  'MarginV=140,Alignment=2,WrapStyle=2';

function muxSubtitle(
  ffmpeg: string,
  videoPath: string,
  srtPath: string,
  outputPath: string
): void {
  // Burn captions directly into video pixels so they're visible on all players/platforms.
  // Escape path for ffmpeg filter — backslashes and colons need escaping on all platforms.
  const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
  execSync(
    `"${ffmpeg}" -y -i "${videoPath}" -vf "subtitles='${escapedSrt}':force_style='${CAPTION_STYLE}'" -c:a copy "${outputPath}"`,
    { stdio: 'pipe' }
  );
}

// ── Upload file to Drive ──────────────────────────────────────────────────────

async function uploadToDrive(
  drive: ReturnType<typeof buildDriveClient>,
  localPath: string,
  name: string,
  mimeType: string,
  parentFolderId: string
): Promise<string> {
  const res = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name,
      parents: [parentFolderId],
    },
    media: {
      mimeType,
      body: fs.createReadStream(localPath),
    },
    fields: 'id,name',
  });
  return res.data.id ?? '';
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const ffmpeg = getFfmpegPath();
  console.log(`ffmpeg: ${ffmpeg}`);

  const drive = buildDriveClient();
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
  const usingLocalWhisper = !openai;

  if (usingLocalWhisper) {
    console.warn('OPENAI_API_KEY not found. Falling back to local Whisper (model=base).');
  }

  console.log(`\nResolving Drive ID: ${DRIVE_ID}`);
  const { files: videos, parentFolderId } = await resolveFiles(drive);
  console.log(`Found ${videos.length} video(s). Captioned files will be saved to folder: ${parentFolderId}`);

  if (DRY_RUN) {
    for (const v of videos) console.log(`  [DRY] ${v.name} (${v.id})`);
    return;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'captions-'));
  console.log(`Temp dir: ${tmpDir}\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i]!;
    const label = `[${i + 1}/${videos.length}] ${video.name}`;

    // Skip if already has _captioned suffix
    if (video.name.includes('_captioned')) {
      console.log(`${label} — skipped (already captioned)`);
      continue;
    }

    const ext = path.extname(video.name) || '.mp4';
    const base = path.basename(video.name, ext);
    const videoPath = path.join(tmpDir, `${base}${ext}`);
    const audioPath = path.join(tmpDir, `${base}.mp3`);
    const srtPath = path.join(tmpDir, `${base}.srt`);
    const outputName = `${base}_captioned${ext}`;
    const outputPath = path.join(tmpDir, outputName);

    try {
      process.stdout.write(`${label} — downloading...`);
      await downloadFile(drive, video.id, videoPath);
      process.stdout.write(' extracting audio...');
      extractAudio(ffmpeg, videoPath, audioPath);
      process.stdout.write(' transcribing...');
      const srt = openai
        ? await transcribeToSrt(openai, audioPath)
        : transcribeToSrtLocalWhisper(audioPath);
      fs.writeFileSync(srtPath, srt, 'utf8');
      process.stdout.write(' muxing...');
      muxSubtitle(ffmpeg, videoPath, srtPath, outputPath);
      process.stdout.write(' uploading...');
      const newId = await uploadToDrive(drive, outputPath, outputName, video.mimeType, parentFolderId);
      console.log(` done (${newId})`);
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n  ERROR: ${msg}`);
      failed++;
    } finally {
      // Clean up temp files for this video
      for (const f of [videoPath, audioPath, srtPath, outputPath]) {
        try { fs.unlinkSync(f); } catch { /* ignore */ }
      }
    }
  }

  try { fs.rmdirSync(tmpDir); } catch { /* ignore */ }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
