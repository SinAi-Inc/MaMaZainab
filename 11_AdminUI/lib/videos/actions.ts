"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { promises as fs } from "node:fs";
import path from "node:path";
import { readStudio, writeStudio } from "./store";
import { uploadFile } from "@/lib/upload";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { requireAdminAction } from "@/lib/server-action-auth";
import { parseScript } from "./parse-script";
import { aspectToSize } from "@/lib/nvidia/client";
import { pickProvider } from "@/lib/video/provider";
import type { VideoJob } from "@/lib/video/schema";
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
  await requireAdminAction();
  const data = ProjectInputSchema.parse(input);
  const state = await readStudio();
  const project: Project = {
    id: `prj_${nanoid(8)}`,
    ...data,
    spentUsd: 0,
    createdAt: now(),
    updatedAt: now(),
  };
  state.projects.push(project);
  await writeStudio(state);
  revalidateAll(project.id);
  return project;
}

export async function updateProject(id: string, input: unknown) {
  await requireAdminAction();
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
  await requireAdminAction();
  const state = await readStudio();
  state.projects = state.projects.filter((p) => p.id !== id);
  state.scenes = state.scenes.filter((s) => s.projectId !== id);
  state.shots = state.shots.filter((s) => s.projectId !== id);
  state.takes = state.takes.filter((t) => t.projectId !== id);
  await writeStudio(state);
  revalidateAll();
}

export async function setProjectStatus(id: string, status: Project["status"]) {
  await requireAdminAction();
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
  await requireAdminAction();
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
        keyframeUrl: "",
        keyframeApprovedAt: "",
        keyframeSeed: 0,
        keyframeHistory: [],
        audio: { voLine: "", voice: "", sfxCue: "", voUrl: "", sfxUrl: "" },
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
  await requireAdminAction();
  // Repo root = workspace root, two levels up from /11_AdminUI
  const repoRoot = path.resolve(process.cwd(), "..");
  const full = path.resolve(repoRoot, relPath);
  const relative = path.relative(repoRoot, full);
  // Block path traversal: reject if normalized path escapes repo root (handles both / and \ on Windows)
  if (relative.startsWith("..") || path.isAbsolute(relative) || /[\\\/]\.\./.test(relative) || relative.includes("..")) {
    throw new Error("Invalid script path");
  }
  const md = await fs.readFile(full, "utf8");
  return reparseProjectScript(projectId, md);
}

/* ---- Scenes ------------------------------------------------- */

export async function updateScene(id: string, input: unknown) {
  await requireAdminAction();
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
  await requireAdminAction();
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
  await requireAdminAction();
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
  await requireAdminAction();
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
  await requireAdminAction();
  const state = await readStudio();
  const shot = state.shots.find((s) => s.id === id);
  if (!shot) return;
  state.shots = state.shots.filter((s) => s.id !== id);
  state.takes = state.takes.filter((t) => t.shotId !== id);
  await writeStudio(state);
  revalidateAll(shot.projectId);
}

export async function setShotStatus(id: string, status: Shot["status"]) {
  await requireAdminAction();
  const state = await readStudio();
  const s = state.shots.find((x) => x.id === id);
  if (!s) throw new Error("Shot not found");
  s.status = status;
  s.updatedAt = now();
  await writeStudio(state);
  revalidateAll(s.projectId);
  return s;
}

/**
 * Update the audio plan (VO line, voice, SFX cue) for a shot.
 * URL fields (voUrl / sfxUrl) are populated later by the audio render pipeline.
 */
