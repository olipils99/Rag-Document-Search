import { NextRequest, NextResponse } from "next/server";
import { TOP_K } from "@/lib/config";
import { generateAnswer } from "@/lib/claude";
import { embedQuery } from "@/lib/embeddings";
import { searchSimilar } from "@/lib/vector-store";
import type { SearchResponse, SourceChunk } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const documentId =
      typeof body.documentId === "string" ? body.documentId : undefined;

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const queryVector = await embedQuery(question);
    const results = await searchSimilar(queryVector, TOP_K, documentId);

    const sources: SourceChunk[] = results.map((result) => ({
      documentId: result.item.metadata.documentId,
      filename: result.item.metadata.filename,
      chunkIndex: result.item.metadata.chunkIndex,
      text: result.item.metadata.text,
      score: result.score,
    }));

    const answer = await generateAnswer(question, sources);

    const response: SearchResponse = { answer, sources };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Search error:", error);
    const message = error instanceof Error ? error.message : "Search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
