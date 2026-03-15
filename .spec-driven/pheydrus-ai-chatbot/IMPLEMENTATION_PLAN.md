# Implementation Plan: Pheydrus AI Chatbot — All 6 Sub-Features

## Context

The Pheydrus AI Chatbot adds an AI-powered knowledge assistant to the existing Pheydrus Combined Calculator web app. It uses a pre-indexed knowledge base (no RAG infrastructure) with Claude API via Vercel serverless functions. Specs are complete. This plan coordinates all 6 sub-features.

---

## Critical Design Decisions (applies to ALL features)

### 1. Data Location

Train_CMO data is committed to `data/Train_CMO/` in this repo. Knowledge base JSON is regenerated on every build. Output is gitignored.

### 2. No RAG — Pre-Indexed + FlexSearch

716KB of text is too small for vector DB. Build-time processing creates searchable JSON chunks. FlexSearch handles client-side retrieval. Core documents always included in context.

### 3. API Key Security

Claude API key stored as Vercel environment variable (`ANTHROPIC_API_KEY`). Never in client code. Serverless function proxies all API calls.

### 4. Streaming via SSE

Server-Sent Events keep the connection alive within Vercel Hobby's 10s timeout. Responses stream token-by-token for real-time UX.

### 5. Session-Only State

Chat history lives in React state. No database, no localStorage persistence for chat. Cleared on page refresh or "New Chat".

### 6. Route Structure (after all features)

```
/               → HomePage
/calculator     → CalculatorPage
/results        → ResultsPage
/chat           → ChatPage          ← NEW
/client         → ClientAssessmentPage
/client/results → ClientResultsPage
```

### 7. New Files (final structure)

```
data/
└── Train_CMO/                        ← committed to git (migrated from Pheydrus_Pluto_New)

scripts/
└── build-knowledge-base.ts           ← 6.1

api/
└── chat.ts                           ← 6.2 (Vercel serverless)

public/
└── knowledge-base/                   ← 6.1 output (gitignored)
    ├── manifest.json
    ├── chunks.json
    └── originals/                    ← 6.6 (low priority)

src/
├── models/
│   └── chat.ts                       ← 6.3
├── services/
│   └── chat/
│       ├── knowledgeSearch.ts        ← 6.3
│       └── chatApi.ts                ← 6.3
├── hooks/
│   └── useChat.ts                    ← 6.4
├── components/
│   └── chat/
│       ├── ChatThread.tsx            ← 6.4
│       ├── ChatMessage.tsx           ← 6.4
│       ├── ChatInput.tsx             ← 6.4
│       ├── CitationLink.tsx          ← 6.4
│       ├── SourcePanel.tsx           ← 6.5
│       └── DocumentViewer.tsx        ← 6.6 (low priority)
└── views/
    └── ChatPage.tsx                  ← 6.5
```

---

## Feature 6.1: Knowledge Base Build Script

### Goal

Process all Train_CMO data into structured, searchable JSON at build time.

### Dependencies to Install

```bash
npm install --save-dev pdf-parse @types/pdf-parse tsx
```

### Steps

**Step 6.1.1 — Create `scripts/build-knowledge-base.ts`**

- Walk `data/Train_CMO/` directory tree
- Read .txt, .csv, .json, .docx files directly
- Extract text from .pdf files via pdf-parse (graceful failure on image-only PDFs)
- Categorize by top-level folder name
- Chunk documents > 3200 chars into ~800-token segments with 100-token overlap
- Flag 5 core documents with `isCore: true`
- Output `public/knowledge-base/manifest.json` (document metadata)
- Output `public/knowledge-base/chunks.json` (all text chunks)

**Step 6.1.2 — Add npm scripts to `package.json`**

- `"build:kb"`: `npx tsx scripts/build-knowledge-base.ts`
- Prepend to `"build"` and `"dev"` scripts

**Step 6.1.3 — Update `.gitignore`**

