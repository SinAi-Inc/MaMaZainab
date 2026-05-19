/**
 * Train character LoRAs on fal.ai for consistent brand character generation.
 *
 * This script:
 *  1. Collects reference images for each character
 *  2. Uploads them to fal.ai's training endpoint
 *  3. Trains a FLUX LoRA (~5-15 min per character)
 *  4. Saves the LoRA URLs to data/character_loras.json
 *
 * Prerequisites:
 *  - FAL_KEY set in .env.local
 *  - Reference images in public/uploads/chars/ and 02_Characters/
 *
 * Usage:
 *   npx tsx _tools/train_character_loras.mts [--character mama_zainab|wong_warrior|wong_banker|zuzu]
 *   npx tsx _tools/train_character_loras.mts --status   (check training status)
 *
 * After training completes, the LoRA weights URL is stored in:
 *   data/character_loras.json
 *
 * These URLs are then used by the keyframe generator to produce
 * character-consistent images.
 */
import { readFile, writeFile, readdir } from "fs/promises";
import path from "path";
import { createReadStream } from "fs";

process.loadEnvFile(path.join(import.meta.dirname, "../.env.local"));

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error("❌ FAL_KEY is not set in .env.local");
  console.error("   Sign up at https://fal.ai → Dashboard → Keys → Create key");
  console.error("   Then add FAL_KEY=fal-... to 11_AdminUI/.env.local");
  process.exit(1);
}

const LORAS_PATH = path.join(import.meta.dirname, "../data/character_loras.json");
const CHARS_DIR = path.resolve(import.meta.dirname, "../../02_Characters");
const UPLOADS_DIR = path.join(import.meta.dirname, "../public/uploads/chars");

/* ---- Character definitions ---- */

interface CharacterTrainingDef {
  id: string;
  triggerWord: string;
  label: string;
  /** Captions for training — what the model learns to associate with the trigger */
  caption: string;
  /** Paths to reference images (relative to workspace root or absolute) */
  imagePaths: string[];
}

const CHARACTERS: CharacterTrainingDef[] = [
  {
    id: "mama_zainab",
    triggerWord: "mama_zainab",
    label: "MaMa Zainab",
    caption: "mama_zainab, Egyptian woman in her late 50s, warm kind face, soft dark eyes, gentle smile lines, olive skin, cream headscarf, GREEN-base plaid apron with yellow stripes and white weft, simple gold hoop earrings, silver wedding band, flour-dusted hands, dignified matriarchal presence",
    imagePaths: [
      path.join(UPLOADS_DIR, "L3SP6ixQDt.jpg"),    // Primary ref
      path.join(CHARS_DIR, "MaMaZainabFinal.png"),
      path.join(CHARS_DIR, "MaMaZainab.jpg"),
      path.join(CHARS_DIR, "MaMaZainab.png"),
      path.join(CHARS_DIR, "MaMaYellowZainab.jpg"),
      path.join(CHARS_DIR, "2026-04-30 at 2.02.56 PM.jpeg"),
    ],
  },
  {
    id: "wong_warrior",
    triggerWord: "wong_warrior",
    label: "Wong (Warrior Mode)",
    caption: "wong_warrior, East-Asian man in his 60s, salt-and-pepper hair tied back loosely, weathered face with subtle old fight scars, calm dangerous eyes, dark silken warrior robes, coiled dangerous stillness, dignified silent presence",
    imagePaths: [
      path.join(UPLOADS_DIR, "YEcQAWdIki.jpg"),    // Primary warrior ref
      path.join(CHARS_DIR, "WongHong.png"),
      path.join(CHARS_DIR, "Wong.jpg"),
      path.join(CHARS_DIR, "Wong.png"),
      path.join(CHARS_DIR, "WongWarrior.jpg"),
      path.join(CHARS_DIR, "WongCollage.png"),
    ],
  },
  {
    id: "wong_banker",
    triggerWord: "wong_banker",
    label: "Wong (Banker/Founder Mode)",
    caption: "wong_banker, East-Asian man in his 60s, salt-and-pepper hair tied back, weathered face with subtle scars, calm warm eyes, crisp cream linen suit, no tie, polished shoes, dignified founder executive presence, calm and at home",
    imagePaths: [
      path.join(UPLOADS_DIR, "hyoRbUUPTY.jpg"),    // Primary banker ref
      path.join(CHARS_DIR, "IsolatedWong.png"),
      path.join(CHARS_DIR, "IsolatedWongAfter.jpg"),
      path.join(CHARS_DIR, "WongAfter.jpg"),
      path.join(CHARS_DIR, "WongBeforeAfter.jpg"),
      path.join(UPLOADS_DIR, "8bWy0tL7k-.jpg"),
    ],
  },
  {
    id: "zuzu",
    triggerWord: "zuzu",
    label: "ZuZu the Goose",
    caption: "zuzu, plump healthy white domestic goose, hyperreal fluffy clean feathers, alert curious posture, expressive amber eyes, vivid orange beak and feet, tiny ribbon around neck made of green-base plaid fabric, slight comedic personality, photoreal feather detail",
    imagePaths: [
      path.join(CHARS_DIR, "ZuZu.PNG"),
      path.join(CHARS_DIR, "ZuZuThumbsUp.jpg"),
      path.join(CHARS_DIR, "ZuZuThumbsUp.PNG"),
      path.join(UPLOADS_DIR, "zudXHgBfRi.jpg") || path.join(import.meta.dirname, "../public/brand/chars/zuzu.jpeg"),
    ],
  },
];

