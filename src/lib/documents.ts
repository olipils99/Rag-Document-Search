import { promises as fs } from "fs";
import path from "path";
import { DOCUMENTS_FILE, UPLOADS_DIR } from "./config";
import type { DocumentRecord } from "./types";

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readRegistry(): Promise<DocumentRecord[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(DOCUMENTS_FILE, "utf-8");
    return JSON.parse(raw) as DocumentRecord[];
  } catch {
    return [];
  }
}

async function writeRegistry(documents: DocumentRecord[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DOCUMENTS_FILE, JSON.stringify(documents, null, 2));
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const docs = await readRegistry();
  return docs.sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export async function addDocument(record: DocumentRecord): Promise<void> {
  const docs = await readRegistry();
  docs.push(record);
  await writeRegistry(docs);
}

export async function removeDocument(id: string): Promise<boolean> {
  const docs = await readRegistry();
  const index = docs.findIndex((d) => d.id === id);
  if (index === -1) return false;

  const [removed] = docs.splice(index, 1);
  await writeRegistry(docs);

  const filePath = path.join(UPLOADS_DIR, `${removed.id}.pdf`);
  try {
    await fs.unlink(filePath);
  } catch {
    // file may already be missing
  }

  return true;
}

export async function savePdfFile(
  id: string,
  buffer: Buffer
): Promise<string> {
  await ensureDataDir();
  const filePath = path.join(UPLOADS_DIR, `${id}.pdf`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}
