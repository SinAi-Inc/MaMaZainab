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
  const { passcodeConfigured: _passcodeConfigured, ...stored } = settings;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(stored, null, 2), "utf8");
}



function withPublicPasscodeState(settings: PartnerSettings): PartnerSettings {
  return {
    ...settings,
    passcode: "",
    passcodeConfigured: Boolean(settings.passcode),
  };
}

function settingsToRow(s: PartnerSettings): Record<string, unknown> {
  const { passcodeConfigured: _passcodeConfigured, ...stored } = s;
  return { id: "singleton", ...toSnake(stored as unknown as Record<string, unknown>) };
}

function rowToSettings(row: Record<string, unknown>): PartnerSettings {
  const camel = toCamel(row) as Record<string, unknown>;
  delete camel.id;
  return PartnerSettingsSchema.parse(camel);
}



export async function readStoredPartnerSettings(): Promise<PartnerSettings> {
  if (!isSupabaseConfigured()) return readJson();

  const { data, error } = await getSupabase()
    .from("partner_settings")
    .select("*")
    .eq("id", "singleton")
    .maybeSingle();

  if (error || !data) return PartnerSettingsSchema.parse({});
  return rowToSettings(data as unknown as Record<string, unknown>);
}

export async function readPartnerSettings(): Promise<PartnerSettings> {
  const settings = await readStoredPartnerSettings();
  return withPublicPasscodeState(settings);
}

export async function writeStoredPartnerSettings(settings: PartnerSettings): Promise<void> {
  if (!isSupabaseConfigured()) {
    try {
      return await writeJson(settings);
    } catch {
      throw new Error(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and a server Supabase key (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY) in .env.local or your hosting environment, then restart local dev or redeploy.",
      );
    }
  }

  const row = settingsToRow(settings);
  const { error } = await getSupabase()
    .from("partner_settings")
    .upsert(row, { onConflict: "id" });
  if (error) {
    console.error("[partner_settings upsert]", JSON.stringify(error));
    if (
      error.code === "42P01" ||
      /relation .*partner_settings.* does not exist/i.test(error.message)
    ) {
      throw new Error(
        "Supabase table partner_settings is missing. Run the partner_settings migration in the Supabase SQL Editor, then try saving again.",
      );
    }

    throw new Error(`Supabase ${error.code ?? "error"}: ${error.message}`);
  }
}
