/**
 * Batch keyframe generation for all 46 shots.
 * Uses NVIDIA Flux.1 Schnell via the project's generateImage client.
 * Handles CONTENT_FILTERED by simplifying the prompt and retrying.
 *
 * Usage: npx tsx _tools/batch_keyframes.mts [--dry-run] [--start N]
 */
import { generateImage } from "../lib/nvidia/client.js";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

process.loadEnvFile(path.join(import.meta.dirname, "../.env.local"));

const DRY_RUN = process.argv.includes("--dry-run");
const startArg = process.argv.find((a) => a.startsWith("--start="));
const START_FROM = startArg ? parseInt(startArg.split("=")[1], 10) : 0;

const VIDEOS_PATH = path.join(import.meta.dirname, "../data/videos.json");
const GEN_DIR = path.join(import.meta.dirname, "../public/uploads/generations");
const MODEL = "black-forest-labs/flux.1-schnell" as const;
const WIDTH = 1344;
const HEIGHT = 768;
const DELAY_MS = 1500; // rate-limit buffer between calls

interface Shot {
  id: string;
  number: string;
  prompt: string;
  description: string;
  keyframeUrl: string;
  keyframeSeed: number;
  updatedAt: string;
}

/**
 * Extra simplification for prompts that get CONTENT_FILTERED.
 * Removes emotional/violent/dramatic descriptors.
 */
function simplifyForRetry(prompt: string): string {
  return prompt
    .replace(/\b(torrential|violent|explosive|blood|weapon|dark|sinister|menacing|ominous)\b/gi, "")
    .replace(/\b(rain-soaked|rain-drenched|storm-battered)\b/gi, "rainy")
    .replace(/\b(descending toward|plunging|diving|falling)\b/gi, "approaching")
    .replace(/\b(isolated|abandoned|desolate)\b/gi, "quiet")
    .replace(/\b(rooftop|ledge|edge)\b/gi, "building top")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function generateWithRetry(prompt: string, seed: number): Promise<{ image: string; contentType: string; seed: number }> {
  try {
    return await generateImage({ model: MODEL, prompt, width: WIDTH, height: HEIGHT, seed });
  } catch (err) {
    if (err instanceof Error && err.message.includes("CONTENT_FILTERED")) {
      console.log("    ⚠ CONTENT_FILTERED - retrying with simplified prompt...");
      const simplified = simplifyForRetry(prompt);
      try {
        return await generateImage({ model: MODEL, prompt: simplified, width: WIDTH, height: HEIGHT, seed });
      } catch (err2) {
        if (err2 instanceof Error && err2.message.includes("CONTENT_FILTERED")) {
          // Final attempt: use just the first sentence of the description
          const minimal = prompt.split(/[.,]/)[0] + ", cinematic, photorealistic, 16:9";
          console.log("    ⚠ Still filtered - trying minimal prompt:", minimal.substring(0, 80) + "...");
          return await generateImage({ model: MODEL, prompt: minimal, width: WIDTH, height: HEIGHT, seed });
        }
        throw err2;
      }
    }
    throw err;
  }
}

async function main() {
  await mkdir(GEN_DIR, { recursive: true });

  const data = JSON.parse(await readFile(VIDEOS_PATH, "utf8"));
  const shots: Shot[] = data.shots;

  const pending = shots.filter((s, i) => !s.keyframeUrl && i >= START_FROM);
  console.log(`\n🎬 Batch Keyframe Generation`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Resolution: ${WIDTH}×${HEIGHT}`);
  console.log(`   Total shots: ${shots.length}`);
  console.log(`   Already generated: ${shots.filter((s) => s.keyframeUrl).length}`);
  console.log(`   To generate: ${pending.length}`);
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  if (DRY_RUN) {
    pending.forEach((s) => console.log(`  Would generate: Shot ${s.number}`));
    return;
  }

  let success = 0;
  let failed = 0;

  for (const shot of pending) {
    const idx = shots.indexOf(shot);
    const prompt = shot.prompt || shot.description;
    console.log(`[${shot.number}] Generating keyframe...`);

    try {
      const seed = Math.floor(Math.random() * 2_000_000_000);
      const result = await generateWithRetry(prompt, seed);

      const ext = result.contentType.includes("png") ? "png" : "jpg";
      const filename = `${randomBytes(8).toString("hex")}.${ext}`;
      const filePath = path.join(GEN_DIR, filename);
      await writeFile(filePath, Buffer.from(result.image, "base64"));

      // Update in-memory data
      shots[idx].keyframeUrl = `/uploads/generations/${filename}`;
      shots[idx].keyframeSeed = result.seed || seed;
      shots[idx].updatedAt = new Date().toISOString();

      const size = Buffer.from(result.image, "base64").length;
      console.log(`    ✓ ${filename} (${(size / 1024).toFixed(0)} KB, seed: ${result.seed || seed})`);
      success++;

      // Save progress every 5 shots
      if (success % 5 === 0) {
        await writeFile(VIDEOS_PATH, JSON.stringify(data, null, 2));
        console.log(`    💾 Progress saved (${success} keyframes so far)`);
      }
    } catch (err) {
      console.log(`    ✗ FAILED: ${err instanceof Error ? err.message : err}`);
      failed++;
    }

    // Rate limit
    if (pending.indexOf(shot) < pending.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // Final save
  await writeFile(VIDEOS_PATH, JSON.stringify(data, null, 2));
  console.log(`\n✅ Complete: ${success} generated, ${failed} failed, ${shots.filter((s) => s.keyframeUrl).length}/${shots.length} total`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
