import { z } from "zod";

/* -------------------------------------------------------------- */
/*  Video Generation - provider-agnostic types                     */
/* -------------------------------------------------------------- */

export const VideoJobStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
  "canceled",
]);
export type VideoJobStatus = z.infer<typeof VideoJobStatusSchema>;

/** Quality tier - drives default provider selection */
export const VideoTierSchema = z.enum(["hero", "draft"]);
export type VideoTier = z.infer<typeof VideoTierSchema>;

export const VideoJobSchema = z.object({
  id: z.string(),
  /** Provider ID - "runway" | "runpod" | "local-nim" */
  providerId: z.string(),
  /** Provider's own job/task ID (used for polling) */
  providerJobId: z.string().default(""),
  /** Quality tier requested */
  tier: VideoTierSchema.default("hero"),
  /** Optional link to a Story Project */
  projectId: z.string().default(""),
  shotId: z.string().default(""),
  takeId: z.string().default(""),
  /** Final assembled prompt (already brand-locked via assemblePrompt) */
  prompt: z.string(),
  /** Negative prompt - joined do_nots from selected characters */
  negativePrompt: z.string().default(""),
  /** Character anchor values used (chr_xyz) */
  characterAnchors: z.array(z.string()).default([]),
  /** Reference image URLs auto-attached for img-to-vid providers */
  referenceImageUrls: z.array(z.string()).default([]),
  /** Optional initial frame URL (img-to-vid) */
  imageUrl: z.string().default(""),
  aspectRatio: z.string().default("16:9"),
  durationSec: z.coerce.number().int().min(1).max(60).default(5),
  seed: z.number().int().default(0),
  status: VideoJobStatusSchema.default("queued"),
  /** Public URL of the generated MP4 once complete */
  outputUrl: z.string().default(""),
  /** Optional cover image (first frame) */
  posterUrl: z.string().default(""),
  /** Estimated cost (set at submit time) */
  estimatedCostUsd: z.number().default(0),
  /** Actual cost (set at completion - may differ if provider charges per-second) */
  actualCostUsd: z.number().default(0),
  error: z.string().default(""),
  /** Free-form provider metadata (job logs, model version, etc.) */
  providerMeta: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type VideoJob = z.infer<typeof VideoJobSchema>;

/** Input shape for submitting a new video job */
export const VideoJobInputSchema = z.object({
  providerId: z.string().optional(),
  tier: VideoTierSchema.default("hero"),
  projectId: z.string().default(""),
  shotId: z.string().default(""),
  prompt: z.string().min(10, "Prompt too short"),
  negativePrompt: z.string().default(""),
  characterAnchors: z.array(z.string()).default([]),
  referenceImageUrls: z.array(z.string()).default([]),
  imageUrl: z.string().default(""),
  aspectRatio: z.string().default("16:9"),
  durationSec: z.coerce.number().int().min(1).max(60).default(5),
  seed: z.number().int().default(0),
  /** Target model hint for multi-model providers like fal.ai */
  targetModel: z.string().optional(),
});
export type VideoJobInput = z.infer<typeof VideoJobInputSchema>;

export const VideoJobStateSchema = z.object({
  version: z.number().int().default(1),
  jobs: z.array(VideoJobSchema).default([]),
});
export type VideoJobState = z.infer<typeof VideoJobStateSchema>;
