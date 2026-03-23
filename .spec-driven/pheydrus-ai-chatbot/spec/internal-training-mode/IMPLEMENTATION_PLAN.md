# Implementation Plan: Feature 6.9 — Internal Training Mode

## Context

Adds an "Internal Training" prompt mode to the private chat that teaches team members about Hero's Journey, Artist's Way, and Business Growth programs. Includes inline media previews of PDFs, images, and text files from Train_CMO, plus comprehension quizzing. Depends on Features 6.6, 6.7, and 6.8.

---

## Feature 6.9.1: Build Script — Copy Originals + Media Manifest

**Files:** `scripts/build-knowledge-base.ts`

### Tasks:

1. Add `TRAINING_CATEGORIES` set and `MEDIA_EXTENSIONS` set constants
2. Add `copyOriginalFiles()` function:
   - Walk all files in `data/Train_CMO/`
   - Filter to training categories + supported extensions
   - Skip files > 50MB with warning
   - Copy to `public/knowledge-base/originals/` preserving folder structure
   - Return `MediaAsset[]` array
3. Add `MediaAsset` and `MediaManifest` interfaces to the script
4. After existing KB generation, call `copyOriginalFiles()`
5. Write `public/knowledge-base/private/media-manifest.json`
6. Update build summary to log originals count + size
7. Add `originals/` to `.gitignore` if not already present

### Verification:

- Run `npx tsx scripts/build-knowledge-base.ts`
- Confirm `public/knowledge-base/originals/Hero_s Journey/` exists with PDFs
- Confirm `public/knowledge-base/private/media-manifest.json` has entries
- Confirm Hero_s Journey, Artist_s Way, Business Growth files present
- Confirm Sales_Pitches, 21DOMA, etc. files NOT in originals

---

## Feature 6.9.2: Media Asset Service

**Files:** `src/services/chat/mediaAssets.ts` (NEW), `src/models/chat.ts` (MODIFY)

### Tasks:

1. Add `MediaAsset` and `MediaManifest` interfaces to `src/models/chat.ts`
2. Create `src/services/chat/mediaAssets.ts`:
   - `loadMediaManifest()` — fetch + cache `media-manifest.json`
   - `lookupAsset(relativePath)` — find asset by path
   - `getPublicUrl(relativePath)` — construct served URL
3. Export from `src/services/chat/index.ts` if barrel exists

### Verification:

- TypeScript compiles without errors
- Manual test: import and call `loadMediaManifest()` in browser console

---

## Feature 6.9.3: Internal Training Prompt

**Files:** `api/chat-private.ts` (MODIFY), `src/models/chat.ts` (MODIFY)

### Tasks:

1. Add `'internal-training'` entry to `PRIVATE_PROMPT_OPTIONS` in `src/models/chat.ts`:
   - Label: "Internal Training"
   - Description: "Learn about Pheydrus products — modules, materials, and quizzes"
   - Starter questions (4 training-specific questions)
2. Add `'internal-training'` prompt to `PROMPTS` dict in `api/chat-private.ts`:
   - Trainer role definition
   - Module structures for all 3 programs
   - `[Preview: ...]` format instructions
   - Comprehension question and quiz mode instructions
   - `{MEDIA_MANIFEST}` and `{CONTEXT}` placeholders
3. Add media manifest loading logic in the API handler:
   - Read `public/knowledge-base/private/media-manifest.json` on server
   - Format as concise list for prompt injection
   - Replace `{MEDIA_MANIFEST}` placeholder
4. Handle fallback if media manifest not found (proceed without previews)

### Verification:

- Select "Internal Training" from dropdown → correct starter questions appear
- Send a message → Claude responds in trainer voice with module references
- Claude includes `[Preview: ...]` tags in responses
- Claude naturally asks follow-up comprehension questions

---

## Feature 6.9.4: MediaPreview Component

**Files:** `src/components/chat/MediaPreview.tsx` (NEW), `src/App.css` (MODIFY)

### Tasks:

1. Create `MediaPreview` component with props: `relativePath`, `fileType`, `fileName`, `publicUrl`, `onViewFull`
2. Implement PDF preview:
   - Lazy-load react-pdf `Document` + `Page`
   - Render page 1 at 120px height as thumbnail
   - Show filename + category below
   - "View Full Document" button
   - Loading skeleton while rendering
