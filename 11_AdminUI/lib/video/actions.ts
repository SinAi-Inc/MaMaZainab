"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { readCharacters } from "@/lib/characters/store";
import { VideoJobInputSchema, type VideoJob, type VideoJobInput } from "./schema";
import { upsertJob, getJob, listJobs, deleteJob, sumProjectSpend } from "./job-store";
import { pickProvider, getProvider } from "./provider";
import { checkBrandLock, buildNegativePrompt, autoExpandAnchors, checkKeyframeGate } from "./brand-lock";
import { estimateVideoCost } from "./cost";
import { recordGeneration } from "@/lib/generations/actions";
import { requireAdminAction } from "@/lib/server-action-auth";

const now = () => new Date().toISOString();

export type SubmitJobResult =
  | { ok: true; job: VideoJob }
  | { ok: false; error: string; violations?: { type: string; message: string }[] };

/**
 * Submit a new video generation job.
 * - Resolves the best provider based on tier + capabilities (or user pick)
 * - Runs Brand-Lock pre-flight (blocks off-brand prompts)
 * - Auto-attaches character reference images
 * - Auto-builds negative prompt from selected characters' donts[]
 * - Stores the job, calls provider.submit(), returns the job record
 */
export async function submitVideoJob(input: unknown): Promise<SubmitJobResult> {
  await requireAdminAction();
  let parsed: VideoJobInput;
  try {
    parsed = VideoJobInputSchema.parse(input);
  } catch (e) {
    return { ok: false, error: e instanceof z.ZodError ? e.issues.map((i) => i.message).join("; ") : String(e) };
  }

  // Pick provider
  const provider = await pickProvider(parsed);
  if (!provider) {
    return {
      ok: false,
      error:
        "No video provider is configured. Set RUNWAY_API_KEY, RUNPOD_API_KEY + RUNPOD_WAN_ENDPOINT_ID, or NVIDIA_NIM_BASE_URL in .env.local.",
    };
  }

  // Brand-Lock pre-flight
  const { characters } = await readCharacters();
  // Auto-expand anchors: if CAST_RULES or user text mentions a character
  // that isn't explicitly anchored, add it so brand-lock passes and the
  // reference image is attached automatically.
  const characterAnchors = autoExpandAnchors(parsed.prompt, parsed.characterAnchors, characters);
  const lock = checkBrandLock(parsed.prompt, characterAnchors, characters);
  if (!lock.ok) {
    return {
      ok: false,
      error: "Brand-Lock violations - fix before submitting.",
      violations: lock.violations.map((v) => ({ type: v.type, message: v.message })),
    };
  }

  // Keyframe gate: hero motion linked to a Shot must have an approved 1280x720
  // keyframe. This is the structural defense against character drift across
  // multi-shot films. Also auto-populates job.imageUrl from the shot when
  // not explicitly provided, so callers don't have to duplicate the URL.
  let resolvedImageUrl = parsed.imageUrl;
  if (parsed.shotId) {
    try {
      const { readStudio } = await import("@/lib/videos/store");
      const studio = await readStudio();
      const shot = studio.shots.find((s) => s.id === parsed.shotId);
      const keyViolations = checkKeyframeGate({ tier: parsed.tier, shot });
      if (keyViolations.length > 0) {
        return {
          ok: false,
          error: "Keyframe gate - generate and approve a keyframe before motion.",
          violations: keyViolations.map((v) => ({ type: v.type, message: v.message })),
        };
      }
      if (!resolvedImageUrl && shot?.keyframeUrl) {
        resolvedImageUrl = shot.keyframeUrl;
      }
    } catch {
      // Studio store unavailable - keyframe gate is best-effort
    }
  }

  // Auto-attach character reference images if provider supports them
  let referenceImageUrls = parsed.referenceImageUrls;
  if (provider.capabilities.characterRefs && referenceImageUrls.length === 0) {
    referenceImageUrls = characterAnchors
      .map((anchorId) => {
        const baseId = characters.find((c) => anchorId === c.id || anchorId.startsWith(`${c.id}_`))?.id;
        const c = characters.find((x) => x.id === baseId);
        if (!c) return undefined;
        const ref = c.referenceImages.find((r) => r.isPrimary)?.url ?? c.referenceImages[0]?.url;
        return ref;
      })
      .filter((u): u is string => !!u);
  }

  // Auto-build negative prompt if not provided
  const negativePrompt = parsed.negativePrompt || buildNegativePrompt(characterAnchors, characters);

  // Cost estimate
  const cost = estimateVideoCost(provider.id, parsed.durationSec);

  // Project budget enforcement (only if a project is associated and has a budget)
  if (parsed.projectId) {
    try {
      const { readStudio } = await import("@/lib/videos/store");
      const studio = await readStudio();
      const project = studio.projects.find((p) => p.id === parsed.projectId);
      const budgetUsd = project?.budgetUsd ?? 0;
      if (budgetUsd > 0) {
        const spent = await sumProjectSpend(parsed.projectId);
        if (spent + cost.estimatedUsd > budgetUsd) {
          return {
            ok: false,
            error: `Project budget would be exceeded: $${(spent + cost.estimatedUsd).toFixed(2)} > $${budgetUsd.toFixed(2)}`,
          };
        }
      }
    } catch {
      // Budget check is best-effort; don't block submission if studio store is unavailable
    }
  }

  // Build the job record
  const job: VideoJob = {
    id: `vid_${nanoid(10)}`,
    providerId: provider.id,
    providerJobId: "",
    tier: parsed.tier,
    projectId: parsed.projectId,
    shotId: parsed.shotId,
    takeId: "",
    prompt: parsed.prompt,
    negativePrompt,
    characterAnchors,
    referenceImageUrls,
    imageUrl: resolvedImageUrl,
    aspectRatio: parsed.aspectRatio,
    durationSec: parsed.durationSec,
    seed: parsed.seed,
    status: "queued",
    outputUrl: "",
    posterUrl: "",
    estimatedCostUsd: cost.estimatedUsd,
    actualCostUsd: 0,
    error: "",
    providerMeta: parsed.targetModel ? { targetModel: parsed.targetModel } : {},
    createdAt: now(),
    updatedAt: now(),
  };

  // Submit to provider
  try {
    const result = await provider.submit(job);
    job.providerJobId = result.providerJobId;
    job.status = result.status === "completed" ? "completed" : result.status === "failed" ? "failed" : "running";
    if (result.outputUrl) job.outputUrl = result.outputUrl;
    if (result.posterUrl) job.posterUrl = result.posterUrl;
    if (result.meta) job.providerMeta = result.meta;
  } catch (e) {
    job.status = "failed";
    job.error = e instanceof Error ? e.message : String(e);
  }

  await upsertJob(job);
  revalidatePath("/ai");
  if (job.projectId) revalidatePath(`/videos/${job.projectId}`);

  // Record in unified generations history (gallery shows images + videos together)
  await recordGeneration({
    type: "video",
    model: provider.id,
    prompt: job.prompt,
    characterAnchor: job.characterAnchors.join(","),
    aspect: job.aspectRatio,
    duration: job.durationSec,
    outputPath: job.outputUrl,
    status: job.status === "completed" ? "completed" : job.status === "failed" ? "failed" : "pending",
    error: job.error,
    costUsd: job.estimatedCostUsd,
  }).catch(() => {});

  return { ok: true, job };
}