- Add `public/knowledge-base` (already done)

**Step 6.1.4 — Run and verify**

- All 241 txt files processed
- Text extracted from PDFs (skip image-only ones)
- manifest.json has correct document count
- chunks.json has all chunks with proper structure
- Core documents flagged
- Script completes in < 60 seconds

---

## Feature 6.2: Vercel Serverless API

### Goal

Secure Claude API proxy that accepts context + messages and returns streamed responses.

### Dependencies to Install

```bash
npm install @anthropic-ai/sdk
```

### Steps

**Step 6.2.1 — Create `api/chat.ts`**
Vercel serverless function:

- Accept POST with `{ messages, context }` body
- Build system prompt with Pheydrus knowledge assistant instructions
- Inject context chunks into system prompt
- Call Claude API (claude-sonnet-4-6) with streaming
- Return SSE stream
- Include citation instructions in system prompt

**Step 6.2.2 — System Prompt Design**
Based on proven Azure app prompts:

```
You are the Pheydrus Knowledge Assistant — a warm, knowledgeable guide...
CITATION RULES: [Source: filename.txt] format
TONE: Conversational but informative, like a knowledgeable friend
BOUNDARIES: Only Pheydrus content, astrology, numerology, personal development
```

**Step 6.2.3 — Environment Setup**

- Create `.env.local` with `ANTHROPIC_API_KEY` (gitignored)
- Document Vercel env var setup

**Step 6.2.4 — Input Validation**

- Max message length check
- Max context token check
- Reject malformed requests with 400

---

## Feature 6.3: Chat Models & Knowledge Search Service

### Goal

TypeScript types and client-side search that finds relevant knowledge base chunks.

### Dependencies to Install

```bash
npm install flexsearch
```

### Steps

**Step 6.3.1 — Create `src/models/chat.ts`**
All TypeScript interfaces:

- ChatMessage, Citation, KnowledgeChunk, KnowledgeManifest
- ChatApiRequest, ChatApiResponse types

**Step 6.3.2 — Create `src/services/chat/knowledgeSearch.ts`**

- Lazy-load chunks.json on first use (singleton pattern)
- Build FlexSearch index from chunk content
- `searchKnowledge(query)` → returns matching chunks
- Always include core document chunks (isCore: true)
- Cap total context at ~50K tokens (~200K chars)

**Step 6.3.3 — Create `src/services/chat/chatApi.ts`**

- `sendChatMessage(messages, context)` → async generator yielding tokens
- POST to /api/chat with SSE response parsing
- Handle connection errors and timeouts
- Parse SSE `data:` lines into token strings

---

## Feature 6.4: Chat UI Components

### Goal

Build chat interface components with streaming and markdown support.

### Dependencies to Install

```bash
npm install react-markdown
```

### Steps

**Step 6.4.1 — Create `src/hooks/useChat.ts`**

- Messages array state
- `sendMessage(text)` → search → API → stream → append
- Loading/streaming/error state tracking
- `clearChat()` to reset
- Citation extraction from `[Source: ...]` patterns

**Step 6.4.2 — Create `src/components/chat/ChatMessage.tsx`**

- User messages: right-aligned, styled bubble
- Assistant messages: left-aligned, markdown rendered via react-markdown
- Citation links highlighted inline

**Step 6.4.3 — Create `src/components/chat/ChatThread.tsx`**

- Scrollable message list
- Auto-scroll on new messages (ref-based)
- Welcome message + starter questions when empty

**Step 6.4.4 — Create `src/components/chat/ChatInput.tsx`**

- Textarea with send button
- Enter to send, Shift+Enter for newline
- Disabled while streaming
- Auto-resize textarea

**Step 6.4.5 — Create `src/components/chat/CitationLink.tsx`**

- Clickable badge component
- Emits callback with citation data for SourcePanel

---

## Feature 6.5: Chat Page & Navigation Integration

### Goal

