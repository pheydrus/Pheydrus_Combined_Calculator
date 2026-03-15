# Pheydrus AI Chatbot - Feature Specifications

All functional and technical requirements for the 6 sub-features are documented here.

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

**Created**: March 8, 2026
**Status**: SPECIFICATIONS COMPLETE — READY FOR DEVELOPMENT
