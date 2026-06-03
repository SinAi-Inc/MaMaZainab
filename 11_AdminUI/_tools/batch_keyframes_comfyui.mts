/**
 * Batch keyframe generation using ComfyUI + local LoRA .safetensors files.
 *
 * This is the Brev/local alternative to batch_keyframes_lora.mts (which uses fal.ai).
 * It connects to a ComfyUI instance (on Brev or local) that has the trained LoRA
 * .safetensors files in its models/loras/ directory.
 *
 * Flow:
 *  1. Connects to ComfyUI WebSocket API
 *  2. For each shot, builds a FLUX + LoRA workflow
 *  3. Queues the prompt, waits for the image
 *  4. Downloads and saves the result
 *
 * Prerequisites:
 *  - ComfyUI running with FLUX.1 Dev + trained LoRA files in models/loras/
 *  - Set COMFYUI_BASE_URL in .env.local (e.g., http://brev-instance:8188)
 *  - Trained LoRA files named: mama_zainab.safetensors, wong_warrior.safetensors, etc.
 *
 * Usage:
 *   npx tsx _tools/batch_keyframes_comfyui.mts [--dry-run] [--shot=X.Y]
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import WebSocket from "ws";

process.loadEnvFile(path.join(import.meta.dirname, "../.env.local"));

const COMFYUI_URL = process.env.COMFYUI_BASE_URL || "http://127.0.0.1:8188";
const DRY_RUN = process.argv.includes("--dry-run");
const shotArg = process.argv.find((a) => a.startsWith("--shot="));
const SINGLE_SHOT = shotArg ? shotArg.split("=")[1] : null;

const VIDEOS_PATH = path.join(import.meta.dirname, "../data/videos.json");
const GEN_DIR = path.join(import.meta.dirname, "../public/uploads/generations");
const CLIENT_ID = randomBytes(8).toString("hex");

const WIDTH = 1344;
const HEIGHT = 768;
const STEPS = 28;
const CFG = 3.5;

/* ---- LoRA mapping ---- */

const LORA_FILES: Record<string, string> = {
  mama_zainab: "mama_zainab.safetensors",
  wong_warrior: "wong_warrior.safetensors",
  wong_banker: "wong_banker.safetensors",
  zuzu: "zuzu.safetensors",
};

/* ---- ComfyUI Workflow Builder ---- */

