# Technical Requirements: Knowledge Base Build Script

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js (build-time script, not browser)
- **Script Runner**: tsx (via `npx tsx`)
- **PDF Parsing**: pdf-parse
- **Build Integration**: npm scripts (pre-build hook)

## Architecture

```
scripts/
└── build-knowledge-base.ts          # Main build script entry point

src/
└── utils/
    └── knowledgeBase/
        ├── fileProcessors.ts         # File type handlers (txt, pdf, json, csv, docx)
        ├── chunker.ts                # Text chunking logic
        └── types.ts                  # Build-time types (shared with runtime types)

data/
└── Train_CMO/                        # Source training data (not committed)
    ├── 21DOMA/
    ├── Artist_s Way/
    ├── Business Growth + Content Creation/
    ├── Everwebinars/
    ├── FYNS/
    ├── FloDesk Emails/
    ├── Freebies - Calculators - Webinars/
    ├── Hero_s Journey/
    ├── Public_CMO/
    ├── Sales_Pitches/
    ├── Skool/
    └── Video Testimonials_Transcripts/

public/
└── knowledge-base/                   # Generated output (gitignored)
    ├── manifest.json
    └── chunks.json
```

## Dependencies

### New Dependencies

```json
{
  "devDependencies": {
    "pdf-parse": "^1.1.1",
    "@types/pdf-parse": "^1.1.4"
  }
}
```

### Existing Dependencies Used

- `tsx` - Already available for TypeScript script execution
- `fs/promises` - Node.js built-in for file I/O
- `path` - Node.js built-in for path resolution

## Data Types

### Build-Time Types

```typescript
// Processed document before chunking
interface ProcessedDocument {
  id: string; // Unique document identifier (slugified filename)
  title: string; // Human-readable title (filename without extension)
  category: string; // Parent folder name from Train_CMO/
  sourceFile: string; // Relative path from Train_CMO/
  content: string; // Full extracted text content
  isCore: boolean; // Whether this is a core document
}

// Individual chunk in output
interface KnowledgeChunk {
  id: string; // Format: {documentId}_chunk_{index}
  documentId: string; // Reference to parent document
  title: string; // Document title
  category: string; // Document category
  content: string; // Chunk text content
  isCore: boolean; // Inherited from parent document
}

// Manifest entry
interface ManifestEntry {
  documentId: string;
  title: string;
  category: string;
  chunkCount: number;
  isCore: boolean;
  sourceFile: string;
}

// Output file structures
interface ManifestFile {
  generatedAt: string; // ISO 8601 timestamp
  totalDocuments: number;
  totalChunks: number;
  categories: string[];
  documents: ManifestEntry[];
}

interface ChunksFile {
  chunks: KnowledgeChunk[];
}
```

## Core Logic

### File Processing Pipeline

```typescript
// Main pipeline
async function buildKnowledgeBase(): Promise<void> {
  // 1. Validate Train_CMO directory exists
  // 2. Walk directory tree, collect file paths grouped by category
  // 3. Filter out image files by extension
  // 4. Process each file through appropriate handler
  // 5. Flag core documents
  // 6. Chunk all processed documents
  // 7. Write manifest.json and chunks.json
  // 8. Print build summary
}
```

### File Type Handlers

```typescript
// Dispatcher based on file extension
async function processFile(filePath: string, category: string): Promise<ProcessedDocument | null>;

// Individual handlers
async function processTextFile(filePath: string): Promise<string>;
async function processPdfFile(filePath: string): Promise<string>; // Uses pdf-parse
async function processJsonFile(filePath: string): Promise<ProcessedDocument[]>; // Returns multiple docs
async function processCsvFile(filePath: string): Promise<string>;
async function processDocxFile(filePath: string): Promise<string>;
```

### PDF Processing

```typescript
import pdf from 'pdf-parse';

async function processPdfFile(filePath: string): Promise<string> {
  // Read file as Buffer
  // Pass to pdf-parse
  // Return extracted text
  // On failure (image-only PDF, corruption): log warning, return empty string
}
```

### JSON Testimonial Processing

```typescript
// JSON format: {"screenshot1.png": "testimonial text", "screenshot2.png": "text"}
async function processJsonFile(filePath: string): Promise<ProcessedDocument[]> {
  // Parse JSON
  // For each key-value pair, create a separate ProcessedDocument
  // Title derived from image filename key (without extension)
  // Content is the testimonial text value
}
```

### Text Chunking Algorithm

