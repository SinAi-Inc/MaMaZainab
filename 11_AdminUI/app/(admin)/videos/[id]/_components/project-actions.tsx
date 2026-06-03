"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Sparkles, RefreshCw, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAllPendingShots, syncTakeFromProvider, getProjectJobs } from "@/lib/videos/actions";
import { exportProjectTimeline } from "@/lib/video/export-actions";
import type { ProviderSummary } from "@/lib/video/provider-info";
import type { VideoTier } from "@/lib/video/schema";

export function ProjectActions({
  projectId,
  providers,
}: {
  projectId: string;
  providers: ProviderSummary[];
}) {
  const [pending, start] = useTransition();
  const configured = providers.filter((p) => p.configured);
  const [tier, setTier] = useState<VideoTier>("hero");
  const [providerId, setProviderId] = useState<string>(
    configured.find((p) => p.tier === "hero")?.id ?? configured[0]?.id ?? "",
  );

  function downloadText(filename: string, content: string, mime = "text/plain") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      {/* Tier + provider selector */}
      <div className="flex items-center gap-1.5 text-xs">
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as VideoTier)}
          aria-label="Quality tier"
          className="text-xs border border-border rounded-md px-2 py-1 bg-white"
        >
          <option value="hero">Hero</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          aria-label="Provider"
          className="text-xs border border-border rounded-md px-2 py-1 bg-white max-w-[160px]"
        >
          {configured.length === 0 && <option value="">No providers</option>}
          {configured.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          variant="primary"
          disabled={pending || !providerId}
          onClick={() =>
            start(async () => {
              try {
                const r = await generateAllPendingShots(projectId, { tier, providerId });
                if (r.failed.length > 0) {
                  toast.error(`Submitted ${r.submitted}/${r.total} - ${r.failed.length} failed`);
                } else if (r.submitted === 0) {
                  toast.info("No pending shots to generate");
                } else {
                  toast.success(`Submitted ${r.submitted} shots to ${providerId}`);
                }
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              }
            })
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Generate pending shots
        </Button>

        <Button
          variant="outline"
          disabled={pending}
          title="Poll all in-progress takes and pull finished videos"
          onClick={() =>
            start(async () => {
              try {
                const jobs = await getProjectJobs(projectId);
                const inFlight = jobs.filter((j) => j.status === "queued" || j.status === "running");
                let updated = 0;
                for (const j of inFlight) {
                  await syncTakeFromProvider(j.id).catch(() => null);
                  updated += 1;
                }
                toast.success(`Synced ${updated} in-flight take${updated === 1 ? "" : "s"}`);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Sync failed");
              }
            })
          }
        >
          <RefreshCw className="size-4" /> Sync takes
        </Button>

        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              try {
                const r = await exportProjectTimeline(projectId, "edl");
                if (!r.ok) {
                  toast.error("No approved takes to export");
                  return;
                }
                downloadText(r.filename, r.content);
                if (r.missing.length > 0) {
                  toast.warning(`EDL exported - ${r.missing.length} shots missing approved takes`);
                } else {
                  toast.success(`EDL exported (${r.clipCount} clips, ${r.totalSec}s)`);
                }
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Export failed");
              }
            })
          }
        >
          <Download className="size-4" /> EDL
        </Button>

        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              try {
                const r = await exportProjectTimeline(projectId, "fcpxml");
                if (!r.ok) {
                  toast.error("No approved takes to export");
                  return;
                }
                downloadText(r.filename, r.content, "application/xml");
                toast.success(`FCPXML exported (${r.clipCount} clips, ${r.totalSec}s)`);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Export failed");
              }
            })
          }
        >
          <Download className="size-4" /> FCPXML
        </Button>
      </div>
    </div>
  );
}
