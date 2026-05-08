import { promises as fs } from "node:fs";
import path from "node:path";
import { BranchesStateSchema, type BranchesState } from "./schema";

const FILE = path.join(process.cwd(), "data", "branches.json");
const DATA_DIR = path.join(process.cwd(), "data");

export async function readBranches(): Promise<BranchesState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    // Support both wrapped { branches: [] } and bare array formats
    const data = Array.isArray(parsed) ? { branches: parsed } : parsed;
    return BranchesStateSchema.parse(data);
  } catch {
    return { branches: [] };
  }
}

export async function writeBranches(state: BranchesState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(state.branches, null, 2), "utf8");
}
