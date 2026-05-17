import { LocalIndex } from "vectra";
import { VECTOR_INDEX_DIR } from "./config";
import type { ChunkMetadata } from "./types";

let indexPromise: Promise<LocalIndex<ChunkMetadata>> | null = null;

async function getIndex(): Promise<LocalIndex<ChunkMetadata>> {
  if (!indexPromise) {
    indexPromise = (async () => {
      const index = new LocalIndex<ChunkMetadata>(VECTOR_INDEX_DIR);
      if (!(await index.isIndexCreated())) {
        await index.createIndex({
          version: 1,
          metadata_config: { indexed: ["documentId", "filename"] },
        });
      }
      return index;
    })();
  }
  return indexPromise;
}

export async function addChunks(
  chunks: { vector: number[]; metadata: ChunkMetadata }[]
): Promise<void> {
  const index = await getIndex();
  await index.beginUpdate();
  try {
    for (const chunk of chunks) {
      await index.insertItem({
        vector: chunk.vector,
        metadata: chunk.metadata,
      });
    }
    await index.endUpdate();
  } catch (error) {
    await index.cancelUpdate();
    throw error;
  }
}

export async function searchSimilar(
  vector: number[],
  topK: number,
  documentId?: string
) {
  const index = await getIndex();
  const filter = documentId
    ? { documentId: { $eq: documentId } }
    : undefined;

  return index.queryItems(vector, "", topK, filter);
}

export async function deleteByDocumentId(documentId: string): Promise<void> {
  const index = await getIndex();
  const items = await index.listItemsByMetadata({
    documentId: { $eq: documentId },
  });

  if (items.length === 0) return;

  await index.beginUpdate();
  try {
    for (const item of items) {
      await index.deleteItem(item.id);
    }
    await index.endUpdate();
  } catch (error) {
    await index.cancelUpdate();
    throw error;
  }
}
