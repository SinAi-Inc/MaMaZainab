"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { promises as fs } from "node:fs";
import path from "node:path";
import { readStudio, writeStudio } from "./store";
import { uploadFile } from "@/lib/upload";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { parseScript } from "./parse-script";
import { submitVideoJob, aspectToSize } from "@/lib/nvidia/client";
import { buildReferenceContext } from "@/lib/ai/brand-reference";
import { readCharacters } from "@/lib/characters/store";
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
 * Generate a new take. If no videoUrl is provided and NVIDIA_API_KEY is set,
 * dispatches to the NVIDIA API and stores the request ID for polling.
 * Brand reference context is injected into the prompt automatically.
 */
export async function generateTake(input: unknown) {
  const data = TakeInputSchema.parse(input);
  const state = await readStudio();
  const shot = state.shots.find((s) => s.id === data.shotId);
  if (!shot) throw new Error("Shot not found");

  const project = state.projects.find((p) => p.id === data.projectId);

  // Build brand-aware prompt
  let enrichedPrompt = data.prompt;
  try {
    const charState = await readCharacters();
    const brandCtx = buildReferenceContext(data.prompt, charState.characters, undefined, {
      includeBrand: true,
      isVideo: true,
    });
    if (brandCtx) {
      enrichedPrompt = `${data.prompt}\n\n---\n${brandCtx}`;
    }
  } catch {
    // If character store isn't available, proceed with raw prompt
  }

  const existing = state.takes.filter((t) => t.shotId === data.shotId);

  let externalId = data.externalId || "";
  let status: "queued" | "ready" | "generating" = data.videoUrl ? "ready" : "queued";

  // Dispatch to NVIDIA API if no video URL provided and API key is configured
  if (!data.videoUrl && process.env.NVIDIA_API_KEY && !process.env.NVIDIA_API_KEY.includes("YOUR_KEY")) {
    try {
      const result = await submitVideoJob({
        model: data.model as Parameters<typeof submitVideoJob>[0]["model"],
        prompt: enrichedPrompt,
        seed: data.seed ? Number(data.seed) : undefined,
      });
      externalId = result.reqId;
      status = result.status === "completed" ? "ready" : "generating";
    } catch (err) {
      // Log error but still create the take as queued
      console.error("[generateTake] NVIDIA API error:", err);
      status = "queued";
    }
  }

  const take: Take = {
    id: `take_${nanoid(8)}`,
    ...data,
    prompt: enrichedPrompt,
    externalId,
    index: existing.length + 1,
    status,
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

/**
 * Poll a generating take's status from NVIDIA API.
 * Updates the take record if completed or failed.
 */
export async function pollTake(takeId: string) {
  const { pollVideoJob } = await import("@/lib/nvidia/client");
  const state = await readStudio();
  const take = state.takes.find((t) => t.id === takeId);
  if (!take) throw new Error("Take not found");
  if (take.status !== "generating" || !take.externalId) return take;

  const result = await pollVideoJob(take.externalId);

  if (result.status === "completed" && result.video) {
    const filename = `${nanoid(10)}.mp4`;
    const buf = Buffer.from(result.video, "base64");

    if (!isSupabaseConfigured()) {
      const dir = path.join(process.cwd(), "public", "uploads", "takes");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, filename), buf);
      take.videoUrl = `/uploads/takes/${filename}`;
    } else {
      const { error: upErr } = await getSupabase().storage
        .from("uploads")
        .upload(`takes/${filename}`, buf, { contentType: "video/mp4" });
      if (upErr) throw upErr;
      const { data: urlData } = getSupabase().storage.from("uploads").getPublicUrl(`takes/${filename}`);
      take.videoUrl = urlData.publicUrl;
    }
    take.status = "ready";
  } else if (result.status === "failed") {
    take.status = "failed";
    take.notes = result.error ?? "Generation failed";
  }
  // else still running — no change

  take.updatedAt = now();
  await writeStudio(state);
  revalidateAll(take.projectId);
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

export async function uploadTakeVideo(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  return uploadFile(file, "takes", ["mp4", "webm", "mov", "m4v"], 300 * 1024 * 1024);
}

export async function uploadShotReference(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  return uploadFile(file, "shot-refs", ["png", "jpg", "jpeg", "webp"], 10 * 1024 * 1024);
}

export async function uploadProjectPoster(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  return uploadFile(file, "posters", ["png", "jpg", "jpeg", "webp"], 10 * 1024 * 1024);
}

export async function uploadScriptFile(formData: FormData): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  return file.text();
}
