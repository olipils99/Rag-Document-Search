import { EMBEDDING_MODEL } from "./config";

type InputType = "document" | "query";

interface VoyageEmbedResponse {
  data: { embedding: number[]; index: number }[];
}

export async function embedTexts(
  texts: string[],
  inputType: InputType = "document"
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "VOYAGE_API_KEY is not set. Voyage AI provides embeddings for Anthropic RAG workflows."
    );
  }

  if (texts.length === 0) return [];

  const BATCH_SIZE = 32;
  if (texts.length <= BATCH_SIZE) {
    return embedBatch(texts, inputType, apiKey);
  }

  const all: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const vectors = await embedBatch(batch, inputType, apiKey);
    all.push(...vectors);
  }
  return all;
}

async function embedBatch(
  texts: string[],
  inputType: InputType,
  apiKey: string
): Promise<number[][]> {
  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: EMBEDDING_MODEL,
      input_type: inputType,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Voyage embedding failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as VoyageEmbedResponse;
  return data.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text], "query");
  return embedding;
}
