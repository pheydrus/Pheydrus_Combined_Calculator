# Pheydrus Automation Handoff (Claude Rebuild Pack)

## Goal
Recreate the key automations built in this repository inside Claude.ai with predictable behavior and clear validation steps.

## Current Production Behavior
1. Transcript workflow is active.
2. Unified Drive video workflow is available via one command for full pipeline (captions + Google Doc + Slack).
3. Client report submission posts to Slack.
4. Client report submission does not sync to FloDesk by default.
5. Calendly booking webhook posts to Slack.

## What's Built (Expanded)
- Transcript workflow (social URL -> transcript + assets):
	- Accepts an Instagram/TikTok/YouTube URL.
	- Pulls transcript text via transcription provider.
	- Creates a Google Doc transcript and stores a local markdown transcript copy.
	- Downloads watermark-free video when applicable and uploads it to Google Drive.
	- Posts result summary in Slack with links.
- Unified Drive full pipeline (Victorias Google Video command):
	- Single command: npm run "victorias google video" -- <drive_video_link>
	- Runs burned-in caption generation on the Drive video.
	- Creates transcript Google Doc for the same source link.
	- Posts one consolidated Slack message containing original video, captioned video, and Google Doc links.
	- Supports batch inputs and --skip-slack for dry validation.
- Captions-only workflow (Drive link or folder):
	- Command: npm run captions:add -- <drive_video_link_or_folder_id>
	- Produces a new _captioned video file in Drive (original untouched).
	- Uses canonical caption defaults:
		- FontSize 35, Bold 0, Outline 0.75
		- MarginL/R 72, MarginV 140
		- Safe wrap defaults: CAPTION_MAX_CHARS=24, CAPTION_MAX_LINES=3
- Client report submission automation (/api/store-results):
	- Validates inbound report payload.
	- Stores results JSON in blob storage.
	- Builds report URL and posts summary to Slack.
	- FloDesk sync is opt-in only via env flag (disabled by default).
- Calendly booking webhook automation (/api/calendly):
	- Verifies webhook signature.
	- Processes invitee.created booking events.
	- Sends booking notifications to Slack.
	- Optional FloDesk sync is fail-soft and never blocks core webhook success.
- FloDesk safety posture:
	- Calculator report submission sync remains explicitly disabled by default.
	- Optional integration failures should warn/log without breaking core Slack/report flow.

## Command Quick Reference
- Full pipeline (recommended for Drive videos):
	- npm run "victorias google video" -- <drive_video_link>
- Captions only (no doc, no consolidated Slack post):
	- npm run captions:add -- <drive_video_link_or_folder_id>
- Transcript only:
	- npm run transcript:only -- <video_url>

## Workflow 1: Transcript -> Google Doc -> Watermark-Free Video -> Google Drive -> Slack
Trigger:
- Run a command with an Instagram/TikTok URL.

Primary command:
- npm run transcript:send -- <video_url>

What it does:
1. Calls transcription provider for text.
2. Extracts title/CTA from caption when possible.
3. Creates transcript Google Doc.
4. Downloads watermark-free video locally.
5. Uploads video to Google Drive.
6. Posts summary to Slack.

Outputs:
- Google Doc link
- Google Drive file link
- Local transcript markdown file

Key implementation files:
- scripts/transcript-to-gdoc-slack.ts
- scripts/upload-to-drive.ts
- watermark-free download/download_video.py

## Workflow 1B: Drive Video Full Pipeline (Victorias Google Video)
Trigger:
- Run one command with a Google Drive file link.

Primary command:
- npm run "victorias google video" -- <drive_video_link>

What it does:
1. Runs captions pipeline on the Drive video.
2. Creates transcript Google Doc from the same source link.
3. Posts one consolidated Slack message containing original video, captioned video, and Google Doc links.

Outputs:
- Original Drive video link
- Captioned Drive video link
- Google Doc link

Key implementation files:
- scripts/victorias-google-video.ts
- scripts/add-captions-to-drive-videos.ts
- scripts/transcript-to-gdoc-slack.ts

Caption style defaults used by this flow:
- FontSize=35, Bold=0, Outline=0.75
- MarginL=72, MarginR=72, MarginV=140
- CAPTION_MAX_CHARS=24, CAPTION_MAX_LINES=3

## Workflow 2: Client Calculator Report Submission -> Slack
Trigger:
- End user submits a report from /client flow.

Backend endpoint:
- POST /api/store-results

What it does:
1. Validates payload.
2. Saves report JSON to Vercel Blob.
3. Builds results URL.
4. Posts Slack notification with grade/score and report link.
5. Attempts FloDesk sync only if explicitly enabled by env flag.

Current FloDesk guard:
- FLODESK_ENABLE_STORE_RESULTS_SYNC must equal true to allow sync.
- If not true, FloDesk sync is skipped.

Key implementation file:
- api/store-results.ts

## Workflow 3: Calendly Booking Webhook -> Slack
Trigger:
- Calendly invitee.created webhook event.

Backend endpoint:
- POST /api/calendly

What it does:
1. Verifies Calendly signature when signing key is configured.
2. Posts booking alert to Slack.
3. Optionally adds subscriber to FloDesk when configured.

Key implementation file:
- api/calendly.ts

## Design Rules To Preserve In Rebuild
1. Slack should still receive events even when optional integrations fail.
2. Optional integrations must fail soft (warn, do not crash core flow).
3. Every workflow should log step-by-step progress.
4. Sensitive keys must stay in env vars only.
5. FloDesk sync for calculator report must be opt-in (disabled by default).

## Suggested Team Rebuild Process In Claude.ai
1. Paste 03-rebuild-prompts.md prompt #1 to scaffold structure.
2. Paste prompt #2 to generate workflows and handlers.
3. Paste prompt #3 to add safety guards and logs.
4. Use 04-validation-checklist.md to verify parity with current behavior.
