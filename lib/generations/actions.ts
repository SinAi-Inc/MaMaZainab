"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { readGenerations, addGeneration, deleteGeneration, clearGenerations } from "./store";
import { estimateCostUsd } from "@/lib/ai/cost";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import type { GenerationEntry, GenerationState } from "./schema";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "generations");
const BUCKET = "uploads";
const STORAGE_SUBDIR = "generations";

function sanitizeExtension(ext: string): string {
  const normalized = ext.trim().replace(/^\.+/, "").toLowerCase();
  return /^[a-z0-9]{1,10}$/.test(normalized) ? normalized : "jpg";
}

/** Save a base64 image to persistent storage (Supabase on prod, local disk on dev). */
export async function saveGeneratedImage(
  base64: string,
  ext: string = "jpg",
): Promise<string> {
  const slug = randomBytes(8).toString("hex");
  const safeExt = sanitizeExtension(ext);
  const filename = `${slug}.${safeExt}`;
  const buffer = Buffer.from(base64, "base64");

  if (isSupabaseConfigured()) {
    const sb = getSupabase();
    const storagePath = `${STORAGE_SUBDIR}/${filename}`;
    await sb.storage.createBucket(BUCKET, { public: true }).catch(() => null);
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: safeExt === "mp4" ? "video/mp4" : `image/${safeExt}`,
        upsert: false,
      });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return `/uploads/${STORAGE_SUBDIR}/${filename}`;
  }

  // Local dev fallback
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filePath, buffer);
  return `/uploads/${STORAGE_SUBDIR}/${filename}`;
}

type RecordInput = Omit<GenerationEntry, "id" | "createdAt"> & { base64Output?: string };

/** Record a generation entry (and optionally save the output file). */
export async function recordGeneration(
  input: Partial<RecordInput> & Pick<RecordInput, "type" | "model" | "prompt">,
): Promise<GenerationEntry> {
  const entry = {
    characterAnchor: "",
    sceneContext: "",
    aspect: "1:1",
    stylePreset: "",
    outputPath: "",
    status: "completed" as const,
    error: "",
    elapsedMs: 0,
    costUsd: 0,
    ...input,
  };
  let outputPath = entry.outputPath || "";

  if (entry.base64Output && entry.status === "completed") {
    const ext = entry.type === "video" ? "mp4" : "jpg";
    outputPath = await saveGeneratedImage(entry.base64Output, ext);
  }

  // Auto-fill cost from lookup if not provided and the call succeeded
  const costUsd = entry.costUsd > 0
    ? entry.costUsd
    : entry.status === "completed"
      ? estimateCostUsd(entry.model)
      : 0;

  const record: GenerationEntry = {
    ...entry,
    costUsd,
    id: randomBytes(6).toString("hex"),
    outputPath,
    createdAt: new Date().toISOString(),
  };
  // Remove base64Output before persisting
  delete (record as Record<string, unknown>)["base64Output"];

  await addGeneration(record);
  return record;
}

/** Get all history entries. */
export async function getHistory(): Promise<GenerationState> {
  return readGenerations();
}

/** Delete a single history entry. */
export async function removeHistoryEntry(id: string): Promise<void> {
  await deleteGeneration(id);
}

/** Clear all history. */
export async function clearHistory(): Promise<void> {
  await clearGenerations();
}
