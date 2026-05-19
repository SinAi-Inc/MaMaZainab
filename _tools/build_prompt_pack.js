#!/usr/bin/env node
/**
 * Parse MaMa_Zainab_Keyframe_Storyboard.md (46 shots, 10 scenes)
 * into data/prompt-pack.json for the Studio PresetPicker.
 *
 * Run: node _tools/build_prompt_pack.js
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const STORYBOARD_PATH = path.resolve(__dirname, "../04_Scripts/MaMa_Zainab_Keyframe_Storyboard.md");
const OUTPUT_PATH = path.resolve(__dirname, "../11_AdminUI/data/prompt-pack.json");

const md = fs.readFileSync(STORYBOARD_PATH, "utf-8");

// ─── Project metadata ───────────────────────────────────────────────────────

const project = {
  id: "prj_brand_legend_v2",
  title: "Brand Incorporation — The Legend of Wong & MaMa Zainab (Full 10-Scene)",
  logline: "An exiled warrior arrives in Egypt, and an AI tells him to build a comfort-food empire named after every Egyptian's mother.",
  aspectRatio: "2.39:1",
  targetRuntime: "3:30",
  defaultModel: "black-forest-labs/flux.1-dev",
  styleSuffix: "shot on ARRI Alexa 35, anamorphic 2.39:1, cinematic color grade, warm Mediterranean highlights + cool teal shadows, volumetric haze, photoreal, film grain, no text overlay",
  negativePrompt: "no logos, no readable text, no watermarks, no warped faces, no extra fingers, no duplicated characters, no deformed hands, no plastic skin, no AI artifact shimmer, no cartoon, no anime, no 3D CGI render, no low-resolution artifacts",
};

// ─── Characters ─────────────────────────────────────────────────────────────

const characters = {
  wong: {
    description: "East-Asian man in his 60s, silver-streaked hair tied back loosely, weathered face, subtle scars, calm dangerous eyes, dark silken warrior robes in dramatic scenes, cream linen suit in public/founder scenes",
    refImage: "/brand/chars/wong-hong.png",
  },
  zainab: {
    description: "Egyptian woman in her late 50s, warm kind face, olive skin, soft dark eyes, cream headscarf, simple gold hoop earrings, green-base plaid apron with yellow stripes and white weft, flour-dusted capable hands",
    refImage: "/brand/chars/mama-zainab.jpeg",
  },
  zuzu: {
    description: "plump photoreal white domestic goose, clean fluffy feathers, amber eyes, vivid orange beak and feet, tiny green plaid ribbon only, never dressed anthropomorphically",
    refImage: "/brand/chars/zuzu.jpeg",
  },
  ghost: {
    description: "translucent luminous-green younger version of an Egyptian woman, pale #1B9B00 green glow, wind-blown",
    refImage: "",
  },
};

// ─── Parse scenes ───────────────────────────────────────────────────────────

// Scene heading pattern: # **SCENE N — TITLE**
const sceneHeadingRe = /^#\s+\*\*SCENE\s+(\d+)\s*[—–-]\s*(.+?)\*\*/gm;
// Shot row pattern: | 1.1 | Type | 4s | Description |
const shotRowRe = /^\|\s*(\d+\.\d+)\s*\|\s*(.+?)\s*\|\s*(\d+)s\s*\|\s*(.+?)\s*\|$/gm;

// Split the file into scene blocks first
const sceneHeaders = [];
let match;
while ((match = sceneHeadingRe.exec(md)) !== null) {
  sceneHeaders.push({
    number: parseInt(match[1]),
    title: match[2].trim(),
    index: match.index,
  });
}

// Location/setting subheading (appears below scene heading)
const locationRe = /\*\*(.+?)\*\*/;

function nanoid(len = 8) {
  return crypto.randomBytes(len).toString("base64url").slice(0, len);
}

// Character detection from shot description
function detectCharacters(desc) {
  const chars = [];
  const lower = desc.toLowerCase();
  if (lower.includes("wong") || lower.includes("warrior-robed") || lower.includes("east-asian man")) chars.push("wong");
  if (lower.includes("mama zainab") || lower.includes("zainab") || lower.includes("plaid apron")) chars.push("zainab");
  if (lower.includes("zuzu") || lower.includes("goose") || lower.includes("white goose")) chars.push("zuzu");
  return chars;
}

function buildRefImages(chars) {
  const map = { wong: "/brand/chars/wong-hong.png", zainab: "/brand/chars/mama-zainab.jpeg", zuzu: "/brand/chars/zuzu.jpeg" };
  return chars.map((c) => map[c]).filter(Boolean);
}

const scenes = [];

for (let i = 0; i < sceneHeaders.length; i++) {
  const header = sceneHeaders[i];
  const nextIndex = i + 1 < sceneHeaders.length ? sceneHeaders[i + 1].index : md.length;
  const block = md.slice(header.index, nextIndex);

  // Parse shot rows from this scene's block
  const shots = [];
  let shotMatch;
  const localShotRe = /^\|\s*(\d+\.\d+)\s*\|\s*(.+?)\s*\|\s*(\d+)s\s*\|\s*(.+?)\s*\|$/gm;
  while ((shotMatch = localShotRe.exec(block)) !== null) {
    const number = shotMatch[1];
    const type = shotMatch[2].trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const durationSec = parseInt(shotMatch[3]);
    const description = shotMatch[4].trim();
    const chars = detectCharacters(description);

    // Build imagePrompt: description + style suffix (for brand-locked generation)
    const imagePrompt = `${description} ${project.styleSuffix}`;
    // Build videoPrompt: add duration/aspect/negative
    const videoPrompt = `${description} Duration: ${durationSec}s. Aspect: ${project.aspectRatio}. ${project.styleSuffix}. ${project.negativePrompt}`;

    shots.push({
      id: `shot_${nanoid(8)}`,
      number,
      type,
      durationSec,
      description,
      dialogue: "",
      cameraNotes: "",
      characters: chars,
      refImages: buildRefImages(chars),
      videoPrompt,
      imagePrompt,
      status: "prompted",
    });
  }

  const totalSec = shots.reduce((sum, s) => sum + s.durationSec, 0);

  scenes.push({
    id: `scn_${nanoid(8)}`,
    number: header.number,
    heading: `SCENE ${header.number} — ${header.title}`,
    totalSec,
    shots,
  });
}

// ─── Assemble & write ───────────────────────────────────────────────────────

const pack = { project, characters, scenes };

// Verify counts
const totalShots = scenes.reduce((s, sc) => s + sc.shots.length, 0);
console.log(`✓ Parsed ${scenes.length} scenes, ${totalShots} shots`);
scenes.forEach((s) => console.log(`  Scene ${s.number}: ${s.shots.length} shots (${s.totalSec}s)`));

if (totalShots !== 46) {
  console.warn(`⚠ Expected 46 shots, got ${totalShots}`);
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(pack, null, 2) + "\n", "utf-8");
console.log(`\n✓ Written to ${OUTPUT_PATH}`);
