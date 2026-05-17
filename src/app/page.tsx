"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { DocumentPanel } from "@/components/DocumentPanel";
import type { DocumentRecord } from "@/lib/types";

export default function Home() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (res.ok) setDocuments(data.documents ?? []);
    } catch {
      // ignore on initial load
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <div className="flex min-h-0 flex-1">
        <DocumentPanel
          documents={documents}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRefresh={loadDocuments}
        />
        <ChatPanel documents={documents} selectedDocumentId={selectedId} />
      </div>
    </div>
  );
}
