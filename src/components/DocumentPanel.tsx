"use client";

import { useCallback, useRef, useState } from "react";
import type { DocumentRecord } from "@/lib/types";

interface DocumentPanelProps {
  documents: DocumentRecord[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRefresh: () => void;
}

export function DocumentPanel({
  documents,
  selectedId,
  onSelect,
  onRefresh,
}: DocumentPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        onRefresh();
        onSelect(data.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onRefresh, onSelect]
  );

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) uploadFile(file);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this document and its embeddings?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      if (selectedId === id) onSelect(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-md shadow-indigo-200">
            R
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">DocSearch</h1>
            <p className="text-xs text-slate-500">RAG over your PDFs</p>
          </div>
        </div>
      </div>

      <UploadZone
        dragOver={dragOver}
        uploading={uploading}
        onBrowse={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      />

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Documents
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          Refresh
        </button>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {documents.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No documents yet. Upload a PDF to get started.
          </li>
        ) : (
          documents.map((doc) => (
            <li key={doc.id} className="group">
              <button
                type="button"
                onClick={() => onSelect(selectedId === doc.id ? null : doc.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  selectedId === doc.id
                    ? "border-indigo-200 bg-indigo-50 shadow-sm"
                    : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"
                }`}
              >
                <p className="truncate text-sm font-medium text-slate-900">
                  {doc.filename}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {doc.chunkCount} chunks
                  {doc.pageCount ? ` · ${doc.pageCount} pages` : ""}
                </p>
              </button>
              <button
                type="button"
                onClick={(e) => handleDelete(doc.id, e)}
                className="mt-0.5 w-full text-right text-xs text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-red-600"
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}

function UploadZone({
  dragOver,
  uploading,
  onBrowse,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  dragOver: boolean;
  uploading: boolean;
  onBrowse: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`mx-4 mb-4 mt-4 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
        dragOver
          ? "border-indigo-400 bg-indigo-50"
          : "border-slate-200 bg-slate-50 hover:border-slate-300"
      }`}
    >
      <p className="text-sm font-medium text-slate-700">
        {uploading ? "Processing PDF…" : "Drop PDF here"}
      </p>
      <p className="mt-1 text-xs text-slate-500">Text extraction & embedding</p>
      <button
        type="button"
        disabled={uploading}
        onClick={onBrowse}
        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Browse files"}
      </button>
    </div>
  );
}
