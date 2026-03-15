# Technical Requirements: Document Viewer (Low Priority)

## Tech Stack

- **Language**: TypeScript
- **Framework**: React 18+
- **PDF Rendering**: react-pdf (wraps PDF.js)
- **Styling**: Tailwind CSS
- **Build**: Vite
- **Testing**: Vitest + React Testing Library

## Architecture

```
src/
├── components/
│   └── chat/
│       ├── DocumentViewer.tsx     ← NEW
│       └── SourcePanel.tsx        ← MODIFIED (add "View Full Document" button)
├── __tests__/
│   └── DocumentViewer.test.tsx
scripts/
└── build-knowledge-base.ts       ← MODIFIED (add original file copy step)
public/
└── knowledge-base/
    ├── manifest.json              ← MODIFIED (add originalPath field)
    ├── chunks.json
    └── originals/                 ← NEW (copied from data/Train_CMO/)
        ├── courses/
        │   ├── heros-journey.pdf
        │   └── artists-way.pdf
        ├── products/
        │   └── catalog.txt
        └── ...
```

## Dependencies

### New Dependencies

```json
{
  "react-pdf": "^9.x"
}
```

### react-pdf Setup

react-pdf requires a PDF.js worker. Configure in the component or at app level:

```typescript
import { pdfjs } from 'react-pdf';

// Use CDN worker to avoid bundling PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

Alternatively, copy the worker to `public/` at build time and reference it locally.

## Component Specifications

### DocumentViewer Component

**File**: `src/components/chat/DocumentViewer.tsx`

```typescript
interface DocumentViewerProps {
  filePath: string; // URL path to the original file (e.g., "/knowledge-base/originals/courses/file.pdf")
  fileName: string; // Display name for the title bar
  fileType: 'pdf' | 'text' | 'image';
  onClose: () => void;
}

function DocumentViewer({
  filePath,
  fileName,
  fileType,
  onClose,
}: DocumentViewerProps): JSX.Element;
```

**Lazy Loading (critical):**

```typescript
// In ChatPage.tsx or wherever DocumentViewer is used:
const DocumentViewer = React.lazy(() => import('./DocumentViewer'));

// Render with Suspense:
{showViewer && (
  <Suspense fallback={<LoadingOverlay />}>
    <DocumentViewer
      filePath={selectedFile.path}
      fileName={selectedFile.name}
      fileType={selectedFile.type}
      onClose={() => setShowViewer(false)}
    />
  </Suspense>
)}
```

**Modal Structure:**

```typescript
function DocumentViewer({ filePath, fileName, fileType, onClose }: DocumentViewerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}  // Close on backdrop click
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-viewer-title"
    >
      <div
        className="bg-white rounded-lg w-[80vw] h-[80vh] md:w-[80vw] md:h-[80vh] max-sm:w-full max-sm:h-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}  // Prevent close on content click
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-deep-purple text-gold">
          <h2 id="doc-viewer-title" className="text-sm font-semibold truncate">
            {fileName}
          </h2>
          <button onClick={onClose} aria-label="Close document viewer">
            {/* X icon */}
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-4">
          {fileType === 'pdf' && <PdfRenderer filePath={filePath} />}
          {fileType === 'text' && <TextRenderer filePath={filePath} />}
          {fileType === 'image' && <ImageRenderer filePath={filePath} fileName={fileName} />}
        </div>
      </div>
    </div>
  );
}
```

### PDF Renderer (internal to DocumentViewer)

```typescript
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

