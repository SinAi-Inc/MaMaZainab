/**
 * Brand Bible data for Studio UI integration.
 * Source of truth: Characters → characters.json (via readCharacters / props)
 *                  Scenes    → hardcoded (narrative arc + marketing presets)
 *
 * Character anchors are now DERIVED from the Character[] array so edits in
 * the Characters page immediately flow into Studio generations.
 */

import type { Character } from "@/lib/characters/schema";

/* ---- Character Anchor Options (derived from Characters data) ---- */

export type CharacterAnchorOption = {
  label: string;
  value: string;
  /** Character name without the mode suffix (e.g. "Shang Hong Wong") */
  baseName: string;
  /** Mode label for multi-mode characters (e.g. "Warrior"); empty otherwise */
  modeLabel: string;
  promptAnchor: string;
  alsoInjectsPlaid: boolean;
  doNots: string[];
  /** Primary reference image URL from the Characters page (if any) */
  referenceImage?: string;
};

/**
 * Build Studio anchor options from the canonical Character[] array.
 * Multi-mode characters (e.g. Wong: Warrior / Business) expand into
 * one dropdown entry per mode.
 */
export function buildAnchorsFromCharacters(
  characters: Character[],
): CharacterAnchorOption[] {
  const anchors: CharacterAnchorOption[] = [];
  const plaidCharIds = new Set(["chr_mama_zainab", "chr_zuzu"]);

  for (const c of characters) {
    if (!c.active) continue;

    const refImg = c.referenceImages.find((r) => r.isPrimary)?.url
      ?? c.referenceImages[0]?.url;

    const injectsPlaid = plaidCharIds.has(c.id)
      || c.anchorBlock.toLowerCase().includes("plaid");

    if (c.modes.length > 0) {
      // Expand each mode into its own anchor entry
      for (const mode of c.modes) {
        // Prefer mode-specific reference image, fall back to character primary
        const modeRef = mode.referenceImage || refImg;
        anchors.push({
          label: `${c.name} — ${mode.label}`,
          value: `${c.id}_${mode.label.toLowerCase().replace(/\s+/g, "_")}`,
          baseName: c.name,
          modeLabel: mode.label,
          promptAnchor: buildModeAnchor(c, mode),
          alsoInjectsPlaid: injectsPlaid,
          doNots: [...c.donts],
          referenceImage: modeRef,
        });
      }
    } else {
      anchors.push({
        label: c.name,
        value: c.id,
        baseName: c.name,
        modeLabel: "",
        promptAnchor: buildEnrichedAnchor(c),
        alsoInjectsPlaid: injectsPlaid,
        doNots: [...c.donts],
        referenceImage: refImg,
      });
    }
  }

  return anchors;
}

/** Build anchor text for a specific mode of a multi-mode character */
function buildModeAnchor(
  c: Character,
  mode: { label: string; costume: string; posture: string; when: string },
): string {
  const base = c.anchorBlock.trim() || buildFallbackAnchor(c);
  const modeDetails = [
    mode.costume && `Costume: ${mode.costume}`,
    mode.posture && `Posture: ${mode.posture}`,
    mode.when && `When: ${mode.when}`,
  ]
    .filter(Boolean)
    .join(". ");
  const dosText = c.dos.length > 0
    ? `Direction: ${c.dos.join(". ")}.`
    : "";
  return [
    `${base}\nMode ${mode.label}: ${modeDetails}`,
    dosText,
  ].filter(Boolean).join("\n");
}

/** Fallback anchor from structured identity fields when anchorBlock is empty */
function buildFallbackAnchor(c: Character): string {
  const parts = [`${c.name} — ${c.role || c.subtitle}`];
  for (const f of c.identityFields) {
    if (f.value) parts.push(`${f.field}: ${f.value}`);
  }
  return parts.join(", ");
}