/* ---- fal.ai API helpers ---- */

const FAL_BASE = "https://queue.fal.run";
const FAL_UPLOAD = "https://fal.ai/api/storage/upload/url"; // pre-signed upload
const FAL_STORAGE = "https://v3.fal.media"; // file storage

function headers(): Record<string, string> {
  return {
    Authorization: `Key ${FAL_KEY}`,
    "Content-Type": "application/json",
  };
}

/**
 * Upload a local file to fal.ai storage and get a CDN URL back.
 */
async function uploadToFal(filePath: string): Promise<string> {
  const fileName = path.basename(filePath);
  const fileData = await readFile(filePath);
  const contentType = fileName.endsWith(".png")
    ? "image/png"
    : fileName.endsWith(".jpeg") || fileName.endsWith(".jpg")
    ? "image/jpeg"
    : "image/png";

  // Step 1: Get pre-signed upload URL
  const initRes = await fetch("https://rest.alpha.fal.ai/storage/upload/initiate", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      file_name: fileName,
      content_type: contentType,
    }),
  });

  if (!initRes.ok) {
    // Fallback: use the direct upload endpoint
    const uploadRes = await fetch("https://fal.run/fal-ai/workflows/upload", {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": contentType,
        "X-Fal-File-Name": fileName,
      },
      body: fileData,
    });
    if (!uploadRes.ok) {
      throw new Error(`Upload failed for ${fileName}: ${uploadRes.status} ${await uploadRes.text()}`);
    }
    const uploadJson = await uploadRes.json() as { url?: string; file_url?: string };
    return uploadJson.url || uploadJson.file_url || "";
  }

  const initJson = await initRes.json() as { upload_url: string; file_url: string };

  // Step 2: PUT the file to the pre-signed URL
  const putRes = await fetch(initJson.upload_url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: fileData,
  });

  if (!putRes.ok) {
    throw new Error(`PUT upload failed for ${fileName}: ${putRes.status}`);
  }

  return initJson.file_url;
}

/**
 * Submit a LoRA training job to fal.ai.
 * Model: fal-ai/flux-lora-general-training
 */