```typescript
const TARGET_CHUNK_SIZE = 3200; // ~800 tokens (4 chars per token estimate)
const OVERLAP_SIZE = 400; // ~100 tokens overlap

function chunkText(text: string, documentId: string): KnowledgeChunk[] {
  // 1. If text length <= TARGET_CHUNK_SIZE, return single chunk
  // 2. Split text into paragraphs (double newline)
  // 3. Accumulate paragraphs until TARGET_CHUNK_SIZE reached
  // 4. When target reached, finalize chunk and start new one
  // 5. New chunk begins OVERLAP_SIZE characters before the split point
  // 6. If a single paragraph exceeds TARGET_CHUNK_SIZE, split on sentence boundaries
  // 7. Assign sequential IDs: {documentId}_chunk_0, _chunk_1, etc.
}
```

### Core Document Detection

```typescript
const CORE_DOCUMENT_FILENAMES = [
  'pheydrus_ai_master_catalog_FINAL.txt',
  'product_routing_decision_tree.txt',
  'life_path_numbers.txt',
  'rising-sign-database.txt',
  'PublicCMOInitialSalesLogic.txt',
] as const;

function isCoreDocument(filename: string): boolean {
  return CORE_DOCUMENT_FILENAMES.includes(filename as any);
}
```

### Document ID Generation

```typescript
// Slugify filename for use as stable document ID
function generateDocumentId(filename: string): string {
  // Remove extension
  // Replace spaces/special chars with hyphens
  // Lowercase
  // Example: "Life Path Numbers.txt" → "life-path-numbers"
}
```

## Build Integration

### npm Scripts

```json
{
  "scripts": {
    "build:kb": "npx tsx scripts/build-knowledge-base.ts",
    "build": "npm run build:kb && vite build",
    "dev": "npm run build:kb && vite"
  }
}
```

### .gitignore Addition

```
# Generated knowledge base (regenerated each build)
public/knowledge-base/
```

## File Skipping Rules

### Image Extensions to Skip (silent, no warning)

```typescript
const SKIP_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.webp',
  '.svg',
  '.ico',
  '.tiff',
  '.tif',
]);
```

### Unsupported Extensions (log warning)

Any extension not in the supported set (`.txt`, `.pdf`, `.json`, `.csv`, `.docx`) and not in the skip set triggers a console warning.

## Error Handling Strategy

```typescript
// Top-level: fail on critical errors
try {
  await buildKnowledgeBase();
} catch (error) {
  console.error('Knowledge base build failed:', error.message);
  process.exit(1);
}

// File-level: warn and continue
async function processFile(filePath: string): Promise<ProcessedDocument | null> {
  try {
    // ... process file
  } catch (error) {
    console.warn(`Warning: Failed to process ${filePath}: ${error.message}`);
    return null;
  }
}
```

## Output Format

### manifest.json Example

```json
{
  "generatedAt": "2026-03-08T12:00:00.000Z",
  "totalDocuments": 312,
  "totalChunks": 2400,
  "categories": ["21DOMA", "Artist_s Way", "..."],
  "documents": [
    {
      "documentId": "pheydrus-ai-master-catalog-final",
      "title": "pheydrus_ai_master_catalog_FINAL",
      "category": "Public_CMO",
      "chunkCount": 15,
      "isCore": true,
      "sourceFile": "Public_CMO/pheydrus_ai_master_catalog_FINAL.txt"
    }
  ]
}
```

### chunks.json Example

```json
{
  "chunks": [
    {
      "id": "pheydrus-ai-master-catalog-final_chunk_0",
      "documentId": "pheydrus-ai-master-catalog-final",
      "title": "pheydrus_ai_master_catalog_FINAL",
      "category": "Public_CMO",
      "content": "The Pheydrus AI Master Catalog contains...",
      "isCore": true
    }
  ]
}
```

## Performance Requirements

- Full build completes within 30 seconds
- PDF parsing is the bottleneck; process files sequentially to avoid memory spikes
- Output JSON uses no pretty-printing in production (minified) to reduce file size
- Expected chunks.json size: ~2-5 MB depending on content

## Testing Strategy

### Unit Tests

- Chunking algorithm: verify chunk sizes, overlap, boundary handling
- File type handlers: verify extraction for each supported format
- Core document detection: verify all 5 filenames match
- Document ID generation: verify slugification

### Integration Tests

- Process a small subset of real Train_CMO files
- Verify manifest and chunks output structure
- Verify core documents are flagged correctly
- Verify image files are skipped

### Manual Verification

- Run `npx tsx scripts/build-knowledge-base.ts` and inspect output
- Verify chunk count is reasonable (~3 chunks per average document)
- Spot-check chunk content against source files

## Files to Create

1. `scripts/build-knowledge-base.ts` - Main build script
2. `src/utils/knowledgeBase/fileProcessors.ts` - File type extraction handlers
3. `src/utils/knowledgeBase/chunker.ts` - Text chunking algorithm
4. `src/utils/knowledgeBase/types.ts` - Shared type definitions

---

**Important:** This is a build-time Node.js script, not browser code. It uses Node.js APIs (fs, path) and runs before the Vite build. Output files are served as static assets from `public/`.
