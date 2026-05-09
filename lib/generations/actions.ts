"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { readGenerations, addGeneration, deleteGeneration, clearGenerations } from "./store";
import type { GenerationEntry, GenerationState } from "./schema";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "generations");

/** Save a base64 image to uploads/generations/ and return the public path. */
export async function saveGeneratedImage(
  base64: string,
  ext: string = "jpg",
): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const slug = randomBytes(8).toString("hex");
  const filename = `${slug}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(base64, "base64");
  await fs.writeFile(filePath, buffer);
  return `/uploads/generations/${filename}`;
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
    ...input,
  };
  let outputPath = entry.outputPath || "";

  if (entry.base64Output && entry.status === "completed") {
    const ext = entry.type === "video" ? "mp4" : "jpg";
    outputPath = await saveGeneratedImage(entry.base64Output, ext);
  }

  const record: GenerationEntry = {
    ...entry,
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