async function submitTraining(char: CharacterTrainingDef, imageUrls: string[]): Promise<string> {
  const body = {
    images_data_url: imageUrls.map((url) => ({
      url,
      caption: char.caption,
    })),
    trigger_word: char.triggerWord,
    steps: 1000,
    learning_rate: 0.0001,
    // Use rank 16 for good quality/speed balance
    rank: 16,
    caption_prefix: "",
    resolution: "1024",
  };

  console.log(`  📤 Submitting training for "${char.label}" (${imageUrls.length} images, 1000 steps)...`);

  const res = await fetch(`${FAL_BASE}/fal-ai/flux-lora-general-training`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Training submit failed: ${res.status} — ${text.slice(0, 500)}`);
  }

  const json = await res.json() as { request_id: string; status?: string };
  if (!json.request_id) {
    throw new Error(`No request_id returned: ${JSON.stringify(json)}`);
  }

  return json.request_id;
}

/**
 * Check training status.
 */
async function checkStatus(requestId: string): Promise<{ status: string; result?: unknown }> {
  const res = await fetch(
    `${FAL_BASE}/fal-ai/flux-lora-general-training/requests/${requestId}/status`,
    { headers: headers() },
  );

  if (!res.ok) {
    return { status: "error" };
  }

  const json = await res.json() as { status: string; response_url?: string };

  if (json.status === "COMPLETED" && json.response_url) {
    // Fetch the result
    const resultRes = await fetch(json.response_url, { headers: headers() });
    const result = await resultRes.json();
    return { status: "completed", result };
  }

  return { status: json.status?.toLowerCase() ?? "unknown" };
}

/* ---- Main ---- */

interface LoraRecord {
  id: string;
  label: string;
  triggerWord: string;
  loraUrl: string;
  requestId: string;
  status: "training" | "completed" | "failed";
  trainedAt: string;
  imageCount: number;
}

async function loadLoras(): Promise<Record<string, LoraRecord>> {
  try {
    return JSON.parse(await readFile(LORAS_PATH, "utf-8"));
  } catch {
    return {};
  }
}

async function saveLoras(loras: Record<string, LoraRecord>): Promise<void> {
  await writeFile(LORAS_PATH, JSON.stringify(loras, null, 2) + "\n", "utf-8");
}

async function main() {
  const args = process.argv.slice(2);
  const statusMode = args.includes("--status");
  const charFilter = args.find((a) => a.startsWith("--character="))?.split("=")[1];

  const loras = await loadLoras();

  if (statusMode) {
    console.log("\n📊 LoRA Training Status:\n");
    for (const [id, record] of Object.entries(loras)) {
      if (record.status === "training" && record.requestId) {
        const check = await checkStatus(record.requestId);
        if (check.status === "completed") {
          const result = check.result as { diffusers_lora_file?: { url: string } };
          record.status = "completed";
          record.loraUrl = result?.diffusers_lora_file?.url ?? "";
          console.log(`  ✅ ${record.label}: COMPLETED`);
          console.log(`     LoRA URL: ${record.loraUrl}`);
        } else {
          console.log(`  ⏳ ${record.label}: ${check.status}`);
        }
      } else {
        const icon = record.status === "completed" ? "✅" : record.status === "failed" ? "❌" : "⏳";
        console.log(`  ${icon} ${record.label}: ${record.status}`);
        if (record.loraUrl) console.log(`     LoRA URL: ${record.loraUrl}`);
      }
    }
    await saveLoras(loras);
    return;
  }

  // Filter characters if --character specified
  const targets = charFilter
    ? CHARACTERS.filter((c) => c.id === charFilter)
    : CHARACTERS;

  if (targets.length === 0) {
    console.error(`❌ Unknown character: ${charFilter}`);
    console.error(`   Available: ${CHARACTERS.map((c) => c.id).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n🎨 Character LoRA Training Pipeline`);
  console.log(`   Target: ${targets.map((c) => c.label).join(", ")}\n`);

  for (const char of targets) {
    console.log(`\n━━━ ${char.label} (trigger: "${char.triggerWord}") ━━━`);

    // Check which images actually exist
    const { existsSync } = await import("fs");
    const validPaths = char.imagePaths.filter((p) => {
      const exists = existsSync(p);
      if (!exists) console.log(`  ⚠ Missing: ${path.basename(p)}`);
      return exists;
    });

    if (validPaths.length < 3) {
      console.log(`  ❌ Need at least 3 images, found ${validPaths.length}. Skipping.`);
      loras[char.id] = {
        id: char.id,
        label: char.label,
        triggerWord: char.triggerWord,
        loraUrl: "",
        requestId: "",
        status: "failed",
        trainedAt: new Date().toISOString(),
        imageCount: validPaths.length,
      };
      continue;
    }

    console.log(`  📁 Found ${validPaths.length} reference images`);

    // Upload images to fal.ai
    console.log(`  📤 Uploading to fal.ai storage...`);
    const imageUrls: string[] = [];
    for (const imgPath of validPaths) {
      try {
        const url = await uploadToFal(imgPath);
        imageUrls.push(url);
        console.log(`     ✓ ${path.basename(imgPath)}`);
      } catch (err) {
        console.log(`     ✗ ${path.basename(imgPath)}: ${(err as Error).message.slice(0, 80)}`);
      }
    }

    if (imageUrls.length < 3) {
      console.log(`  ❌ Only ${imageUrls.length} images uploaded successfully. Need 3+. Skipping.`);
      continue;
    }

    // Submit training
    try {
      const requestId = await submitTraining(char, imageUrls);
      console.log(`  ✅ Training submitted! Request ID: ${requestId}`);
      console.log(`     Training typically takes 5-15 minutes.`);
      console.log(`     Check status: npx tsx _tools/train_character_loras.mts --status`);

      loras[char.id] = {
        id: char.id,
        label: char.label,
        triggerWord: char.triggerWord,
        loraUrl: "",
        requestId,
        status: "training",
        trainedAt: new Date().toISOString(),
        imageCount: imageUrls.length,
      };
    } catch (err) {
      console.error(`  ❌ Training failed: ${(err as Error).message}`);
      loras[char.id] = {
        id: char.id,
        label: char.label,
        triggerWord: char.triggerWord,
        loraUrl: "",
        requestId: "",
        status: "failed",
        trainedAt: new Date().toISOString(),
        imageCount: imageUrls.length,
      };
    }
  }

  await saveLoras(loras);
  console.log(`\n💾 Status saved to ${LORAS_PATH}`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Wait 5-15 minutes for training to complete`);
  console.log(`   2. Run: npx tsx _tools/train_character_loras.mts --status`);
  console.log(`   3. Once all LoRAs are "completed", run the keyframe generator`);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
