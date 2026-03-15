# Functional Requirements: Knowledge Base Build Script

## Overview

Build-time script that processes the `data/Train_CMO/` directory of training documents into a structured, searchable JSON knowledge base. The script extracts text from multiple file formats, chunks content into search-optimized segments, and outputs a manifest and chunks file for use by the client-side chat search service.

## Scope

### Input: Training Data Directory

The `data/Train_CMO/` directory contains approximately 352 files across 12 category folders:

- **21DOMA** - 21 Days of Manifesting Abundance
- **Artist_s Way** - Artist's Way content
- **Business Growth + Content Creation** - Business growth material
- **Everwebinars** - Evergreen webinar content
- **FYNS** - Find Your North Star program
- **FloDesk Emails** - Email marketing content
- **Freebies - Calculators - Webinars** - Free resources and webinar transcripts
- **Hero_s Journey** - Hero's Journey framework content
- **Public_CMO** - Public-facing CMO content
- **Sales_Pitches** - Sales materials and scripts
- **Skool** - Skool community content
- **Video Testimonials_Transcripts** - Video testimonial transcripts

### File Types

| Type                      | Count   | Handling                                             |
| ------------------------- | ------- | ---------------------------------------------------- |
| .txt                      | 241     | Direct text extraction                               |
| .pdf                      | 107     | Text extraction via pdf-parse                        |
| .json                     | 2       | Testimonial data: `{"filename.png": "text content"}` |
| .csv                      | 1       | Row-based text extraction                            |
| .docx                     | 1       | Text extraction                                      |
| Images (.png, .jpg, etc.) | Various | Skipped entirely                                     |

### Output: Knowledge Base Files

Two files generated to `public/knowledge-base/`:

1. **`manifest.json`** - Document metadata index
2. **`chunks.json`** - Chunked text content for search

## User Stories

### US-1: Process Text Files

**As a** developer
**I want** .txt files extracted and chunked into the knowledge base
**So that** plain text training content is searchable by the chatbot

**Acceptance Criteria:**

- [ ] All 241 .txt files in `data/Train_CMO/` subdirectories are read
- [ ] File content is extracted as-is (UTF-8 encoding)
- [ ] Category is derived from the parent folder name
- [ ] Document title is derived from the filename (without extension)
- [ ] Empty files are skipped with a console warning
- [ ] Files with content are chunked and included in output

### US-2: Process PDF Files

**As a** developer
**I want** .pdf files extracted and chunked into the knowledge base
**So that** PDF training documents are searchable by the chatbot

**Acceptance Criteria:**

- [ ] All 107 .pdf files are processed using pdf-parse
- [ ] Text content is extracted from all pages
- [ ] Image-only PDFs (no extractable text) fail gracefully with a console warning
- [ ] Corrupted or unreadable PDFs fail gracefully with a console warning
- [ ] Successfully extracted PDFs are chunked and included in output
- [ ] PDF processing does not halt the entire build on individual file failure

### US-3: Process JSON Testimonial Files

**As a** developer
**I want** .json testimonial files parsed and included in the knowledge base
**So that** customer testimonial content is searchable by the chatbot

**Acceptance Criteria:**

- [ ] JSON files with format `{"filename.png": "text content"}` are parsed
- [ ] Each key-value pair becomes a separate document in the knowledge base
- [ ] Document title is derived from the image filename key
- [ ] Category is derived from the parent folder name
- [ ] Invalid JSON files fail gracefully with a console warning

### US-4: Process CSV and DOCX Files

**As a** developer
**I want** .csv and .docx files extracted and chunked into the knowledge base
**So that** all text-based training content is included

**Acceptance Criteria:**

- [ ] The 1 .csv file is read and rows are concatenated into text content
- [ ] The 1 .docx file has its text content extracted
- [ ] Both file types are chunked and included in the output
- [ ] Extraction failures are logged and do not halt the build

### US-5: Skip Image Files

**As a** developer
**I want** image files silently skipped during processing
**So that** the build does not waste time on non-text content

**Acceptance Criteria:**

