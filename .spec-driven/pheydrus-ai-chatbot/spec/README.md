# Pheydrus AI Chatbot - Feature Specifications

All functional and technical requirements for the 8 sub-features are documented here.

## Specifications by Feature

### Feature 6.1: Knowledge Base Build Script

Build-time processing of Train_CMO data into searchable JSON chunks.

- [Functional Requirements](./knowledge-base-build-script/functional-requirements.md)
- [Technical Requirements](./knowledge-base-build-script/technical-requirements.md)

---

### Feature 6.2: Vercel Serverless API

Secure Claude API proxy with streaming responses.

- [Functional Requirements](./vercel-serverless-api/functional-requirements.md)
- [Technical Requirements](./vercel-serverless-api/technical-requirements.md)

---

### Feature 6.3: Chat Models & Knowledge Search Service

TypeScript types and client-side FlexSearch over knowledge base.

- [Functional Requirements](./chat-models-and-search/functional-requirements.md)
- [Technical Requirements](./chat-models-and-search/technical-requirements.md)

---

### Feature 6.4: Chat UI Components

React components for chat interface with streaming and markdown.

- [Functional Requirements](./chat-ui-components/functional-requirements.md)
- [Technical Requirements](./chat-ui-components/technical-requirements.md)

---

### Feature 6.5: Chat Page & Navigation Integration

Route, navigation link, source panel, and final wiring.

- [Functional Requirements](./chat-page-and-navigation/functional-requirements.md)
- [Technical Requirements](./chat-page-and-navigation/technical-requirements.md)

---

### Feature 6.6: Document Viewer (Low Priority)

In-browser PDF/text/image viewer for original source documents.

- [Functional Requirements](./document-viewer/functional-requirements.md)
- [Technical Requirements](./document-viewer/technical-requirements.md)

---

### Feature 6.7: Public & Private Chat Split

Split chat into two routes with separate knowledge bases. Public excludes Sales_Pitches and FloDesk Emails. Private has full access.

- [Functional Requirements](./public-private-chat-split/functional-requirements.md)
- [Technical Requirements](./public-private-chat-split/technical-requirements.md)

---

### Feature 6.8: Multi-Prompt System

Configurable system prompts per chat mode. Public has one fixed prompt. Private has selectable prompts (General Knowledge, Email Generator) via dropdown.

- [Functional Requirements](./prompt-system/functional-requirements.md)
- [Technical Requirements](./prompt-system/technical-requirements.md)

---

### Feature 6.9: Internal Training Mode

Interactive training mode for the private chat — teaches team members about Hero's Journey, Artist's Way, and Business Growth programs with inline media previews and comprehension quizzes.

- [Functional Requirements](./internal-training-mode/functional-requirements.md)
- [Technical Requirements](./internal-training-mode/technical-requirements.md)
- [Implementation Plan](./internal-training-mode/IMPLEMENTATION_PLAN.md)

---

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
                   +--► 6.7 Public & Private Chat Split
                   |     (dual knowledge bases, dual routes,
                   |      dual API endpoints)
                   |
                   +--► 6.8 Multi-Prompt System
                   |     (prompt dropdown for private,
                   |      starter questions per mode)
                   |
                   +--► 6.6 Document Viewer
                   |     (modal PDF/text/image viewer)
                   |
                   +--► 6.9 Internal Training Mode     ← NEW
                         (training prompt, media previews,
                          comprehension quizzes)
                         Depends on: 6.6, 6.7, 6.8
```

Note: 6.7 and 6.8 are tightly coupled and should be implemented together. 6.9 builds on top of 6.6 (document viewer), 6.7 (private chat), and 6.8 (prompt system).

---

**Created**: March 8, 2026
**Updated**: March 22, 2026
**Status**: SPECIFICATIONS COMPLETE — READY FOR DEVELOPMENT
