/**
 * Loads sensitive brand prose from a gitignored source.
 *
 * Priority:
 *   1. BRAND_PRIVATE_DATA env var (base64-encoded JSON) — used on Vercel
 *   2. data/brand-private.json file — used in local dev
 *   3. Empty-defaults fallback — graceful degradation (no crash)
 *
 * Call loadBrandPrivate() anywhere on the server side; the result is
 * cached in the module singleton so the file is read at most once.
 */

import fs from "fs";
import path from "path";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type BrandMaterialEntry = {
  descriptor: string;
};

export type BrandPrivateData = {
  brandMaterials: {
    plaid: BrandMaterialEntry;
    packaging: BrandMaterialEntry;
    logo: BrandMaterialEntry;
    kitchen: BrandMaterialEntry;
    food: BrandMaterialEntry;
  };
  characterAliases: Record<string, string[]>;
  brandIdentity: {
    name: string;
    nameArabic: string;
    tagline: string;
    originStory: string;
    personality: string[];
    marketPosition: string;
    foundingCity: string;
  };
  characters: BrandCharacterPrivate[];
  scenes: SceneMappingPrivate[];
  generationRules: {
    mandatory: string[];
    qualityGates: { check: string; rule: string }[];
  };
  patternPromptAnchor: string;
  iconPatternPromptAnchor: string;
};

export type BrandCharacterPrivate = {
  id: string;
  name: string;
  nameArabic?: string;
  role: string;
  descriptionShort: string;
  visualPromptAnchor: string;
  avatarSrc: string;
  physicalTraits: Record<string, string>;
  wardrobe: { label: string; desc: string; colors?: string; context?: string }[];
  personality: string[];
  signatureLine?: string;
  doNots: string[];
};

export type SceneMappingPrivate = {
  id: string;
  label: string;
  characters: string[];
  wongMode?: string;
  paletteFocus: string[];
  patternUsage: string;
  mood: string;
  brandElements: string[];
};

/* ------------------------------------------------------------------ */
/*  Defaults (safe no-op fallback)                                      */
/* ------------------------------------------------------------------ */

const EMPTY_DEFAULTS: BrandPrivateData = {
  brandMaterials: {
    plaid:     { descriptor: "" },
    packaging: { descriptor: "" },
    logo:      { descriptor: "" },
    kitchen:   { descriptor: "" },
    food:      { descriptor: "" },
  },
  characterAliases: {},
  brandIdentity: {
    name: "MaMa Zainab",
    nameArabic: "ماما زينب",
    tagline: "",
    originStory: "",
    personality: [],
    marketPosition: "",
    foundingCity: "",
  },
  characters: [],
  scenes: [],
  generationRules: { mandatory: [], qualityGates: [] },
  patternPromptAnchor: "",
  iconPatternPromptAnchor: "",
};

/* ------------------------------------------------------------------ */
/*  Loader (module-level singleton cache)                               */
/* ------------------------------------------------------------------ */

let _cache: BrandPrivateData | null = null;

export function loadBrandPrivate(): BrandPrivateData {
  if (_cache) return _cache;

  // 1 — Vercel env var (base64 JSON)
  if (process.env.BRAND_PRIVATE_DATA) {
    try {
      _cache = JSON.parse(
        Buffer.from(process.env.BRAND_PRIVATE_DATA, "base64").toString("utf-8")
      ) as BrandPrivateData;
      return _cache;
    } catch {
      // malformed — fall through
    }
  }

  // 2 — Local gitignored file
  try {
    const fp = path.join(process.cwd(), "data", "brand-private.json");
    _cache = JSON.parse(fs.readFileSync(fp, "utf-8")) as BrandPrivateData;
    return _cache;
  } catch {
    // file absent — fall through
  }

  // 3 — Empty-defaults (brand context will be omitted from prompts)
  _cache = EMPTY_DEFAULTS;
  return _cache;
}

/** Call this in tests or hot-reload scenarios to bust the cache. */
export function resetBrandPrivateCache(): void {
  _cache = null;
}
