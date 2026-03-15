# Technical Requirements: Chat Models & Knowledge Search Service

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Browser (client-side)
- **Search Library**: FlexSearch (~6KB gzip)
- **HTTP**: Fetch API with ReadableStream for SSE
- **Build**: Vite (tree-shaking, code splitting)

## Architecture

```
src/
├── models/
│   └── chat.ts                      # All chat & knowledge base TypeScript interfaces
└── services/
    ├── knowledgeSearch.ts            # FlexSearch-based knowledge base search
    └── chatApi.ts                    # Chat API client with SSE stream parsing
```

## Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "flexsearch": "^0.7.43"
  },
  "devDependencies": {
    "@types/flexsearch": "^0.7.6"
  }
}
```

## Type Definitions

### src/models/chat.ts

```typescript
// Chat message in conversation history
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: number; // Date.now() at creation
}

// Citation reference within an assistant message
export interface Citation {
  documentId: string; // References KnowledgeChunk.documentId
  title: string; // Document title for display
  category: string; // Document category for display
  excerpt: string; // Relevant excerpt from the source
}

// Single chunk from the knowledge base (matches build script output)
export interface KnowledgeChunk {
  id: string; // Format: {documentId}_chunk_{index}
  documentId: string; // Parent document identifier
  title: string; // Document title
  category: string; // Category from Train_CMO folder name
  content: string; // Chunk text content
  isCore: boolean; // Whether this is a core document chunk
}

// Manifest file structure (matches build script output)
export interface KnowledgeManifest {
  generatedAt: string; // ISO 8601 timestamp
  totalDocuments: number;
  totalChunks: number;
  categories: string[];
  documents: ManifestDocument[];
}

export interface ManifestDocument {
  documentId: string;
  title: string;
  category: string;
  chunkCount: number;
  isCore: boolean;
  sourceFile: string;
}

// API request body for POST /api/chat
export interface ChatApiRequest {
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

// SSE token event from the API
export interface ChatTokenEvent {
  token: string;
}
```

## Knowledge Search Service

### src/services/knowledgeSearch.ts

```typescript
import { Index } from 'flexsearch';
import type { KnowledgeChunk } from '../models/chat';

// Module-level state (singleton pattern)
let chunks: KnowledgeChunk[] | null = null;
let coreChunks: KnowledgeChunk[] = [];
let searchIndex: Index | null = null;
let loadPromise: Promise<void> | null = null;

// Lazy-load chunks.json and build FlexSearch index
export async function loadKnowledgeBase(): Promise<void> {
  // If already loaded, return immediately
  // If currently loading, return existing promise (dedup concurrent calls)
  // Fetch /knowledge-base/chunks.json
  // Parse JSON into KnowledgeChunk[]
  // Separate core chunks (isCore: true) into coreChunks array
  // Build FlexSearch index over all chunks
}

// Search for relevant chunks
export async function searchKnowledge(query: string): Promise<KnowledgeChunk[]> {
  // 1. Ensure knowledge base is loaded (call loadKnowledgeBase)
  // 2. If query is empty, return only core chunks
  // 3. Search FlexSearch index with query
  // 4. Map result IDs back to KnowledgeChunk objects
  // 5. Combine: core chunks + search results (deduplicated)
  // 6. Apply token cap (~200,000 characters total)
  // 7. Return combined results
}

// Check if knowledge base is loaded
export function isKnowledgeBaseLoaded(): boolean;
```

### FlexSearch Configuration

```typescript
const searchIndex = new Index({
  tokenize: 'forward', // Prefix matching for partial words
  resolution: 9, // Default relevance resolution
  cache: true, // Cache frequent queries
});

// Index each chunk by its array position
chunks.forEach((chunk, i) => {
  searchIndex.add(i, chunk.content);
});
```

### Context Size Management

```typescript
const MAX_CONTEXT_CHARS = 200_000; // ~50K tokens at 4 chars/token

function applyContextCap(chunks: KnowledgeChunk[]): KnowledgeChunk[] {
  let totalChars = 0;
  const result: KnowledgeChunk[] = [];

  for (const chunk of chunks) {
    if (totalChars + chunk.content.length > MAX_CONTEXT_CHARS) {
      break;
    }
    result.push(chunk);
    totalChars += chunk.content.length;
  }

  return result;
}
```

### Deduplication

```typescript
// Core chunks are always first; search results added only if not already core
function combineResults(
  coreChunks: KnowledgeChunk[],
  searchResults: KnowledgeChunk[]
): KnowledgeChunk[] {
  const coreIds = new Set(coreChunks.map((c) => c.id));
  const dedupedSearch = searchResults.filter((c) => !coreIds.has(c.id));
  return [...coreChunks, ...dedupedSearch];
}
```

## Chat API Service

### src/services/chatApi.ts

```typescript
import type { ChatApiRequest, ChatMessage, KnowledgeChunk } from '../models/chat';

const CHAT_API_URL = '/api/chat';
const STREAM_TIMEOUT_MS = 30_000;

// Send chat message and return SSE stream reader
export async function sendChatMessage(
  messages: ChatMessage[],
  context: KnowledgeChunk[]
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  // 1. Build ChatApiRequest from messages and context
  // 2. POST to /api/chat with JSON body
  // 3. Check response.ok, throw on error
  // 4. Return response.body.getReader()
}

// Parse SSE stream into async iterator of token strings
export async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<string, void, unknown> {
  // 1. Read chunks from reader
  // 2. Decode Uint8Array to string (TextDecoder)
  // 3. Buffer partial lines (SSE lines end with \n\n)
  // 4. For each complete "data: ..." line:
  //    - If "data: [DONE]", return (end generator)
  //    - Otherwise parse JSON and yield token string
  // 5. Skip malformed lines (no crash)
}
```

### SSE Parsing Logic

```typescript
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  // Process complete SSE events (separated by double newline)
  const events = buffer.split('\n\n');
  buffer = events.pop() || ''; // Keep incomplete last event in buffer