/**
 * Build enriched anchor: base anchorBlock + identity fields + positive "dos".
 * FLUX weights the start of the prompt highest (CLIP ~77 token window),
 * so critical visual features (age, headscarf, skin tone) come first.
 */
function buildEnrichedAnchor(c: Character): string {
  const base = c.anchorBlock.trim() || buildFallbackAnchor(c);

  // Append identity fields not already in the base anchor (for specificity)
  const extras: string[] = [];
  for (const f of c.identityFields) {
    if (!f.value) continue;
    // Skip if the base anchor already mentions this field's value
    if (base.toLowerCase().includes(f.value.toLowerCase().slice(0, 10))) continue;
    extras.push(`${f.field}: ${f.value}`);
  }

  // Append positive brand dos as reinforcement
  const dosText = c.dos.length > 0
    ? `Direction: ${c.dos.join(". ")}.`
    : "";

  const parts = [base];
  if (extras.length > 0) parts.push(extras.join(". "));
  if (dosText) parts.push(dosText);

  return parts.join("\n");
}

/* ---- Scene Context Options ---- */

export type SceneContextOption = {
  label: string;
  value: string;
  mood: string;
  paletteFocus: string[];
  patternUsage: string;
  characters: string[];
  wongMode?: string;
};

export const SCENE_CONTEXTS: SceneContextOption[] = [
  {
    label: "Scene 1 — Neon Rooftop",
    value: "scene_1_rooftop",
    mood: "dark, neon, rain, high-action",
    paletteFocus: ["Ink #2C292A", "Brand Red #E60000"],
    patternUsage: "none",
    characters: ["chr_wong_warrior"],
    wongMode: "warrior",
  },
  {
    label: "Scene 2 — Pyramids",
    value: "scene_2_pyramids",
    mood: "epic, golden, vast, meditative",
    paletteFocus: ["Cream #FFF8E7", "Mahshi Green #1B9B00", "Brand Yellow #EFD200"],
    patternUsage: "none",
    characters: ["chr_wong_warrior"],
    wongMode: "warrior",
  },
  {
    label: "Scene 3 — Competition",
    value: "scene_3_competition",
    mood: "bright, Mediterranean, festive, competitive",
    paletteFocus: ["Mahshi Green #1B9B00", "Brand Yellow #EFD200", "Cream #FFF8E7"],
    patternUsage: "aprons, stage_banners",
    characters: ["chr_wong_business", "chr_mama_zainab"],
    wongMode: "business",
  },
  {
    label: "Scene 4 — Cooking",
    value: "scene_4_cooking",
    mood: "comedic, chaotic, warm",
    paletteFocus: ["Mahshi Green #1B9B00", "Brand Yellow #EFD200", "Cream #FFF8E7"],
    patternUsage: "apron, zuzu_ribbon",
    characters: ["chr_mama_zainab", "chr_zuzu", "chr_ghost_zainab"],
  },
  {
    label: "Scene 5 — Judging",
    value: "scene_5_judging",
    mood: "dramatic, emotional, triumphant",
    paletteFocus: ["Mahshi Green #1B9B00", "Brand Yellow #EFD200"],
    patternUsage: "apron",
    characters: ["chr_wong_business", "chr_mama_zainab"],
    wongMode: "business",
  },
  {
    label: "Scene 6 — Command Center",
    value: "scene_6_command_center",
    mood: "clean, futuristic, peaceful, Apple-store aesthetic",
    paletteFocus: ["Garlic White #FAFAFA", "Mahshi Green #1B9B00", "Cream #FFF8E7"],
    patternUsage: "apron, subtle_office_accents",
    characters: ["chr_mama_zainab", "chr_zuzu", "chr_ghost_zainab", "chr_wong_silhouette"],
    wongMode: "silhouette",
  },
  {
    label: "Marketing — General",
    value: "marketing_general",
    mood: "warm, inviting, authentic, village-premium",
    paletteFocus: ["Mahshi Green #1B9B00", "Brand Yellow #EFD200", "Cream #FFF8E7"],
    patternUsage: "apron, packaging_accents",
    characters: ["chr_mama_zainab", "chr_zuzu"],
  },
  {
    label: "Packaging Shot",
    value: "packaging_shot",
    mood: "clean, studio-lit, product-focused",
    paletteFocus: ["Mahshi Green #1B9B00", "Cream #FFF8E7", "Brand Yellow #EFD200"],
    patternUsage: "packaging_wrap, plaid_band",
    characters: [],
  },
  {
    label: "Menu Item Hero",
    value: "menu_hero",
    mood: "food photography, warm, overhead or 45°, shallow DoF",
    paletteFocus: ["Mahshi Green #1B9B00", "Cream #FFF8E7"],
    patternUsage: "optional_tablecloth",
    characters: [],
  },
];

