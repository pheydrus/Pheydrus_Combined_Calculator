/**
 * Build-time script: generates embeddings for knowledge base chunks.
 *
 * Uses a local transformer model (all-MiniLM-L6-v2) — no API key needed.
 * Reads chunks.json from the knowledge base and outputs chunks-with-vectors.json
 * for each mode (public/private).
 *
 * Usage: npx tsx scripts/build-embeddings.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_DIR = path.resolve(__dirname, '..', 'public', 'knowledge-base');

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

interface ChunkWithVector extends Chunk {
  vector: number[];
}

async function main() {
  console.log('Generating embeddings...');
  console.log('  Loading model (first run downloads ~80MB)...');

  // Dynamic import for ESM compatibility
  const { pipeline } = await import('@xenova/transformers');
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  for (const mode of ['public', 'private'] as const) {
    const chunksPath = path.join(KB_DIR, mode, 'chunks.json');
    if (!fs.existsSync(chunksPath)) {
      console.warn(`  ⚠ ${mode}/chunks.json not found, skipping`);
      continue;
    }

    const chunks: Chunk[] = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
    console.log(`  ${mode}: ${chunks.length} chunks to embed...`);

    const results: ChunkWithVector[] = [];
    const batchSize = 16;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map((c) => `${c.title}: ${c.content.slice(0, 512)}`);

      // Embed batch
      const outputs = await Promise.all(
        texts.map(async (text) => {
          const output = await embedder(text, { pooling: 'mean', normalize: true });
          return Array.from(output.data as Float32Array);
        })
      );

      for (let j = 0; j < batch.length; j++) {
        results.push({ ...batch[j], vector: outputs[j] });
      }

      if ((i + batchSize) % 100 < batchSize) {
        console.log(`    ${Math.min(i + batchSize, chunks.length)}/${chunks.length} embedded`);
      }
    }

    const outPath = path.join(KB_DIR, mode, 'chunks-with-vectors.json');
    fs.writeFileSync(outPath, JSON.stringify(results));

    const sizeKB = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`  ${mode}: saved ${outPath} (${sizeKB} KB)`);
  }

  console.log('\n  Embeddings complete!');
}

main().catch((err) => {
  console.error('Embedding build failed:', err);
  process.exit(1);
});
