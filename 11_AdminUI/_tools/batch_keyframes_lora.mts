/**
 * Batch keyframe generation using fal.ai FLUX with trained character LoRAs.
 *
 * This replaces the old batch_keyframes.mts which used bare Flux.1 Schnell
 * (text-only, no character consistency).
 *
 * This script:
 *  1. Loads trained LoRA URLs from data/character_loras.json
 *  2. For each shot, detects which character LoRAs are needed
 *  3. Generates keyframes via fal-ai/flux-lora with the correct LoRA weights
 *  4. Saves results to public/uploads/generations/ and updates videos.json
 *
 * Prerequisites:
 *  - FAL_KEY set in .env.local
 *  - Trained LoRAs in data/character_loras.json (run train_character_loras.mts first)
 *
 * Usage:
 *   npx tsx _tools/batch_keyframes_lora.mts [--dry-run] [--start=N] [--shot=X.Y]
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

process.loadEnvFile(path.join(import.meta.dirname, "../.env.local"));

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error("❌ FAL_KEY is not set in .env.local");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const startArg = process.argv.find((a) => a.startsWith("--start="));
const START_FROM = startArg ? parseInt(startArg.split("=")[1], 10) : 0;
const shotArg = process.argv.find((a) => a.startsWith("--shot="));
const SINGLE_SHOT = shotArg ? shotArg.split("=")[1] : null;

const VIDEOS_PATH = path.join(import.meta.dirname, "../data/videos.json");
const LORAS_PATH = path.join(import.meta.dirname, "../data/character_loras.json");
const GEN_DIR = path.join(import.meta.dirname, "../public/uploads/generations");
const WIDTH = 1344;
const HEIGHT = 768;
const DELAY_MS = 2000; // rate-limit buffer

/* ---- Types ---- */

interface LoraRecord {
  id: string;
  triggerWord: string;
  loraUrl: string;
  status: string;
}

interface Shot {
  id: string;
  number: string;
  prompt: string;
  description: string;
  keyframeUrl: string;
  keyframeSeed: number;
  keyframeHistory: Array<{ url: string; seed: number; generatedAt: string }>;
  updatedAt: string;
}

/* ---- fal.ai Generation ---- */

function headers(): Record<string, string> {
  return {
    Authorization: `Key ${FAL_KEY}`,
    "Content-Type": "application/json",
  };
}

/**
 * Extract <lora:xxx> tags from a prompt and map them to LoRA URLs.
 * Returns the cleaned prompt (tags removed) and the lora_urls array.
 */
function extractLoras(
  prompt: string,
  loras: Record<string, LoraRecord>,
): { cleanPrompt: string; loraUrls: Array<{ url: string; scale: number }> } {
  const loraUrls: Array<{ url: string; scale: number }> = [];
  const cleanPrompt = prompt.replace(/<lora:([^>]+)>/g, (_, loraId: string) => {
    const record = loras[loraId];
    if (record?.loraUrl && record.status === "completed") {
      loraUrls.push({ url: record.loraUrl, scale: 1.0 });
      // Replace with trigger word
      return record.triggerWord;
    }
    // LoRA not trained yet - just use trigger word as text
    console.log(`    ⚠ LoRA "${loraId}" not ready - using text description only`);
    return record?.triggerWord ?? loraId;
  });

  return { cleanPrompt, loraUrls };
}

/**
 * Generate an image via fal-ai/flux-lora (or fal-ai/flux/dev if no LoRAs).
 */
async function generateWithLora(
  prompt: string,
  loraUrls: Array<{ url: string; scale: number }>,
  seed: number,
): Promise<{ imageUrl: string; seed: number }> {
  const model = loraUrls.length > 0
    ? "fal-ai/flux-lora"
    : "fal-ai/flux/dev";

  const body: Record<string, unknown> = {
    prompt,
    image_size: { width: WIDTH, height: HEIGHT },
    num_images: 1,
    seed,
    guidance_scale: 3.5,
    num_inference_steps: 28,
    enable_safety_checker: false,
  };

  if (loraUrls.length > 0) {
    body.loras = loraUrls.map((l) => ({
      path: l.url,
      scale: l.scale,
    }));
  }

  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json() as {
    images?: Array<{ url: string; content_type?: string }>;
    seed?: number;
  };

  const imageUrl = json.images?.[0]?.url;
  if (!imageUrl) throw new Error("No image URL in response");

  return { imageUrl, seed: json.seed ?? seed };
}

