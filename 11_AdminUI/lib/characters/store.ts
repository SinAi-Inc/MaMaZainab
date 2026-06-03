import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toCamel, toSnake } from "@/lib/case";
import { CharacterStateSchema, type Character, type CharacterState } from "./schema";

const FILE = path.join(process.cwd(), "data", "characters.json");
const DATA_DIR = path.join(process.cwd(), "data");



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



function charToRow(c: Character): Record<string, unknown> {
  const row = toSnake(c as unknown as Record<string, unknown>);
  // jsonb columns - send arrays directly, no JSON.stringify needed
  row.reference_images = c.referenceImages;
  row.identity_fields = c.identityFields;
  row.modes = c.modes;
  row.dos = c.dos;
  row.donts = c.donts;
  return row;
}

function rowToChar(row: Record<string, unknown>): Character {
  const parsed = { ...row };
  for (const col of ["reference_images", "identity_fields", "modes", "dos", "donts"] as const) {
    if (typeof parsed[col] === "string") {
      try { parsed[col] = JSON.parse(parsed[col] as string); } catch { parsed[col] = []; }
    }
  }
  return toCamel(parsed) as unknown as Character;
}



export async function readCharacters(): Promise<CharacterState> {
  if (!isSupabaseConfigured()) return readJson();

  const { data, error } = await getSupabase()
    .from("characters")
    .select("*")
    .order("sort");

  if (error || !data) return { version: 1, characters: [] };
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