/**
 * Poll a job - checks the provider and updates persisted state.
 * Called by the UI on a setInterval.
 */
export async function pollVideoJob(id: string): Promise<VideoJob | null> {
  await requireAdminAction();
  const job = await getJob(id);
  if (!job) return null;
  if (job.status === "completed" || job.status === "failed" || job.status === "canceled") {
    return job;
  }

  const provider = await getProvider(job.providerId);
  if (!provider) return job;

  try {
    const result = await provider.poll(job.providerJobId, job);
    job.status = result.status;
    if (result.outputUrl) job.outputUrl = result.outputUrl;
    if (result.posterUrl) job.posterUrl = result.posterUrl;
    if (result.error) job.error = result.error;
    if (typeof result.actualCostUsd === "number") job.actualCostUsd = result.actualCostUsd;
    job.updatedAt = now();
    await upsertJob(job);
  } catch (e) {
    job.status = "failed";
    job.error = e instanceof Error ? e.message : String(e);
    job.updatedAt = now();
    await upsertJob(job);
  }

  return job;
}

export async function cancelVideoJob(id: string): Promise<VideoJob | null> {
  await requireAdminAction();
  const job = await getJob(id);
  if (!job) return null;
  const provider = await getProvider(job.providerId);
  if (provider?.cancel) {
    try {
      await provider.cancel(job.providerJobId);
    } catch {
      /* best-effort */
    }
  }
  job.status = "canceled";
  job.updatedAt = now();
  await upsertJob(job);
  revalidatePath("/ai");
  return job;
}

export async function deleteVideoJob(id: string): Promise<void> {
  await requireAdminAction();
  await deleteJob(id);
  revalidatePath("/ai");
}

export async function listVideoJobs(filter?: {
  projectId?: string;
  shotId?: string;
  limit?: number;
}): Promise<VideoJob[]> {
  await requireAdminAction();
  return listJobs(filter);
}

export async function getProjectSpend(projectId: string): Promise<number> {
  await requireAdminAction();
  return sumProjectSpend(projectId);
}
