"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type State = "idle" | "loading" | "success" | "error";

export function SyncMenuButton() {
  const [state, setState] = useState<State>("idle");
  const [detail, setDetail] = useState<string>("");

  async function handleSync() {
    if (state === "loading") return;
    setState("loading");
    setDetail("");

    try {
      const res = await fetch("/api/menu/sync", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setState("error");
        setDetail(json.error ?? `HTTP ${res.status}`);
        return;
      }

      const { synced } = json as { synced: { categories: number; items: number } };
      setState("success");
      setDetail(`${synced.categories} categories · ${synced.items} items synced`);

      // Auto-reset after 5 s
      setTimeout(() => setState("idle"), 5000);
    } catch (err) {
      setState("error");
      setDetail(err instanceof Error ? err.message : "Network error");
    }
  }

  return (
    <div className="mt-3 space-y-1.5">
      <button
        onClick={handleSync}
        disabled={state === "loading"}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          state === "success"
            ? "bg-brand-green/10 text-brand-green-deep border border-brand-green/30"
            : state === "error"
            ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
            : "bg-brand-green text-white hover:bg-brand-green-deep disabled:opacity-60"
        )}
      >
        {state === "loading" ? (
          <RefreshCw className="size-3.5 animate-spin" />
        ) : state === "success" ? (
          <CheckCircle2 className="size-3.5" />
        ) : state === "error" ? (
          <AlertCircle className="size-3.5" />
        ) : (
          <RefreshCw className="size-3.5" />
        )}
        {state === "loading" ? "Syncing…" : state === "success" ? "Synced!" : state === "error" ? "Retry" : "Publish to Supabase"}
      </button>

      {detail && (
        <p className={cn("text-xs", state === "error" ? "text-red-500" : "text-muted")}>
          {detail}
        </p>
      )}
    </div>
  );
}
