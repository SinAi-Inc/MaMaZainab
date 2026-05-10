"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleSync() {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/menu/sync", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          setResult(`✓ Synced ${data.synced.categories} categories, ${data.synced.items} items`);
        } else {
          setResult(`✗ ${data.error}`);
        }
      } catch {
        setResult("✗ Network error");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={handleSync} disabled={isPending}>
        <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Syncing…" : "Sync to Production"}
      </Button>
      {result && (
        <span className={`text-xs ${result.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