Wire everything together into a routed, navigable page.

### Steps

**Step 6.5.1 — Create `src/views/ChatPage.tsx`**

- Uses useChat hook
- Renders ChatThread + ChatInput in main area
- SourcePanel on right (collapsible)
- "New Chat" button in header area

**Step 6.5.2 — Create `src/components/chat/SourcePanel.tsx`**

- Slide-out panel showing citation details
- Document title, category badge, content excerpt
- Close button

**Step 6.5.3 — Add `/chat` route to `src/App.tsx`**

- Inside Layout wrapper (gets header/nav/footer)

**Step 6.5.4 — Add "Chat" to `src/components/Layout.tsx`**

- Navigation link alongside Home and Calculator

**Step 6.5.5 — Style chat page**

- Match existing gold/purple theme
- Mobile responsive (SourcePanel overlays on mobile)

---

## Feature 6.6: Document Viewer (Low Priority)

### Goal

View original source documents in-browser.

### Dependencies to Install

```bash
npm install react-pdf
```

### Steps

**Step 6.6.1 — Extend build script**

- Copy original PDFs/images to `public/knowledge-base/originals/`
- Add `originalPath` field to manifest entries

**Step 6.6.2 — Create `src/components/chat/DocumentViewer.tsx`**

- Modal overlay with PDF rendering (react-pdf)
- Text file display with styling
- Image display
- Page navigation for PDFs

**Step 6.6.3 — Update CitationLink/SourcePanel**

- "View Full Document" button linking to DocumentViewer

---

## Dependency & Sequencing Summary

```
Feature 6.1 (Knowledge Base Build Script)
    ↓
Feature 6.2 (Vercel Serverless API)     ← can start parallel with 6.3
Feature 6.3 (Chat Models & Search)      ← needs 6.1 output format
    ↓
Feature 6.4 (Chat UI Components)        ← needs 6.3 types + services
    ↓
Feature 6.5 (Chat Page & Navigation)    ← needs 6.4 components
    ↓
Feature 6.6 (Document Viewer)           ← low priority, needs 6.5
```

---

## Packages to Install (all features combined)

| Package             | Feature | Purpose                            |
| ------------------- | ------- | ---------------------------------- |
| `pdf-parse`         | 6.1     | PDF text extraction (dev dep)      |
| `@types/pdf-parse`  | 6.1     | TypeScript types (dev dep)         |
| `tsx`               | 6.1     | TypeScript script runner (dev dep) |
| `@anthropic-ai/sdk` | 6.2     | Claude API client                  |
| `flexsearch`        | 6.3     | Client-side full-text search       |
| `react-markdown`    | 6.4     | Markdown rendering                 |
| `react-pdf`         | 6.6     | PDF viewer (low priority)          |

---

## Files to Modify (existing)

| File                        | Modified By | Change                                |
| --------------------------- | ----------- | ------------------------------------- |
| `package.json`              | 6.1         | Add build:kb script + deps            |
| `.gitignore`                | 6.1         | Add public/knowledge-base, .env.local |
| `src/App.tsx`               | 6.5         | Add /chat route                       |
| `src/components/Layout.tsx` | 6.5         | Add Chat nav link                     |
| `src/models/index.ts`       | 6.3         | Re-export chat types                  |

---

## Verification Plan

After all features implemented:

1. **Build**: `npm run build` — knowledge base generated, no TypeScript errors
2. **Manual smoke test**:
   - Visit /chat → welcome message appears with starter questions
   - Ask about Artist's Way → get cited answer from course content
   - Ask for product recommendation → get correct product with price
   - Click citation → SourcePanel shows document excerpt
   - Ask off-topic question → politely redirected
   - New Chat → conversation cleared
3. **Mobile test**: Chat usable on mobile viewport
4. **Security**: API key not in client bundle (`grep -r "sk-ant" dist/` returns nothing)
5. **Performance**: First token < 3s, chunks.json loads < 1s
