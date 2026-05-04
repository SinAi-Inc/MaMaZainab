"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { promises as fs } from "node:fs";
import path from "node:path";
import { readStudio, writeStudio } from "./store";
import { parseScript } from "./parse-script";
import {
  ProjectInputSchema,
  SceneInputSchema,
  ShotInputSchema,
  TakeInputSchema,
  type Project,
  type Scene,
  type Shot,
  type Take,
} from "./schema";

const now = () => new Date().toISOString();

function revalidateAll(projectId?: string) {
  revalidatePath("/videos");
  if (projectId) revalidatePath(`/videos/${projectId}`);
}

/* ---- Projects ----------------------------------------------- */

export async function createProject(input: unknown) {
  const data = ProjectInputSchema.parse(input);
  const state = await readStudio();
  const project: Project = {
    id: `prj_${nanoid(8)}`,
    ...data,
    createdAt: now(),
    updatedAt: now(),
  };
  state.projects.push(project);
  await writeStudio(state);
  revalidateAll(project.id);
  return project;
}

export async function updateProject(id: string, input: unknown) {
  const data = ProjectInputSchema.parse(input);
  const state = await readStudio();
  const idx = state.projects.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error("Project not found");
  state.projects[idx] = { ...state.projects[idx], ...data, updatedAt: now() };
  await writeStudio(state);
  revalidateAll(id);
  return state.projects[idx];
}

export async function deleteProject(id: string) {
  const state = await readStudio();
  state.projects = state.projects.filter((p) => p.id !== id);
  state.scenes = state.scenes.filter((s) => s.projectId !== id);
  state.shots = state.shots.filter((s) => s.projectId !== id);
  state.takes = state.takes.filter((t) => t.projectId !== id);
  await writeStudio(state);
  revalidateAll();
}

export async function setProjectStatus(id: string, status: Project["status"]) {
  const state = await readStudio();
  const p = state.projects.find((x) => x.id === id);
  if (!p) throw new Error("Project not found");
  p.status = status;
  p.updatedAt = now();
  await writeStudio(state);
  revalidateAll(id);
  return p;
}

/* ---- Script parsing ---------------------------------------- */

/**
 * Replace any existing scenes/shots for a project with a fresh
 * parse of the given script Markdown.
 */
export async function reparseProjectScript(projectId: string, script: string) {
  const state = await readStudio();
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) throw new Error("Project not found");

  const { scenes, shotsByScene } = parseScript(script);

  // wipe existing scenes/shots/takes for project
  state.scenes = state.scenes.filter((s) => s.projectId !== projectId);
  state.shots = state.shots.filter((s) => s.projectId !== projectId);
  state.takes = state.takes.filter((t) => t.projectId !== projectId);

  for (const sc of scenes) {
    const sceneId = `scn_${nanoid(8)}`;
    const newScene: Scene = {
      id: sceneId,
      projectId,
      number: sc.number,
      heading: sc.heading,
      summary: sc.summary,
      scriptExcerpt: sc.scriptExcerpt,
      sort: sc.number,
      createdAt: now(),
      updatedAt: now(),
    };
    state.scenes.push(newScene);

    const shots = shotsByScene[sc.number] ?? [];
    let i = 0;
    for (const sh of shots) {
      const shot: Shot = {
        id: `shot_${nanoid(8)}`,
        projectId,
        sceneId,
        number: sh.number,
        type: sh.type,
        durationSec: sh.durationSec,
        description: sh.description,
        dialogue: "",
        cameraNotes: "",
        prompt: "",
        referenceUrls: [],
        status: "pending",
        approvedTakeId: "",
        sort: i++,
        createdAt: now(),
        updatedAt: now(),
      };
      state.shots.push(shot);
    }
  }

  project.script = script;
  project.updatedAt = now();
  await writeStudio(state);
  revalidateAll(projectId);
  return { scenes: scenes.length, shots: state.shots.filter((s) => s.projectId === projectId).length };
}

/**
 * Load a script Markdown file from the repo (relative path) into a project.
 * Useful for the seed Brand Incorporation project.
 */
export async function loadScriptFromRepo(projectId: string, relPath: string) {
  // Repo root = workspace root, two levels up from /11_AdminUI
  const repoRoot = path.resolve(process.cwd(), "..");
  const full = path.join(repoRoot, relPath);
  const md = await fs.readFile(full, "utf8");
  return reparseProjectScript(projectId, md);
}

/* ---- Scenes ------------------------------------------------- */

export async function updateScene(id: string, input: unknown) {
  const data = SceneInputSchema.parse(input);
  const state = await readStudio();
  const idx = state.scenes.findIndex((s) => s.id === id);
  if (idx < 0) throw new Error("Scene not found");
  state.scenes[idx] = { ...state.scenes[idx], ...data, updatedAt: now() };
  await writeStudio(state);
  revalidateAll(state.scenes[idx].projectId);
  return state.scenes[idx];
}

export async function deleteScene(id: string) {
  const state = await readStudio();
  const scene = state.scenes.find((s) => s.id === id);
  if (!scene) return;
  state.scenes = state.scenes.filter((s) => s.id !== id);
  state.shots = state.shots.filter((s) => s.sceneId !== id);
  state.takes = state.takes.filter(
    (t) => !state.shots.some((s) => s.id === t.shotId && s.sceneId === id),
  );
  await writeStudio(state);
  revalidateAll(scene.projectId);
}

/* ---- Shots -------------------------------------------------- */

