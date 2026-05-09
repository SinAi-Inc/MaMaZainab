import { promises as fs } from "node:fs";
import path from "node:path";
import { GenerationStateSchema, type GenerationEntry, type GenerationState } from "./schema";

const FILE = path.join(process.cwd(), "data", "generations.json");
const DATA_DIR = path.join(process.cwd(), "data");

/* ── JSON store ────────────────────────────────────── */

async function readJson(): Promise<GenerationState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return GenerationStateSchema.parse(JSON.parse(raw));
  } catch {
    return { version: 1, entries: [] };
  }
}

async function writeJson(state: GenerationState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(state, null, 2), "utf8");
}

/* ── Public API ──────────────────────────────────── */

/** Read all generation history entries (newest first). */
export async function readGenerations(): Promise<GenerationState> {
  return readJson();
}

/** Append a new entry and persist. */
export async function addGeneration(entry: GenerationEntry): Promise<void> {
  const state = await readJson();
  state.entries.unshift(entry);
  // Keep max 200 entries
  if (state.entries.length > 200) {
    state.entries = state.entries.slice(0, 200);
  }
  await writeJson(state);
}

/** Delete a single entry by ID. */
export async function deleteGeneration(id: string): Promise<void> {
  const state = await readJson();
  state.entries = state.entries.filter((e) => e.id !== id);
  await writeJson(state);
}

/** Clear all history. */
export async function clearGenerations(): Promise<void> {
  await writeJson({ version: 1, entries: [] });
}