3. Implement image preview:
   - Inline `<img>` max 300px wide with `loading="lazy"`
   - Click calls `onViewFull`
   - Filename caption
4. Implement text preview:
   - Fetch text file content (first 500 chars)
   - Collapsible card with gradient fade
   - "Show More" / "View Full Document" link
5. Implement `PreviewUnavailable` fallback for 404/missing files
6. Add all CSS styles to `src/App.css`:
   - `.media-preview-card`, `.media-preview-thumbnail`, etc.
   - `.preview-skeleton` with pulse animation
   - `.preview-unavailable` for fallback state

### Verification:

- PDF preview shows first page thumbnail
- Image preview shows inline image
- Text preview shows collapsible excerpt
- Missing file shows "Document unavailable"
- Clicking "View Full Document" triggers callback

---

## Feature 6.9.5: ChatMessage Preview Parsing

**Files:** `src/components/chat/ChatMessage.tsx` (MODIFY)

### Tasks:

1. Add `PREVIEW_REGEX` pattern: `/\[Preview:\s*([^\]]+)\]/g`
2. Add `extractPreviews()` function:
   - Parse all `[Preview: ...]` tags from content
   - Cap at 3 previews per message
   - Return clean content (tags removed) + preview paths array
3. In render: after markdown content, map preview paths to `MediaPreview` components
4. Use `lookupAsset()` from mediaAssets service to resolve paths to MediaAsset objects
5. Pass `onViewFull` callback through from parent (for DocumentViewer integration)

### Verification:

- Message with `[Preview: path]` renders preview card below text
- `[Preview: ...]` tags are not visible in message text
- Max 3 previews rendered even if Claude includes more
- Unknown paths show `PreviewUnavailable`

---

## Feature 6.9.6: DocumentViewer Integration

**Files:** `src/views/PrivateChatPage.tsx` (MODIFY)

### Tasks:

1. Add DocumentViewer state: `viewerFile: { publicUrl, fileName, fileType } | null`
2. Lazy-load DocumentViewer component: `React.lazy(() => import(...))`
3. Pass `onViewDocument` callback through ChatThread → ChatMessage → MediaPreview
4. When callback fires, set `viewerFile` state → DocumentViewer modal opens
5. Close handler clears `viewerFile` state
6. Wrap DocumentViewer in `<Suspense>` with loading fallback

### Verification:

- Click "View Full Document" on PDF preview → DocumentViewer opens with PDF
- Click image preview → DocumentViewer opens with image
- Click "View Full Document" on text preview → DocumentViewer opens
- Close button / Escape key closes viewer
- Viewer does not render when no file selected (no unnecessary lazy-load)

---

## Implementation Order

```
6.9.1  Build Script (copy files + media manifest)
  │
  ├──► 6.9.2  Media Asset Service (loader + lookup)
  │
  ├──► 6.9.3  Internal Training Prompt (API + dropdown option)
  │
  └──► 6.9.4  MediaPreview Component (inline cards)
        │
        ├──► 6.9.5  ChatMessage Preview Parsing
        │
        └──► 6.9.6  DocumentViewer Integration
```

6.9.1 must come first (generates the files). 6.9.2, 6.9.3, and 6.9.4 can be worked in parallel after that. 6.9.5 and 6.9.6 depend on 6.9.4.

---

## Risk Areas

1. **react-pdf bundle size**: ~200KB gzip. Must be lazy-loaded. If problematic, fallback to simple "Open PDF" link (no thumbnail).
2. **Vercel static asset limits**: ~50MB of copied originals. Vercel Hobby allows large static deployments but monitor build size.
3. **Claude prompt quality**: The training prompt is complex. May need iteration on:
   - How consistently Claude uses `[Preview: ...]` tags
   - Whether comprehension questions feel natural vs forced
   - Module accuracy (Claude may conflate programs if context is ambiguous)
4. **PDF rendering in chat**: react-pdf rendering multiple thumbnails in a conversation could cause performance issues. Cap at 3 per message and lazy-render off-screen previews.

---

**Created**: March 22, 2026
**Status**: PLAN COMPLETE — READY FOR DEVELOPMENT
