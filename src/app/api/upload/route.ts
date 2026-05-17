import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { chunkText } from "@/lib/chunking";
import { addDocument, savePdfFile } from "@/lib/documents";
import { embedTexts } from "@/lib/embeddings";
import { extractTextFromPdf } from "@/lib/pdf";
import { addChunks } from "@/lib/vector-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, pageCount } = await extractTextFromPdf(buffer);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from this PDF." },
        { status: 400 }
      );
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No text chunks generated." }, { status: 400 });
    }

    const documentId = randomUUID();
    await savePdfFile(documentId, buffer);

    const vectors = await embedTexts(chunks, "document");
    await addChunks(
      chunks.map((chunk, index) => ({
        vector: vectors[index],
        metadata: {
          documentId,
          filename: file.name,
          chunkIndex: index,
          text: chunk,
        },
      }))
    );

    await addDocument({
      id: documentId,
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      chunkCount: chunks.length,
      pageCount,
    });

    return NextResponse.json({
      id: documentId,
      filename: file.name,
      chunkCount: chunks.length,
      pageCount,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
