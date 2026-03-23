# Functional Requirements: Internal Training Mode (Feature 6.9)

## Overview

Add an "Internal Training" prompt mode to the private chat that acts as an interactive training system for internal team members learning about Pheydrus products. The training mode teaches employees about Hero's Journey, Artist's Way, and Business Growth programs with specific module references, inline media previews of source materials (PDFs, slides, images), and comprehension quizzes.

## Dependencies

- **Feature 6.7** (Public & Private Chat Split): Private chat route and dual knowledge bases must exist
- **Feature 6.8** (Multi-Prompt System): Prompt dropdown infrastructure must exist
- **Feature 6.6** (Document Viewer): Media preview infrastructure (build script file copying, DocumentViewer component) — 6.9 extends this with inline chat previews
- **react-pdf**: For inline PDF thumbnail rendering

## User Stories

### US-1: Internal Training Prompt in Dropdown

**As a** Pheydrus team member
**I want** to select "Internal Training" from the private chat mode dropdown
**So that** I can learn about Pheydrus products in a structured, interactive way

**Acceptance Criteria:**

- [ ] New "Internal Training" option added to private chat dropdown (alongside General Knowledge and Email Generator)
- [ ] Selecting Internal Training clears conversation (existing behavior from 6.8)
- [ ] Starter questions are training-specific:
  - "Walk me through the Hero's Journey program modules"
  - "What are the 11 modules of Artist's Way and their themes?"
  - "Explain the Business Growth program structure"
  - "What modalities are used across the Pheydrus programs?"
- [ ] System prompt instructs Claude to act as a product trainer, not a sales assistant

### US-2: Module-Specific Training Content

**As a** team member in training
**I want** the chatbot to reference specific modules, worksheets, and presentations
**So that** I learn the actual program content in detail, not just summaries

**Acceptance Criteria:**

- [ ] Claude references specific modules by name (e.g., "Nightmare — 5 Soul Wounds", "Clarity — Inspecting the Blueprint")
- [ ] Claude cites specific documents: worksheets, presentations, video transcripts, journal prompts
- [ ] Claude provides module structure and sequence (which modules come first, prerequisites)
- [ ] Claude explains the purpose and learning objectives of each module
- [ ] Claude distinguishes between the 3 programs and their unique approaches:
  - Hero's Journey: 8 phases (Energy Diagnostic → Dream → Nightmare → Opportunity → Integrate → New Dream → Quantum Relationships → New Dream again)
  - Artist's Way: 11 modules (Clarity → Integrate → Opportunity → Dimensions → Dream → Nightmare → Electromagnetic Connections → Portal → Synchronicity → Real Estate Numerology → New Dream)
  - Business Growth: 7 tarot-themed modules (Fool → Magician → High Priestess → Empress → Emperor → Hierophant → Lovers)

### US-3: Inline Media Previews

**As a** team member in training
**I want** to see actual worksheets, presentations, and images referenced by the chatbot directly in the chat
**So that** I can study the materials without leaving the conversation

**Acceptance Criteria:**

- [ ] When Claude references a document, it can include a media preview tag: `[Preview: relative/path/to/file.pdf]`
- [ ] ChatMessage component parses `[Preview: ...]` tags and renders inline previews
- [ ] Preview types:
  - **PDF**: Thumbnail of first page with "View Full Document" button
  - **Image (PNG/JPG)**: Inline image, click to expand
  - **Text files**: Collapsible excerpt (first 500 chars) with "Show More" / "View Full Document"
- [ ] Clicking "View Full Document" opens the DocumentViewer modal (from Feature 6.6)
- [ ] Previews are responsive — scale appropriately on mobile
- [ ] If file is unavailable (404), preview shows graceful fallback: "Document preview unavailable"
- [ ] Maximum 3 previews per message to avoid overwhelming the chat

### US-4: Natural Comprehension Questions

**As a** team member in training
**I want** the chatbot to naturally ask clarifying and comprehension questions
**So that** I engage with the material and the chatbot can tailor its explanations

**Acceptance Criteria:**