/**
 * Download an image from a URL and save it locally.
 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(outputPath, buffer);
}

/* ---- Main ---- */

async function main() {
  await mkdir(GEN_DIR, { recursive: true });

  // Load LoRAs
  let loras: Record<string, LoraRecord> = {};
  try {
    loras = JSON.parse(await readFile(LORAS_PATH, "utf-8"));
  } catch {
    console.log("⚠ No character_loras.json found - generating without LoRAs (text-only)");
  }

  const readyLoras = Object.values(loras).filter((l) => l.status === "completed");
  console.log(`\n🎨 LoRA-Conditioned Keyframe Generator`);
  console.log(`   Ready LoRAs: ${readyLoras.length} (${readyLoras.map((l) => l.id).join(", ") || "none"})`);
  if (readyLoras.length === 0) {
    console.log(`   ⚠ No trained LoRAs available - images will use text description only`);
    console.log(`   Run train_character_loras.mts first for character consistency\n`);
  }

  // Load videos
  const data = JSON.parse(await readFile(VIDEOS_PATH, "utf-8"));
  let shots: Shot[] = data.shots;

  // Filter
  if (SINGLE_SHOT) {
    shots = shots.filter((s) => s.number === SINGLE_SHOT);
    if (shots.length === 0) {
      console.error(`❌ Shot ${SINGLE_SHOT} not found`);
      process.exit(1);
    }
  } else {
    shots = shots.slice(START_FROM);
  }

  console.log(`   Shots to generate: ${shots.length}`);
  if (DRY_RUN) console.log(`   MODE: DRY RUN\n`);

  let generated = 0;
  let failed = 0;

  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const { cleanPrompt, loraUrls } = extractLoras(shot.prompt || shot.description, loras);
    const seed = shot.keyframeSeed || Math.floor(Math.random() * 999999);
    const loraNames = loraUrls.length > 0
      ? ` [LoRA: ${loraUrls.length}]`
      : " [text-only]";

    console.log(`\n  [${i + 1}/${shots.length}] Shot ${shot.number}${loraNames}`);
    console.log(`    Prompt: ${cleanPrompt.substring(0, 100)}...`);

    if (DRY_RUN) {
      console.log(`    ⏸ Skipped (dry run)`);
      continue;
    }

    try {
      const result = await generateWithLora(cleanPrompt, loraUrls, seed);

      // Download image locally
      const ext = "jpg";
      const filename = `lora_${shot.number.replace(".", "_")}_${randomBytes(3).toString("hex")}.${ext}`;
      const localPath = path.join(GEN_DIR, filename);
      await downloadImage(result.imageUrl, localPath);

      // Update shot in data
      const shotInData = data.shots.find((s: Shot) => s.id === shot.id);
      if (shotInData) {
        // Push old keyframe to history
        if (shotInData.keyframeUrl) {
          if (!shotInData.keyframeHistory) shotInData.keyframeHistory = [];
          shotInData.keyframeHistory.push({
            url: shotInData.keyframeUrl,
            seed: shotInData.keyframeSeed,
            generatedAt: shotInData.updatedAt,
          });
        }
        shotInData.keyframeUrl = `/uploads/generations/${filename}`;
        shotInData.keyframeSeed = result.seed;
        shotInData.keyframeApprovedAt = ""; // Reset approval
        shotInData.updatedAt = new Date().toISOString();
      }

      generated++;
      console.log(`    ✅ Saved: ${filename} (seed: ${result.seed})`);

      // Save progress every 5 shots
      if (generated % 5 === 0) {
        await writeFile(VIDEOS_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
        console.log(`    💾 Progress saved (${generated} done)`);
      }
    } catch (err) {
      failed++;
      console.error(`    ❌ Failed: ${(err as Error).message.slice(0, 150)}`);
    }

    // Rate limit
    if (i < shots.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // Final save
  if (!DRY_RUN && generated > 0) {
    await writeFile(VIDEOS_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
  }

  console.log(`\n━━━ Results ━━━`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Total:     ${shots.length}`);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
