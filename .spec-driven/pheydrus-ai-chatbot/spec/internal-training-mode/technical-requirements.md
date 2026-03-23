# Technical Requirements: Internal Training Mode (Feature 6.9)

## Tech Stack

- **Language**: TypeScript
- **Framework**: React 18+
- **PDF Rendering**: react-pdf (from Feature 6.6)
- **Styling**: App.css (project convention)
- **Build**: Vite
- **API**: Vercel serverless function (extends api/chat-private.ts)
- **Testing**: Vitest + React Testing Library

## Architecture

```
scripts/
└── build-knowledge-base.ts        ← MODIFIED (add media manifest + file copy)

public/knowledge-base/
├── private/
│   ├── manifest.json               ← MODIFIED (add originalPath per document)
│   ├── chunks.json
│   └── media-manifest.json          ← NEW (media asset registry)
└── originals/                       ← NEW (copied source files)
    ├── Hero_s Journey/
    │   ├── Dream/12 House Shadow Traits.pdf
    │   ├── Energy Diagnostic/Energy Diagnostic.pdf
    │   └── ...
    ├── Artist_s Way/
    │   ├── Clarity/Clarity Worksheets.pdf
    │   ├── Dream/Dream Presentation.pdf
    │   └── ...
    └── Business Growth + Content Creation/
        └── BG Module Description.txt

api/
└── chat-private.ts                  ← MODIFIED (add training prompt + media manifest injection)

src/
├── models/
│   └── chat.ts                      ← MODIFIED (add PromptOption, MediaAsset types)
├── hooks/
│   └── useChat.ts                   ← MODIFIED (load media manifest for training mode)
├── services/chat/
│   └── mediaAssets.ts               ← NEW (media manifest loader + lookup)
├── components/chat/
│   ├── ChatMessage.tsx              ← MODIFIED (parse [Preview: ...] tags)
│   ├── MediaPreview.tsx             ← NEW (inline preview card component)
│   └── DocumentViewer.tsx           ← FROM 6.6 (lazy-loaded modal viewer)
└── views/
    └── PrivateChatPage.tsx          ← MODIFIED (wire DocumentViewer to preview clicks)
```

## New Types

### MediaAsset (in `src/models/chat.ts`)

```typescript
export interface MediaAsset {
  id: string;
  fileName: string;
  relativePath: string; // path within Train_CMO/
  publicUrl: string; // served path: /knowledge-base/originals/...
  fileType: 'pdf' | 'image' | 'text';
  fileSizeKB: number;
  category: string; // Hero_s Journey, Artist_s Way, etc.
  subcategory: string; // Dream, Nightmare, Clarity, etc.
}

export interface MediaManifest {
  generatedAt: string;
  assetCount: number;
  assets: MediaAsset[];
}
```

### Extended PromptOption (in `src/models/chat.ts`)

```typescript
// Add 'internal-training' to PRIVATE_PROMPT_OPTIONS array:
{
  id: 'internal-training',
  label: 'Internal Training',
  description: 'Learn about Pheydrus products — modules, materials, and quizzes',
  starterQuestions: [
    "Walk me through the Hero's Journey program modules",
    "What are the 11 modules of Artist's Way and their themes?",
    "Explain the Business Growth program structure",
    "What modalities are used across the Pheydrus programs?",
  ],
}
```

## Build Script Extension

### File: `scripts/build-knowledge-base.ts`

#### 1. Copy Original Files to Public

```typescript
const ORIGINALS_DIR = path.join(OUTPUT_DIR, '..', 'originals');
const MEDIA_EXTENSIONS = new Set(['.pdf', '.txt', '.png', '.jpg', '.jpeg', '.gif']);
const MAX_FILE_SIZE_MB = 50;

// Training-relevant categories only (for media manifest)
const TRAINING_CATEGORIES = new Set([
  'Hero_s Journey',
  'Artist_s Way',
  'Business Growth + Content Creation',
]);

function copyOriginalFiles(allFiles: string[]): MediaAsset[] {
  const assets: MediaAsset[] = [];

  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    if (!MEDIA_EXTENSIONS.has(ext)) continue;

    const relativePath = path.relative(DATA_DIR, filePath);
    const { category, subcategory } = getCategoryFromPath(relativePath);

    // Only include training-relevant categories in media manifest
    if (!TRAINING_CATEGORIES.has(category)) continue;

    const stats = fs.statSync(filePath);
    const fileSizeKB = Math.round(stats.size / 1024);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      console.warn(`  ⚠ Skipping large file: ${relativePath} (${fileSizeMB.toFixed(1)}MB)`);
      continue;
    }

    // Copy file preserving directory structure
    const destPath = path.join(ORIGINALS_DIR, relativePath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(filePath, destPath);

    const fileType =
      ext === '.pdf' ? 'pdf' : ['.png', '.jpg', '.jpeg', '.gif'].includes(ext) ? 'image' : 'text';

    assets.push({
      id: slugify(relativePath),
      fileName: path.basename(filePath),
      relativePath: relativePath.replace(/\\/g, '/'),
      publicUrl: `/knowledge-base/originals/${relativePath.replace(/\\/g, '/')}`,
      fileType,
      fileSizeKB,
      category,
      subcategory,
    });
  }

  return assets;
}
```