function buildFluxLoraWorkflow(
  prompt: string,
  loraNames: string[],
  seed: number,
): Record<string, unknown> {
  // Build a FLUX.1 Dev workflow with optional LoRA nodes
  const workflow: Record<string, unknown> = {};
  let lastModelNode = "1"; // Model loader node

  // Node 1: Load FLUX checkpoint
  workflow["1"] = {
    class_type: "UNETLoader",
    inputs: {
      unet_name: "flux1-dev-fp8.safetensors",
      weight_dtype: "fp8_e4m3fn",
    },
  };

  // Node 2: CLIP loader (dual - T5 + CLIP-L for FLUX)
  workflow["2"] = {
    class_type: "DualCLIPLoader",
    inputs: {
      clip_name1: "t5xxl_fp8_e4m3fn.safetensors",
      clip_name2: "clip_l.safetensors",
      type: "flux",
    },
  };

  // Node 3: VAE loader
  workflow["3"] = {
    class_type: "VAELoader",
    inputs: { vae_name: "ae.safetensors" },
  };

  // LoRA nodes (chained)
  let nodeId = 10;
  for (const loraFile of loraNames) {
    workflow[String(nodeId)] = {
      class_type: "LoraLoader",
      inputs: {
        lora_name: loraFile,
        strength_model: 1.0,
        strength_clip: 1.0,
        model: [lastModelNode, 0],
        clip: ["2", 0],
      },
    };
    lastModelNode = String(nodeId);
    nodeId++;
  }

  // Node 20: CLIP Text Encode (positive prompt)
  workflow["20"] = {
    class_type: "CLIPTextEncode",
    inputs: {
      text: prompt,
      clip: loraNames.length > 0 ? [String(nodeId - 1), 1] : ["2", 0],
    },
  };

  // Node 21: Empty latent
  workflow["21"] = {
    class_type: "EmptyLatentImage",
    inputs: { width: WIDTH, height: HEIGHT, batch_size: 1 },
  };

  // Node 22: KSampler (FlowMatch for FLUX)
  workflow["22"] = {
    class_type: "KSampler",
    inputs: {
      seed,
      steps: STEPS,
      cfg: CFG,
      sampler_name: "euler",
      scheduler: "simple",
      denoise: 1.0,
      model: [lastModelNode, 0],
      positive: ["20", 0],
      negative: ["23", 0],
      latent_image: ["21", 0],
    },
  };

  // Node 23: Empty negative (FLUX doesn't use negative but API needs it)
  workflow["23"] = {
    class_type: "CLIPTextEncode",
    inputs: {
      text: "",
      clip: loraNames.length > 0 ? [String(nodeId - 1), 1] : ["2", 0],
    },
  };

  // Node 24: VAE Decode
  workflow["24"] = {
    class_type: "VAEDecode",
    inputs: {
      samples: ["22", 0],
      vae: ["3", 0],
    },
  };

  // Node 25: Save Image
  workflow["25"] = {
    class_type: "SaveImage",
    inputs: {
      filename_prefix: "mamazainab",
      images: ["24", 0],
    },
  };

  return workflow;
}

/* ---- ComfyUI API helpers ---- */

