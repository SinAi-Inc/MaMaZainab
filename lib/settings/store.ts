import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toCamel, toSnake } from "@/lib/case";
import { SettingsSchema, type Settings } from "./schema";

const FILE = path.join(process.cwd(), "data", "settings.json");
const DATA_DIR = path.join(process.cwd(), "data");
const DEFAULTS: Settings = SettingsSchema.parse({});

/* ── JSON fallback ───────────────────────────────── */

async function readJson(): Promise<Settings> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return SettingsSchema.parse(JSON.parse(raw));
  } catch {
    return DEFAULTS;
  }
}

async function writeJson(settings: Settings): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(settings, null, 2), "utf8");
}

/* ── Public API ──────────────────────────────────── */

export async function readSettings(): Promise<Settings> {
  if (!isSupabaseConfigured()) return readJson();

  const { data, error } = await getSupabase()
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) return DEFAULTS;
  const camel = toCamel(data) as Record<string, unknown>;
  delete camel.id;
  return SettingsSchema.parse(camel);
}

export async function writeSettings(settings: Settings): Promise<void> {
  if (!isSupabaseConfigured()) return writeJson(settings);

  const row = toSnake(settings as unknown as Record<string, unknown>);
  (row as Record<string, unknown>).id = 1;
  const { error } = await getSupabase().from("settings").upsert(row);
  if (error) throw error;
}
