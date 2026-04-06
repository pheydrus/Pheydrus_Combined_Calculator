Get the transcript from a TikTok, Instagram Reel, or YouTube URL.

## Steps

1. Read `GETTRANSCRIBE_KEY` from the `.env` file in the project root.
   If missing, say: "Add your GETTRANSCRIBE_KEY to the .env file first."

2. Make this API call:
   ```
   POST https://api.gettranscribe.ai/transcriptions
   Header: x-api-key: <GETTRANSCRIBE_KEY>
   Body: { "url": "$ARGUMENTS", "language": "en" }
   ```

3. Return the `transcription` field from the response as plain text in the chat.
   If there's an error, show it clearly.
