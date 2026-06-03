/**
 * Provider recommendation engine - suggests the best video model
 * per shot based on type, mood, and content analysis.
 *
 * Based on hybrid workflow:
 *   Emotional cinematic closeups → Veo
 *   Rain / neon / cyberpunk      → Runway
 *   Action / robes / martial     → Kling
 *   Funny ZuZu moments           → Pika
 *   Experimental transitions     → Luma
 */
import type { VideoModel } from "@/lib/videos/schema";

export type ShotHint = {
  type?: string;       // "close-up" | "wide" | "medium" | "tracking" etc.
  description?: string;
  dialogue?: string;
  cameraNotes?: string;
  characterAnchors?: string[];
};

export type Recommendation = {
  model: VideoModel;
  reason: string;
  confidence: "high" | "medium" | "low";
};

/** Keywords / patterns that suggest a specific provider */
const KLING_SIGNALS = [
  /action/i, /martial/i, /robe/i, /warrior/i, /fight/i, /slash/i,
  /combat/i, /sword/i, /chi/i, /kung\s?fu/i, /wuxia/i, /leap/i,
  /flowing.*robe/i, /wind.*cloak/i, /staff/i, /battle/i,
];

const RUNWAY_SIGNALS = [
  /rain/i, /neon/i, /cyberpunk/i, /night/i, /glow/i, /dark.*alley/i,
  /moody/i, /cinematic.*atmosphere/i, /wet.*street/i, /reflections/i,
  /vapor/i, /smoke/i, /fog/i, /noir/i, /dramatic.*lighting/i,
];

const VEO_SIGNALS = [
  /emotional/i, /tender/i, /intimate/i, /tears/i, /heartfelt/i,
  /nostalgic/i, /warm.*light/i, /soft.*focus/i, /memory/i,
  /close-?up/i, /portrait/i, /expression/i, /feeling/i,
];

const PIKA_SIGNALS = [
  /zuzu/i, /funny/i, /playful/i, /cartoon/i, /bouncy/i,
  /silly/i, /humor/i, /whimsical/i, /dance/i, /jump.*around/i,
];

const LUMA_SIGNALS = [
  /transition/i, /morph/i, /dream/i, /surreal/i, /experimental/i,
  /abstract/i, /time-?lapse/i, /transform/i, /dissolve/i,
  /portal/i, /dimension/i,
];

function scoreSignals(text: string, signals: RegExp[]): number {
  return signals.reduce((score, rx) => score + (rx.test(text) ? 1 : 0), 0);
}

/**
 * Recommend the best video model for a shot based on its content.
 * Returns a ranked list (top recommendation first).
 */
export function recommendProviders(hint: ShotHint): Recommendation[] {
  const fullText = [
    hint.description || "",
    hint.dialogue || "",
    hint.cameraNotes || "",
    hint.type || "",
  ].join(" ");

  const scores: Array<{ model: VideoModel; score: number; reason: string }> = [
    {
      model: "kling/3.0",
      score: scoreSignals(fullText, KLING_SIGNALS),
      reason: "Action / martial arts / flowing robes",
    },
    {
      model: "runway/gen4",
      score: scoreSignals(fullText, RUNWAY_SIGNALS),
      reason: "Rain / neon / atmospheric cinematics",
    },
    {
      model: "google/veo-3",
      score: scoreSignals(fullText, VEO_SIGNALS),
      reason: "Emotional cinematic closeups",
    },
    {
      model: "pika/2.2",
      score: scoreSignals(fullText, PIKA_SIGNALS),
      reason: "Playful / funny character moments",
    },
    {
      model: "luma/dream-machine",
      score: scoreSignals(fullText, LUMA_SIGNALS),
      reason: "Experimental transitions / surreal",
    },
  ];

  // Boost based on shot type
  if (hint.type === "close-up") {
    const veo = scores.find((s) => s.model === "google/veo-3");
    if (veo) veo.score += 2;
  }
  if (hint.type === "wide" || hint.type === "aerial") {
    const runway = scores.find((s) => s.model === "runway/gen4");
    if (runway) runway.score += 1;
  }
  if (hint.type === "tracking") {
    const kling = scores.find((s) => s.model === "kling/3.0");
    if (kling) kling.score += 1;
  }

  // Boost if ZuZu character is anchored
  if (hint.characterAnchors?.some((a) => a.includes("zuzu"))) {
    const pika = scores.find((s) => s.model === "pika/2.2");
    if (pika) pika.score += 3;
  }

  // Boost Wong for Kling (martial / warrior)
  if (hint.characterAnchors?.some((a) => a.includes("wong") && a.includes("warrior"))) {
    const kling = scores.find((s) => s.model === "kling/3.0");
    if (kling) kling.score += 3;
  }

  // Sort descending
  scores.sort((a, b) => b.score - a.score);

  // Build result with confidence
  const results: Recommendation[] = scores
    .filter((s) => s.score > 0)
    .map((s): Recommendation => ({
      model: s.model,
      reason: s.reason,
      confidence: s.score >= 3 ? "high" : s.score >= 2 ? "medium" : "low",
    }));

  // If nothing matched, default to Runway (safest all-rounder)
  if (results.length === 0) {
    results.push({ model: "runway/gen4", reason: "Default - versatile all-rounder", confidence: "medium" });
  }

  return results;
}

/**
 * Quick helper - returns the single best model for a shot.
 */
export function recommendBestModel(hint: ShotHint): VideoModel {
  const recs = recommendProviders(hint);
  return recs[0]?.model ?? "runway/gen4";
}
