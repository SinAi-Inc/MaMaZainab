"use client";

import { useState, useEffect, useTransition } from "react";
import { getHistory, removeHistoryEntry, clearHistory } from "@/lib/generations/actions";
import type { GenerationEntry } from "@/lib/generations/schema";

export function HistoryTab() {
  const [entries, setEntries] = useState<GenerationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getHistory().then((state) => {
      setEntries(state.entries);
      setLoading(false);
    });
  }, []);

  function handleDelete(id: string) {
    startTransition(async () => {
      await removeHistoryEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    });
  }

  function handleClearAll() {
    if (!confirm("Delete all generation history?")) return;
    startTransition(async () => {
      await clearHistory();
      setEntries([]);
    });
  }

  if (loading) {
    return <p className="text-sm text-muted p-6">Loading history…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Generation History
        </h3>
        {entries.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={isPending}
            className="text-xs text-red-600 hover:underline disabled:opacity-50"
          >
            Clear All
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-white/60 p-8 text-center">
          <p className="text-sm text-muted">No generations yet.</p>
          <p className="text-xs text-muted mt-1">
            Images and videos you generate will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              onDelete={handleDelete}
              pending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Card ────────────────────────────────────────── */

function HistoryCard({
  entry,
  onDelete,
  pending,
}: {
  entry: GenerationEntry;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const isImage = entry.type === "image";
  const date = new Date(entry.createdAt);
  const timeStr = date.toLocaleString();

  return (
    <div className="rounded-xl border border-border bg-white/80 overflow-hidden flex flex-col">
      {/* Thumbnail */}
      {entry.outputPath && isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.outputPath}
          alt="Generated"
          className="w-full aspect-square object-cover bg-neutral-100"
        />
      ) : entry.outputPath && !isImage ? (
        <video
          src={entry.outputPath}
          className="w-full aspect-video object-cover bg-neutral-900"
          controls
          muted
        />
      ) : (
        <div className="w-full aspect-square bg-neutral-100 flex items-center justify-center text-xs text-muted">
          {entry.status === "failed" ? "Failed" : "No output"}
        </div>
      )}

      {/* Meta */}
      <div className="p-3 text-xs space-y-1 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block size-2 rounded-full ${
              entry.status === "completed"
                ? "bg-green-500"
                : entry.status === "failed"
                  ? "bg-red-500"
                  : "bg-yellow-500"
            }`}
          />
          <span className="font-medium capitalize">{entry.type}</span>
          <span className="text-muted">·</span>
          <span className="text-muted truncate" title={entry.model}>
            {entry.model.split("/").pop()}
          </span>
        </div>

        {entry.characterAnchor && (
          <p className="text-muted truncate">
            Character: {entry.characterAnchor}
          </p>
        )}
        {entry.sceneContext && (
          <p className="text-muted truncate">
            Scene: {entry.sceneContext}
          </p>
        )}

        <p className="text-muted line-clamp-2" title={entry.prompt}>
          {entry.prompt}
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-border mt-1">
          <span className="text-[10px] text-muted">{timeStr}</span>
          <div className="flex gap-2">
            {entry.outputPath && (
              <a
                href={entry.outputPath}
                download
                className="text-[10px] text-blue-600 hover:underline"
              >
                Download
              </a>
            )}
            <button
              onClick={() => onDelete(entry.id)}
              disabled={pending}
              className="text-[10px] text-red-500 hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
