/**
 * Brand Reference Context — injected into every generation prompt to keep
 * outputs on-brand. Detects character mentions, appends anchor blocks,
 * DO/DON'T rules, reference media paths, and brand material descriptors.
 *
 * Used by both image-gen-tab and video-gen-tab.
 */

import type { Character } from "@/lib/characters/schema";

/* ---- Brand Materials (static) ---- */

export const BRAND_MATERIALS = {
  plaid: {
    keywords: ["plaid", "apron", "pattern", "tartan", "fabric", "textile"],
    descriptor: `[BRAND MATERIAL: Plaid v2]
Green-base diamond plaid — warp: Brand Green #1B9B00 on cream #FFF8E7, weft: Brand Yellow #EFD200 at 30% opacity, white intersection highlights. Pattern repeat: 2cm diamond. Used on aprons, ribbons, packaging bands, tablecloths.
DO NOT use: yellow-base plaid (legacy), random tartans, buffalo check.
[REF: /brand/plaid.png]`,
  },
  packaging: {
    keywords: ["packaging", "box", "bag", "wrapper", "container", "label", "pack"],
    descriptor: `[BRAND MATERIAL: Packaging]
Kraft brown base, plaid v2 band wrapping the package, MaMa Zainab wordmark in Brand Green on cream label, hand-stamped "Village Kitchen" in Ink #2C292A. Ribbon closure with plaid v2 fabric strip.
DO NOT use: plastic laminate, metallic foil, neon colors, generic stock packaging.
[REF: /brand/logo-primary.png]`,
  },
  logo: {
    keywords: ["logo", "wordmark", "brand mark", "lockup"],
    descriptor: `[BRAND MATERIAL: Logo / Wordmark]
"MaMa Zainab" wordmark in custom Arabic-inspired script, Brand Green #1B9B00 primary, cream #FFF8E7 background acceptable. Minimum clear space: 1× height on all sides. Always paired with Mama Zainab character or standalone — never with Wong.
[REF: /brand/logo-primary.png]`,
  },
  kitchen: {
    keywords: ["kitchen", "cook", "cooking", "stove", "counter", "pot", "pan"],
    descriptor: `[BRAND MATERIAL: Kitchen Setting]
Rustic Mediterranean-Egyptian village kitchen: warm terracotta tiles, cream plastered walls, wooden shelves with copper pots, natural sunlight from a window, hanging dried herbs, flour-dusted wooden work surface. Brand Green accents in textiles (towels, apron). Warm tungsten fill light.
DO NOT use: modern stainless steel, industrial kitchen, neon/LED lighting, minimalist design.`,
  },
  food: {
    keywords: ["food", "dish", "plate", "meal", "mahshi", "vine leaves", "rice"],
    descriptor: `[BRAND MATERIAL: Food Presentation]
Authentic Egyptian/Mediterranean home-style plating: rustic ceramic bowls in cream/terracotta, fresh herbs as garnish, natural overhead or 45° angle photography, shallow depth of field, warm color temperature. Portions generous, steam visible on hot dishes.
DO NOT use: molecular gastronomy, fine-dining micro-portions, black plates, cold blue lighting.`,
  },
} as const;

export type BrandMaterialKey = keyof typeof BRAND_MATERIALS;

/* ---- Character keyword map for auto-detection ---- */

const CHARACTER_ALIASES: Record<string, string[]> = {
  chr_mama_zainab: ["mama zainab", "mama", "zainab", "matriarch", "mother"],
  chr_zuzu: ["zuzu", "goose", "mascot", "duck", "bird"],
  chr_wong: ["wong", "shang hong", "banker", "founder", "investor"],
  chr_ghost_zainab: ["ghost", "phantom", "ethereal", "spirit", "apparition"],
};

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
    for (const [key, material] of Object.entries(BRAND_MATERIALS)) {
      if (material.keywords.some((kw) => promptLower.includes(kw))) {
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
      sections.push(BRAND_MATERIALS[matKey].descriptor);
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
