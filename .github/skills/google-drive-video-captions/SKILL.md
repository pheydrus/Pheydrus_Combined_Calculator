# Google Drive Video Captions

## Purpose
Use this skill when the user asks to add captions/subtitles to videos stored in Google Drive.
The workflow downloads each video locally, transcribes audio via OpenAI Whisper, then burns the
captions directly into the video frames (hardcoded, always visible — no player toggle needed)
and uploads the captioned version back to the same Drive folder with a `-sitecap` suffix.

## Caption Style (Reference Standard)
Always use these ffmpeg `force_style` settings when burning captions:
```
FontName=Arial,FontSize=14,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1,MarginV=80,Alignment=2
```
- **White text** with **2px black outline** — no box background
- **FontSize=14** — small, unobtrusive (50% smaller than default)
- **MarginV=80** — placed near the very bottom, below any existing text overlays (title cards, TikTok stickers, etc.)
- **Alignment=2** — bottom-center

If the video has a bottom text obstruction, increase `MarginV` (e.g. 120–160) rather than reducing font size further.

## What It Produces
For every source video `pile-1.mp4` it creates:
- `pile-1.srt` — plain text SRT caption file
- `pile-1-sitecap.mp4` — captions burned into video frames (visible on all players, TikTok, IG, etc.)

## Required Env Vars
Set these in `.env.local` or pass inline:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REFRESH_TOKEN`
- `OPENAI_API_KEY`

## Optional Env Vars
- `CAPTION_LANGUAGE` — ISO-639-1 code (default: `en`)
- `DRY_RUN=true` — list files without processing

## Dependencies
- `npm install openai googleapis` (already in this repo)
- `ffmpeg` — install via `brew install ffmpeg`, OR use the bundled binary:
  `python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"`
  The script auto-detects whichever is available.

## The Script
`scripts/add-captions-to-drive-videos.ts`

Supports both `.mp4` and `.mov` files. Skips any file already containing `-sitecap` in the name.

## How to Run

### Dry run first (lists files, no processing):
```bash
DRY_RUN=true npx tsx scripts/add-captions-to-drive-videos.ts <DRIVE_FOLDER_ID>
```

### Run for real:
```bash
npx tsx scripts/add-captions-to-drive-videos.ts <DRIVE_FOLDER_ID>
```

Or via npm script:
```bash
npm run captions:add -- <DRIVE_FOLDER_ID>
```

### Run for a specific subfolder on disk (no Drive download needed):
If videos are already local (e.g. Google Drive synced via Drive for Desktop at
`~/My Drive/PAC - Shorts/`), use the local variant script instead — see below.

## Source Options — Where Videos Can Come From
This skill works with videos from any of these sources:

| Source | How to handle |
|---|---|
| Google Drive folder (by folder ID or URL) | Script lists all videos in folder, processes each |
| Single Google Drive file link | Script processes just that one file, uploads captioned version to the same folder |
| Local folder synced via Drive for Desktop | Script reads/writes files directly on disk (no API download needed) |
| Any local folder | Same as above — just point the script at the folder path |

Always ask the user: **"Where are the videos?"** — accept a Drive folder URL, a single Drive file link, or a local path.

### Accepted input formats:
```
https://drive.google.com/file/d/FILE_ID/view       ← single file
https://drive.google.com/drive/folders/FOLDER_ID   ← whole folder
FOLDER_ID or FILE_ID (bare)                        ← auto-detected via Drive API
```

The script automatically detects whether the ID is a file or folder and behaves accordingly. For a single file, the captioned output is uploaded to the same parent folder.

## PAC Shorts Example (for reference)
Previously used for the PAC tarot video library at `~/My Drive/PAC - Shorts/`.
Folder convention used:
```
PAC - Shorts/
  1 - same as #11/
    pile-1.mov
    pile-1-transcript.txt   ← existing transcript (skip Whisper to save cost)
    pile-1.srt              ← generated
    pile-1-sitecap.mov      ← final output
```

### To check which videos in a local folder are missing sitecap versions:
```bash
TARGET_DIR="<PATH_TO_FOLDER>"
for f in "$TARGET_DIR"/**/*.{mov,mp4}(N); do
  [[ "$f" == *-sitecap* ]] && continue
  base="${f%.*}"; ext="${f##*.}"
  sitecap="${base}-sitecap.${ext}"
  [ ! -f "$sitecap" ] && echo "MISSING: $f"
done
```

## Process Steps (what the script does)
1. List all video files in the target Drive folder (or local path)
2. For each video:
   a. Download (or read locally)
   b. Extract audio → MP3 at 16kHz mono (via ffmpeg)
   c. Send to OpenAI Whisper API → get SRT response
   d. Write `.srt` file
   e. Mux SRT into video with `ffmpeg -c:v copy -c:a copy -c:s mov_text` (no re-encode)
   f. Upload captioned video back to Drive (or save locally)
3. Skip any file already named `-sitecap`

## ffmpeg Mux Command (reference)
```bash
ffmpeg -y -i "input.mp4" -i "input.srt" \
  -c:v copy -c:a copy -c:s mov_text \
  -metadata:s:s:0 language=en \
  "output-sitecap.mp4"
```

## Common Issues
- **`mov_text` codec error with .mov files**: Use `-c:s mov_text` for MP4 containers.
  For `.mov` containers, try `-c:s copy` or convert to MP4 first.
- **Whisper file size limit**: Whisper API accepts up to 25MB per file. For longer videos,
  split audio with `ffmpeg -ss 0 -t 600 -vn ...` before sending.
- **Google OAuth refresh token expired**: Re-run the OAuth flow and update `GOOGLE_OAUTH_REFRESH_TOKEN`.
- **Drive quota**: Large batch jobs may hit Drive API rate limits — add `sleep 1` between uploads if needed.

## This Repo's Google OAuth Setup
Auth credentials are stored as env vars and used via `googleapis`:
```ts
const auth = new google.auth.OAuth2({ clientId, clientSecret });
auth.setCredentials({ refresh_token: refreshToken });
const drive = google.drive({ version: 'v3', auth });
```
See `scripts/upload-to-drive.ts` for the established pattern.
