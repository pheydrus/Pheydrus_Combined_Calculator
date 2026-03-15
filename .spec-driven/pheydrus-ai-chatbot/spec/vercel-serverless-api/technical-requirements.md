# Technical Requirements: Vercel Serverless API

## Tech Stack

- **Runtime**: Vercel Serverless Functions (Node.js 18+)
- **Language**: TypeScript
- **Claude SDK**: @anthropic-ai/sdk
- **Model**: claude-sonnet-4-6
- **Transport**: Server-Sent Events (SSE) over HTTP
- **Local Dev**: `vercel dev`

## Architecture

```
api/
└── chat.ts                          # POST /api/chat serverless function

src/
└── models/
    └── chat.ts                      # Shared types (ChatApiRequest, ChatApiResponse, etc.)
```

The serverless function lives in the `api/` directory at the project root, following Vercel's file-based routing convention. A single file handles the entire `/api/chat` endpoint.

## Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0"
  }
}
```

## Environment Configuration

### Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...       # Required, never client-side
```

### Local Development

```bash
# .env.local (gitignored)
ANTHROPIC_API_KEY=sk-ant-your-dev-key-here
```

### Vercel Production

Set `ANTHROPIC_API_KEY` in Vercel project settings under Environment Variables. Apply to Production and Preview environments.

## API Specification

### Endpoint

```
POST /api/chat
Content-Type: application/json
```

### Request Schema

```typescript
interface ChatApiRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  context: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
  }>;
}
```

### Response: SSE Stream

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"token":"Hello"}

data: {"token":" there"}

data: {"token":"!"}

data: [DONE]
```

### Error Responses

```typescript
// All errors return JSON (not SSE)
interface ChatApiError {
  error: string;
}
```

| Status | Condition                | Body                                             |
| ------ | ------------------------ | ------------------------------------------------ |
| 400    | Missing/empty messages   | `{"error": "Messages array is required"}`        |
| 400    | Message content too long | `{"error": "Message exceeds maximum length"}`    |
| 400    | Context too large        | `{"error": "Context exceeds maximum size"}`      |
| 400    | Invalid role value       | `{"error": "Invalid message role"}`              |
| 400    | Invalid JSON body        | `{"error": "Invalid request format"}`            |
| 405    | Non-POST method          | `{"error": "Method not allowed"}`                |
| 413    | Body > 1 MB              | `{"error": "Request too large"}`                 |
| 429    | Claude rate limited      | `{"error": "Service is busy, please try again"}` |
| 500    | Missing API key          | `{"error": "Chat service is not configured"}`    |
| 502    | Claude API error         | `{"error": "Failed to generate response"}`       |

## Core Implementation

### Serverless Function Structure

```typescript
// api/chat.ts
import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Method check (POST only)
  // 2. Validate ANTHROPIC_API_KEY exists
  // 3. Parse and validate request body
  // 4. Build system prompt with context
  // 5. Set SSE headers
  // 6. Create Claude streaming request
  // 7. Pipe tokens as SSE events
  // 8. Send [DONE] event on completion
  // 9. Handle errors at each stage
}
```

### System Prompt Construction

```typescript
function buildSystemPrompt(context: ChatApiRequest['context']): string {
  const contextBlock = context
    .map((chunk) => `[${chunk.category}] ${chunk.title}:\n${chunk.content}`)
    .join('\n\n---\n\n');

  return `You are Pheydrus AI, a warm and knowledgeable guide for personal development,
astrology, and numerology. You help users understand their cosmic blueprint
and navigate their personal growth journey.

INSTRUCTIONS:
- Answer questions using ONLY the provided context below
- If the context doesn't contain enough information, say so honestly
- Cite your sources inline using [Source: filename] format
- Stay on topic: astrology, numerology, personal development, and Pheydrus offerings
- Keep responses concise (2-4 paragraphs) unless the user asks for more detail
- Be warm, encouraging, and conversational in tone
- Never fabricate information not present in the context

CONTEXT:
${contextBlock}`;
}
```

### Claude API Integration

```typescript
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Streaming call
const stream = client.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  temperature: 0.7,
  system: systemPrompt,
  messages: validatedMessages,
});
```

### SSE Streaming

```typescript
// Set SSE headers
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

// Stream tokens
stream.on('text', (text) => {
  res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
});

stream.on('end', () => {
  res.write('data: [DONE]\n\n');
  res.end();
});

stream.on('error', (error) => {
  // If headers already sent, close stream
  // Otherwise, return error JSON
});
```

### Input Validation

```typescript
const MAX_MESSAGE_LENGTH = 10_000; // Per message content
const MAX_CONTEXT_SIZE = 100_000; // Total context characters
const MAX_BODY_SIZE = 1_000_000; // 1 MB request body

function validateRequest(body: unknown): ChatApiRequest {
  // 1. Verify body is an object
  // 2. Verify messages is a non-empty array
  // 3. Verify each message has valid role ('user' | 'assistant') and content (string)
  // 4. Verify no single message.content exceeds MAX_MESSAGE_LENGTH
  // 5. Verify context is an array (may be empty)
  // 6. Verify total context content doesn't exceed MAX_CONTEXT_SIZE
  // 7. Throw descriptive error on validation failure
}
```

## Vercel Configuration

### vercel.json

```json
{
  "functions": {
    "api/chat.ts": {
      "maxDuration": 30
    }
  }
}
```

Note: Vercel Hobby plan has a 10-second execution timeout, but streaming responses keep the connection alive beyond this limit. The `maxDuration` setting is a safeguard.

### CORS Headers

```typescript
// Set on all responses (including errors)
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

// Handle OPTIONS preflight
if (req.method === 'OPTIONS') {
  return res.status(200).end();
}
```

## Error Handling Strategy

```typescript
try {
  // Validate and process request
  const validated = validateRequest(req.body);
  const systemPrompt = buildSystemPrompt(validated.context);

  // Stream response
  const stream = client.messages.stream({ ... });
  // ... pipe tokens
} catch (error) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }
  if (error instanceof Anthropic.RateLimitError) {
    return res.status(429).json({ error: 'Service is busy, please try again' });
  }
  if (error instanceof Anthropic.APIError) {
    console.error('Claude API error:', error.status, error.message);
    return res.status(502).json({ error: 'Failed to generate response' });
  }
  console.error('Unexpected error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

## Security Considerations

- API key read from `process.env` only (never hardcoded)
- API key never included in response bodies or headers
- Error messages are generic (no stack traces, no internal details)
- Input length limits prevent abuse
- No authentication required on the endpoint (public chatbot)
- Rate limiting handled by Claude API's built-in limits and Vercel's request limits

## Testing Strategy

### Unit Tests

- System prompt construction with various context sizes
- Input validation: valid requests, missing fields, oversized content
- Error mapping: Claude errors to HTTP status codes

### Integration Tests (Local)

- Full request/response cycle with `vercel dev`
- SSE stream parsing on the client side
- Error scenarios: missing API key, invalid input

### Manual Testing

- Send requests via curl or Postman to `vercel dev` server
- Verify SSE stream format in browser DevTools
- Test with empty context, large context, long conversation history

## Files to Create

1. `api/chat.ts` - Vercel serverless function
2. `vercel.json` - Vercel configuration (if not already present)
3. `.env.local` - Local development environment variables (gitignored)

---

**Important:** The serverless function must be in the `api/` directory at the project root for Vercel's file-based routing. The system prompt is critical to response quality and should be iterated on based on real user testing.