export async function createShot(input: unknown) {
  const data = ShotInputSchema.parse(input);
  const state = await readStudio();
  const shot: Shot = {
    id: `shot_${nanoid(8)}`,
    ...data,
    createdAt: now(),
    updatedAt: now(),
  };
  state.shots.push(shot);
  await writeStudio(state);
  revalidateAll(shot.projectId);
  return shot;
}

export async function updateShot(id: string, input: unknown) {
  const data = ShotInputSchema.parse(input);
  const state = await readStudio();
  const idx = state.shots.findIndex((s) => s.id === id);
  if (idx < 0) throw new Error("Shot not found");
  state.shots[idx] = { ...state.shots[idx], ...data, updatedAt: now() };
  await writeStudio(state);
  revalidateAll(state.shots[idx].projectId);
  return state.shots[idx];
}

export async function deleteShot(id: string) {
  const state = await readStudio();
  const shot = state.shots.find((s) => s.id === id);
  if (!shot) return;
  state.shots = state.shots.filter((s) => s.id !== id);
  state.takes = state.takes.filter((t) => t.shotId !== id);
  await writeStudio(state);
  revalidateAll(shot.projectId);
}

export async function setShotStatus(id: string, status: Shot["status"]) {
  const state = await readStudio();
  const s = state.shots.find((x) => x.id === id);
  if (!s) throw new Error("Shot not found");
  s.status = status;
  s.updatedAt = now();
  await writeStudio(state);
  revalidateAll(s.projectId);
  return s;
}

/* ---- Takes -------------------------------------------------- */

/**
 * Generate a new take. v1: this records a queued/ready take with the
 * prompt snapshot. Future: dispatch to provider SDK based on `model`.
 */
export async function generateTake(input: unknown) {
  const data = TakeInputSchema.parse(input);
  const state = await readStudio();
  const shot = state.shots.find((s) => s.id === data.shotId);
  if (!shot) throw new Error("Shot not found");

  const existing = state.takes.filter((t) => t.shotId === data.shotId);
  const take: Take = {
    id: `take_${nanoid(8)}`,
    ...data,
    index: existing.length + 1,
    // If the user provided a videoUrl already, treat as ready; otherwise queue.
    status: data.videoUrl ? "ready" : "queued",
    createdAt: now(),
    updatedAt: now(),
  };
  state.takes.push(take);

  // Mark shot as prompted at minimum
  if (shot.status === "pending") shot.status = "prompted";
  shot.updatedAt = now();

  await writeStudio(state);
  revalidateAll(shot.projectId);
  return take;
}

export async function updateTake(id: string, input: unknown) {
  const data = TakeInputSchema.parse(input);
  const state = await readStudio();
  const idx = state.takes.findIndex((t) => t.id === id);
  if (idx < 0) throw new Error("Take not found");
  state.takes[idx] = { ...state.takes[idx], ...data, updatedAt: now() };
  await writeStudio(state);
  revalidateAll(state.takes[idx].projectId);
  return state.takes[idx];
}

export async function deleteTake(id: string) {
  const state = await readStudio();
  const take = state.takes.find((t) => t.id === id);
  if (!take) return;
  state.takes = state.takes.filter((t) => t.id !== id);
  // If this was the approved take, clear the shot's pointer
  const shot = state.shots.find((s) => s.id === take.shotId);
  if (shot && shot.approvedTakeId === id) {
    shot.approvedTakeId = "";
    if (shot.status === "approved") shot.status = "prompted";
  }
  await writeStudio(state);
  revalidateAll(take.projectId);
}

export async function approveTake(id: string) {
  const state = await readStudio();
  const take = state.takes.find((t) => t.id === id);
  if (!take) throw new Error("Take not found");
  // Demote any other approved take for this shot
  for (const t of state.takes) {
    if (t.shotId === take.shotId && t.id !== id && t.status === "approved") {
      t.status = "ready";
      t.updatedAt = now();
    }
  }
  take.status = "approved";
  take.updatedAt = now();
  const shot = state.shots.find((s) => s.id === take.shotId);
  if (shot) {
    shot.approvedTakeId = take.id;
    shot.status = "approved";
    shot.updatedAt = now();
  }
  await writeStudio(state);
  revalidateAll(take.projectId);
  return take;
}

export async function setTakeStatus(id: string, status: Take["status"]) {
  const state = await readStudio();
  const t = state.takes.find((x) => x.id === id);
  if (!t) throw new Error("Take not found");
  t.status = status;
  t.updatedAt = now();
  await writeStudio(state);
  revalidateAll(t.projectId);
  return t;
}

/* ---- Uploads ------------------------------------------------ */

async function saveUpload(
  formData: FormData,
  subdir: string,
  allowed: string[],
  maxBytes: number,
): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  if (file.size > maxBytes)
    throw new Error(`Max ${Math.round(maxBytes / 1024 / 1024)}MB`);

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!allowed.includes(ext)) {
    throw new Error(`Allowed: ${allowed.join(", ")}`);
  }

  const filename = `${nanoid(10)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await fs.mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buf);
  return `/uploads/${subdir}/${filename}`;
}

export async function uploadTakeVideo(formData: FormData) {
  return saveUpload(
    formData,
    "takes",
    ["mp4", "webm", "mov", "m4v"],
    300 * 1024 * 1024,
  );
}

export async function uploadShotReference(formData: FormData) {
  return saveUpload(
    formData,
    "shot-refs",
    ["png", "jpg", "jpeg", "webp"],
    10 * 1024 * 1024,
  );
}

export async function uploadProjectPoster(formData: FormData) {
  return saveUpload(
    formData,
    "posters",
    ["png", "jpg", "jpeg", "webp"],
    10 * 1024 * 1024,
  );
}

export async function uploadScriptFile(formData: FormData): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  return file.text();
}
