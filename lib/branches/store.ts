import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toCamel, toSnake } from "@/lib/case";
import { BranchesStateSchema, type Branch, type BranchesState } from "./schema";

const FILE = path.join(process.cwd(), "data", "branches.json");
const DATA_DIR = path.join(process.cwd(), "data");



async function readJson(): Promise<BranchesState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    const data = Array.isArray(parsed) ? { branches: parsed } : parsed;
    return BranchesStateSchema.parse(data);
  } catch {
    return { branches: [] };
  }
}

async function writeJson(state: BranchesState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(state.branches, null, 2), "utf8");
}



export async function readBranches(): Promise<BranchesState> {
  if (!isSupabaseConfigured()) return readJson();

  const { data, error } = await getSupabase()
    .from("branches")
    .select("*")
    .order("kiosk_number");
  if (error) throw error;
  return {
    branches: (data ?? []).map((r) => toCamel(r as unknown as Record<string, unknown>) as unknown as Branch),
  };
}

export async function writeBranches(state: BranchesState): Promise<void> {
  if (!isSupabaseConfigured()) return writeJson(state);

  const sb = getSupabase();
  await sb.from("branches").delete().neq("id", "");
  if (state.branches.length > 0) {
    const rows = state.branches.map((b) => toSnake(b as unknown as Record<string, unknown>));
    const { error } = await sb.from("branches").insert(rows);
    if (error) throw error;
  }
}
