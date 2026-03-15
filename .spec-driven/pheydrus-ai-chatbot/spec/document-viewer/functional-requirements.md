# Functional Requirements: Document Viewer (Low Priority)

## Overview

Add an in-browser document viewer that allows users to view original source documents (PDFs, text files, images) referenced by chat citations. This is a low-priority enhancement that improves trust in the chatbot's citations by letting users see the original material.

## Priority Note

This feature is **LOW PRIORITY** and should be built last. The chatbot is fully functional without it (Features 6.1-6.5). It can be deferred indefinitely if time or resources are constrained.

## Dependencies

- **Feature 6.5** (Chat Page & Navigation): SourcePanel must exist with citation display
- **Feature 6.1** (Knowledge Base Build Script): Must be extended to copy original files
- **react-pdf**: Library for in-browser PDF rendering
- **Original source files**: PDFs (28KB to 82MB), text files, and images from `data/Train_CMO/`

## User Stories

### US-1: Document Viewer Component

**As a** user
**I want** to view the original source document that a citation comes from
**So that** I can read the full context and verify the chatbot's answer

**Acceptance Criteria:**

- [ ] DocumentViewer renders in a modal or full-panel overlay
- [ ] Supports three file types:
  - **PDF files**: Rendered page-by-page using react-pdf
  - **Text files**: Displayed with readable formatting and monospace or serif font
  - **Image files** (PNG, JPG, GIF): Displayed with fit-to-width and zoom capability
- [ ] Modal has a close button and can be dismissed with Escape key
- [ ] Modal has a title bar showing the document filename
- [ ] Loading indicator shown while document is being fetched/rendered
- [ ] Graceful fallback if the original file is unavailable (e.g., "Original document not available")

### US-2: PDF Viewing with Page Navigation

**As a** user
**I want** to browse PDF documents page by page
**So that** I can find the relevant section within a multi-page document

**Acceptance Criteria:**

- [ ] PDF renders one page at a time (not all pages simultaneously)
- [ ] Page navigation controls: Previous / Next buttons
- [ ] Current page indicator: "Page X of Y"
- [ ] Optional: page number input to jump to a specific page
- [ ] PDF pages are rendered at readable quality (not blurry)
- [ ] PDF pages scale to fit the viewer width (responsive)
- [ ] Large PDFs (up to 82MB) load progressively — first page renders quickly, not blocked by full download
- [ ] If PDF fails to load (corrupt or too large for browser memory), show error with filename

### US-3: Trigger from SourcePanel

**As a** user
**I want** a "View Full Document" button in the SourcePanel
**So that** I can open the document viewer from the citation detail view

**Acceptance Criteria:**

- [ ] SourcePanel (Feature 6.5) updated with a "View Full Document" button
- [ ] Button is positioned below the text excerpt in the SourcePanel
- [ ] Button is styled consistently (gold outline style)
- [ ] Clicking the button opens the DocumentViewer modal with the corresponding original file
- [ ] Button is only shown when the original file is available (check against manifest or known file list)
- [ ] If the original file is not available, the button is hidden (not shown as disabled)

### US-4: Build Script Extension for Original Files

**As a** developer
**I want** the build script to copy original source files to the public directory
**So that** they can be served as static assets for the document viewer

**Acceptance Criteria:**

- [ ] Knowledge base build script (Feature 6.1) extended with an additional step
- [ ] Copies original files from `data/Train_CMO/` to `public/knowledge-base/originals/`
- [ ] Preserves directory structure within `originals/` (matching category folders)
- [ ] Only copies file types that the viewer can render: `.pdf`, `.txt`, `.png`, `.jpg`, `.jpeg`, `.gif`
- [ ] Skips files exceeding a configurable size threshold (default: 100MB) with a warning
- [ ] Manifest.json (from Feature 6.1) updated to include `originalPath` field for each document that has a copied original
- [ ] Build script remains idempotent — re-running does not duplicate files
- [ ] Files are served by Vite dev server and Vercel static hosting at `/knowledge-base/originals/...`

**Example manifest entry:**

```json
{
  "id": "hero-journey-overview",
  "title": "Hero's Journey Program Overview",
  "category": "courses",
  "originalPath": "/knowledge-base/originals/courses/heros-journey-overview.pdf",
  "chunks": ["chunk-001", "chunk-002"]
}
```

### US-5: Text File Display

**As a** user
**I want** to view text files with clean formatting
**So that** I can read plain text source documents comfortably

**Acceptance Criteria:**

- [ ] Text files fetched via HTTP and displayed in the viewer
- [ ] Content displayed with readable font (serif or sans-serif, not raw monospace unless appropriate)
- [ ] Line breaks and paragraph spacing preserved
- [ ] Long lines wrap (no horizontal scrolling)
- [ ] Content area is scrollable for long documents
- [ ] UTF-8 encoding handled correctly (accented characters, special symbols)

### US-6: Image Display

**As a** user
**I want** to view image files referenced in citations
**So that** I can see diagrams, charts, or visual content from source materials

**Acceptance Criteria:**

- [ ] Images displayed centered in the viewer
- [ ] Images scale to fit the viewer width (max-width: 100%)
- [ ] Click or pinch-to-zoom for viewing details (optional — can use browser native zoom)
- [ ] Alt text or filename shown below the image
- [ ] Common formats supported: PNG, JPG/JPEG, GIF

## Visual Design Requirements

### Modal/Viewer Appearance

- Full-screen modal with semi-transparent dark backdrop
- Content area: white or light background for readability
- Title bar: deep purple with gold text showing filename
- Close button: top-right corner, prominent
- Navigation controls (for PDF): centered below the document, gold-styled buttons
- Consistent with existing app's gold/purple theme

### Responsive Behavior

- **Desktop**: Modal at 80% viewport width and height, centered
- **Mobile**: Full-screen modal (100vw x 100vh)
- PDF pages scale down to fit mobile width
- Controls remain accessible on touch devices

## Error Scenarios

- Original file not found (404): Display "Original document is not available" message in viewer
- PDF rendering failure (corrupt file, out of memory): Display error message with filename, suggest downloading
- Network timeout on large file: Show progress indicator if possible, timeout message if fails
- Unsupported file type: Display "This file type cannot be previewed" message
- Very large PDFs (50MB+): May cause browser memory issues — display warning and offer to open in new tab instead

## Performance Requirements

- First PDF page renders within 3 seconds for files under 5MB
- Text files display within 1 second
- Images display within 2 seconds (depends on file size)
- Document viewer component is lazy-loaded (not included in main bundle)
- react-pdf worker loaded asynchronously (web worker for PDF.js)
- Original files are fetched on demand (not preloaded)

## Accessibility

- Modal has `role="dialog"` and `aria-modal="true"`
- Modal title is associated via `aria-labelledby`
- Focus trapped within modal while open
- Close button has `aria-label="Close document viewer"`
- PDF page navigation buttons have aria-labels ("Previous page", "Next page")
- Current page announced to screen readers ("Page 3 of 12")
- Escape key closes the modal

## Testing Strategy

- Component test: DocumentViewer renders PDF with page navigation controls
- Component test: DocumentViewer renders text file with proper formatting
- Component test: DocumentViewer renders image at correct scale
- Component test: Error fallback when file not found
- Component test: Modal open/close behavior and focus management
- Integration test: SourcePanel "View Full Document" button opens DocumentViewer
- Build script test: Original files copied to correct public directory
- Build script test: Manifest includes originalPath for available files

---

**Important:** This feature adds significant bundle size via react-pdf (~200KB gzip). Lazy-loading the DocumentViewer component is critical to avoid impacting initial page load for users who never use this feature.
