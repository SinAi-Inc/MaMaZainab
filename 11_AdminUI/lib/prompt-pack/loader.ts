/**
 * Prompt-pack loader. Loads the canonical campaign prompt pack
 * (05_VideoCampaign/prompt_pack.json) for use in the Studio Preset picker.
 *
 * The pack is statically imported so it ships with the bundle and is
 * available without an HTTP fetch.
 */

import { z } from "zod";
import promptPackJson from "@/data/prompt-pack.json";

const ShotSchema = z.object({
  id: z.string(),
  number: z.string(),
  type: z.string(),
  durationSec: z.number(),
  description: z.string().default(""),
  dialogue: z.string().default(""),
  cameraNotes: z.string().default(""),
  characters: z.array(z.string()).default([]),
  refImages: z.array(z.string()).default([]),
  videoPrompt: z.string().default(""),
  imagePrompt: z.string().default(""),
  status: z.string().default("prompted"),
});
export type PromptPackShot = z.infer<typeof ShotSchema>;

const SceneSchema = z.object({
  id: z.string(),
  number: z.number(),
  heading: z.string(),
  totalSec: z.number().default(0),
  shots: z.array(ShotSchema).default([]),
});
export type PromptPackScene = z.infer<typeof SceneSchema>;

const PromptPackSchema = z.object({
  project: z
    .object({
      name: z.string().optional(),
      logline: z.string().optional(),
      runtimeTarget: z.string().optional(),
      aspectRatio: z.string().optional(),
      primaryModel: z.string().optional(),
      globalStyleSuffix: z.string().optional(),
      negativePrompt: z.string().optional(),
    })
    .passthrough()
    .default({}),
  characters: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]).default([]),
  scenes: z.array(SceneSchema).default([]),
  summary: z.unknown().optional(),
});
export type PromptPack = z.infer<typeof PromptPackSchema>;

export const PROMPT_PACK: PromptPack = PromptPackSchema.parse(promptPackJson);



/**
 * Map a pack character slug (e.g. "wong") to a Studio anchor value
 * (e.g. "chr_wong_hong_warrior"). Returns the anchor value or empty
 * string if no match.
 */
export function mapPackCharacterToAnchor(
  slug: string,
  anchorValues: string[],
): string {
  const lower = slug.toLowerCase();
  // Try direct id match first
  const direct = anchorValues.find((v) => v.toLowerCase() === lower);
  if (direct) return direct;
  // Then match by prefix/contains
  const fuzzy = anchorValues.find((v) => v.toLowerCase().includes(lower));
  return fuzzy ?? "";
}

/**
 * Map a scene number (1..10) to the Studio SCENE_CONTEXTS value.
 * Scenes 1–6 correspond to the original SCENE_CONTEXTS; 7–10 are new
 * from the expanded Keyframe Storyboard and have no preset scene context
 * yet — return empty string so the preset-picker still loads the prompt
 * without forcing a scene dropdown selection.
 */
export function mapPackSceneToContext(sceneNumber: number): string {
  switch (sceneNumber) {
    case 1: return "scene_1_rooftop";
    case 2: return "scene_2_pyramids";
    case 3: return "scene_3_competition";
    case 4: return "scene_4_cooking";
    case 5: return "scene_5_judging";
    case 6: return "scene_6_command_center";
    // Scenes 7–10 from the expanded storyboard — no preset scene context
    default: return "";
  }
}

/** Find a shot by id across all scenes. */
export function findShot(shotId: string): {
  scene: PromptPackScene;
  shot: PromptPackShot;
} | null {
  for (const scene of PROMPT_PACK.scenes) {
    const shot = scene.shots.find((s) => s.id === shotId);
    if (shot) return { scene, shot };
  }
  return null;
}
