# Functional Requirements: Chat Models & Knowledge Search Service

## Overview

Client-side TypeScript type definitions and two service modules that power the chatbot: (1) a knowledge search service that lazy-loads the knowledge base and performs full-text search to find relevant context chunks, and (2) a chat API service that sends messages to the serverless API and parses the SSE response stream into tokens.

## Scope

- TypeScript interfaces for all chat and knowledge base data structures
- FlexSearch-based client-side full-text search over knowledge base chunks
- Lazy loading of chunks.json (deferred until first chat page visit)
- Chat API client with SSE stream parsing
- Core document prioritization in search results
- Context size management (~50K token cap)

## User Stories

### US-1: Define Chat Data Types

**As a** developer
**I want** TypeScript interfaces for all chat-related data structures
**So that** type safety is enforced across the chat feature

**Acceptance Criteria:**

- [ ] `ChatMessage` interface defined with: role ("user" | "assistant"), content (string), citations (optional array), timestamp (number)
- [ ] `Citation` interface defined with: documentId (string), title (string), category (string), excerpt (string)
- [ ] `KnowledgeChunk` interface defined with: id (string), documentId (string), title (string), category (string), content (string), isCore (boolean)
- [ ] `KnowledgeManifest` interface defined with: generatedAt (string), totalDocuments (number), totalChunks (number), categories (string[]), documents (array)
- [ ] `ChatApiRequest` interface defined with: messages (array), context (array)
- [ ] `ChatApiResponse` type defined for SSE token events
- [ ] All interfaces are exported and importable across the project

### US-2: Load Knowledge Base on Demand

**As a** user visiting the chat page
**I want** the knowledge base loaded only when I first open chat
**So that** the main calculator page loads quickly without downloading the large chunks file

**Acceptance Criteria:**

- [ ] `chunks.json` is NOT loaded during initial page load or calculator usage
- [ ] `chunks.json` is fetched on first call to the search service
- [ ] Subsequent search calls use the already-loaded data (no re-fetching)
- [ ] Loading state is exposed so the UI can show a loading indicator
- [ ] Load failure is handled gracefully with an error message (not a crash)
- [ ] Estimated chunks.json size: 2-5 MB, loaded via fetch from `/knowledge-base/chunks.json`

### US-3: Search Knowledge Base

**As a** chat service
**I want** to search the knowledge base for chunks relevant to a user's message
**So that** the API receives focused context for generating accurate responses

**Acceptance Criteria:**

- [ ] `searchKnowledge(query: string)` accepts a search query and returns matching chunks
- [ ] Search uses FlexSearch for full-text indexing and retrieval
- [ ] Results are ranked by relevance (FlexSearch default scoring)
- [ ] Search is case-insensitive
- [ ] Multi-word queries match documents containing any of the words
- [ ] Search completes within 100ms for typical queries
- [ ] Empty query returns no results (no chunks sent to API)

### US-4: Always Include Core Document Chunks

**As a** chat service
**I want** chunks from the 5 core documents always included in search results
**So that** Claude always has access to essential Pheydrus reference material

**Acceptance Criteria:**

- [ ] All chunks with `isCore: true` are included in every search result
- [ ] Core chunks are included even if they don't match the search query
- [ ] Core chunks do not count against the search result limit (they are additive)
- [ ] Core documents:
  1. pheydrus_ai_master_catalog_FINAL.txt
  2. product_routing_decision_tree.txt
  3. life_path_numbers.txt
  4. rising-sign-database.txt
  5. PublicCMOInitialSalesLogic.txt

### US-5: Cap Total Context Size

**As a** developer
**I want** the total context sent to the API capped at approximately 50,000 tokens
**So that** Claude's context window is not exceeded and API costs stay manageable

**Acceptance Criteria:**

- [ ] Total character count of all returned chunks does not exceed ~200,000 characters (~50K tokens)
- [ ] Core document chunks are included first (they have priority)
- [ ] Remaining budget is filled with search-matched chunks in relevance order
- [ ] If core chunks alone exceed the cap, they are truncated to fit
- [ ] The cap is applied before returning results, not at the API layer

### US-6: Send Chat Message via API

**As a** chat interface
**I want** a service function that sends messages to the `/api/chat` endpoint
**So that** the chat UI doesn't need to handle HTTP/SSE details directly

**Acceptance Criteria:**

- [ ] `sendChatMessage(messages, context)` sends a POST request to `/api/chat`
- [ ] Request body matches the `ChatApiRequest` interface
- [ ] Function returns a `ReadableStream` reader for consuming SSE tokens
- [ ] SSE events are parsed: `data: {"token":"text"}` yields the token string
- [ ] The `[DONE]` event signals stream completion
- [ ] Connection errors throw a descriptive error
- [ ] Timeout after 30 seconds of no data triggers an error

### US-7: Parse SSE Stream

**As a** chat interface
**I want** SSE events parsed into individual token strings
**So that** the UI can append tokens to the response as they arrive

**Acceptance Criteria:**

- [ ] Each `data: {"token":"..."}` SSE line is parsed and the token string extracted
- [ ] `data: [DONE]` signals the end of the stream
- [ ] Malformed SSE lines are skipped (no crash)
- [ ] Multi-byte characters split across SSE boundaries are handled correctly
- [ ] The parser works with the Fetch API's `ReadableStream`

## Data Flow

```
User types message
        │
        ▼
searchKnowledge(query)
        │
        ├── Always include core chunks
        ├── FlexSearch for matching chunks
        ├── Cap at ~50K tokens
        │
        ▼
sendChatMessage(messages, context)
        │
        ├── POST /api/chat with messages + context
        ├── Returns SSE stream reader
        │
        ▼
Chat UI consumes tokens from stream
```

## Performance Requirements

- Knowledge base lazy-load: no impact on initial page load
- FlexSearch index build: under 500ms after chunks.json loads
- Individual search query: under 100ms
- FlexSearch library size: ~6KB gzip (minimal bundle impact)
- SSE parsing: real-time (no buffering delay)

---

**Important:** The knowledge search service is the bridge between the static knowledge base (built by Feature 6.1) and the serverless API (Feature 6.2). Search quality directly impacts response quality. Core documents must always be included to ensure Claude has essential context.
