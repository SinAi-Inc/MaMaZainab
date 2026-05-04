import { promises as fs } from "node:fs";
import path from "node:path";
import { StudioStateSchema, type StudioState } from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "videos.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function fileExists() {
  try {
    await fs.access(FILE);
    return true;
  } catch {
    return false;
  }
}

const now = () => new Date().toISOString();

const SEED: StudioState = {
  version: 2,
  projects: [
    {
      id: "prj_brand_incorporation",
      title: "Brand Incorporation — The Legend of Wong & MaMa Zainab",
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
      tags: ["brand", "launch", "cinematic", "hero-film"],
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  scenes: [],
  shots: [],
  takes: [],
};

export async function readStudio(): Promise<StudioState> {
  await ensureDir();
  if (!(await fileExists())) {
    await writeStudio(SEED);
    return SEED;
  }
  const raw = await fs.readFile(FILE, "utf8");
  const json = JSON.parse(raw);
  return StudioStateSchema.parse(json);
}

export async function writeStudio(state: StudioState): Promise<void> {
  await ensureDir();
  const validated = StudioStateSchema.parse(state);
  await fs.writeFile(FILE, JSON.stringify(validated, null, 2), "utf8");
}

/* ---- Convenience selectors ---------------------------------- */

export async function readProject(id: string) {
  const s = await readStudio();
  const project = s.projects.find((p) => p.id === id) ?? null;
  if (!project) return null;
  const scenes = s.scenes
    .filter((sc) => sc.projectId === id)
    .sort((a, b) => a.sort - b.sort || a.number - b.number);
  const shots = s.shots
    .filter((sh) => sh.projectId === id)
    .sort((a, b) => a.sort - b.sort);
  const takes = s.takes
    .filter((t) => t.projectId === id)
    .sort((a, b) => a.index - b.index);
  return { project, scenes, shots, takes };
}
