/**
 * Seed all 46 shots from prompt-pack.json into videos.json
 * - Preserves existing project metadata
 * - Updates scene headings to match prompt pack
 * - Creates scenes 7–10 (don't exist yet)
 * - Preserves shot 1.1 keyframe if it exists
 * - Maps each prompt-pack shot → project shot with full prompts
 *
 * Run from workspace root: node _tools/seed_from_pack.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";

const VIDEOS_PATH = "11_AdminUI/data/videos.json";
const PACK_PATH = "11_AdminUI/data/prompt-pack.json";
const PROJECT_ID = "prj_brand_incorporation";
const NOW = new Date().toISOString();

function uid(prefix = "shot") {
  return `${prefix}_${randomBytes(4).toString("base64url").slice(0, 8)}`;
}

// Normalize descriptive shot type slugs to the allowed enum values
const VALID_TYPES = new Set(["wide", "medium", "close-up", "insert", "aerial", "ots", "tracking", "macro"]);
function normalizeType(raw) {
  if (VALID_TYPES.has(raw)) return raw;
  const r = raw.toLowerCase();
  if (r.includes("aerial") || r.includes("drone")) return "aerial";
  if (r.includes("macro") || r.includes("ingredient")) return "macro";
  if (r.includes("insert") || r.includes("detail") || r.includes("smartphone") || r.includes("memory")) return "insert";
  if (r.includes("close-up") || r.includes("close") || r.includes("portrait") || r.includes("realization") || r.includes("hands")) return "close-up";
  if (r.includes("tracking") || r.includes("montage") || r.includes("transition")) return "tracking";
  if (r.includes("ots") || r.includes("reverse")) return "ots";
  if (r.includes("wide") || r.includes("establishing") || r.includes("competition") || r.includes("rural") || r.includes("nile")) return "wide";
  // Default: medium for hero shots, arrivals, cultural, taste, etc.
  return "medium";
}

// Load current data
const videos = JSON.parse(readFileSync(VIDEOS_PATH, "utf8"));
const pack = JSON.parse(readFileSync(PACK_PATH, "utf8"));

// Find existing shot 1.1 to preserve its keyframe
const existingShot11 = videos.shots.find(
  (s) => s.projectId === PROJECT_ID && s.number === "1.1"
);

// Build scene map: pack scene number → existing or new scene ID
const sceneMap = new Map();
const updatedScenes = [];

for (const packScene of pack.scenes) {
  const existing = videos.scenes.find(
    (s) => s.projectId === PROJECT_ID && s.number === packScene.number
  );

  if (existing) {
    // Update heading/summary to match prompt pack
    existing.heading = packScene.heading;
    existing.summary = packScene.heading;
    existing.updatedAt = NOW;
    updatedScenes.push(existing);
    sceneMap.set(packScene.number, existing.id);
  } else {
    // Create new scene (7–10)
    const newScene = {
      id: uid("scn"),
      projectId: PROJECT_ID,
      number: packScene.number,
      heading: packScene.heading,
      summary: packScene.heading,
      scriptExcerpt: "",
      sort: packScene.number,
      createdAt: NOW,
      updatedAt: NOW,
    };
    updatedScenes.push(newScene);
    sceneMap.set(packScene.number, newScene.id);
  }
}

// Keep scenes from other projects
const otherScenes = videos.scenes.filter((s) => s.projectId !== PROJECT_ID);
videos.scenes = [...otherScenes, ...updatedScenes];

// Build shots from prompt pack
const newShots = [];
let shotSort = 0;

for (const packScene of pack.scenes) {
  const sceneId = sceneMap.get(packScene.number);

  for (const packShot of packScene.shots) {
    shotSort++;

    // Preserve shot 1.1 keyframe data
    const isShot11 = packShot.number === "1.1" && existingShot11;
    const shotId = isShot11 ? existingShot11.id : uid("shot");

    const shot = {
      id: shotId,
      projectId: PROJECT_ID,
      sceneId,
      number: packShot.number,
      type: normalizeType(packShot.type || "wide"),
      durationSec: packShot.durationSec || 4,
      description: packShot.description || "",
      dialogue: packShot.dialogue || "",
      cameraNotes: packShot.cameraNotes || "",
      prompt: packShot.videoPrompt || "",
      referenceUrls: packShot.refImages || [],
      status: packShot.status || "prompted",
      approvedTakeId: "",
      sort: shotSort,
      // Keyframe data - copy from prompt-pack (has keyframeUrl + seed for all 46 shots)
      keyframeUrl: packShot.keyframeUrl || (isShot11 ? existingShot11.keyframeUrl || "" : ""),
      keyframeApprovedAt: isShot11
        ? existingShot11.keyframeApprovedAt || ""
        : packShot.keyframeUrl ? NOW : "",
      keyframeSeed: packShot.keyframeSeed || (isShot11 ? existingShot11.keyframeSeed || 0 : 0),
      keyframeHistory: isShot11 ? existingShot11.keyframeHistory || [] : [],
      // Audio
      audio: { voLine: "", voice: "", sfxCue: "", voUrl: "", sfxUrl: "" },
      createdAt: isShot11 ? existingShot11.createdAt : NOW,
      updatedAt: NOW,
    };

    newShots.push(shot);
  }
}

// Replace shots for this project, keep others
const otherShots = videos.shots.filter((s) => s.projectId !== PROJECT_ID);
videos.shots = [...otherShots, ...newShots];

// Keep existing takes
// (don't touch videos.takes)

// Update project metadata
const project = videos.projects.find((p) => p.id === PROJECT_ID);
if (project) {
  project.targetDurationSec = pack.scenes.reduce((a, s) => a + s.totalSec, 0);
  project.styleSuffix = pack.project.styleSuffix;
  project.updatedAt = NOW;
}

writeFileSync(VIDEOS_PATH, JSON.stringify(videos, null, 2), "utf8");

console.log(`✅ Seeded ${newShots.length} shots across ${updatedScenes.length} scenes`);
console.log(`   Scenes 7–10 created: ${[7, 8, 9, 10].map((n) => sceneMap.get(n)).join(", ")}`);
console.log(`   Shot 1.1 keyframe preserved: ${!!existingShot11?.keyframeUrl}`);
