import { z } from "zod";

/* -------------------------------------------------------------- */
/*  Character Bible - domain                                       */
/*  Cast → Character with identity, voice, refs, rules            */
/* -------------------------------------------------------------- */

export const CharacterVisibilitySchema = z.enum([
  "always-on",
  "high",
  "low",
  "video-only",
]);
export type CharacterVisibility = z.infer<typeof CharacterVisibilitySchema>;

export const VISIBILITY_META: Record<
  CharacterVisibility,
  { label: string; tone: "success" | "info" | "warning" | "neutral" }
> = {
  "always-on": { label: "Always On",  tone: "success" },
  high:        { label: "High",       tone: "info" },
  low:         { label: "Low",        tone: "warning" },
  "video-only":{ label: "Video Only", tone: "neutral" },
};

/* ---- Sub-schemas -------------------------------------------- */

export const ReferenceImageSchema = z.object({
  url:       z.string().min(1, "URL required"),
  label:     z.string().default(""),
  isPrimary: z.boolean().default(false),
});
export type ReferenceImage = z.infer<typeof ReferenceImageSchema>;

export const IdentityFieldSchema = z.object({
  field: z.string().min(1),
  value: z.string().default(""),
});
export type IdentityField = z.infer<typeof IdentityFieldSchema>;

export const AppearanceModeSchema = z.object({
  label:          z.string().min(1, "Label required"),
  when:           z.string().default(""),
  costume:        z.string().default(""),
  posture:        z.string().default(""),
  /** Optional mode-specific reference image (overrides character primary) */
  referenceImage: z.string().default(""),
});
export type AppearanceMode = z.infer<typeof AppearanceModeSchema>;

/* ---- Character ---------------------------------------------- */

export const CharacterSchema = z.object({
  id:              z.string(),
  /** Display name, e.g. "MaMa Zainab" */
  name:            z.string().min(1, "Required"),
  /** Short role line, e.g. "the heart" */
  subtitle:        z.string().default(""),
  /** Full role description */
  role:            z.string().default(""),
  visibility:      CharacterVisibilitySchema.default("high"),
  /** The text block that must be pasted into every AI prompt */
  anchorBlock:     z.string().default(""),
  referenceImages: z.array(ReferenceImageSchema).default([]),
  identityFields:  z.array(IdentityFieldSchema).default([]),
  /** Appearance modes (warrior/banker etc.) – only for multi-mode chars */
  modes:           z.array(AppearanceModeSchema).default([]),
  voiceProvider:   z.string().default(""),
  voiceId:         z.string().default(""),
  voiceNotes:      z.string().default(""),
  /** Dos – one per item */
  dos:             z.array(z.string()).default([]),
  /** Don'ts – one per item */
  donts:           z.array(z.string()).default([]),
  surfaceUsage:    z.string().default(""),
  active:          z.boolean().default(true),
  sort:            z.coerce.number().int().default(0),
  createdAt:       z.string(),
  updatedAt:       z.string(),
});
export type Character = z.infer<typeof CharacterSchema>;

/* ---- State -------------------------------------------------- */

export const CharacterStateSchema = z.object({
  version:    z.number().int().default(1),
  characters: z.array(CharacterSchema).default([]),
});
export type CharacterState = z.infer<typeof CharacterStateSchema>;

/* ---- Input (form/action) ------------------------------------ */

export const CharacterInputSchema = CharacterSchema.omit({
  id:        true,
  createdAt: true,
  updatedAt: true,
});
export type CharacterInput    = z.output<typeof CharacterInputSchema>;
export type CharacterInputRaw = z.input<typeof CharacterInputSchema>;
