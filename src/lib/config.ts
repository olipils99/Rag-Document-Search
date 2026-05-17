import path from "path";

export const EMBEDDING_MODEL = "voyage-3";
export const EMBEDDING_DIMENSION = 1024;
export const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
export const CHUNK_SIZE = 800;
export const CHUNK_OVERLAP = 150;
export const TOP_K = 5;

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export const VECTOR_INDEX_DIR = path.join(DATA_DIR, "vector-index");
export const DOCUMENTS_FILE = path.join(DATA_DIR, "documents.json");
