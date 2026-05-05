import { promises as fs } from "node:fs";
import path from "node:path";
import { SettingsSchema, type Settings } from "./schema";

const FILE = path.join(process.cwd(), "data", "settings.json");
const DATA_DIR = path.join(process.cwd(), "data");

const DEFAULTS: Settings = SettingsSchema.parse({});

export async function readSettings(): Promise<Settings> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return SettingsSchema.parse(JSON.parse(raw));
  } catch {
    return DEFAULTS;
  }
}

export async function writeSettings(settings: Settings): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(settings, null, 2), "utf8");
}