#### 2. Generate Media Manifest

```typescript
// After copying files:
const mediaAssets = copyOriginalFiles(allFiles);
const mediaManifest: MediaManifest = {
  generatedAt: new Date().toISOString(),
  assetCount: mediaAssets.length,
  assets: mediaAssets,
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'private', 'media-manifest.json'),
  JSON.stringify(mediaManifest, null, 2)
);
```

#### 3. Update Document Manifest with originalPath

```typescript
// For each document in the manifest, add originalPath if the original was copied:
const assetByRelPath = new Map(mediaAssets.map((a) => [a.relativePath, a.publicUrl]));

for (const doc of documents) {
  doc.originalPath = assetByRelPath.get(doc.relativePath) ?? null;
}
```

## API: Training Prompt

### File: `api/chat-private.ts`

Add a third prompt entry to the `PROMPTS` dictionary:

```typescript
'internal-training': {
  system: `You are Pheydrus Internal Trainer — an interactive training assistant that helps team members deeply learn the Pheydrus product catalog.

## Your Role
You are a patient, thorough product trainer. You teach internal team members about three programs:

1. **Hero's Journey** — 8 phases: Energy Diagnostic → Dream → Nightmare → Opportunity → Integrate → New Dream → Quantum Relationships → New Dream (revisited)
2. **Artist's Way** — 11 modules (building-as-metaphor): Clarity → Integrate → Opportunity → Dimensions → Dream → Nightmare → Electromagnetic Connections → Portal → Synchronicity → Real Estate Numerology → New Dream
3. **Business Growth** — 7 tarot-themed modules: Fool → Magician → High Priestess → Empress → Emperor → Hierophant → Lovers

## Teaching Approach
- Start with program overviews when asked broadly
- Drill into specific modules on follow-up questions
- Reference EXACT module names, worksheet titles, and presentation names from the knowledge base
- Explain the modalities used in each module (Human Design, astrology, numerology, feng shui, akashic records, etc.)
- Explain the metaphorical framework (Hero's Journey uses Joseph Campbell's monomyth; Artist's Way uses a building/real-estate metaphor)

## Media Previews
You have access to a media manifest listing available files. When explaining a concept that has a relevant worksheet, presentation, or visual:
- Include \`[Preview: relative/path/to/file.pdf]\` in your response
- Use previews to show worksheets, presentations, journal prompts
- Maximum 3 previews per response
- Only reference files that exist in the MEDIA MANIFEST below
- If no relevant file exists, use standard \`[Source: filename]\` citations instead

## Comprehension Questions
- Naturally ask 1-2 follow-up or clarifying questions after explaining a module or concept
- Use questions to gauge what the user already knows and tailor your depth accordingly
- When the user answers, evaluate their response against the source material
- For correct answers: confirm and reinforce with additional context
- For incorrect answers: gently correct with the right information and cite the source
- Keep the tone conversational — questions should feel like a natural part of the discussion, not a formal test

## Citation Rules
- Always cite your sources: \`[Source: filename]\`
- Use exact filenames from the knowledge base
- If you're unsure, say so — do not fabricate information

## Boundaries
- Only discuss Hero's Journey, Artist's Way, and Business Growth programs
- If asked about unrelated topics, redirect warmly: "Great question! That's outside my training scope. I'm here to help you master the Pheydrus programs. Want to continue with [current topic]?"
- Do not discuss pricing, sales strategies, or customer information

## MEDIA MANIFEST
The following files are available for [Preview: ...] tags. Use the relativePath value:
{MEDIA_MANIFEST}

## KNOWLEDGE BASE CONTEXT
{CONTEXT}`,
}
```

### Media Manifest Injection

```typescript
// In the API handler, when promptId === 'internal-training':
// Load media manifest and inject into prompt

const mediaManifestPath = path.join(
  process.cwd(),
  'public',
  'knowledge-base',
  'private',
  'media-manifest.json'
);
let mediaManifestText = '(No media manifest available)';

try {
  const raw = fs.readFileSync(mediaManifestPath, 'utf-8');
  const manifest = JSON.parse(raw);
  // Format as a concise list for the prompt
  mediaManifestText = manifest.assets
    .map(
      (a: MediaAsset) =>
        `- ${a.relativePath} (${a.fileType}, ${a.fileSizeKB}KB) [${a.category} > ${a.subcategory}]`
    )
    .join('\n');
} catch {
  console.warn('Media manifest not found');
}

