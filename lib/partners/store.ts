import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toSnake, toCamel } from "@/lib/case";
import { PartnerSettingsSchema, type PartnerSettings } from "./schema";

const FILE = path.join(process.cwd(), "data", "partners.json");
const DATA_DIR = path.join(process.cwd(), "data");



async function readJson(): Promise<PartnerSettings> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return PartnerSettingsSchema.parse(JSON.parse(raw));
  } catch {
    return PartnerSettingsSchema.parse({});
  }
}

async function writeJson(settings: PartnerSettings): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(settings, null, 2), "utf8");
}



function settingsToRow(s: PartnerSettings): Record<string, unknown> {
  return { id: "singleton", ...toSnake(s as unknown as Record<string, unknown>) };
}

function rowToSettings(row: Record<string, unknown>): PartnerSettings {
  const camel = toCamel(row) as Record<string, unknown>;
  delete camel.id;
  return PartnerSettingsSchema.parse(camel);
}



export async function readPartnerSettings(): Promise<PartnerSettings> {
  if (!isSupabaseConfigured()) return readJson();

  const { data, error } = await getSupabase()
    .from("partner_settings")
    .select("*")
    .eq("id", "singleton")
    .maybeSingle();

  if (error || !data) return PartnerSettingsSchema.parse({});
  return rowToSettings(data as unknown as Record<string, unknown>);
}

export async function writePartnerSettings(settings: PartnerSettings): Promise<void> {
  if (!isSupabaseConfigured()) return writeJson(settings);

  try { await writeJson(settings); } catch { /* read-only FS on Vercel — expected */ }
  const row = settingsToRow(settings);
  const { error } = await getSupabase()
    .from("partner_settings")
    .upsert(row, { onConflict: "id" });
  if (error) {
    console.error("[partner_settings upsert]", JSON.stringify(error));
    throw new Error(`Supabase ${error.code}: ${error.message}`);
  }
}
