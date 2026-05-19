/**
 * Brand-Lock Gate — pre-flight validation that runs BEFORE any video job
 * is submitted. Ensures every character mentioned in a prompt has an
 * anchor selected, so the generator gets the proper identity block.
 *
 * Why: prevents off-brand drift where a user types "Mama Zainab makes
 * mahshi" but forgets to anchor her — the model would invent a random
 * woman.
 */
import type { Character } from "@/lib/characters/schema";

export type BrandLockViolation = {
  type: "missing_anchor" | "forbidden_term" | "wrong_mode" | "keyframe_required";
  message: string;
  characterId?: string;
};

export type BrandLockResult = {
  ok: boolean;
  violations: BrandLockViolation[];
};

/** Global forbidden terms that should never appear in any prompt */
const FORBIDDEN_TERMS = [
  // Wrong attire on Mama Zainab
  { term: /western\s+dress|crop\s+top|bikini/i, message: "Forbidden attire term (Mama Zainab is always in traditional dress)" },
  // Wrong typography in renders
  { term: /comic\s+sans|papyrus/i, message: "Off-brand font reference" },
];

/**
 * Run the brand-lock validation.
 * @param prompt - the full assembled prompt being submitted
 * @param selectedAnchorIds - anchor `value` field (e.g. "chr_mama_zainab" or "chr_wong_hong_warrior")
 * @param characters - canonical Character[] from characters.json
 */
export function checkBrandLock(
  prompt: string,
  selectedAnchorIds: string[],
  characters: Character[],
): BrandLockResult {
  const violations: BrandLockViolation[] = [];
  const lowerPrompt = prompt.toLowerCase();

  // 1. Forbidden terms
  for (const f of FORBIDDEN_TERMS) {
    if (f.term.test(prompt)) {
      violations.push({ type: "forbidden_term", message: f.message });
    }
  }

  // 2. Character mentioned by name but not anchored
  for (const c of characters) {
    if (!c.active) continue;
    // Match the character's display name (case-insensitive, word boundaries)
    const namePattern = new RegExp(`\\b${escapeRegExp(c.name)}\\b`, "i");
    if (!namePattern.test(lowerPrompt) && !namePattern.test(prompt)) continue;

    // Is this character anchored? Anchor value is either `c.id` or `c.id_<mode>`
    const anchored = selectedAnchorIds.some(
      (id) => id === c.id || id.startsWith(`${c.id}_`),
    );
    if (!anchored) {
      violations.push({
        type: "missing_anchor",
        message: `"${c.name}" is in the prompt but no character anchor is selected — output will drift off-brand.`,
        characterId: c.id,
      });
    }
  }

  return { ok: violations.length === 0, violations };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Keyframe-gate: hero-tier shot-linked motion jobs require a human-approved
 * 1280x720 starting keyframe on the Shot. This is the structural defense
 * against character drift across multi-shot films — identity is locked at
 * the keyframe, motion only animates from there.
 *
 * Pass-through (returns empty array) when:
 *   - tier !== "hero" (drafts can free-run for iteration)
 *   - no shot linkage (workbench single-shots have no enforcement target)
 *   - shot has both keyframeUrl and keyframeApprovedAt populated
 */
export function checkKeyframeGate(input: {
  tier: "hero" | "draft";
  shot?: { keyframeUrl?: string; keyframeApprovedAt?: string } | null;
}): BrandLockViolation[] {
  if (input.tier !== "hero") return [];
  if (!input.shot) return [];
  if (!input.shot.keyframeUrl) {
    return [
      {
        type: "keyframe_required",
        message:
          "Hero motion requires a locked 1280×720 keyframe on this shot. Generate and approve a keyframe first.",
      },
    ];
  }
  if (!input.shot.keyframeApprovedAt) {
    return [
      {
        type: "keyframe_required",
        message:
          "Keyframe exists but has not been approved. Approve the keyframe before submitting motion.",
      },
    ];
  }
  return [];
}

/**
 * Auto-expand anchor IDs: if a character's display name appears in the prompt
 * (e.g. injected via CAST_RULES or typed by the user) but isn't yet anchored,
 * add the base character ID so brand-lock passes and the reference image is
 * attached automatically.
 */
export function autoExpandAnchors(
  prompt: string,
  selectedAnchorIds: string[],
  characters: Character[],
): string[] {
  const expanded = [...selectedAnchorIds];
  for (const c of characters) {
    if (!c.active) continue;
    const namePattern = new RegExp(`\\b${escapeRegExp(c.name)}\\b`, "i");
    if (!namePattern.test(prompt)) continue;
    const alreadyAnchored = expanded.some(
      (id) => id === c.id || id.startsWith(`${c.id}_`),
    );
    if (!alreadyAnchored) expanded.push(c.id);
  }
  return expanded;
}

/**
 * Assemble the canonical negative prompt for a job from the selected
 * characters' `donts[]` lists. Joined with commas — most providers
 * accept this format.
 */
export function buildNegativePrompt(
  selectedAnchorIds: string[],
  characters: Character[],
): string {
  const donts = new Set<string>();
  for (const id of selectedAnchorIds) {
    // strip mode suffix to find base character
    const baseId = id.includes("_") && characters.some((c) => c.id === id)
      ? id
      : characters.find((c) => id.startsWith(`${c.id}_`))?.id ?? id;
    const c = characters.find((x) => x.id === baseId);
    if (!c) continue;
    for (const d of c.donts) donts.add(d);
  }
  // Always-on global don'ts
  donts.add("low quality");
  donts.add("blurry");
  donts.add("distorted face");
  donts.add("extra limbs");
  return Array.from(donts).join(", ");
}
