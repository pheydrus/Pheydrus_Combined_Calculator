/**
 * Build-time script: processes data/Train_CMO into a searchable knowledge base.
 *
 * Reads .txt, .json, .csv, .docx files directly and extracts text from .pdf files.
 * Outputs:
 *   public/knowledge-base/manifest.json  – document metadata
 *   public/knowledge-base/chunks.json    – text chunks for search
 *
 * Usage: npx tsx scripts/build-knowledge-base.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

// ── Configuration ──────────────────────────────────────────────────────────────

const DATA_DIR = path.resolve(__dirname, '..', 'data', 'Train_CMO');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'knowledge-base');

const CHUNK_TARGET_CHARS = 3200; // ~800 tokens at 4 chars/token
const CHUNK_OVERLAP_CHARS = 400; // ~100 tokens overlap

/** Core documents always included in chat context regardless of search */
const CORE_DOCUMENT_NAMES = [
  'pheydrus_ai_master_catalog_final.txt',
  'product_routing_decision_tree.txt',
  'life_path_numbers.txt',
  'rising-sign-database.txt',
  'publiccmoinitialsaleslogic.txt',
];

const TEXT_EXTENSIONS = new Set(['.txt', '.csv', '.json', '.docx']);
const SKIP_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

// ── Types ──────────────────────────────────────────────────────────────────────

interface DocumentMeta {
  id: string;
  title: string;
  fileName: string;
  category: string;
  subcategory: string;
  relativePath: string;
  fileType: string;
  wordCount: number;
  chunkCount: number;
  isCore: boolean;
}

interface Chunk {
  id: string;
  documentId: string;
  title: string;
  category: string;
  subcategory: string;
  content: string;
  isCore: boolean;
  chunkIndex: number;
  totalChunks: number;
}

interface Manifest {
  generatedAt: string;
  documentCount: number;
  chunkCount: number;
  categories: string[];
  documents: DocumentMeta[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getCategoryFromPath(relativePath: string): {
  category: string;
  subcategory: string;
} {
  const parts = relativePath.split(path.sep).filter(Boolean);
  // parts[0] is always "Train_CMO" — skip it if present at root level
  // The first real folder is the category
  const category = parts[0] || 'Uncategorized';
  const subcategory = parts.length > 2 ? parts.slice(1, -1).join(' > ') : '';
  return { category, subcategory };
}

function isCoreDocument(fileName: string): boolean {
  return CORE_DOCUMENT_NAMES.includes(fileName.toLowerCase());
}

function chunkText(text: string): string[] {
  if (text.length <= CHUNK_TARGET_CHARS) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + CHUNK_TARGET_CHARS;

    if (end < text.length) {
      // Try to break at a paragraph boundary
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + CHUNK_TARGET_CHARS * 0.5) {
        end = paragraphBreak + 2;
      } else {
        // Fall back to sentence boundary
        const sentenceBreak = text.lastIndexOf('. ', end);
        if (sentenceBreak > start + CHUNK_TARGET_CHARS * 0.5) {
          end = sentenceBreak + 2;
        }
      }
    } else {
      end = text.length;
    }

    chunks.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP_CHARS;
    if (start < 0) start = 0;
    // Prevent infinite loop on very small remaining text
    if (end >= text.length) break;
  }

  return chunks.filter((c) => c.length > 0);
}

