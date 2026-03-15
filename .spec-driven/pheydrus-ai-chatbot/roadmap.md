# Pheydrus AI Chatbot - Product Roadmap

## Project Vision

Add an AI-powered knowledge assistant to the Pheydrus Combined Calculator that helps users explore Pheydrus courses, get personalized product recommendations, and learn about astrology/numerology concepts — all grounded in the actual Train_CMO training materials with cited sources.

## Problem Statement

Pheydrus has extensive course content, product catalogs, and training materials spread across multiple documents. Users and team members need a fast, conversational way to:

- Understand which Pheydrus program is right for them
- Get answers about specific course content (Artist's Way, Hero's Journey, Business Growth, 21 DOMA)
- Learn about life path numbers, rising signs, and product routing
- Access product details with correct pricing and links

Previously handled by an Azure-based chatbot (Pheydrus Pluto New) with RAG infrastructure. This new implementation is simpler, cheaper, and integrated directly into the existing web app.

## Target Users

- **Prospective Students** - Exploring which Pheydrus program fits their needs
- **Current Students** - Looking up course content and concepts
- **Internal Team** - Coaches, support staff needing quick reference to program details
- **Curious Visitors** - Learning about astrology, numerology, and personal development

## Success Metrics

- Chatbot answers questions about any Pheydrus course accurately with citations
- Product recommendations include correct names, prices, and links
- Responses stream in real-time with < 3s to first token
- API key never exposed in client-side code
- Average query cost < $0.01 (Sonnet pricing)
- Chat page loads in < 2 seconds

## Features (Priority Order)

### 6.1 Knowledge Base Build Script - [HIGH Priority]

**Description**: Build-time script that processes all Train_CMO data (241 txt + 107 pdf files) into a structured, searchable knowledge base (manifest.json + chunks.json).

**Key Activities**:

- Walk Train_CMO directory, read text files, extract text from PDFs
- Categorize by folder path, chunk large documents
- Flag core documents for always-include behavior
- Integrate into npm build/dev scripts

**Complexity**: MEDIUM
**Depends On**: None
**User Impact**: Foundation — no chatbot works without this

---

### 6.2 Vercel Serverless API - [HIGH Priority]

**Description**: Secure serverless endpoint that proxies Claude API calls, keeping the API key server-side and streaming responses back to the client.

**Key Activities**:

- Create POST /api/chat Vercel serverless function
- Integrate @anthropic-ai/sdk with streaming
- Design system prompt based on proven Azure app prompts
- Input validation and error handling

**Complexity**: MEDIUM
**Depends On**: None (can parallel with 6.1)
**User Impact**: Critical — enables AI responses

---

### 6.3 Chat Models & Knowledge Search Service - [HIGH Priority]

**Description**: TypeScript types for the chat system and client-side search service that finds relevant knowledge base chunks for each user query.

**Key Activities**:

- Define ChatMessage, Citation, KnowledgeChunk interfaces
- Implement FlexSearch index over chunks.json
- Build SSE stream parser for chat API responses
- Ensure core documents always included in search results

**Complexity**: MEDIUM
**Depends On**: 6.1 (needs chunks.json format)
**User Impact**: High — determines answer quality

---

### 6.4 Chat UI Components - [HIGH Priority]

**Description**: React components for the chat interface: message thread, input box, citation links, and streaming display.

**Key Activities**:

- ChatThread with auto-scroll and welcome message
- ChatMessage with markdown rendering (react-markdown)
- ChatInput with Enter-to-send and disabled-while-streaming
- CitationLink for clickable source references
- useChat hook for state management

**Complexity**: MEDIUM
**Depends On**: 6.3 (types and search service)
**User Impact**: Critical — what users see and interact with

---

### 6.5 Chat Page & Navigation Integration - [HIGH Priority]

**Description**: Wire everything together into a `/chat` route accessible from the main navigation, with source panel for citation display.

**Key Activities**:

- Create ChatPage view
- Add /chat route to App.tsx
- Add "Chat" to Layout navigation
- Build SourcePanel for citation details
- Style to match existing app theme

**Complexity**: LOW
**Depends On**: 6.4 (components)
**User Impact**: Critical — makes chatbot accessible

---

### 6.6 Document Viewer (Low Priority) - [LOW Priority]

**Description**: In-browser viewer for original source documents (PDFs, images, text files) linked from chat citations.

**Key Activities**:

- Integrate react-pdf for PDF rendering
- Build modal/panel document viewer
- Copy original files to public directory at build time
- Link from citation clicks

**Complexity**: MEDIUM
**Depends On**: 6.5
**User Impact**: Nice-to-have — enhances trust in citations

---

## Release Timeline

### Phase 1: Foundation (Features 6.1-6.3)

- Knowledge base processing pipeline
- Serverless API with Claude integration
- Search service and type definitions
- **Deliverable**: Backend working end-to-end

### Phase 2: User Interface (Features 6.4-6.5)

- Chat components with streaming
- Page routing and navigation
- Source panel for citations
- **Deliverable**: Fully functional chatbot on /chat

### Phase 3: Enhancement (Feature 6.6)

- Document viewer for original files
- **Deliverable**: Complete experience with document viewing

## Out of Scope (Future)

- User authentication / login
- Persistent chat history (database)
- Multiple personas / conversation modes
- Runtime document upload / admin panel
- Voice input/output
- Integration with calculator results
- GitHub Actions auto-rebuild on data changes

---

**Created**: March 8, 2026
**Version**: 1.0
**Status**: Ready for Specification & Development