  for (const event of events) {
    const dataLine = event.trim();
    if (!dataLine.startsWith('data: ')) continue;

    const data = dataLine.slice(6); // Remove "data: " prefix
    if (data === '[DONE]') return;

    try {
      const parsed = JSON.parse(data);
      yield parsed.token;
    } catch {
      // Skip malformed JSON
    }
  }
}
```

### Error Handling

```typescript
export class ChatApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'ChatApiError';
  }
}

// In sendChatMessage:
if (!response.ok) {
  const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
  throw new ChatApiError(errorBody.error || 'Failed to send message', response.status);
}

if (!response.body) {
  throw new ChatApiError('No response stream available', 500);
}
```

### Timeout Handling

```typescript
// Wrap reader.read() with timeout
function readWithTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number
): Promise<ReadableStreamReadResult<Uint8Array>> {
  return Promise.race([
    reader.read(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new ChatApiError('Stream timeout', 408)), timeoutMs)
    ),
  ]);
}
```

## Lazy Loading Strategy

The knowledge base is loaded lazily to avoid impacting the main calculator page:

1. `chunks.json` is a static asset in `public/knowledge-base/` (served by Vite/Vercel)
2. The `loadKnowledgeBase()` function is called on first chat page visit
3. A singleton promise prevents duplicate fetches if called multiple times
4. The FlexSearch index is built in-memory after the JSON is loaded
5. Subsequent searches reuse the in-memory index (no re-fetch, no re-index)

### Load Sequence

```
Chat page mounted
        │
        ▼
loadKnowledgeBase()
        │
        ├── fetch('/knowledge-base/chunks.json')
        ├── Parse JSON → KnowledgeChunk[]
        ├── Filter core chunks
        ├── Build FlexSearch index
        │
        ▼
Ready for search (subsequent calls instant)
```

## Performance Requirements

| Operation              | Target                      |
| ---------------------- | --------------------------- |
| chunks.json fetch      | Network-dependent (~2-5 MB) |
| FlexSearch index build | < 500ms                     |
| Single search query    | < 100ms                     |
| FlexSearch bundle size | ~6KB gzip                   |
| SSE token parsing      | Real-time (< 1ms per event) |

## Testing Strategy

### Unit Tests

- **Type definitions**: Verify interfaces compile correctly with sample data
- **Search service**: Mock chunks data, verify search returns relevant results
- **Core chunk inclusion**: Verify core chunks always present in results
- **Context cap**: Verify total context stays under limit
- **Deduplication**: Verify no duplicate chunks in combined results
- **SSE parser**: Verify token extraction from mock SSE streams
- **Error handling**: Verify ChatApiError creation and propagation

### Integration Tests

- Load actual chunks.json and verify FlexSearch indexing
- Search with real queries and verify result relevance
- End-to-end: search → API call → stream parsing

### Test Data

```typescript
const mockChunks: KnowledgeChunk[] = [
  {
    id: 'life-path-numbers_chunk_0',
    documentId: 'life-path-numbers',
    title: 'life_path_numbers',
    category: 'Public_CMO',
    content: 'Life path number 1 represents leadership...',
    isCore: true,
  },
  {
    id: 'sales-pitch-1_chunk_0',
    documentId: 'sales-pitch-1',
    title: 'Sales Pitch Opening',
    category: 'Sales_Pitches',
    content: 'Welcome to Pheydrus, where we help you...',
    isCore: false,
  },
];
```

## Files to Create

1. `src/models/chat.ts` - TypeScript interfaces for chat and knowledge base
2. `src/services/knowledgeSearch.ts` - FlexSearch-based knowledge base search service
3. `src/services/chatApi.ts` - Chat API client with SSE stream parsing

---

**Important:** The search service and chat API service are client-side code that runs in the browser. FlexSearch was chosen for its small bundle size (~6KB gzip) and fast performance. The lazy-loading pattern is critical to avoid penalizing users who only use the calculator features.