export async function updateShotAudio(
  id: string,
  audio: { voLine?: string; voice?: string; sfxCue?: string },
) {
  await requireAdminAction();
  const state = await readStudio();
  const s = state.shots.find((x) => x.id === id);
  if (!s) throw new Error("Shot not found");
  s.audio = {
    ...s.audio,
    voLine: audio.voLine ?? s.audio.voLine,
    voice: audio.voice ?? s.audio.voice,
    sfxCue: audio.sfxCue ?? s.audio.sfxCue,
  };
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
  await requireAdminAction();
  const data = TakeInputSchema.parse(input);
  const state = await readStudio();
  const shot = state.shots.find((s) => s.id === data.shotId);
  if (!shot) throw new Error("Shot not found");

  const project = state.projects.find((p) => p.id === data.projectId);

  // Build brand-aware prompt
  let enrichedPrompt = data.prompt;
  let brandLockCheck: { character: boolean; sceneMood: boolean; palette: boolean; plaid: boolean; negatives: boolean } | undefined;
  try {
    const charState = await readCharacters();
    const brandCtx = buildReferenceContext(data.prompt, charState.characters, undefined, {
      includeBrand: true,
      isVideo: true,
    });
    if (brandCtx) {
      enrichedPrompt = `${data.prompt}\n\n---\n${brandCtx}`;
    }
    // Build brand-lock metadata from the shot's prompt breakdown
    const breakdown = await buildShotPrompt(data.shotId);
    brandLockCheck = breakdown.injected;
  } catch {
    // If character store isn't available, proceed with raw prompt
  }

  const existing = state.takes.filter((t) => t.shotId === data.shotId);

  let externalId = data.externalId || "";
  let status: "queued" | "ready" | "generating" = data.videoUrl ? "ready" : "queued";

  // Dispatch to video provider if no video URL already provided
  if (!data.videoUrl) {
    try {
      const provider = await pickProvider({
        providerId: undefined,
        tier: "hero",
        durationSec: shot.durationSec ?? 5,
        aspectRatio: "16:9",
      });
      if (provider) {
        const videoJob: VideoJob = {
          id: `vjob_${nanoid(8)}`,
          providerId: provider.id,
          providerJobId: "",
          tier: "hero",
          projectId: data.projectId,
          shotId: data.shotId,
          takeId: "",
          prompt: enrichedPrompt,
          negativePrompt: "",
          characterAnchors: [],
          referenceImageUrls: [],
          imageUrl: shot.keyframeUrl ?? "",
          aspectRatio: "16:9",
          durationSec: shot.durationSec ?? 5,
          seed: data.seed ? Number(data.seed) : 0,
          status: "queued",
          outputUrl: "",
          posterUrl: "",
          estimatedCostUsd: 0,
          actualCostUsd: 0,
          error: "",
          providerMeta: {},
          createdAt: now(),
          updatedAt: now(),
        };
        const result = await provider.submit(videoJob);
        externalId = result.providerJobId;
        status = result.status === "completed" ? "ready" : "generating";
      }
    } catch (err) {
      console.error("[generateTake] video provider error:", err);
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
    brandLock: brandLockCheck,
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
 * Poll a generating take's status from the video provider.
 * Updates the take record if completed or failed.
 */
export async function pollTake(takeId: string) {
  await requireAdminAction();
  const { getProvider } = await import("@/lib/video/provider");
  const state = await readStudio();
  const take = state.takes.find((t) => t.id === takeId);
  if (!take) throw new Error("Take not found");
  if (take.status !== "generating" || !take.externalId) return take;

  // Detect provider from externalId format
  let providerId: string;
  if (take.externalId.includes("arn:aws:bedrock")) {
    providerId = "bedrock";
  } else {
    providerId = take.model?.split("/")[0] ?? "runway";
  }

  const provider = await getProvider(providerId);
  if (!provider) {
    take.status = "failed";
    take.notes = `Provider ${providerId} not available`;
    take.updatedAt = now();
    await writeStudio(state);
    revalidateAll(take.projectId);
    return take;
  }

  const result = await provider.poll(take.externalId);

  if (result.status === "completed" && result.outputUrl) {
    take.videoUrl = result.outputUrl;
    take.status = "ready";
  } else if (result.status === "completed" && !result.outputUrl) {
    // Some providers return inline video - not common with Runway
    take.status = "ready";
  } else if (result.status === "failed") {
    take.status = "failed";
    take.notes = result.error ?? "Generation failed";
  }
  // else still running - no change

  take.updatedAt = now();
  await writeStudio(state);
  revalidateAll(take.projectId);
  return take;
}

export async function updateTake(id: string, input: unknown) {
  await requireAdminAction();
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
  await requireAdminAction();
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
  await requireAdminAction();
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
  await requireAdminAction();
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
  await requireAdminAction();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  return uploadFile(file, "takes", ["mp4", "webm", "mov", "m4v"], 300 * 1024 * 1024);
}

export async function uploadShotReference(formData: FormData) {
  await requireAdminAction();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  return uploadFile(file, "shot-refs", ["png", "jpg", "jpeg", "webp"], 10 * 1024 * 1024);
}

export async function uploadProjectPoster(formData: FormData) {
  await requireAdminAction();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  return uploadFile(file, "posters", ["png", "jpg", "jpeg", "webp"], 10 * 1024 * 1024);
}

export async function uploadScriptFile(formData: FormData): Promise<string> {
  await requireAdminAction();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  return file.text();
}

/* ---- Modern provider-backed shot generation ---------------- */
/*  Bridges the Story Project to the new VideoProvider system   */
/*  (Runway / RunPod / Local NIM) with Brand-Lock + budget cap. */
/* ------------------------------------------------------------ */

import { submitVideoJob as submitProviderJob, pollVideoJob as pollProviderJob, listVideoJobs } from "@/lib/video/actions";
import { sumProjectSpend } from "@/lib/video/job-store";
import { assemblePrompt, buildAnchorsFromCharacters, getAnchorByValue, detectCharacterIds, SCENE_CONTEXTS } from "@/lib/ai/brand-bible";
import type { VideoTier } from "@/lib/video/schema";

type GenerateShotOptions = {
  tier?: VideoTier;
  providerId?: string;
  /** Target video model (kling/3.0, google/veo-3, pika/2.2, luma/dream-machine, runway/gen4) */
  targetModel?: string;
  characterAnchors?: string[];
};

/**
 * Generate a video clip for a single shot using the new VideoProvider
 * system (with Brand-Lock + budget cap). Creates a Take that mirrors the
 * VideoJob so existing UI stays compatible.
 */
export async function generateShotViaProvider(
  projectId: string,
  shotId: string,
  options: GenerateShotOptions = {},
) {
  await requireAdminAction();
  const state = await readStudio();
  const project = state.projects.find((p) => p.id === projectId);
  const shot = state.shots.find((s) => s.id === shotId);
  if (!project) throw new Error("Project not found");
  if (!shot) throw new Error("Shot not found");

  // Budget cap pre-check
  const budgetUsd = project.budgetUsd ?? 0;
  if (budgetUsd > 0) {
    const spent = await sumProjectSpend(projectId);
    if (spent >= budgetUsd) {
      throw new Error(`Project budget exceeded ($${spent.toFixed(2)} / $${budgetUsd.toFixed(2)})`);
    }
  }

  // Build a brand-locked prompt from shot description + character anchors
  const charState = await readCharacters();
  const anchorOpts = buildAnchorsFromCharacters(charState.characters);
  const selectedAnchors = (options.characterAnchors ?? [])
    .map((v) => getAnchorByValue(v, anchorOpts))
    .filter((a): a is NonNullable<typeof a> => !!a);

  const userPrompt = shot.prompt || `${shot.description}${shot.cameraNotes ? `\n${shot.cameraNotes}` : ""}`;
  const assembled = assemblePrompt({
    sceneContext: undefined,
    characterAnchors: selectedAnchors,
    userPrompt,
    includePalette: true,
    isVideo: true,
  });
  const finalPrompt = assembled || userPrompt;

  // Submit to provider
  const result = await submitProviderJob({
    providerId: options.providerId ?? (options.targetModel ? "fal" : undefined),
    tier: options.tier ?? "hero",
    projectId,
    shotId,
    prompt: finalPrompt,
    characterAnchors: options.characterAnchors ?? [],
    aspectRatio: project.aspectRatio || "16:9",
    durationSec: shot.durationSec || 5,
    targetModel: options.targetModel,
  });
  if (!result.ok) {
    throw new Error(result.error + (result.violations ? ` (${result.violations.map((v) => v.message).join("; ")})` : ""));
  }

  // Map provider id → Take.model enum (Take schema uses VideoModelSchema)
  const providerToModel: Record<string, "runway/gen4" | "kling/3.0" | "google/veo-3" | "pika/2.2" | "luma/dream-machine"> = {
    runway: "runway/gen4",
    runpod: "runway/gen4",
    "local-nim": "runway/gen4",
    fal: "kling/3.0", // default; overridden below if providerMeta.targetModel is set
  };
  // fal.ai routes to multiple models - use the explicit targetModel when set
  let resolvedModel = providerToModel[result.job.providerId] ?? "runway/gen4";
  const targetModel = result.job.providerMeta?.targetModel;
  if (typeof targetModel === "string" && ["kling/3.0", "google/veo-3", "pika/2.2", "luma/dream-machine"].includes(targetModel)) {
    resolvedModel = targetModel as typeof resolvedModel;
  }
  // Create a mirrored Take so the existing edit UI shows it
  const existingTakes = state.takes.filter((t) => t.shotId === shotId);
  const take: Take = {
    id: result.job.id, // share id with the VideoJob for easy lookup
    projectId,
    shotId,
    index: existingTakes.length + 1,
    model: resolvedModel,
    prompt: finalPrompt,
    externalId: result.job.providerJobId,
    seed: String(result.job.seed || ""),
    status: result.job.status === "completed" ? "ready" : "generating",
    videoUrl: result.job.outputUrl || "",
    thumbnailUrl: result.job.posterUrl || "",
    durationSec: result.job.durationSec,
    notes: "",
    createdAt: now(),
    updatedAt: now(),
  };
  state.takes.push(take);
  if (shot.status === "pending") shot.status = "prompted";
  shot.updatedAt = now();
  await writeStudio(state);
  revalidateAll(projectId);
  return { take, job: result.job };
}

/**
 * Sync a take with its underlying VideoJob - poll the provider and
 * persist the video URL when ready.
 */
export async function syncTakeFromProvider(takeId: string) {
  await requireAdminAction();
  const state = await readStudio();
  const take = state.takes.find((t) => t.id === takeId);
  if (!take) throw new Error("Take not found");
  const job = await pollProviderJob(takeId);
  if (!job) return take;

  if (job.status === "completed") {
    take.status = "ready";
    take.videoUrl = job.outputUrl;
    if (job.posterUrl) take.thumbnailUrl = job.posterUrl;
  } else if (job.status === "failed") {
    take.status = "failed";
    take.notes = job.error || "Provider error";
  } else if (job.status === "canceled") {
    take.status = "failed";
    take.notes = "Cancelled";
  }
  take.updatedAt = now();
  await writeStudio(state);
  revalidateAll(take.projectId);
  return take;
}

/**
 * Submit video jobs for every pending shot in a project.
 * Returns a summary of submitted / skipped / failed shots.
 */
export async function generateAllPendingShots(
  projectId: string,
  options: GenerateShotOptions = {},
) {
  await requireAdminAction();
  const state = await readStudio();
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) throw new Error("Project not found");
  const pending = state.shots
    .filter((s) => s.projectId === projectId && (s.status === "pending" || s.status === "prompted"))
    .sort((a, b) => a.sort - b.sort);

  const submitted: string[] = [];
  const failed: { shotId: string; error: string }[] = [];

  for (const shot of pending) {
    try {
      const { take } = await generateShotViaProvider(projectId, shot.id, options);
      submitted.push(take.id);
    } catch (e) {
      failed.push({ shotId: shot.id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return { submitted: submitted.length, failed, total: pending.length };
}

/**
 * Get the live status of all video jobs for a project.
 * Used by the project edit UI to refresh take status.
 */
export async function getProjectJobs(projectId: string) {
  await requireAdminAction();
  return listVideoJobs({ projectId, limit: 200 });
}

/* ---- Keyframe generation ----------------------------------- */
/*  Produces a 1280x720 brand-locked still for a Shot. Approval  */
/*  is a separate human action - this only writes keyframeUrl    */
/*  and keyframeSeed. The "approved" gate uses keyframeApprovedAt */
/*  which must be set by the user via the approval action.       */
/* ------------------------------------------------------------ */

type GenerateKeyframeOptions = {
  model?: import("@/lib/nvidia/client").NvidiaImageModelId;
  characterAnchors?: string[];
  seed?: number;
};

/**
 * Shared prompt-building pipeline used by both keyframe generation AND
 * the live preview UI. Returns the assembled brand-locked prompt plus
 * a structured breakdown of what was injected.
 */
export type ShotPromptBreakdown = {
  /** Final assembled prompt (verbose, pre-condense) */
  assembled: string;
  /** SD1.5-condensed version (positive, what ComfyUI actually sees) */
  condensedPositive: string;
  condensedNegative: string;
  /** Detected character anchors */
  anchors: {
    value: string;
    label: string;
    modeLabel: string;
    referenceImage: string;
  }[];
  /** Detected scene context */
  sceneContext: {
    value: string;
    label: string;
    mood: string;
    paletteFocus: string[];
  } | null;
  /** What got injected (checklist) */
  injected: {
    character: boolean;
    sceneMood: boolean;
    palette: boolean;
    plaid: boolean;
    negatives: boolean;
  };
};

export async function buildShotPrompt(
  shotId: string,
  options: { characterAnchors?: string[] } = {},
): Promise<ShotPromptBreakdown> {
  await requireAdminAction();
  const state = await readStudio();
  const shot = state.shots.find((s) => s.id === shotId);
  if (!shot) throw new Error("Shot not found");

  const charState = await readCharacters();
  const anchorOpts = buildAnchorsFromCharacters(charState.characters);

  // Auto-detect from shot text when caller passes empty.
  let anchorIds = options.characterAnchors ?? [];
  if (anchorIds.length === 0) {
    const text = `${shot.description} ${shot.prompt}`;
    anchorIds = detectCharacterIds(text, charState.characters);
  }

  const selectedAnchors = anchorIds
    .map((v) => getAnchorByValue(v, anchorOpts))
    .filter((a): a is NonNullable<typeof a> => !!a);

  const scene = state.scenes.find((s) => s.id === shot.sceneId);
  const sceneNum = scene ? Number(scene.number) : 0;
  const sceneCtxValue = sceneNum > 0
    ? SCENE_CONTEXTS.find((sc) => sc.value.includes(`scene_${sceneNum}`))
    : undefined;

  const userPrompt = shot.prompt || `${shot.description}${shot.cameraNotes ? `\n${shot.cameraNotes}` : ""}`;
  const assembled = assemblePrompt({
    sceneContext: sceneCtxValue,
    characterAnchors: selectedAnchors,
    userPrompt,
    includePalette: true,
    isVideo: false,
  });
  const finalPrompt = assembled || userPrompt;

  // Get the actual condensed form (what the model will see)
  const { condenseForSD15 } = await import("@/lib/comfy/client");
  const condensed = condenseForSD15(finalPrompt);

  const needsPlaid =
    selectedAnchors.some((a) => a.alsoInjectsPlaid) ||
    sceneCtxValue?.value === "packaging_shot" ||
    (sceneCtxValue?.patternUsage !== undefined && sceneCtxValue?.patternUsage !== "none");

  return {
    assembled: finalPrompt,
    condensedPositive: condensed.positive,
    condensedNegative: condensed.negative,
    anchors: selectedAnchors.map((a) => ({
      value: a.value,
      label: a.label,
      modeLabel: a.modeLabel,
      referenceImage: a.referenceImage ?? "",
    })),
    sceneContext: sceneCtxValue
      ? {
          value: sceneCtxValue.value,
          label: sceneCtxValue.label,
          mood: sceneCtxValue.mood,
          paletteFocus: sceneCtxValue.paletteFocus,
        }
      : null,
    injected: {
      character: selectedAnchors.length > 0,
      sceneMood: !!sceneCtxValue,
      palette: true,
      plaid: needsPlaid,
      negatives: selectedAnchors.some((a) => a.doNots.length > 0),
    },
  };
}

/** Server action wrapper for client UI use */
export async function previewShotPrompt(
  shotId: string,
  characterAnchors?: string[],
): Promise<ShotPromptBreakdown> {
  await requireAdminAction();
  return buildShotPrompt(shotId, { characterAnchors });
}

export async function generateShotKeyframe(
  projectId: string,
  shotId: string,
  options: GenerateKeyframeOptions = {},
) {
  await requireAdminAction();
  const state = await readStudio();
  const project = state.projects.find((p) => p.id === projectId);
  const shot = state.shots.find((s) => s.id === shotId);
  if (!project) throw new Error("Project not found");
  if (!shot) throw new Error("Shot not found");

  // Build brand-locked prompt via shared pipeline
  const breakdown = await buildShotPrompt(shotId, {
    characterAnchors: options.characterAnchors,
  });
  const finalPrompt = breakdown.assembled;

  const startedAt = Date.now();
  const { generateImage } = await import("@/lib/nvidia/client");
  const { generateImageComfy, isComfyConfigured } = await import("@/lib/comfy/client");
  const { saveGeneratedImage } = await import("@/lib/generations/actions");
  const { recordGeneration } = await import("@/lib/generations/actions");

  const seed = options.seed ?? Math.floor(Math.random() * 2_000_000_000);
  const model = options.model ?? "black-forest-labs/flux.1-schnell";

  // FLUX cloud only accepts width/height from {768,832,896,960,1024,1088,
  // 1152,1216,1280,1344}. 1344x768 is the closest valid widescreen frame
  // (7:4 ≈ 1.75, vs true 16:9 = 1.778). The downstream motion model (when
  // re-enabled) will letterbox/crop as needed.
  const width = 1344;
  const height = 768;

  // Primary path: local ComfyUI (when configured). Falls back to NVIDIA
  // cloud on any error so a stopped Comfy server doesn't block generation.
  let result: { image: string; contentType: string; seed: number };
  let providerUsed: string = model;
  if (isComfyConfigured()) {
    try {
      result = await generateImageComfy({ prompt: finalPrompt, width, height, seed });
      providerUsed = "comfyui";
    } catch (err) {
      console.warn("[keyframe] ComfyUI failed, falling back to NVIDIA:", err instanceof Error ? err.message : err);
      result = await generateImage({ model, prompt: finalPrompt, width, height, seed });
    }
  } else {
    result = await generateImage({ model, prompt: finalPrompt, width, height, seed });
  }

  // Save base64 → public/uploads/generations/<slug>.png (Supabase on prod)
  const ext = result.contentType.includes("png") ? "png" : "jpg";
  const outputPath = await saveGeneratedImage(result.image, ext);

  // Re-read state (image gen can take 60-180s - avoid stale write)
  const fresh = await readStudio();
  const freshShot = fresh.shots.find((s) => s.id === shotId);
  if (!freshShot) throw new Error("Shot disappeared during keyframe gen");

  // Push current keyframe into history before overwriting (if one existed)
  if (freshShot.keyframeUrl) {
    const prev = {
      url: freshShot.keyframeUrl,
      seed: freshShot.keyframeSeed,
      model: providerUsed,
      createdAt: freshShot.updatedAt || now(),
    };
    if (!freshShot.keyframeHistory) freshShot.keyframeHistory = [];
    freshShot.keyframeHistory.unshift(prev);
    // Keep max 20 entries per shot
    if (freshShot.keyframeHistory.length > 20) {
      freshShot.keyframeHistory = freshShot.keyframeHistory.slice(0, 20);
    }
  }

  freshShot.keyframeUrl = outputPath;
  freshShot.keyframeSeed = result.seed || seed;
  // Re-generating invalidates any prior approval
  freshShot.keyframeApprovedAt = "";
  freshShot.updatedAt = now();
  await writeStudio(fresh);

  // Non-fatal - still return the keyframe even if history save fails
  try {
    await recordGeneration({
      type: "image",
      model: providerUsed,
      prompt: finalPrompt,
      aspect: "16:9",
      status: "completed",
      elapsedMs: Date.now() - startedAt,
      outputPath,
      characterAnchor: (options.characterAnchors ?? []).join(","),
    });
  } catch (saveErr) {
    console.error("[generateShotKeyframe] history save failed:", saveErr instanceof Error ? saveErr.message : saveErr);
  }

  revalidateAll(projectId);
  return { keyframeUrl: outputPath, seed: result.seed || seed };
}

/* ---- Export for DaVinci Resolve ------------------------------ */

export type ResolveExportClip = {
  shotNumber: string;
  sceneName: string;
  description: string;
  videoUrl: string;
  keyframeUrl: string;
  durationSec: number;
  model: string;
  audio?: {
    voLine: string;
    voice: string;
    sfxCue: string;
  };
};

export type ResolveExportManifest = {
  projectTitle: string;
  aspectRatio: string;
  targetDurationSec: number;
  exportedAt: string;
  clips: ResolveExportClip[];
};

/**
 * Export all approved shots for a project as a DaVinci Resolve-ready manifest.
 * Returns a structured JSON manifest with all video URLs in shot order,
 * plus keyframes, audio cues, and metadata for timeline assembly.
 */
export async function exportForResolve(projectId: string): Promise<ResolveExportManifest> {
  await requireAdminAction();
  const state = await readStudio();
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) throw new Error("Project not found");

  const scenes = state.scenes.filter((s) => s.projectId === projectId);
  const shots = state.shots.filter((s) => s.projectId === projectId);

  // Build ordered clip list from approved takes
  const clips: ResolveExportClip[] = [];

  for (const shot of shots.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))) {
    const approvedTake = shot.approvedTakeId
      ? state.takes.find((t) => t.id === shot.approvedTakeId)
      : undefined;

    // Only include shots with approved takes or ready videos
    if (!approvedTake?.videoUrl) continue;

    const scene = scenes.find((s) => s.id === shot.sceneId);

    clips.push({
      shotNumber: shot.number,
      sceneName: scene?.heading || `Scene ${shot.sceneId}`,
      description: shot.description,
      videoUrl: approvedTake.videoUrl,
      keyframeUrl: shot.keyframeUrl || "",
      durationSec: approvedTake.durationSec || shot.durationSec || 5,
      model: approvedTake.model,
      audio: shot.audio?.voLine
        ? {
            voLine: shot.audio.voLine,
            voice: shot.audio.voice || "",
            sfxCue: shot.audio.sfxCue || "",
          }
        : undefined,
    });
  }

  return {
    projectTitle: project.title,
    aspectRatio: project.aspectRatio || "16:9",
    targetDurationSec: project.targetDurationSec || 0,
    exportedAt: now(),
    clips,
  };
}

/**
 * Mark a Shot's keyframe as approved (human-in-the-loop gate).
 * After approval, hero motion jobs for this shot may proceed.
 */
export async function approveShotKeyframe(projectId: string, shotId: string) {
  await requireAdminAction();
  const state = await readStudio();
  const shot = state.shots.find((s) => s.id === shotId);
  if (!shot) throw new Error("Shot not found");
  if (!shot.keyframeUrl) throw new Error("Cannot approve - no keyframe generated yet");
  shot.keyframeApprovedAt = now();
  shot.updatedAt = now();
  await writeStudio(state);
  revalidateAll(projectId);
  return { approvedAt: shot.keyframeApprovedAt };
}

/**
 * Select a keyframe from the shot's history and make it the active keyframe.
 * The current keyframe is pushed into history in its place.
 */
export async function selectKeyframeFromHistory(
  projectId: string,
  shotId: string,
  historyIndex: number,
) {
  await requireAdminAction();
  const state = await readStudio();
  const shot = state.shots.find((s) => s.id === shotId);
  if (!shot) throw new Error("Shot not found");
  if (!shot.keyframeHistory?.[historyIndex]) throw new Error("History entry not found");

  const selected = shot.keyframeHistory[historyIndex];

  // Push current active keyframe into history (in place of selected)
  if (shot.keyframeUrl) {
    shot.keyframeHistory[historyIndex] = {
      url: shot.keyframeUrl,
      seed: shot.keyframeSeed,
      model: "",
      createdAt: shot.updatedAt || now(),
    };
  } else {
    // No current keyframe - just remove the selected entry from history
    shot.keyframeHistory.splice(historyIndex, 1);
  }

  shot.keyframeUrl = selected.url;
  shot.keyframeSeed = selected.seed;
  shot.keyframeApprovedAt = ""; // selecting invalidates prior approval
  shot.updatedAt = now();
  await writeStudio(state);
  revalidateAll(projectId);
  return { keyframeUrl: shot.keyframeUrl, seed: shot.keyframeSeed };
}

/**
 * Upload an externally-created keyframe image (e.g. from ChatGPT, Midjourney,
 * or any external tool) and set it as the shot's active keyframe.
 * Pushes the current keyframe into history before overwriting.
 */
export async function uploadShotKeyframe(
  projectId: string,
  shotId: string,
  formData: FormData,
): Promise<{ keyframeUrl: string }> {
  await requireAdminAction();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  if (!file.type.startsWith("image/")) throw new Error("Must be an image file");

  // Upload and read state in parallel - they're independent
  const [url, state] = await Promise.all([
    uploadFile(file, "keyframes", ["png", "jpg", "jpeg", "webp"], 10 * 1024 * 1024),
    readStudio(),
  ]);

  const shot = state.shots.find((s) => s.id === shotId);
  if (!shot) throw new Error("Shot not found");

  // Push current keyframe into history before overwriting
  if (shot.keyframeUrl) {
    const prev = {
      url: shot.keyframeUrl,
      seed: shot.keyframeSeed,
      model: "upload",
      createdAt: shot.updatedAt || now(),
    };
    if (!shot.keyframeHistory) shot.keyframeHistory = [];
    shot.keyframeHistory.unshift(prev);
    if (shot.keyframeHistory.length > 20) {
      shot.keyframeHistory = shot.keyframeHistory.slice(0, 20);
    }
  }

  shot.keyframeUrl = url;
  shot.keyframeSeed = 0;
  shot.keyframeApprovedAt = ""; // new upload invalidates prior approval
  shot.updatedAt = now();
  await writeStudio(state);
  revalidateAll(projectId);
  return { keyframeUrl: url };
}
