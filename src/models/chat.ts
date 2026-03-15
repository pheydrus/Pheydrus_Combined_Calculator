export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  timestamp: number;
}

export interface Citation {
  documentId: string;
  title: string;
  category: string;
  fileName: string;
}

export interface KnowledgeChunk {
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

export interface KnowledgeManifest {
  generatedAt: string;
  documentCount: number;
  chunkCount: number;
  categories: string[];
  documents: DocumentMeta[];
}

export interface DocumentMeta {
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

export interface ContextChunk {
  id: string;
  title: string;
  content: string;
  category: string;
}

export interface ChatApiRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  context: ContextChunk[];
}

export interface ChatStreamEvent {
  text?: string;
  error?: string;
}