/* ---- Prompt Blocks ---- */

export const PALETTE_BLOCK =
  "Brand color palette: Mahshi Green #1B9B00, Brand Yellow #EFD200, Brand Red #E60000, Ink #2C292A, Cream #FFF8E7";

export const PLAID_BLOCK =
  "Plaid v2: green-on-cream diamond weave with thin yellow cross-threads, rustic village-handwoven textile aesthetic";

export const CAST_RULES =
  "Cast rules: Mama Zainab always largest and centered. ZuZu supporting, lower-third. Wong separate from food. Ghost only in video. FORBIDDEN: ZuZu and Wong in same frame.";

/**
 * Injected first in every assembled prompt.
 * FLUX.1 has no negative_prompt field — style must be enforced via strong
 * positive direction only. Negative phrasing ("NOT ...") confuses FLUX
 * and can trigger NVIDIA's safety filter, producing black images.
 */
export const RENDER_STYLE_BLOCK =
  "Shot on 35 mm film, natural available light, editorial photography on location. " +
  "Photorealistic, real human subject with visible skin pores, fabric weave, and natural imperfections. " +
  "Cinematic color grading, shallow depth of field, film grain. " +
  "Real-world physics, gravity, and proportions.";

/* ---- 6-Step Prompt Assembly ---- */

/** Build food photography direction from a menu item's real data */
export function buildMenuItemPrompt(item: {
  nameEn: string;
  descriptionEn: string;
  categoryName?: string;
}): string {
  const parts = [`Hero food shot: ${item.nameEn}`];
  if (item.descriptionEn) parts.push(`(${item.descriptionEn})`);
  if (item.categoryName) parts.push(`Category: ${item.categoryName}`);
  parts.push(
    "Overhead or 45-degree angle, shallow depth of field, warm directional light, " +
    "rustic ceramic plate on cream linen, garnished with fresh herbs. " +
    "Authentic Egyptian home-cooking presentation, not restaurant fine-dining."
  );
  return parts.join(". ");
}

