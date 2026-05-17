export interface DocumentRecord {
  id: string;
  filename: string;
  uploadedAt: string;
  chunkCount: number;
  pageCount?: number;
}

export interface ChunkMetadata extends Record<string, string | number> {
  documentId: string;
  filename: string;
  chunkIndex: number;
  text: string;
}

export interface SourceChunk {
  documentId: string;
  filename: string;
  chunkIndex: number;
  text: string;
  score: number;
}

export interface SearchResponse {
  answer: string;
  sources: SourceChunk[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
}
