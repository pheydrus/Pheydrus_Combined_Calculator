import type { KnowledgeChunk, ContextChunk, ChatMode } from '../../models/chat';

interface SearchIndex {
  add: (id: number, text: string) => void;
  search: (query: string, limit?: number) => number[];
}

function createIndex(): SearchIndex {
  const index = new Map<string, Set<number>>();

  return {
    add(id: number, text: string) {
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
        const ids = index.get(word);
        if (!ids) continue;
        for (const id of ids) {
          scores.set(id, (scores.get(id) || 0) + (word.length > 5 ? 2 : 1));
        }
      }

      return [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);
    },
  };
}

// ── Cache ──────────────────────────────────────────────────────────────────

interface KBCache {
  chunks: KnowledgeChunk[];
  index: SearchIndex | null;
  loadPromise: Promise<void> | null;
}

const caches: Record<ChatMode, KBCache> = {
  public: { chunks: [], index: null, loadPromise: null },
  private: { chunks: [], index: null, loadPromise: null },
};

async function loadKnowledgeBase(mode: ChatMode): Promise<void> {
  const cache = caches[mode];
  if (cache.chunks.length > 0) return;
  if (cache.loadPromise) return cache.loadPromise;

  cache.loadPromise = (async () => {
    const response = await fetch(`/knowledge-base/${mode}/chunks.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${mode} knowledge base: ${response.status}`);
    }
    cache.chunks = await response.json();

    cache.index = createIndex();
    for (let i = 0; i < cache.chunks.length; i++) {
      cache.index.add(i, `${cache.chunks[i].title} ${cache.chunks[i].content}`);
    }
  })();

  return cache.loadPromise;
}

// ── Search config per mode ─────────────────────────────────────────────────

const SEARCH_CONFIG: Record<ChatMode, { maxChunks: number; maxChars: number }> = {
  public: { maxChunks: 5, maxChars: 16_000 }, // ~4K tokens — lean and focused
  private: { maxChunks: 15, maxChars: 60_000 }, // ~15K tokens — broader context
};

export async function searchKnowledge(
  query: string,
  mode: ChatMode = 'public'
): Promise<ContextChunk[]> {
  await loadKnowledgeBase(mode);

  const cache = caches[mode];
  const config = SEARCH_CONFIG[mode];

  // Core documents — public only gets routing + sales logic (not the full catalog)
  const coreChunks = cache.chunks
    .filter((c) => {
      if (!c.isCore) return false;
      if (mode === 'private') return true;
      // Public: only routing + sales logic, skip catalog/life path/rising sign
      const normalized = c.title.toLowerCase().replace(/[_ -]+/g, ' ');
      return (
        normalized.includes('product routing decision tree') ||
        normalized.includes('publiccmoinitialsaleslogic')
      );
    })
    .map(toContextChunk);

  // Search for relevant chunks (search results include catalog when relevant)
  const matchedIndices = cache.index!.search(query, config.maxChunks);
  const searchChunks = matchedIndices
    .map((idx) => cache.chunks[idx])
    .filter((c) => !c.isCore)
    .map(toContextChunk);

  // Combine: core first, then search results
  const combined = [...coreChunks, ...searchChunks];

  // Cap at char limit
  let totalChars = 0;
  const capped: ContextChunk[] = [];
  for (const chunk of combined) {
    totalChars += chunk.content.length;
    if (totalChars > config.maxChars) break;
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