export function assemblePrompt(opts: {
  sceneContext?: SceneContextOption;
  /** Single anchor (legacy) OR multiple anchors for multi-character frames */
  characterAnchor?: CharacterAnchorOption;
  characterAnchors?: CharacterAnchorOption[];
  userPrompt: string;
  includePalette: boolean;
  isVideo?: boolean;
  /** When set, injects food photography direction from the real menu */
  menuItemPrompt?: string;
}): string {
  const { sceneContext, userPrompt, includePalette, isVideo, menuItemPrompt } = opts;

  // Normalise to an array — support both single and multi-anchor call sites
  const anchors: CharacterAnchorOption[] = opts.characterAnchors?.length
    ? opts.characterAnchors
    : opts.characterAnchor
    ? [opts.characterAnchor]
    : [];

  const parts: string[] = [];

  // Step 0: Render Style — must come first so FLUX weighs it highest
  parts.push(RENDER_STYLE_BLOCK);

  // Step 1: Scene Context (mood + palette_focus)
  if (sceneContext) {
    parts.push(
      `Scene: ${sceneContext.label}. Mood: ${sceneContext.mood}. Key colors: ${sceneContext.paletteFocus.join(", ")}. Pattern usage: ${sceneContext.patternUsage}.`
    );
  }

  // Step 1b: Menu Item (food photography direction from real menu data)
  if (menuItemPrompt) {
    parts.push(menuItemPrompt);
  }

  // Step 2: Character Anchors (one block per character)
  if (anchors.length === 1) {
    parts.push(`Subject: ${anchors[0].promptAnchor}`);
  } else if (anchors.length > 1) {
    for (const a of anchors) {
      parts.push(`Character ${a.label}: ${a.promptAnchor}`);
    }
    // Multi-character cast rules always apply
    parts.push(CAST_RULES);
  }

  // Step 3: User Prompt — tagged so condenseForSD15 can extract it as priority
  if (userPrompt.trim()) {
    parts.push(`[SHOT] ${userPrompt.trim()}`);
  }

  // Step 4: Palette Block
  if (includePalette) {
    parts.push(PALETTE_BLOCK);
  }

  // Step 5: Plaid Block (if any anchor has apron/ribbon OR packaging scene)
  const needsPlaid =
    anchors.some((a) => a.alsoInjectsPlaid) ||
    sceneContext?.value === "packaging_shot" ||
    (sceneContext?.patternUsage && sceneContext.patternUsage !== "none");
  if (includePalette && needsPlaid) {
    parts.push(`Pattern detail: ${PLAID_BLOCK}`);
  }

  // Step 6: Negative Prompt (merge do_not rules from all anchors)
  // FLUX.1 has no negative_prompt API field — embed avoidances inline
  const allDoNots = [...new Set(anchors.flatMap((a) => a.doNots))];
  if (allDoNots.length > 0) {
    parts.push(`Avoid: ${allDoNots.join(". ")}`);
  }

  // Cast rules for scene with multiple characters (single-anchor path)
  if (anchors.length <= 1 && sceneContext && sceneContext.characters.length > 1) {
    parts.push(CAST_RULES);
  }

  // Ghost warning for image gen
  if (!isVideo && anchors.some((a) => a.value.includes("ghost"))) {
    parts.push(
      "⚠️ Ghost of Mama Zainab is primarily a VIDEO character. Still images may lack the ethereal motion effect."
    );
  }

  return parts.join("\n\n");
}

/* ---- Helpers ---- */

export function getAnchorByValue(
  value: string,
  anchors: CharacterAnchorOption[],
): CharacterAnchorOption | undefined {
  // Exact match first
  const exact = anchors.find((a) => a.value === value);
  if (exact) return exact;
  // Multi-mode fallback: if caller passes "chr_wong" but anchors have
  // "chr_wong_warrior" / "chr_wong_banker", return the first matching mode.
  return anchors.find((a) => a.value.startsWith(value + "_"));
}

export function getSceneByValue(value: string): SceneContextOption | undefined {
  return SCENE_CONTEXTS.find((s) => s.value === value);
}

/**
 * Detect which character IDs appear in arbitrary text.
 * Matches on full name AND any individual word of the name that is ≥3 chars
 * (so "Wong" matches "Shang Hong Wong", "Zainab" matches "MaMa Zainab").
 * Returns raw character IDs (e.g. "chr_wong"), not mode-expanded anchor values.
 */
export function detectCharacterIds(
  text: string,
  characters: { id: string; name: string; active: boolean }[],
): string[] {
  const lower = text.toLowerCase();
  const ids: string[] = [];
  for (const c of characters) {
    if (!c.active) continue;
    const fullName = c.name.toLowerCase();
    // Check full name match first
    if (lower.includes(fullName)) {
      ids.push(c.id);
      continue;
    }
    // Check individual name parts (≥3 chars to avoid "Ma" false positives)
    const parts = fullName.split(/\s+/).filter((p) => p.length >= 3);
    if (parts.some((part) => lower.includes(part))) {
      ids.push(c.id);
    }
  }
  return ids;
}
