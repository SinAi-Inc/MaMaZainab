import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toCamel, toSnake } from "@/lib/case";
import { CharacterStateSchema, type Character, type CharacterState } from "./schema";

const FILE = path.join(process.cwd(), "data", "characters.json");
const DATA_DIR = path.join(process.cwd(), "data");

/* ── JSON fallback ───────────────────────────────── */

async function readJson(): Promise<CharacterState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return CharacterStateSchema.parse(JSON.parse(raw));
  } catch {
    return { version: 1, characters: [] };
  }
}

async function writeJson(state: CharacterState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(state, null, 2), "utf8");
}

/* ── Supabase row converters ─────────────────────── */

function charToRow(c: Character): Record<string, unknown> {
  const row = toSnake(c as unknown as Record<string, unknown>);
  row.reference_images = JSON.stringify(c.referenceImages);
  row.identity_fields = JSON.stringify(c.identityFields);
  row.modes = JSON.stringify(c.modes);
  row.dos = JSON.stringify(c.dos);
  row.donts = JSON.stringify(c.donts);
  return row;
}

function rowToChar(row: Record<string, unknown>): Character {
  return toCamel(row) as unknown as Character;
}

/* ── Public API ──────────────────────────────────── */

export async function readCharacters(): Promise<CharacterState> {
  if (!isSupabaseConfigured()) return readJson();

  const { data, error } = await getSupabase()
    .from("characters")
    .select("*")
    .order("sort");

  if (error) throw error;
  if (!data || data.length === 0) {
    return { version: 1, characters: [] };
  }

  return {
    version: 1,
    characters: data.map((r) => rowToChar(r as unknown as Record<string, unknown>)),
  };
}

export async function writeCharacters(state: CharacterState): Promise<void> {
  if (!isSupabaseConfigured()) return writeJson(state);

  const sb = getSupabase();
  await sb.from("characters").delete().neq("id", "");
  if (state.characters.length > 0) {
    const rows = state.characters.map(charToRow);
    const { error } = await sb.from("characters").insert(rows);
    if (error) throw error;
  }
}

