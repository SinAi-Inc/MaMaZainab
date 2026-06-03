import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toCamel, toSnake } from "@/lib/case";
import { StudioStateSchema, type StudioState, type Project, type Scene, type Shot, type Take } from "./schema";

const FILE = path.join(process.cwd(), "data", "videos.json");
const DATA_DIR = path.join(process.cwd(), "data");

const now = () => new Date().toISOString();

const SEED_PROJECT: Project = {
  id: "prj_brand_incorporation",
  title: "Brand Incorporation - The Legend of Wong & MaMa Zainab",
  logline:
    "An exiled warrior arrives in Egypt, and an AI tells him to build a comfort-food empire named after every Egyptian's mother.",
  synopsis:
    "Cinematic ~3:30 launch film tracing Shang Hong Wong's flight from a neon-soaked underworld to Alexandria, where he forges the MaMa Zainab brand under the guidance of an AI oracle and a phantom army of 'Falaha' village mothers.",
  status: "scripting",
  script: "",
  scriptSourcePath: "04_Scripts/MaMa Zainab.md",
  targetDurationSec: 210,
  aspectRatio: "2.39:1",
  defaultModel: "veo-3.1",
  styleSuffix:
    "shot on ARRI Alexa 35, anamorphic 2.39:1, cinematic color grade, warm Mediterranean highlights + cool teal shadows, volumetric haze, photoreal, film grain, no text overlay",
  posterUrl: "",
  masterCutUrl: "",
  budgetUsd: 0,
  spentUsd: 0,
  tags: ["brand", "launch", "cinematic", "hero-film"],
  createdAt: now(),
  updatedAt: now(),
};

const SEED: StudioState = {
  version: 2,
  projects: [SEED_PROJECT],
  scenes: [],
  shots: [],
  takes: [],
};



async function readJson(): Promise<StudioState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return StudioStateSchema.parse(JSON.parse(raw));
  } catch {
    await writeJson(SEED);
    return SEED;
  }
}

async function writeJson(state: StudioState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const validated = StudioStateSchema.parse(state);
  await fs.writeFile(FILE, JSON.stringify(validated, null, 2), "utf8");
}



function projectToRow(p: Project): Record<string, unknown> {
  const row = toSnake(p as unknown as Record<string, unknown>);
  // jsonb columns - send arrays directly, do NOT JSON.stringify
  row.tags = p.tags;
  return row;
}

function rowToProject(row: Record<string, unknown>): Project {
  const parsed = { ...row };
  if (typeof parsed.tags === "string") {
    try { parsed.tags = JSON.parse(parsed.tags as string); } catch { parsed.tags = []; }
  }
  return toCamel(parsed) as unknown as Project;
}

function shotToRow(s: Shot): Record<string, unknown> {
  const row = toSnake(s as unknown as Record<string, unknown>);
  // jsonb columns - send arrays directly, do NOT JSON.stringify
  row.reference_urls = s.referenceUrls;
  return row;
}

function rowToShot(row: Record<string, unknown>): Shot {
  const parsed = { ...row };
  if (typeof parsed.reference_urls === "string") {
    try { parsed.reference_urls = JSON.parse(parsed.reference_urls as string); } catch { parsed.reference_urls = []; }
  }
  return toCamel(parsed) as unknown as Shot;
}



export async function readStudio(): Promise<StudioState> {
  if (!isSupabaseConfigured()) return readJson();

  try {
    const sb = getSupabase();
    const { data: projects } = await sb.from("projects").select("*").order("created_at");
    if (!projects || projects.length === 0) {
      // Supabase has no projects - check local JSON first (may have data from before Supabase was configured)
      const local = await readJson();
      if (local.projects.length > 0) return local;
      try {
        await sb.from("projects").upsert(projectToRow(SEED_PROJECT));
      } catch {
        // Seed failed - return empty state rather than crashing the page
      }
      return SEED;
    }

    const { data: scenes } = await sb.from("scenes").select("*").order("sort");
    const { data: shots } = await sb.from("shots").select("*").order("sort");
    const { data: takes } = await sb.from("takes").select("*").order("index");

    const state: StudioState = {
      version: 2,
      projects: projects.map((r) => rowToProject(r as unknown as Record<string, unknown>)),
      scenes: (scenes ?? []).map((r) => toCamel(r as unknown as Record<string, unknown>) as unknown as Scene),
      shots: (shots ?? []).map((r) => rowToShot(r as unknown as Record<string, unknown>)),
      takes: (takes ?? []).map((r) => toCamel(r as unknown as Record<string, unknown>) as unknown as Take),
    };

    // Fallback: if Supabase is missing shots, use local JSON for scenes+shots+takes together
    // (must keep referential integrity - shot.sceneId references scene.id from the same source)
    if (state.shots.length === 0) {
      const local = await readJson();
      if (local.shots.length > 0) {
        state.scenes = local.scenes;
        state.shots = local.shots;
        state.takes = local.takes;
      }
    }

    return state;
  } catch {
    // Supabase read/mapping failed - return empty state rather than crashing the page
    return SEED;
  }
}