const systemPrompt = PROMPTS[promptId].system
  .replace('{MEDIA_MANIFEST}', mediaManifestText)
  .replace('{CONTEXT}', contextBlock);
```

## Frontend: Inline Media Preview

### File: `src/services/chat/mediaAssets.ts` (NEW)

```typescript
import type { MediaAsset, MediaManifest } from '../../models/chat';

let cachedManifest: MediaManifest | null = null;
let loading: Promise<MediaManifest> | null = null;

export async function loadMediaManifest(): Promise<MediaManifest> {
  if (cachedManifest) return cachedManifest;
  if (loading) return loading;

  loading = fetch('/knowledge-base/private/media-manifest.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((manifest: MediaManifest) => {
      cachedManifest = manifest;
      return manifest;
    });

  return loading;
}

export function lookupAsset(relativePath: string): MediaAsset | undefined {
  return cachedManifest?.assets.find((a) => a.relativePath === relativePath);
}

export function getPublicUrl(relativePath: string): string {
  return `/knowledge-base/originals/${relativePath}`;
}
```

### File: `src/components/chat/MediaPreview.tsx` (NEW)

```typescript
interface MediaPreviewProps {
  relativePath: string;
  fileType: 'pdf' | 'image' | 'text';
  fileName: string;
  publicUrl: string;
  onViewFull: (publicUrl: string, fileName: string, fileType: 'pdf' | 'image' | 'text') => void;
}

function MediaPreview({
  relativePath,
  fileType,
  fileName,
  publicUrl,
  onViewFull,
}: MediaPreviewProps) {
  // Renders based on fileType:
  // - pdf: canvas thumbnail of page 1 (120px height) + "View Full Document" link
  // - image: inline <img> max 300px wide + click to expand
  // - text: fetched excerpt (first 500 chars) in collapsible card
}
```

**PDF Thumbnail Rendering:**

```typescript
// Use react-pdf Document + Page at small scale for thumbnail
// Lazy-load react-pdf only when a PDF preview is in the message
const PdfThumbnail = React.lazy(() => import('./PdfThumbnail'));

function PdfThumbnail({ publicUrl }: { publicUrl: string }) {
  return (
    <Document file={publicUrl} loading={<div className="preview-skeleton" />}>
      <Page pageNumber={1} height={120} />
    </Document>
  );
}
```

### File: `src/components/chat/ChatMessage.tsx` (MODIFIED)

Add `[Preview: ...]` parsing alongside existing `[Source: ...]` parsing:

```typescript
const PREVIEW_REGEX = /\[Preview:\s*([^\]]+)\]/g;

function extractPreviews(content: string): { cleanContent: string; previewPaths: string[] } {
  const previewPaths: string[] = [];
  const cleanContent = content.replace(PREVIEW_REGEX, (_, path) => {
    if (previewPaths.length < 3) { // max 3 previews per message
      previewPaths.push(path.trim());
    }
    return ''; // remove tag from visible text
  });
  return { cleanContent, previewPaths };
}