async function queuePrompt(workflow: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${COMFYUI_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: CLIENT_ID }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ComfyUI queue failed: ${res.status} - ${text.slice(0, 200)}`);
  }

  const json = await res.json() as { prompt_id: string };
  return json.prompt_id;
}

async function waitForCompletion(promptId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const wsUrl = COMFYUI_URL.replace("http", "ws") + `/ws?clientId=${CLIENT_ID}`;
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Timeout waiting for ComfyUI (120s)"));
    }, 120_000);

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "executed" && msg.data?.prompt_id === promptId) {
          clearTimeout(timeout);
          ws.close();
          resolve();
        }
        if (msg.type === "execution_error" && msg.data?.prompt_id === promptId) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(`ComfyUI execution error: ${JSON.stringify(msg.data).slice(0, 200)}`));
        }
      } catch { /* ignore non-JSON */ }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function getOutputImage(promptId: string): Promise<Buffer> {
  const historyRes = await fetch(`${COMFYUI_URL}/history/${promptId}`);
  const history = await historyRes.json() as Record<string, { outputs: Record<string, { images: Array<{ filename: string; subfolder: string; type: string }> }> }>;

  const outputs = history[promptId]?.outputs;
  if (!outputs) throw new Error("No outputs in history");

  // Find the SaveImage node output
  for (const nodeOutput of Object.values(outputs)) {
    if (nodeOutput.images?.length > 0) {
      const img = nodeOutput.images[0];
      const imgRes = await fetch(
        `${COMFYUI_URL}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`,
      );
      if (!imgRes.ok) throw new Error("Failed to download image from ComfyUI");
      return Buffer.from(await imgRes.arrayBuffer());
    }
  }
  throw new Error("No images in ComfyUI output");
}

/* ---- Extract LoRA tags from prompt ---- */

function extractLoras(prompt: string): { cleanPrompt: string; loraFiles: string[] } {
  const loraFiles: string[] = [];
  const cleanPrompt = prompt.replace(/<lora:([^>]+)>/g, (_, loraId: string) => {
    const file = LORA_FILES[loraId];
    if (file) {
      loraFiles.push(file);
      return loraId; // Replace tag with trigger word
    }
    return loraId;
  });
  return { cleanPrompt, loraFiles };
}

/* ---- Main ---- */

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

async function main() {
  await mkdir(GEN_DIR, { recursive: true });

  // Verify ComfyUI is reachable
  try {
    const check = await fetch(`${COMFYUI_URL}/system_stats`);
    if (!check.ok) throw new Error(`Status ${check.status}`);
    const stats = await check.json() as { system?: { vram_total?: number } };
    const vramGB = ((stats?.system?.vram_total ?? 0) / 1e9).toFixed(1);
    console.log(`✅ ComfyUI connected: ${COMFYUI_URL} (VRAM: ${vramGB}GB)`);
  } catch (err) {
    console.error(`❌ Cannot reach ComfyUI at ${COMFYUI_URL}`);
    console.error(`   Make sure ComfyUI is running. Error: ${(err as Error).message}`);
    console.error(`   Set COMFYUI_BASE_URL in .env.local if not localhost:8188`);
    process.exit(1);
  }

  // Load videos
  const data = JSON.parse(await readFile(VIDEOS_PATH, "utf-8"));
  let shots: Shot[] = data.shots;

  if (SINGLE_SHOT) {
    shots = shots.filter((s) => s.number === SINGLE_SHOT);
  }

  console.log(`\n🎨 ComfyUI + LoRA Keyframe Generator`);
  console.log(`   Shots: ${shots.length}`);
  if (DRY_RUN) console.log(`   MODE: DRY RUN\n`);

  let generated = 0;
  let failed = 0;

  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const { cleanPrompt, loraFiles } = extractLoras(shot.prompt || shot.description);
    const seed = shot.keyframeSeed || Math.floor(Math.random() * 999999);
    const loraLabel = loraFiles.length > 0 ? ` [LoRA: ${loraFiles.join(", ")}]` : " [no LoRA]";

    console.log(`\n  [${i + 1}/${shots.length}] Shot ${shot.number}${loraLabel}`);

    if (DRY_RUN) {
      console.log(`    Prompt: ${cleanPrompt.substring(0, 80)}...`);
      continue;
    }

    try {
      const workflow = buildFluxLoraWorkflow(cleanPrompt, loraFiles, seed);
      const promptId = await queuePrompt(workflow);
      console.log(`    ⏳ Queued: ${promptId.slice(0, 8)}...`);

      await waitForCompletion(promptId);
      const imageBuffer = await getOutputImage(promptId);

      // Save locally
      const filename = `comfy_${shot.number.replace(".", "_")}_${randomBytes(3).toString("hex")}.png`;
      const localPath = path.join(GEN_DIR, filename);
      await writeFile(localPath, imageBuffer);

      // Update shot
      const shotInData = data.shots.find((s: Shot) => s.id === shot.id);
      if (shotInData) {
        if (shotInData.keyframeUrl) {
          if (!shotInData.keyframeHistory) shotInData.keyframeHistory = [];
          shotInData.keyframeHistory.push({
            url: shotInData.keyframeUrl,
            seed: shotInData.keyframeSeed,
            generatedAt: shotInData.updatedAt,
          });
        }
        shotInData.keyframeUrl = `/uploads/generations/${filename}`;
        shotInData.keyframeSeed = seed;
        shotInData.keyframeApprovedAt = "";
        shotInData.updatedAt = new Date().toISOString();
      }

      generated++;
      const sizeKB = (imageBuffer.length / 1024).toFixed(0);
      console.log(`    ✅ ${filename} (${sizeKB}KB, seed: ${seed})`);

      // Save progress every 5
      if (generated % 5 === 0) {
        await writeFile(VIDEOS_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
      }
    } catch (err) {
      failed++;
      console.error(`    ❌ ${(err as Error).message.slice(0, 150)}`);
    }
  }

  if (!DRY_RUN && generated > 0) {
    await writeFile(VIDEOS_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
  }

  console.log(`\n━━━ Results ━━━`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Failed:    ${failed}`);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