function PdfRenderer({ filePath }: { filePath: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  // Measure container width for responsive PDF scaling
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth - 32); // minus padding
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    setLoadError(`Failed to load PDF: ${error.message}`);
  };

  if (loadError) {
    return <ErrorFallback message={loadError} fileName={filePath} />;
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      <Document
        file={filePath}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={<LoadingSpinner />}
      >
        <Page
          pageNumber={currentPage}
          width={containerWidth}
          loading={<LoadingSpinner />}
        />
      </Document>

      {/* Page navigation */}
      {numPages && numPages > 1 && (
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

**Large PDF Handling:**

- react-pdf / PDF.js loads pages on demand (only the current page is rendered)
- For very large PDFs (50MB+), the initial download may be slow — show a progress bar if `fetch` progress events are available
- If browser runs out of memory during rendering, catch the error and display: "This document is too large to preview in the browser. [Open in new tab]" with a direct link

### Text Renderer (internal to DocumentViewer)

```typescript
function TextRenderer({ filePath }: { filePath: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(filePath)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(setContent)
      .catch((err) => setError(err.message));
  }, [filePath]);

  if (error) return <ErrorFallback message={`Failed to load file: ${error}`} />;
  if (content === null) return <LoadingSpinner />;

  return (
    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
      {content}
    </pre>
  );
}
```

### Image Renderer (internal to DocumentViewer)

```typescript
function ImageRenderer({ filePath, fileName }: { filePath: string; fileName: string }) {
  const [error, setError] = useState(false);

  if (error) return <ErrorFallback message="Failed to load image" />;

  return (
    <div className="flex flex-col items-center">
      <img
        src={filePath}
        alt={fileName}
        className="max-w-full h-auto"
        onError={() => setError(true)}
      />
      <p className="mt-2 text-xs text-gray-500">{fileName}</p>
    </div>
  );
}
```

### Error Fallback (shared)

```typescript
function ErrorFallback({ message, fileName }: { message: string; fileName?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <p className="text-lg mb-2">Document unavailable</p>
      <p className="text-sm">{message}</p>
      {fileName && (
        <a
          href={fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-gold underline text-sm"
        >
          Try opening in a new tab
        </a>
      )}
    </div>
  );
}
```

## SourcePanel Modification

**File**: `src/components/chat/SourcePanel.tsx` (MODIFY — created in Feature 6.5)

Add a "View Full Document" button:

```typescript
// Additional prop:
interface SourcePanelProps {
  citation: Citation;
  onClose: () => void;
  onViewDocument?: (citation: Citation) => void;  // NEW
}

// In the render, after the text content:
{citation.originalPath && onViewDocument && (
  <button
    onClick={() => onViewDocument(citation)}
    className="mt-4 w-full py-2 border border-gold text-gold rounded hover:bg-gold/10 text-sm"
  >
    View Full Document
  </button>
)}
```

**Availability Check:**

- The `originalPath` field on the Citation object (populated from manifest.json) determines whether the button is shown
- If `originalPath` is null/undefined, the button is not rendered

## Build Script Extension

**File**: `scripts/build-knowledge-base.ts` (MODIFY — created in Feature 6.1)

### New Step: Copy Original Files

Add after the existing manifest/chunks generation:

```typescript
const ORIGINALS_OUTPUT_DIR = 'public/knowledge-base/originals';
const SUPPORTED_EXTENSIONS = ['.pdf', '.txt', '.png', '.jpg', '.jpeg', '.gif'];
const MAX_FILE_SIZE_MB = 100; // Skip files larger than this

async function copyOriginalFiles(
  sourceDir: string,
  outputDir: string
): Promise<Map<string, string>> {
  const fileMap = new Map<string, string>(); // sourceRelativePath → publicPath

  // Walk sourceDir recursively
  // For each file:
  //   1. Check extension is in SUPPORTED_EXTENSIONS
  //   2. Check file size < MAX_FILE_SIZE_MB
  //   3. Copy to outputDir preserving relative directory structure
  //   4. Record mapping in fileMap

  return fileMap;
}
```

### Manifest Update

Add `originalPath` field to manifest entries:

```typescript
interface ManifestEntry {
  id: string;
  title: string;
  category: string;
  sourcePath: string;
  originalPath: string | null; // NEW — path to original file in public/
  chunkIds: string[];
}
```

### Build Script Integration

```typescript
// In the main build function:
async function buildKnowledgeBase() {
  // ... existing steps (read files, chunk, generate manifest/chunks.json) ...

  // NEW STEP: Copy originals
  console.log('Copying original files...');
  const fileMap = await copyOriginalFiles('data/Train_CMO', ORIGINALS_OUTPUT_DIR);

  // Update manifest entries with originalPath
  for (const entry of manifest) {
    const originalPath = fileMap.get(entry.sourcePath);
    entry.originalPath = originalPath || null;
  }

  // Write updated manifest
  await fs.writeFile('public/knowledge-base/manifest.json', JSON.stringify(manifest, null, 2));

  console.log(`Copied ${fileMap.size} original files to ${ORIGINALS_OUTPUT_DIR}`);
}
```

### Size Warnings

```typescript
// During copy, log warnings for skipped files:
if (fileSizeMB > MAX_FILE_SIZE_MB) {
  console.warn(
    `⚠ Skipping ${filePath} (${fileSizeMB.toFixed(1)}MB exceeds ${MAX_FILE_SIZE_MB}MB limit)`
  );
  continue;
}
```

## File Type Detection

Determine `fileType` from the file extension in `originalPath`:

```typescript
function getFileType(filePath: string): 'pdf' | 'text' | 'image' | 'unknown' {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt') return 'text';
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) return 'image';
  return 'unknown';
}
```

## Data Flow

```
User clicks citation in chat response
        |
        v
SourcePanel shows citation details
        |
        v
User clicks "View Full Document" button
        |
        v
ChatPage sets viewer state: { filePath, fileName, fileType }
        |
        v
DocumentViewer modal opens (lazy-loaded)
        |
        v
  PDF → react-pdf renders page 1, nav controls for paging
  Text → fetch() text content, display in <pre>
  Image → <img> tag with responsive sizing
        |
        v
User closes modal → ChatPage clears viewer state
```

## Performance Considerations

- **Bundle Impact**: react-pdf adds ~200KB gzip. MUST be lazy-loaded via `React.lazy()` — never imported at top level of a non-chat module
- **PDF.js Worker**: Load asynchronously from CDN or public directory — do not bundle into main JS
- **Large File Fetch**: PDFs up to 82MB. Browser will buffer the full file. Consider:
  - Showing download progress if `Content-Length` header is available
  - Setting a practical timeout (30 seconds)
  - Offering "Open in new tab" as fallback for files > 20MB
- **Memory**: PDF.js renders pages to canvas. Only render the current page (already handled by rendering one `<Page>` at a time)
- **Static Asset Serving**: Vercel serves files from `public/` as static assets with appropriate caching headers. No additional configuration needed.

## Vite Configuration

No special Vite config changes needed. Files in `public/` are served as static assets by both Vite dev server and production builds.

If react-pdf requires Vite-specific configuration (e.g., for the worker), add to `vite.config.ts`:

```typescript
// Only if needed — check react-pdf Vite compatibility docs
optimizeDeps: {
  include: ['react-pdf'],
},
```

## Testing Strategy

### DocumentViewer Tests

```typescript
// Test cases:
// - Renders PDF with page navigation controls
// - Page navigation: next/previous buttons update page number
// - Renders text file content after fetch
// - Renders image with correct src and alt
// - Shows error fallback on 404
// - Shows error fallback on PDF load failure
// - Modal closes on backdrop click
// - Modal closes on Escape key
// - Focus trapped within modal
```

### Build Script Tests

```typescript
// Test cases:
// - Copies supported file types to originals directory
// - Skips unsupported file types
// - Skips files exceeding size limit (with warning)
// - Preserves directory structure
// - Manifest entries include originalPath for copied files
// - Manifest entries have null originalPath for skipped/unsupported files
// - Idempotent: re-running does not create duplicates
```

### SourcePanel Integration Tests

```typescript
// Test cases:
// - "View Full Document" button shown when originalPath exists
// - "View Full Document" button hidden when originalPath is null
// - Button click calls onViewDocument with correct citation
```

## Files to Create

1. `src/components/chat/DocumentViewer.tsx` - Modal document viewer with PDF/text/image rendering

## Files to Modify

1. `src/components/chat/SourcePanel.tsx` - Add "View Full Document" button
2. `src/components/chat/ChatPage.tsx` - Add DocumentViewer state and lazy rendering
3. `scripts/build-knowledge-base.ts` - Add original file copy step and manifest update

## Migration Checklist

- [ ] react-pdf installed and configured (worker setup)
- [ ] DocumentViewer component created with PDF, text, and image renderers
- [ ] DocumentViewer lazy-loaded via React.lazy (not in main bundle)
- [ ] PDF page navigation working (previous/next, page indicator)
- [ ] Text file fetching and display working
- [ ] Image display with responsive sizing working
- [ ] Error fallbacks for all failure modes (404, corrupt, too large)
- [ ] Modal keyboard handling (Escape to close, focus trap)
- [ ] SourcePanel updated with "View Full Document" button (conditional)
- [ ] Build script extended to copy original files to public/knowledge-base/originals/
- [ ] Manifest.json updated with originalPath field
- [ ] Large file handling (skip files > 100MB, warn in build output)
- [ ] Styling consistent with gold/purple theme
- [ ] All tests passing
- [ ] Bundle size impact verified (react-pdf only loaded on demand)

---

**Important Note**: This is a low-priority enhancement. If react-pdf proves problematic (bundle size, compatibility issues), a simpler alternative is to open PDFs in a new browser tab using a direct link. The text and image viewers are lightweight and can be kept regardless.