async function extractTextFromFile(filePath: string, ext: string): Promise<string | null> {
  try {
    if (TEXT_EXTENSIONS.has(ext)) {
      const raw = fs.readFileSync(filePath, 'utf-8');

      // For JSON files, try to extract meaningful text
      if (ext === '.json') {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'object' && parsed !== null) {
            // Handle testimonial-style JSON: { "filename": "text", ... }
            return Object.entries(parsed)
              .map(([key, val]) => `[${key}]\n${String(val)}`)
              .join('\n\n');
          }
        } catch {
          return raw; // Not valid JSON, return as-is
        }
      }

      return raw;
    }

    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      const uint8 = new Uint8Array(buffer);
      const parser = new PDFParse(uint8);
      const result = await parser.getText();
      const text = result.text?.trim();
      if (!text || text.length < 20) {
        // Image-only PDF or negligible text
        return null;
      }
      return text;
    }

    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠ Failed to extract text from ${filePath}: ${msg}`);
    return null;
  }
}

function walkDirectory(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDirectory(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Building knowledge base...');
  console.log(`  Source: ${DATA_DIR}`);
  console.log(`  Output: ${OUTPUT_DIR}`);

  if (!fs.existsSync(DATA_DIR)) {
    console.error(`ERROR: Data directory not found: ${DATA_DIR}`);
    process.exit(1);
  }

  // Ensure output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Collect all files
  const allFiles = walkDirectory(DATA_DIR);
  console.log(`  Found ${allFiles.length} total files`);

  const documents: DocumentMeta[] = [];
  const chunks: Chunk[] = [];

  let processedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();

    // Skip images and other non-text files
    if (SKIP_EXTENSIONS.has(ext)) {
      skippedCount++;
      continue;
    }

    // Skip unsupported extensions
    if (!TEXT_EXTENSIONS.has(ext) && ext !== '.pdf') {
      skippedCount++;
      continue;
    }

    const relativePath = path.relative(DATA_DIR, filePath);
    const fileName = path.basename(filePath);
    const { category, subcategory } = getCategoryFromPath(relativePath);
    const title = path.basename(filePath, ext).replace(/[_-]+/g, ' ').trim();
    const docId = slugify(relativePath);

    const text = await extractTextFromFile(filePath, ext);
    if (!text || text.trim().length < 10) {
      failedCount++;
      continue;
    }

    const isCore = isCoreDocument(fileName);
    const textChunks = chunkText(text.trim());
    const wordCount = text.split(/\s+/).length;

    const docMeta: DocumentMeta = {
      id: docId,
      title,
      fileName,
      category,
      subcategory,
      relativePath: relativePath.replace(/\\/g, '/'),
      fileType: ext.replace('.', ''),
      wordCount,
      chunkCount: textChunks.length,
      isCore,
    };
    documents.push(docMeta);

    for (let i = 0; i < textChunks.length; i++) {
      chunks.push({
        id: `${docId}--${i}`,
        documentId: docId,
        title,
        category,
        subcategory,
        content: textChunks[i],
        isCore,
        chunkIndex: i,
        totalChunks: textChunks.length,
      });
    }

    processedCount++;
  }

  // Build manifest
  const categories = [...new Set(documents.map((d) => d.category))].sort();
  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    documentCount: documents.length,
    chunkCount: chunks.length,
    categories,
    documents,
  };

  // Write output files
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'chunks.json'), JSON.stringify(chunks));

  // Summary
  const coreCount = documents.filter((d) => d.isCore).length;
  const totalChars = chunks.reduce((sum, c) => sum + c.content.length, 0);
  const estimatedTokens = Math.round(totalChars / 4);

  console.log('\n  Knowledge base built successfully!');
  console.log(`  ─────────────────────────────────`);
  console.log(`  Documents processed: ${processedCount}`);
  console.log(`  Documents skipped:   ${skippedCount} (images/unsupported)`);
  console.log(`  Documents failed:    ${failedCount} (no text extracted)`);
  console.log(`  Core documents:      ${coreCount}`);
  console.log(`  Total chunks:        ${chunks.length}`);
  console.log(`  Categories:          ${categories.join(', ')}`);
  console.log(`  Total text:          ${(totalChars / 1024).toFixed(1)} KB`);
  console.log(`  Estimated tokens:    ~${estimatedTokens.toLocaleString()}`);
  console.log(`  Output:              ${path.relative(process.cwd(), OUTPUT_DIR)}/`);
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