- [ ] Claude naturally asks 1-2 follow-up or comprehension questions after explaining a module or concept
- [ ] Questions are specific and reference actual program content (not generic)
- [ ] Questions help the chatbot understand what the user already knows vs needs to learn
- [ ] Claude evaluates user answers and provides corrective feedback with source references
- [ ] Claude acknowledges correct answers and reinforces understanding
- [ ] Claude gently corrects wrong answers with the right information and its source
- [ ] Questions feel conversational, not like a formal test or quiz mode

### US-5: Media Asset Registry (Build-Time)

**As a** developer
**I want** the build script to generate a media asset manifest
**So that** Claude knows which files exist and can reference them by path

**Acceptance Criteria:**

- [ ] Build script generates `public/knowledge-base/private/media-manifest.json`
- [ ] Media manifest maps document IDs to their original file paths in `public/knowledge-base/originals/`
- [ ] Each entry includes: `id`, `fileName`, `relativePath`, `publicUrl`, `fileType` (pdf/image/text), `fileSizeKB`, `category`, `subcategory`
- [ ] Only files relevant to the 3 training products are included initially (Hero_s Journey, Artist_s Way, Business Growth + Content Creation)
- [ ] Media manifest is injected into the training prompt context so Claude knows what's available to preview
- [ ] Build script copies original files to `public/knowledge-base/originals/` preserving folder structure (extends Feature 6.6 US-4)

## System Prompt Requirements

The Internal Training prompt must instruct Claude to:

1. **Act as a product trainer** — not a sales assistant, not a general chatbot
2. **Teach with specificity** — reference exact module names, worksheet titles, presentation names
3. **Use media previews** — when explaining a concept, include `[Preview: path]` for relevant worksheets/slides
4. **Follow a pedagogical structure**:
   - Start with program overview when asked
   - Drill into modules on follow-up
   - Provide examples and references
   - Ask comprehension questions periodically
5. **Know the available media** — the prompt includes the media manifest so Claude can reference real files
6. **Quiz on request** — when user says "quiz me" or "test me", switch to assessment mode
7. **Stay focused** — only train on Hero's Journey, Artist's Way, and Business Growth content

## Visual Design Requirements

### Inline Preview Cards

- Card with subtle border (consistent with chat bubble styling)
- PDF previews: 120px tall thumbnail + filename + "View Full Document" link
- Image previews: Max 300px wide inline, click to expand to DocumentViewer
- Text previews: Collapsible with smooth animation, monospace-like font for excerpts
- Preview cards are visually distinct from regular message text (slight background tint)

### Quiz/Question Styling

- No special styling needed — questions render as normal markdown
- Claude can use bold for questions and bullet points for multiple-choice options

## Error Scenarios

- Media file not found: Preview card shows "Document unavailable" with filename
- Media manifest not loaded: Training mode still works (text-only, no previews)
- Large PDF preview: Only render first page thumbnail (not full PDF)
- Claude references a file not in the manifest: Show `[Source: filename]` as a regular citation badge (existing behavior)

## Performance Requirements

- Media manifest loads once and is cached in memory
- PDF thumbnails render at reduced resolution (72 DPI, ~120px height)
- Image previews lazy-load (only fetch when scrolled into view)
- No more than 3 preview cards per message to limit DOM weight

## Accessibility

- Preview cards have `role="img"` with descriptive `aria-label`
- "View Full Document" buttons have descriptive aria-labels including filename
- Quiz questions work with screen readers (standard markdown rendering)
- Collapsible text previews use `aria-expanded` state

## Testing Strategy

- Prompt option appears in dropdown and clears chat on selection
- Starter questions render for training mode
- `[Preview: ...]` tags parse correctly in ChatMessage
- PDF thumbnail renders for valid PDF path
- Image preview renders for valid image path
- Text preview renders with collapse/expand
- 404 file shows graceful fallback
- Natural follow-up: Claude asks comprehension question → user answers → Claude provides feedback
- Media manifest generated correctly by build script
- Build script copies files to originals directory

---

**Created**: March 22, 2026
**Status**: SPECIFICATION COMPLETE — READY FOR DEVELOPMENT
