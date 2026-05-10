"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { Trash2, Download, ImageIcon, Film, AlertCircle, Loader2 } from "lucide-react";
import { getHistory, removeHistoryEntry, clearHistory } from "@/lib/generations/actions";
import { formatCost } from "@/lib/ai/cost";
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
    if (!confirm("Delete all generation history? This cannot be undone.")) return;
    startTransition(async () => {
      await clearHistory();
      setEntries([]);
    });
  }

  /* ── Stats ─────────────────────────────────── */
  const stats = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let total = 0;
    let today = 0;
    let week = 0;
    let images = 0;
    let videos = 0;
    let failed = 0;
    for (const e of entries) {
      total += e.costUsd;
      const age = now - new Date(e.createdAt).getTime();
      if (age < dayMs) today += e.costUsd;
      if (age < 7 * dayMs) week += e.costUsd;
      if (e.type === "image") images++;
      else if (e.type === "video") videos++;
      if (e.status === "failed") failed++;
    }
    return { total, today, week, images, videos, failed };
  }, [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted">
        <Loader2 className="size-4 animate-spin mr-2" />
        Loading history…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <StatCard label="Today" value={formatCost(stats.today)} />
          <StatCard label="7 Days" value={formatCost(stats.week)} />
          <StatCard label="All-Time" value={formatCost(stats.total)} accent />
          <StatCard
            label="Generations"
            value={`${stats.images + stats.videos}`}
            sub={`${stats.images} img · ${stats.videos} vid`}
          />
          <StatCard
            label="Failed"
            value={`${stats.failed}`}
            sub={stats.failed > 0 ? "needs review" : "none"}
            warn={stats.failed > 0}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Generation History
        </h3>
        {entries.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
          >
            <Trash2 className="size-3" />
            Clear All
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState />
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

/* ── Stat card ─────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  accent,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 ${
        accent
          ? "border-brand-green/40 bg-brand-green/5"
          : warn
            ? "border-red-200 bg-red-50/50"
            : "border-border bg-white/60"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p
        className={`text-lg font-semibold tabular-nums ${
          accent ? "text-brand-green-deep" : warn ? "text-red-600" : "text-brand-ink"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Empty state ─────────────────────────────── */

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white/50 px-6 py-12 text-center">
      <div className="mx-auto size-12 rounded-full bg-brand-yellow/20 flex items-center justify-center mb-3">
        <ImageIcon className="size-5 text-brand-green-deep" />
      </div>
      <p className="text-sm font-medium text-brand-ink">No generations yet</p>
      <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
        Run a prompt from the Image or Video tabs — try the Campaign Presets to
        generate a real shot from the storyboard.
      </p>
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
        <div className="w-full aspect-square bg-neutral-50 flex flex-col items-center justify-center text-xs text-muted gap-1.5">
          {entry.status === "failed" ? (
            <>
              <AlertCircle className="size-5 text-red-500" />
              <span className="text-red-600">Failed</span>
            </>
          ) : entry.status === "pending" ? (
            <>
              <Loader2 className="size-5 animate-spin text-brand-yellow" />
              <span>Pending…</span>
            </>
          ) : (
            <span>No output</span>
          )}
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
          {isImage ? <ImageIcon className="size-3" /> : <Film className="size-3" />}
          <span className="font-medium capitalize">{entry.type}</span>
          <span className="text-muted">·</span>
          <span className="text-muted truncate" title={entry.model}>
            {entry.model.split("/").pop()}
          </span>
          {entry.costUsd > 0 && (
            <span className="ml-auto text-[10px] tabular-nums text-brand-green-deep font-medium">
              {formatCost(entry.costUsd)}
            </span>
          )}
        </div>

        {entry.characterAnchor && (
          <p className="text-muted truncate">
            Character: {entry.characterAnchor}
          </p>
        )}
        {entry.sceneContext && (
          <p className="text-muted truncate">Scene: {entry.sceneContext}</p>
        )}

        <p className="text-muted line-clamp-2" title={entry.prompt}>
          {entry.prompt}
        </p>

        {entry.error && (
          <p className="text-red-600 line-clamp-2" title={entry.error}>
            {entry.error}
          </p>
        )}

        <div className="flex items-center justify-between pt-1.5 border-t border-border mt-1">
          <span className="text-[10px] text-muted">{timeStr}</span>
          <div className="flex gap-2">
            {entry.outputPath && (
              <a
                href={entry.outputPath}
                download
                className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline"
              >
                <Download className="size-3" />
                Download
              </a>
            )}
            <button
              onClick={() => onDelete(entry.id)}
              disabled={pending}
              className="inline-flex items-center gap-0.5 text-[10px] text-red-500 hover:underline disabled:opacity-50"
            >
              <Trash2 className="size-3" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
