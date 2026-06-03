import { z } from "zod";

/* -------------------------------------------------------------- */
/*  Video Generation Studio - domain                              */
/*  Project → Scene → Shot → Take                                 */
/* -------------------------------------------------------------- */

/* ---- Project ------------------------------------------------- */

export const ProjectStatusSchema = z.enum([
  "concept",
  "scripting",
  "generating",
  "editing",
  "delivered",
]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; tone: "neutral" | "info" | "warning" | "success" }
> = {
  concept: { label: "Concept", tone: "neutral" },
  scripting: { label: "Scripting", tone: "info" },
  generating: { label: "Generating", tone: "warning" },
  editing: { label: "Editing", tone: "warning" },
  delivered: { label: "Delivered", tone: "success" },
};

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Required"),
  /** One-line tagline / pitch */
  logline: z.string().default(""),
  /** Long-form synopsis */
  synopsis: z.string().default(""),
  status: ProjectStatusSchema.default("concept"),
  /** Markdown script - source of truth */
  script: z.string().default(""),
  /** Path to original .md script file under repo (if uploaded) */
  scriptSourcePath: z.string().default(""),
  /** Target final runtime (seconds) */
  targetDurationSec: z.coerce.number().int().min(0).default(0),
  /** "16:9" | "9:16" | "1:1" | "2.39:1" */
  aspectRatio: z.string().default("2.39:1"),
  /** Default model preference */
  defaultModel: z.string().default("runway/gen4"),
  /** Free-form style notes appended to every prompt */
  styleSuffix: z.string().default(""),
  posterUrl: z.string().default(""),
  /** Master assembled cut */
  masterCutUrl: z.string().default(""),
  /** Hard cost cap for video generation across this project (USD). 0 = unlimited. */
  budgetUsd: z.coerce.number().min(0).default(0),
  /** Running total of estimated spend (USD). Updated on each successful job submission. */
  spentUsd: z.coerce.number().min(0).default(0),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

/* ---- Scene --------------------------------------------------- */

export const SceneSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  number: z.coerce.number().int().min(1),
  heading: z.string().default(""),
  summary: z.string().default(""),
  scriptExcerpt: z.string().default(""),
  sort: z.coerce.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Scene = z.infer<typeof SceneSchema>;

/* ---- Shot ---------------------------------------------------- */

export const ShotTypeSchema = z.enum([
  "wide",
  "medium",
  "close-up",
  "insert",
  "aerial",
  "ots",
  "tracking",
  "macro",
]);
export type ShotType = z.infer<typeof ShotTypeSchema>;

export const SHOT_TYPE_META: Record<ShotType, { label: string }> = {
  wide: { label: "Wide" },
  medium: { label: "Medium" },
  "close-up": { label: "Close-up" },
  insert: { label: "Insert" },
  aerial: { label: "Aerial" },
  ots: { label: "OTS" },
  tracking: { label: "Tracking" },
  macro: { label: "Macro" },
};

export const ShotStatusSchema = z.enum([
  "pending",
  "prompted",
  "keyframed",
  "approved",
  "blocked",
]);
export type ShotStatus = z.infer<typeof ShotStatusSchema>;

export const SHOT_STATUS_META: Record<
  ShotStatus,
  { label: string; tone: "neutral" | "info" | "success" | "danger" }
