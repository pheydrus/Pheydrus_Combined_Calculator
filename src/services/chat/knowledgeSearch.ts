import type { KnowledgeChunk, ContextChunk } from '../../models/chat';

// FlexSearch doesn't have great ESM types — use dynamic import
let searchIndex: ReturnType<typeof createIndex> | null = null;
let allChunks: KnowledgeChunk[] = [];
let loadPromise: Promise<void> | null = null;

interface SearchIndex {
  add: (id: number, text: string) => void;
  search: (query: string, limit?: number) => number[];
}

function createIndex(): SearchIndex {
  // Simple inverted index fallback — FlexSearch loaded dynamically
  const index = new Map<string, Set<number>>();
  const items = new Map<number, string>();

  return {
    add(id: number, text: string) {
      items.set(id, text);
      const words = text
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 2);
      for (const word of words) {
        if (!index.has(word)) index.set(word, new Set());
        index.get(word)!.add(id);
      }
    },
    search(query: string, limit = 100): number[] {
      const queryWords = query
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 2);
      if (queryWords.length === 0) return [];

      const scores = new Map<number, number>();
      for (const word of queryWords) {
        for (const [indexWord, ids] of index) {
          if (indexWord.includes(word) || word.includes(indexWord)) {
            for (const id of ids) {
              scores.set(id, (scores.get(id) || 0) + (indexWord === word ? 2 : 1));
            }
          }
        }
      }

      return [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);
    },
  };
}

async function loadKnowledgeBase(): Promise<void> {
  if (allChunks.length > 0) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const response = await fetch('/knowledge-base/chunks.json');
    if (!response.ok) {
      throw new Error(`Failed to load knowledge base: ${response.status}`);
    }
    allChunks = await response.json();

    searchIndex = createIndex();
    for (let i = 0; i < allChunks.length; i++) {
      searchIndex.add(i, `${allChunks[i].title} ${allChunks[i].content}`);
    }
  })();

  return loadPromise;
}

const MAX_CONTEXT_CHARS = 200_000; // ~50K tokens

export async function searchKnowledge(query: string): Promise<ContextChunk[]> {
  await loadKnowledgeBase();

  // Always include core documents
  const coreChunks = allChunks.filter((c) => c.isCore).map(toContextChunk);

  // Search for relevant chunks
  const matchedIndices = searchIndex!.search(query, 100);
  const searchChunks = matchedIndices
    .map((idx) => allChunks[idx])
    .filter((c) => !c.isCore) // Don't duplicate core docs
    .map(toContextChunk);

  // Combine: core first, then search results
  const combined = [...coreChunks, ...searchChunks];

  // Cap at token limit
  let totalChars = 0;
  const capped: ContextChunk[] = [];
  for (const chunk of combined) {
    totalChars += chunk.content.length;
    if (totalChars > MAX_CONTEXT_CHARS) break;
    capped.push(chunk);
  }

  return capped;
}

function toContextChunk(chunk: KnowledgeChunk): ContextChunk {
  return {
    id: chunk.id,
    title: chunk.title,
    content: chunk.content,
    category: chunk.category,
  };
}

export async function preloadKnowledgeBase(): Promise<void> {
  return loadKnowledgeBase();
}
