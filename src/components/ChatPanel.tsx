"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, DocumentRecord, SourceChunk } from "@/lib/types";

interface ChatPanelProps {
  documents: DocumentRecord[];
  selectedDocumentId: string | null;
}

export function ChatPanel({ documents, selectedDocumentId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocumentId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    if (documents.length === 0) {
      setError("Upload at least one PDF before asking questions.");
      return;
    }

    setError(null);
    setInput("");
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          documentId: selectedDocumentId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        sources: data.sources as SourceChunk[],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Ask your documents</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {selectedDoc
            ? `Searching only: ${selectedDoc.filename}`
            : "Searching across all uploaded documents"}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && !loading ? (
          <EmptyState />
        ) : (
          <MessagesList messages={messages} />
        )}

        {loading && <LoadingIndicator />}

        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mx-6 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 bg-white px-6 py-4"
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your PDFs…"
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>
      </form>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
        💬
      </div>
      <h3 className="mt-4 text-base font-medium text-slate-800">
        Start a conversation
      </h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Upload PDFs on the left, then ask questions here. Answers are grounded in
        your documents with source excerpts shown below each reply.
      </p>
    </div>
  );
}

function MessagesList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="mx-auto mt-4 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="inline-flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
        </span>
        Retrieving context and generating answer…
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-indigo-600 text-white"
            : "border border-slate-200 bg-white text-slate-800 shadow-sm"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>

        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceList sources={message.sources} />
        )}
      </div>
    </div>
  );
}

function SourceList({ sources }: { sources: SourceChunk[] }) {
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Sources ({sources.length})
      </p>
      <SourceListInner sources={sources} />
    </div>
  );
}

function SourceListInner({ sources }: { sources: SourceChunk[] }) {
  return (
    <div className="space-y-2">
      {sources.map((source, i) => (
        <details
          key={`${source.documentId}-${source.chunkIndex}-${i}`}
          className="rounded-lg border border-slate-100 bg-slate-50"
        >
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-700">
            {source.filename} · chunk {source.chunkIndex + 1} · score{" "}
            {source.score.toFixed(3)}
          </summary>
          <p className="border-t border-slate-100 px-3 py-2 text-xs leading-relaxed text-slate-600">
            {source.text}
          </p>
        </details>
      ))}
    </div>
  );
}