// In the render, after markdown content:
{previewPaths.length > 0 && (
  <div className="media-previews">
    {previewPaths.map((p) => {
      const asset = lookupAsset(p);
      if (!asset) return <PreviewUnavailable key={p} fileName={p} />;
      return (
        <MediaPreview
          key={p}
          relativePath={asset.relativePath}
          fileType={asset.fileType}
          fileName={asset.fileName}
          publicUrl={asset.publicUrl}
          onViewFull={onViewDocument}
        />
      );
    })}
  </div>
)}
```

## Styling

### File: `src/App.css` (additions)

```css
/* Media Preview Cards */
.media-previews {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.media-preview-card {
  border: 1px solid #e5e0d5;
  border-radius: 8px;
  padding: 12px;
  background: #faf9f7;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 400px;
}

.media-preview-card:hover {
  border-color: #9a7d4e;
}

.media-preview-thumbnail {
  flex-shrink: 0;
  width: 80px;
  height: 120px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.media-preview-info {
  flex: 1;
  min-width: 0;
}

.media-preview-filename {
  font-size: 0.8rem;
  font-weight: 600;
  color: #3a3226;
  word-break: break-word;
}

.media-preview-meta {
  font-size: 0.7rem;
  color: #8a7e6e;
  margin-top: 2px;
}

.media-preview-action {
  font-size: 0.75rem;
  color: #9a7d4e;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 8px;
  background: none;
  border: none;
  padding: 0;
}

.media-preview-action:hover {
  color: #7a6340;
}

/* Image inline preview */
.media-preview-image {
  max-width: 300px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.media-preview-image:hover {
  opacity: 0.9;
}

/* Text excerpt preview */
.media-preview-text {
  font-size: 0.75rem;
  color: #5a5248;
  white-space: pre-wrap;
  max-height: 100px;
  overflow: hidden;
  position: relative;
}

.media-preview-text--collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: linear-gradient(transparent, #faf9f7);
}

.preview-unavailable {
  font-size: 0.75rem;
  color: #a09080;
  font-style: italic;
  padding: 8px 12px;
  border: 1px dashed #d5d0c5;
  border-radius: 8px;
}

.preview-skeleton {
  width: 80px;
  height: 120px;
  background: linear-gradient(90deg, #eee 25%, #ddd 50%, #eee 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

## Data Flow

```
BUILD TIME:
  Train_CMO/
  ├── Process text → chunks.json (existing)
  └── Copy originals → public/knowledge-base/originals/ (new)
       └── Generate media-manifest.json (new)

QUERY TIME (training mode):
  User selects "Internal Training" from dropdown
       │
       ▼
  useChat('private', 'internal-training')
       │
       ├──► knowledgeSearch loads private/chunks.json (existing)
       │
       ▼
  POST /api/chat-private
       │
       ├──► Server loads media-manifest.json
       ├──► Injects manifest list into system prompt
       ├──► Injects knowledge base context
       ├──► Calls Claude API
       │
       ▼
  Claude response (streamed):
    "The Nightmare module covers 5 Soul Wounds...
     [Source: Soul Wounds.pdf]
     [Preview: Hero_s Journey/Nightmare/5 Soul Wounds/Soul Wounds.pdf]

     What are the 5 Soul Wounds? Can you name at least 3?"
       │
       ▼
  ChatMessage parses response:
    ├──► [Source: ...] → citation badges (existing)
    ├──► [Preview: ...] → MediaPreview cards (new)
    └──► Regular text → markdown (existing)
       │
       ▼
  MediaPreview renders:
    ├──► PDF: thumbnail via react-pdf + "View Full Document"
    ├──► Image: inline <img> + click to expand
    └──► Text: collapsible excerpt + "View Full Document"
       │
       ▼
  Click "View Full Document" → DocumentViewer modal (from 6.6)
```

## Performance Considerations

- **Media manifest size**: ~200 training-relevant files → ~30KB JSON. Acceptable for single fetch + cache.
- **PDF thumbnails**: react-pdf renders Page 1 at 120px height. Small canvas, fast render. Lazy-load the react-pdf chunk.
- **Image previews**: Use `loading="lazy"` on `<img>` tags for below-the-fold previews.
- **File copy at build time**: ~200 files, mostly PDFs 50KB–5MB. Adds ~30s to build, ~50MB to public assets. Acceptable for Vercel Hobby tier (which allows up to 100MB per function, static assets separate).
- **Prompt size**: Media manifest adds ~10KB to prompt. Well within Claude's context.

## Files to Create

1. `src/services/chat/mediaAssets.ts` — media manifest loader + lookup
2. `src/components/chat/MediaPreview.tsx` — inline preview card component

## Files to Modify

1. `scripts/build-knowledge-base.ts` — copy originals + generate media-manifest.json
2. `api/chat-private.ts` — add 'internal-training' prompt + manifest injection
3. `src/models/chat.ts` — add MediaAsset/MediaManifest types + new PromptOption
4. `src/components/chat/ChatMessage.tsx` — parse `[Preview: ...]` tags, render MediaPreview cards
5. `src/views/PrivateChatPage.tsx` — wire DocumentViewer for preview clicks
6. `src/App.css` — media preview card styles

## Migration Checklist

- [ ] Build script copies training-relevant files to `public/knowledge-base/originals/`
- [ ] Build script generates `public/knowledge-base/private/media-manifest.json`
- [ ] `internal-training` prompt added to `api/chat-private.ts` with manifest injection
- [ ] `Internal Training` option added to PRIVATE_PROMPT_OPTIONS in chat.ts
- [ ] MediaPreview component renders PDF thumbnails, images, and text excerpts
- [ ] ChatMessage parses `[Preview: ...]` tags (max 3 per message)
- [ ] DocumentViewer opens from MediaPreview clicks
- [ ] Comprehension questions appear naturally in training responses
- [ ] 404 files show graceful fallback in preview cards
- [ ] react-pdf lazy-loaded (not in main bundle)
- [ ] Media manifest cached after first load
- [ ] All styles match gold/purple theme
- [ ] Build succeeds with file copying step
- [ ] Vercel deployment serves originals as static assets

---

**Created**: March 22, 2026
**Status**: SPECIFICATION COMPLETE — READY FOR DEVELOPMENT
