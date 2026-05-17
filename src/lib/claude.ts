import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "./config";
import type { SourceChunk } from "./types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateAnswer(
  question: string,
  sources: SourceChunk[]
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }

  const context =
    sources.length === 0
      ? "No relevant document excerpts were found."
      : sources
          .map(
            (s, i) =>
              `[Source ${i + 1} — ${s.filename}, chunk ${s.chunkIndex + 1}, relevance ${s.score.toFixed(3)}]\n${s.text}`
          )
          .join("\n\n---\n\n");

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a helpful document assistant. Answer the user's question using ONLY the provided context. If the context does not contain enough information, say so clearly. Cite which sources you used when possible.

<context>
${context}
</context>

<question>
${question}
</question>`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : "No response generated.";
}