- [ ] Files with extensions .png, .jpg, .jpeg, .gif, .bmp, .webp, .svg are skipped
- [ ] No error or warning is logged for skipped image files
- [ ] Skipped files do not appear in manifest or chunks output

### US-6: Chunk Text Content

**As a** developer
**I want** document text split into overlapping chunks of approximately 800 tokens
**So that** search results return focused, relevant passages rather than entire documents

**Acceptance Criteria:**

- [ ] Each chunk targets approximately 800 tokens (~3200 characters)
- [ ] Chunks overlap by approximately 100 tokens (~400 characters) to preserve context across boundaries
- [ ] Chunking splits on paragraph boundaries when possible, falling back to sentence boundaries
- [ ] Each chunk is assigned a unique ID (e.g., `{documentId}_chunk_{index}`)
- [ ] Chunk metadata includes: documentId, title, category, chunk index
- [ ] Short documents (under 800 tokens) produce a single chunk

### US-7: Flag Core Documents

**As a** developer
**I want** 5 critical documents flagged as "core" in the knowledge base
**So that** the search service can always include them in chat context

**Acceptance Criteria:**

- [ ] The following 5 documents are flagged with `isCore: true`:
  1. `pheydrus_ai_master_catalog_FINAL.txt`
  2. `product_routing_decision_tree.txt`
  3. `life_path_numbers.txt`
  4. `rising-sign-database.txt`
  5. `PublicCMOInitialSalesLogic.txt`
- [ ] All other documents have `isCore: false`
- [ ] Core flag is present on every chunk belonging to a core document
- [ ] Build warns if any core document is not found in the source data

### US-8: Generate Manifest File

**As a** developer
**I want** a manifest.json file listing all processed documents
**So that** the client can display document metadata without loading all chunks

**Acceptance Criteria:**

- [ ] `public/knowledge-base/manifest.json` is generated
- [ ] Each entry includes: documentId, title, category, chunkCount, isCore, sourceFile
- [ ] Entries are sorted alphabetically by title
- [ ] Build prints summary: total documents, total chunks, documents per category

### US-9: Generate Chunks File

**As a** developer
**I want** a chunks.json file containing all text chunks
**So that** the client-side search service can load and index them

**Acceptance Criteria:**

- [ ] `public/knowledge-base/chunks.json` is generated
- [ ] Each chunk includes: id, documentId, title, category, content, isCore
- [ ] File is valid JSON parseable by the browser
- [ ] Total file size is logged at build completion

### US-10: Integrate with Build System

**As a** developer
**I want** the knowledge base script to run as part of npm build and dev workflows
**So that** the knowledge base is always up-to-date with source data

**Acceptance Criteria:**

- [ ] Script runs via `npx tsx scripts/build-knowledge-base.ts`
- [ ] Script is integrated into `npm run build` (runs before Vite build)
- [ ] Script is integrated into `npm run dev` (runs before Vite dev server starts)
- [ ] Output files (`public/knowledge-base/`) are gitignored
- [ ] Script completes within 30 seconds for the full dataset
- [ ] Script exits with non-zero code if critical errors occur (e.g., Train_CMO directory missing)

## Error Handling

| Scenario                            | Behavior                                           |
| ----------------------------------- | -------------------------------------------------- |
| `data/Train_CMO/` directory missing | Script exits with error code 1 and clear message   |
| Individual file read failure        | Log warning, skip file, continue processing        |
| PDF with no extractable text        | Log warning, skip file, continue processing        |
| Invalid JSON file                   | Log warning, skip file, continue processing        |
| Core document not found             | Log warning (build continues but alerts developer) |
| Output directory doesn't exist      | Create `public/knowledge-base/` automatically      |

## Build Output Summary

At completion, the script prints a summary:

```
Knowledge Base Build Complete
-----------------------------
Documents processed: 312
Documents skipped: 40 (images/errors)
Total chunks: ~2,400
Core documents: 5/5 found
Manifest: public/knowledge-base/manifest.json
Chunks: public/knowledge-base/chunks.json (X.X MB)
Build time: X.Xs
```

---

**Important:** The knowledge base is regenerated on every build. Source data in `data/Train_CMO/` is the single source of truth. Output files must never be committed to version control.
