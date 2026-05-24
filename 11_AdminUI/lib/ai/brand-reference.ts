/**
 * Brand Reference Context — injected into every generation prompt to keep
 * outputs on-brand. Detects character mentions, appends anchor blocks,
 * DO/DON'T rules, reference media paths, and brand material descriptors.
 *
 * Sensitive prose (descriptors, character aliases, anchor blocks) is loaded
 * at runtime from the gitignored data/brand-private.json (local dev) or the
 * BRAND_PRIVATE_DATA environment variable (Vercel / production).
 *
 * Used by both image-gen-tab and video-gen-tab.
 */

import type { Character } from "@/lib/characters/schema";
import { loadBrandPrivate } from "@/lib/private-brand-loader";

/* ---- Non-sensitive keyword triggers (no brand strategy here) ---- */

const BRAND_MATERIAL_KEYWORDS: Record<string, string[]> = {
  plaid:     ["plaid", "apron", "pattern", "tartan", "fabric", "textile"],
  packaging: ["packaging", "box", "bag", "wrapper", "container", "label", "pack"],
  logo:      ["logo", "wordmark", "brand mark", "lockup"],
  kitchen:   ["kitchen", "cook", "cooking", "stove", "counter", "pot", "pan"],
  food:      ["food", "dish", "plate", "meal", "mahshi", "vine leaves", "rice"],
};

export type BrandMaterialKey = keyof typeof BRAND_MATERIAL_KEYWORDS;

/* ---- Core function: build validated reference context ---- */

export function buildReferenceContext(
  userPrompt: string,
  characters: Character[],
  selectedCharId?: string,
  options?: {
    includeBrand?: boolean;
    isVideo?: boolean;
  }
): string {
  const { includeBrand = true, isVideo = false } = options ?? {};
  const promptLower = userPrompt.toLowerCase();
  const sections: string[] = [];

  const priv = loadBrandPrivate();
  const CHARACTER_ALIASES = priv.characterAliases;
  const brandMaterials    = priv.brandMaterials;

  // 1. Collect all characters that should be referenced
  const referencedCharIds = new Set<string>();

  // Always include the explicitly selected character
  if (selectedCharId) {
    referencedCharIds.add(selectedCharId);
  }

  // Auto-detect character mentions in prompt text
  for (const [charId, aliases] of Object.entries(CHARACTER_ALIASES)) {
    if (aliases.some((alias) => promptLower.includes(alias))) {
      referencedCharIds.add(charId);
    }
  }

  // 2. Inject character anchor blocks + constraints
  for (const charId of referencedCharIds) {
    const char = characters.find((c) => c.id === charId);
    if (!char) continue;

    // Video-only characters shouldn't appear in image gen
    if (!isVideo && char.visibility === "video-only") {
      sections.push(
        `⚠️ WARNING: ${char.name} is VIDEO-ONLY. Do not generate still images of this character.`
      );
      continue;
    }

    const charBlock: string[] = [];
    charBlock.push(`[CHARACTER: ${char.name}]`);

    // Anchor block (the core visual description)
    if (char.anchorBlock.trim()) {
      charBlock.push(char.anchorBlock.trim());
    }

    // Reference images
    if (char.referenceImages.length > 0) {
      const refs = char.referenceImages
        .map((r) => `  ${r.isPrimary ? "★ " : ""}${r.label || "ref"}: ${r.url}`)
        .join("\n");
      charBlock.push(`Reference media:\n${refs}`);
    }

    // DO constraints
    if (char.dos.length > 0) {
      charBlock.push(`DO: ${char.dos.join(" | ")}`);
    }

    // DON'T constraints
    if (char.donts.length > 0) {
      charBlock.push(`DON'T: ${char.donts.join(" | ")}`);
    }

    // Modes (for multi-mode characters like Wong)
    if (char.modes.length > 0) {
      const modeStr = char.modes
        .map((m) => `  ${m.label}: ${m.costume} (${m.posture})`)
        .join("\n");
      charBlock.push(`Appearance modes:\n${modeStr}`);
    }

    charBlock.push(`[/CHARACTER]`);
    sections.push(charBlock.join("\n"));
  }

  // 3. Auto-detect brand material mentions and inject descriptors
  if (includeBrand) {
    const usedMaterials = new Set<BrandMaterialKey>();
    for (const [key, keywords] of Object.entries(BRAND_MATERIAL_KEYWORDS)) {
      if (keywords.some((kw) => promptLower.includes(kw))) {
        usedMaterials.add(key as BrandMaterialKey);
      }
    }

    // Always include plaid if any character with apron/ribbon is referenced
    if (
      referencedCharIds.has("chr_mama_zainab") ||
      referencedCharIds.has("chr_zuzu")
    ) {
      usedMaterials.add("plaid");
    }

    for (const matKey of usedMaterials) {
      const descriptor = brandMaterials[matKey as keyof typeof brandMaterials]?.descriptor;
      if (descriptor) sections.push(descriptor);
    }

    // Global brand palette (always append when brand mode is on)
    sections.push(
      `[BRAND PALETTE] Mahshi Green #1B9B00 | Brand Yellow #EFD200 | Brand Red #E60000 | Ink #2C292A | Cream #FFF8E7 | Plaid v2: green-on-cream diamond weave.`
    );
  }

  // 4. Cast hierarchy rules (if multiple characters)
  if (referencedCharIds.size > 1) {
    sections.push(
      `[CAST RULES] Mama Zainab always largest/centered. ZuZu supporting, lower-third. Wong separate from food. Ghost only in video. FORBIDDEN: ZuZu + Wong in same frame.`
    );
  }

  // 5. Trim to stay within API limits (keep under 6000 chars for reference context)
  let result = sections.join("\n\n");
  if (result.length > 6000) {
    result = result.slice(0, 5950) + "\n\n[... context trimmed for API limits]";
  }

  return result;
}
