import { z } from "zod";

export const GenerationEntrySchema = z.object({
  id: z.string(),
  /** "image" | "video" */
  type: z.enum(["image", "video"]),
  /** Model ID used (e.g. "black-forest-labs/flux.1-dev") */
  model: z.string(),
  /** The full assembled prompt sent to the API */
  prompt: z.string(),
  /** Character anchor value used (if any) */
  characterAnchor: z.string().default(""),
  /** Scene context value used (if any) */
  sceneContext: z.string().default(""),
  /** Aspect ratio */
  aspect: z.string().default("1:1"),
  /** Duration in seconds (video only) */
  duration: z.number().optional(),
  /** Style preset (video only) */
  stylePreset: z.string().default(""),
  /** Path to saved output file (relative to public/) */
  outputPath: z.string().default(""),
  /** Generation status */
  status: z.enum(["pending", "completed", "failed"]).default("completed"),
  /** Error message if failed */
  error: z.string().default(""),
  /** Time taken in ms */
  elapsedMs: z.number().default(0),
  createdAt: z.string(),
});
export type GenerationEntry = z.infer<typeof GenerationEntrySchema>;

export const GenerationStateSchema = z.object({
  version: z.number().int().default(1),
  entries: z.array(GenerationEntrySchema).default([]),
});
export type GenerationState = z.infer<typeof GenerationStateSchema>;