> = {
  pending: { label: "Pending", tone: "neutral" },
  prompted: { label: "Prompted", tone: "info" },
  keyframed: { label: "Keyframed", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  blocked: { label: "Blocked", tone: "danger" },
};

export const ShotSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  sceneId: z.string(),
  number: z.string().default(""),
  type: ShotTypeSchema.default("medium"),
  durationSec: z.coerce.number().int().min(0).default(4),
  description: z.string().default(""),
  dialogue: z.string().default(""),
  cameraNotes: z.string().default(""),
  prompt: z.string().default(""),
  referenceUrls: z.array(z.string()).default([]),
  status: ShotStatusSchema.default("pending"),
  approvedTakeId: z.string().default(""),
  sort: z.coerce.number().int().default(0),
  /**
   * Locked 1280x720 starting keyframe (image-to-video source).
   * Public URL under /uploads/keyframes/. When set, motion jobs feed it
   * as the start frame to lock character identity for the 6s clip.
   */
  keyframeUrl: z.string().default(""),
  /** ISO timestamp when a human approved the keyframe (gate for motion). */
  keyframeApprovedAt: z.string().default(""),
  /** Seed used to generate the locked keyframe - for re-rolls. */
  keyframeSeed: z.coerce.number().int().default(0),
  /** History of previously generated keyframes for this shot (newest first). */
  keyframeHistory: z
    .array(
      z.object({
        url: z.string(),
        seed: z.coerce.number().int().default(0),
        model: z.string().default(""),
        createdAt: z.string(),
      }),
    )
    .default([]),
  /**
   * Audio plan for this shot. Captures the VO line, chosen voice, and SFX cue
   * before they are rendered by ElevenLabs / SFX provider in PR 3c.
   */
  audio: z
    .object({
      voLine: z.string().default(""),
      voice: z.string().default(""),
      sfxCue: z.string().default(""),
      voUrl: z.string().default(""),
      sfxUrl: z.string().default(""),
    })
    .default({ voLine: "", voice: "", sfxCue: "", voUrl: "", sfxUrl: "" }),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Shot = z.infer<typeof ShotSchema>;

/* ---- Take ---------------------------------------------------- */

export const VideoModelSchema = z.enum([
  "runway/gen4",
  "kling/3.0",
  "google/veo-3",
  "pika/2.2",
  "luma/dream-machine",
]);
export type VideoModel = z.infer<typeof VideoModelSchema>;

export const MODEL_META: Record<
  VideoModel,
  { label: string; vendor: string; color: string }
> = {
  "runway/gen4":    { label: "Runway Gen-4",        vendor: "Runway",       color: "#7C3AED" },
  "kling/3.0":      { label: "Kling 3.0",           vendor: "Kling AI",     color: "#0EA5E9" },
  "google/veo-3":   { label: "Google Veo 3.1",      vendor: "Google",       color: "#1B9B00" },
  "pika/2.2":       { label: "Pika 2.2",            vendor: "Pika",         color: "#F59E0B" },
  "luma/dream-machine": { label: "Luma Dream Machine", vendor: "Luma AI",   color: "#E11D48" },
};

export const TakeStatusSchema = z.enum([
  "queued",
  "generating",
  "ready",
  "failed",
  "approved",
]);
export type TakeStatus = z.infer<typeof TakeStatusSchema>;

export const TAKE_STATUS_META: Record<
  TakeStatus,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  queued: { label: "Queued", tone: "neutral" },
  generating: { label: "Generating", tone: "warning" },
  ready: { label: "Ready", tone: "info" },
  failed: { label: "Failed", tone: "danger" },
  approved: { label: "Approved", tone: "success" },
};

export const BrandLockCheckSchema = z.object({
  character: z.boolean().default(false),
  sceneMood: z.boolean().default(false),
  palette: z.boolean().default(false),
  plaid: z.boolean().default(false),
  negatives: z.boolean().default(false),
});
export type BrandLockCheck = z.infer<typeof BrandLockCheckSchema>;

export const TakeSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  shotId: z.string(),
  index: z.coerce.number().int().min(1),
  model: VideoModelSchema.catch("runway/gen4"),
  prompt: z.string().default(""),
  externalId: z.string().default(""),
  seed: z.string().default(""),
  status: TakeStatusSchema.default("queued"),
  videoUrl: z.string().default(""),
  thumbnailUrl: z.string().default(""),
  durationSec: z.coerce.number().int().min(0).default(0),
  notes: z.string().default(""),
  /** Brand-lock injection audit - which elements were present in the prompt */
  brandLock: BrandLockCheckSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Take = z.infer<typeof TakeSchema>;

/* ---- Aggregate state ---------------------------------------- */

export const StudioStateSchema = z.object({
  version: z.number().int().default(2),
  projects: z.array(ProjectSchema).default([]),
  scenes: z.array(SceneSchema).default([]),
  shots: z.array(ShotSchema).default([]),
  takes: z.array(TakeSchema).default([]),
});
export type StudioState = z.infer<typeof StudioStateSchema>;

/* ---- Inputs ------------------------------------------------- */

export const ProjectInputSchema = z.object({
  title: z.string().min(1, "Required"),
  logline: z.string(),
  synopsis: z.string(),
  status: ProjectStatusSchema,
  script: z.string(),
  scriptSourcePath: z.string(),
  targetDurationSec: z.coerce.number().int().min(0),
  aspectRatio: z.string(),
  defaultModel: z.string(),
  styleSuffix: z.string(),
  posterUrl: z.string(),
  masterCutUrl: z.string(),
  budgetUsd: z.coerce.number().min(0).default(0),
  tags: z.array(z.string()),
});
export type ProjectInput = z.output<typeof ProjectInputSchema>;
export type ProjectInputRaw = z.input<typeof ProjectInputSchema>;

export const SceneInputSchema = SceneSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type SceneInput = z.output<typeof SceneInputSchema>;
export type SceneInputRaw = z.input<typeof SceneInputSchema>;

export const ShotInputSchema = ShotSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type ShotInput = z.output<typeof ShotInputSchema>;
export type ShotInputRaw = z.input<typeof ShotInputSchema>;

export const TakeInputSchema = TakeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type TakeInput = z.output<typeof TakeInputSchema>;
export type TakeInputRaw = z.input<typeof TakeInputSchema>;
