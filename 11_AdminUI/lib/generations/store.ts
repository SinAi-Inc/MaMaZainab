import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toSnake, toCamel } from "@/lib/case";
import { GenerationStateSchema, type GenerationEntry, type GenerationState } from "./schema";

const FILE = path.join(process.cwd(), "data", "generations.json");
const DATA_DIR = path.join(process.cwd(), "data");



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



function entryToRow(e: GenerationEntry): Record<string, unknown> {
  return toSnake(e as unknown as Record<string, unknown>);
}

function rowToEntry(row: Record<string, unknown>): GenerationEntry {
  return toCamel(row) as unknown as GenerationEntry;
}



/** Read all generation history entries (newest first). */
export async function readGenerations(): Promise<GenerationState> {
  if (!isSupabaseConfigured()) return readJson();

  const { data, error } = await getSupabase()
    .from("generations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const sbEntries = error
    ? []
    : (data ?? []).map((r) => rowToEntry(r as unknown as Record<string, unknown>));

  // Merge any local JSON fallback entries (written when Supabase insert failed)
  const local = await readJson();
  if (local.entries.length === 0) {
    return { version: 1, entries: sbEntries };
  }

  // Deduplicate by id, preferring Supabase entries
  const seen = new Set(sbEntries.map((e) => e.id));
  const merged = [...sbEntries];
  for (const le of local.entries) {
    if (!seen.has(le.id)) merged.push(le);
  }
  // Sort newest first
  merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { version: 1, entries: merged.slice(0, 200) };
}

/** Append a new entry and persist. */
export async function addGeneration(entry: GenerationEntry): Promise<void> {
  if (!isSupabaseConfigured()) {
    const state = await readJson();
    state.entries.unshift(entry);
    if (state.entries.length > 200) {
      state.entries = state.entries.slice(0, 200);
    }
    return writeJson(state);
  }

  const { error } = await getSupabase()
    .from("generations")
    .insert(entryToRow(entry));
  if (error) {
    // Supabase insert failed — fall back to local JSON so entries are never lost
    console.warn("[generations] Supabase insert failed, falling back to JSON:", error.message);
    const state = await readJson();
    state.entries.unshift(entry);
    if (state.entries.length > 200) {
      state.entries = state.entries.slice(0, 200);
    }
    await writeJson(state);
  }
}

/** Delete a single entry by ID. */
export async function deleteGeneration(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const state = await readJson();
    state.entries = state.entries.filter((e) => e.id !== id);
    return writeJson(state);
  }

  const { error } = await getSupabase()
    .from("generations")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/** Clear all history. */
export async function clearGenerations(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return writeJson({ version: 1, entries: [] });
  }

  const { error } = await getSupabase()
    .from("generations")
    .delete()
    .neq("id", "");
  if (error) throw error;
}
