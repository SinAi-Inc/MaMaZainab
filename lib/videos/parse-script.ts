import type { Scene, Shot } from "./schema";

/**
 * Very simple Markdown script → scenes parser.
 *
 * Recognises blocks separated by `---` and pulls the first
 * `**SCENE N**` / `## SCENE N` / `### SCENE N` style heading
 * to determine scene number + heading. Everything else becomes
 * the verbatim excerpt.
 *
 * For shots, looks for either explicit `Shot 1.1`-style markers,
 * or a Markdown table whose first column is the shot number
 * (matching the format used in 05_VideoCampaign/STORYBOARD.md).
 *
 * If no shots can be detected, returns an empty array — the user
 * can add shots manually in the workspace.
 */

const SCENE_RE = /(?:\*\*\s*SCENE\s+(\d+)\s*\*\*|^#{1,4}\s*SCENE\s+(\d+))\s*[-–:]?\s*([^\n*#]*)/im;
const SHOT_LINE_RE = /^\s*\|\s*(\d+\.\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|\n]+)/;

export function parseScript(script: string): {
  scenes: Array<Pick<Scene, "number" | "heading" | "summary" | "scriptExcerpt">>;
  shotsByScene: Record<
    number,
    Array<
      Pick<
        Shot,
        "number" | "type" | "durationSec" | "description"
      >
    >
  >;
} {
  const scenes: Array<
    Pick<Scene, "number" | "heading" | "summary" | "scriptExcerpt">
  > = [];
  const shotsByScene: Record<
    number,
    Array<
      Pick<Shot, "number" | "type" | "durationSec" | "description">
    >
  > = {};

  // Split on horizontal rule
  const blocks = script.split(/\n\s*---+\s*\n/);
  for (const block of blocks) {
    const m = block.match(SCENE_RE);
    if (!m) continue;
    const number = parseInt(m[1] || m[2], 10);
    if (Number.isNaN(number)) continue;

    // Heading: prefer the inline tail captured by the regex, then any
    // EXT./INT. slug line further down.
    const inlineTail = (m[3] || "").trim();
    const slugLine = block
      .split(/\n/)
      .map((l) => l.replace(/[*#]/g, "").trim())
      .find((l) => /^(EXT\.|INT\.|EST\.)/i.test(l));
    const heading = (slugLine || inlineTail).slice(0, 200);

    // Summary: first non-empty paragraph after heading
    const paragraphs = block
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const summary = paragraphs[1]?.replace(/\*\*/g, "").slice(0, 240) || "";

    scenes.push({
      number,
      heading,
      summary,
      scriptExcerpt: block.trim(),
    });

    // Shot table parsing: lines like `| 1.1 | Aerial wide | 4s | Slow descent ...`
    const shots: Array<
      Pick<Shot, "number" | "type" | "durationSec" | "description">
    > = [];
    for (const line of block.split(/\n/)) {
      const sm = line.match(SHOT_LINE_RE);
      if (!sm) continue;
      const [, num, typeRaw, durRaw, desc] = sm;
      shots.push({
        number: num,
        type: normaliseType(typeRaw.trim()),
        durationSec: parseDuration(durRaw.trim()),
        description: desc.trim(),
      });
    }
    // Fallback: synthesise a single master shot from the scene summary
    // so the user has somewhere to start generating.
    if (!shots.length && summary) {
      shots.push({
        number: `${number}.1`,
        type: "wide",
        durationSec: 6,
        description: summary,
      });
    }
    if (shots.length) shotsByScene[number] = shots;
  }

  return { scenes, shotsByScene };
}

function normaliseType(s: string): Shot["type"] {
  const x = s.toLowerCase();
  if (x.includes("aerial") || x.includes("drone")) return "aerial";
  if (x.includes("wide")) return "wide";
  if (x.includes("close")) return "close-up";
  if (x.includes("insert")) return "insert";
  if (x.includes("ots")) return "ots";
  if (x.includes("track")) return "tracking";
  if (x.includes("macro")) return "macro";
  return "medium";
}

function parseDuration(s: string): number {
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 4;
}
