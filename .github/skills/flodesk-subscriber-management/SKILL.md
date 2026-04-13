# Flodesk Subscriber Management

## Purpose
Use this skill when the user asks to add one or more emails to Flodesk, create/find a segment, or verify whether a subscriber was added to a segment.

## Inputs Required
- Flodesk API key (`fd_key_...`)
- Subscriber email(s)
- Optional first/last name
- Optional target segment name or segment ID

## Safety + Privacy Rules
- Treat API keys and emails as sensitive.
- Never print full API keys in final responses.
- Prefer masked emails in logs when possible.
- If sharing command output, redact secrets.

## Flodesk API Basics
- Base URL: `https://api.flodesk.com/v1`
- Auth: HTTP Basic, username = API key, password blank.
- Build auth header:
  - `AUTH=$(printf "%s:" "$FLODESK_API_KEY" | base64)`

## Core Workflows

### 1) List segments
```bash
curl -sS "https://api.flodesk.com/v1/segments" \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json"
```

### 2) Create segment (if missing)
```bash
curl -sS -X POST "https://api.flodesk.com/v1/segments" \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d '{"name":"VIP Calculator","color":"#D3CFF8"}'
```

### 3) Add or update subscriber in a segment
Use `segment_ids` (not `segments`).
```bash
curl -sS -X POST "https://api.flodesk.com/v1/subscribers" \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"person@example.com",
    "first_name":"First",
    "last_name":"Last",
    "segment_ids":["SEGMENT_ID_HERE"]
  }'
```

### 4) Verify subscriber details
```bash
curl -sS "https://api.flodesk.com/v1/subscribers/person@example.com" \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json"
```

### 5) Verify segment membership by filter
```bash
curl -sS "https://api.flodesk.com/v1/subscribers?segment_id=SEGMENT_ID_HERE&per_page=100" \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json"
```

## This Repo Integration Notes
- Client submissions are handled via `POST /api/store-results`.
- Flodesk sync code lives in:
  - `api/store-results.ts`
  - `api/calendly.ts`
- Required Vercel env vars:
  - `FLODESK_API_KEY`
  - `FLODESK_CALCULATOR_USED_SEGMENT_ID`

## Common Failure Modes
- `subscriber_not_found` after test:
  - Check whether API call failed silently in app logs.
  - Confirm API key has no trailing newline in env vars.
- Segment not applied:
  - Ensure payload uses `segment_ids` array.
  - Confirm segment ID exists in account.
- App says `ok: true` but no subscriber:
  - Pull Vercel logs for `/api/store-results` and inspect Flodesk warning output.

## Ready-to-Run Checklist
1. Confirm segment exists or create it.
2. Add/update env vars in Vercel.
3. Deploy.
4. Submit one live test email through app.
5. Confirm subscriber exists in Flodesk with segment attached.
