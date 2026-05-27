"use server";

import { readStudio } from "@/lib/videos/store";
import { requireAdminAction } from "@/lib/server-action-auth";
import { buildProjectTimeline, exportEdl, exportFcpxml } from "./edl-export";

export type ExportResult = {
  ok: boolean;
  format: "edl" | "fcpxml";
  filename: string;
  content: string;
  totalSec: number;
  clipCount: number;
  missing: { shotNumber: string; reason: string }[];
};

/**
 * Build an EDL or FCPXML for the project's approved takes.
 * Called by the project edit UI to populate a download.
 */
export async function exportProjectTimeline(
  projectId: string,
  format: "edl" | "fcpxml" = "edl",
  fps = 24,
): Promise<ExportResult> {
  await requireAdminAction();
  const state = await readStudio();
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) throw new Error("Project not found");

  const timeline = buildProjectTimeline(project, state.scenes, state.shots, state.takes);
  const content = format === "fcpxml" ? exportFcpxml(timeline, fps) : exportEdl(timeline, fps);
  const safeName = project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "project";
  const filename = `${safeName}.${format}`;

  return {
    ok: timeline.clips.length > 0,
    format,
    filename,
    content,
    totalSec: timeline.totalSec,
    clipCount: timeline.clips.length,
    missing: timeline.missing.map((m) => ({ shotNumber: m.shotNumber, reason: m.reason })),
  };
}
