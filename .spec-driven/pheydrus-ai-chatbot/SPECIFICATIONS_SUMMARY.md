# Pheydrus AI Chatbot - Specifications Summary

## Project Overview

Add an AI-powered chatbot page to the Pheydrus Combined Calculator web application. The chatbot uses the Claude API, is grounded in all Pheydrus course content (Train_CMO dataset), and helps users understand Pheydrus offerings, get personalized recommendations, and explore course content with cited sources.

## Architecture Decision: Pre-Indexed Knowledge Base (No RAG)

Total text content is only ~716KB across 241 files — far too small for vector DB/embeddings overhead. Instead:

- **Build-time**: Script processes all Train_CMO data into searchable JSON chunks
- **Runtime**: FlexSearch (6KB) does client-side full-text search; core documents always included
- **API**: Vercel serverless function proxies Claude API calls (keeps API key secure)
- **Streaming**: SSE for real-time token-by-token responses

## Specifications Completed

### 6.1 Knowledge Base Build Script

- **Status**: Specs Complete
- **Functional Requirements**: [knowledge-base-build-script/functional-requirements.md](./spec/knowledge-base-build-script/functional-requirements.md)
- **Technical Requirements**: [knowledge-base-build-script/technical-requirements.md](./spec/knowledge-base-build-script/technical-requirements.md)
- **Key Points**:
  - Process 241 txt + 107 pdf files from `data/Train_CMO/`
  - Output manifest.json + chunks.json to `public/knowledge-base/`
  - Chunk large documents (~800 tokens with overlap)
  - Flag 5 core documents (product catalog, routing, life paths, rising signs, sales logic)
  - Integrated into `npm run build` and `npm run dev`

### 6.2 Vercel Serverless API

- **Status**: Specs Complete
- **Functional Requirements**: [vercel-serverless-api/functional-requirements.md](./spec/vercel-serverless-api/functional-requirements.md)
- **Technical Requirements**: [vercel-serverless-api/technical-requirements.md](./spec/vercel-serverless-api/technical-requirements.md)
- **Key Points**:
  - POST /api/chat endpoint with SSE streaming
  - Claude API via @anthropic-ai/sdk (claude-sonnet-4-6)
  - API key in Vercel environment variable
  - System prompt based on proven Azure app prompts
  - Citation instructions baked into system prompt

### 6.3 Chat Models & Knowledge Search Service

- **Status**: Specs Complete
- **Functional Requirements**: [chat-models-and-search/functional-requirements.md](./spec/chat-models-and-search/functional-requirements.md)
- **Technical Requirements**: [chat-models-and-search/technical-requirements.md](./spec/chat-models-and-search/technical-requirements.md)
- **Key Points**:
  - TypeScript interfaces for chat messages, citations, chunks
  - FlexSearch client-side full-text search over chunks.json
  - Core documents always included regardless of search
  - SSE stream parser for chatApi service
  - ~50K token context cap per query

### 6.4 Chat UI Components

- **Status**: Specs Complete
- **Functional Requirements**: [chat-ui-components/functional-requirements.md](./spec/chat-ui-components/functional-requirements.md)
- **Technical Requirements**: [chat-ui-components/technical-requirements.md](./spec/chat-ui-components/technical-requirements.md)
- **Key Points**:
  - ChatThread, ChatMessage, ChatInput, CitationLink components
  - useChat hook manages state + streaming
  - react-markdown for rendering assistant responses
  - Welcome message with starter questions
  - Auto-scroll, loading indicators, error states

### 6.5 Chat Page & Navigation Integration

- **Status**: Specs Complete
- **Functional Requirements**: [chat-page-and-navigation/functional-requirements.md](./spec/chat-page-and-navigation/functional-requirements.md)
- **Technical Requirements**: [chat-page-and-navigation/technical-requirements.md](./spec/chat-page-and-navigation/technical-requirements.md)
- **Key Points**:
  - `/chat` route inside Layout wrapper
  - "Chat" link in main navigation header
  - SourcePanel for citation detail display
  - Consistent gold/purple styling
  - Mobile responsive

### 6.6 Document Viewer (Low Priority)

- **Status**: Specs Complete
- **Functional Requirements**: [document-viewer/functional-requirements.md](./spec/document-viewer/functional-requirements.md)
- **Technical Requirements**: [document-viewer/technical-requirements.md](./spec/document-viewer/technical-requirements.md)
- **Key Points**:
  - react-pdf for in-browser PDF rendering
  - Text/image file display in modal
  - Triggered from citation links
  - Original files served from `public/knowledge-base/originals/`

## Key Design Decisions

1. **No RAG Infrastructure**: 716KB of text doesn't justify vector DB. Pre-indexed JSON + FlexSearch is simpler.
2. **Core Documents Always Included**: Product catalog, routing tree, life paths, rising signs, and sales logic are always in context.
3. **Vercel Serverless**: Same project/deployment, API key never exposed client-side.
4. **Streaming SSE**: Real-time feel, works within Vercel Hobby 10s timeout (streaming keeps connection alive).
5. **Session-Only Chat**: No database, no persistent history. Conversations live in React state.
6. **Data in Git**: Train_CMO committed to repo. Update by editing files and pushing.

## Architecture Overview

```
data/Train_CMO/ (committed to repo)
         |
   [npm run build:kb]
         |
public/knowledge-base/ (manifest.json + chunks.json)
         |
    [User visits /chat]
         |
    FlexSearch (client-side search)
         |
    POST /api/chat (Vercel serverless)
         |
    Claude API (streaming)
         |
    Chat UI (markdown + citations)
```

## Tech Stack Additions

| Package             | Purpose                            | Size        |
| ------------------- | ---------------------------------- | ----------- |
| `@anthropic-ai/sdk` | Claude API client (serverless)     | Server-only |
| `flexsearch`        | Client-side full-text search       | ~6KB gzip   |
| `react-markdown`    | Markdown rendering in chat         | ~12KB gzip  |
| `pdf-parse`         | PDF text extraction (build script) | Dev dep     |
| `tsx`               | TypeScript script runner           | Dev dep     |
| `react-pdf`         | PDF viewer (low priority)          | ~200KB gzip |

## Implementation Order

```
6.1 Knowledge Base Build Script
 |
 +--► 6.2 Vercel Serverless API
 |
 +--► 6.3 Chat Models & Search Service
       |
       +--► 6.4 Chat UI Components
             |
             +--► 6.5 Chat Page & Navigation
                   |
                   +--► 6.6 Document Viewer (low priority)
```

---

**All specifications are complete and ready for implementation.**

**Status**: READY FOR DEVELOPMENT