export async function writeStudio(state: StudioState): Promise<void> {
  // ALWAYS persist to local JSON as ground truth (never lose data)
  await writeJson(state);

  if (!isSupabaseConfigured()) return;

  const sb = getSupabase();
  try {
    await sb.from("takes").delete().neq("id", "");
    await sb.from("shots").delete().neq("id", "");
    await sb.from("scenes").delete().neq("id", "");
    await sb.from("projects").delete().neq("id", "");

    if (state.projects.length > 0) {
      const rows = state.projects.map(projectToRow);
      const { error } = await sb.from("projects").insert(rows);
      if (error) throw error;
    }
    if (state.scenes.length > 0) {
      const rows = state.scenes.map((s) => toSnake(s as unknown as Record<string, unknown>));
      const { error } = await sb.from("scenes").insert(rows);
      if (error) throw error;
    }
    if (state.shots.length > 0) {
      const rows = state.shots.map(shotToRow);
      const { error } = await sb.from("shots").insert(rows);
      if (error) {
        console.error("[writeStudio] shots insert failed - data safe in local JSON", {
          error: error.message,
          rowKeys: Object.keys(rows[0] ?? {}),
          rowCount: rows.length,
        });
        // Don't throw - local JSON is already saved
        return;
      }
    }
    if (state.takes.length > 0) {
      const rows = state.takes.map((t) => toSnake(t as unknown as Record<string, unknown>));
      const { error } = await sb.from("takes").insert(rows);
      if (error) {
        console.error("[writeStudio] takes insert failed - data safe in local JSON", { error: error.message });
        return;
      }
    }
  } catch (err) {
    console.error("[writeStudio] Supabase sync failed - data safe in local JSON:", err instanceof Error ? err.message : err);
  }
}

/* ---- Convenience selectors ---------------------------------- */

export async function readProject(id: string) {
  if (!isSupabaseConfigured()) {
    const s = await readJson();
    const project = s.projects.find((p) => p.id === id) ?? null;
    if (!project) return null;
    const scenes = s.scenes.filter((sc) => sc.projectId === id).sort((a, b) => a.sort - b.sort);
    const shots = s.shots.filter((sh) => sh.projectId === id).sort((a, b) => a.sort - b.sort);
    const takes = s.takes.filter((t) => t.projectId === id).sort((a, b) => a.index - b.index);
    return { project, scenes, shots, takes };
  }

  const sb = getSupabase();
  const { data: pData } = await sb.from("projects").select("*").eq("id", id).single();
  if (!pData) return null;

  const project = rowToProject(pData as unknown as Record<string, unknown>);

  const { data: sceneData } = await sb
    .from("scenes").select("*").eq("project_id", id).order("sort");
  const { data: shotData } = await sb
    .from("shots").select("*").eq("project_id", id).order("sort");
  const { data: takeData } = await sb
    .from("takes").select("*").eq("project_id", id).order("index");

  let scenes = (sceneData ?? []).map((r) => toCamel(r as unknown as Record<string, unknown>) as unknown as Scene);
  let shots = (shotData ?? []).map((r) => rowToShot(r as unknown as Record<string, unknown>));
  let takes = (takeData ?? []).map((r) => toCamel(r as unknown as Record<string, unknown>) as unknown as Take);

  // Fallback: if Supabase is missing shots, use local JSON for scenes+shots+takes together
  // (must keep referential integrity - shot.sceneId references scene.id from the same source)
  if (shots.length === 0) {
    const local = await readJson();
    const localScenes = local.scenes.filter((sc) => sc.projectId === id).sort((a, b) => a.sort - b.sort);
    const localShots = local.shots.filter((sh) => sh.projectId === id).sort((a, b) => a.sort - b.sort);
    const localTakes = local.takes.filter((t) => t.projectId === id).sort((a, b) => a.index - b.index);
    if (localShots.length > 0) {
      scenes = localScenes;
      shots = localShots;
      takes = localTakes;
    }
  }

  return { project, scenes, shots, takes };
}
