/**
 * ComfyUI HTTP client (REST polling, no WebSocket).
 *
 * Set:
 *   COMFYUI_BASE_URL          e.g. http://127.0.0.1:8188
 *   COMFYUI_WORKFLOW          "flux" (default) | "sdxl" | absolute path to a workflow JSON
 *   COMFYUI_SDXL_CKPT         checkpoint filename for the SDXL workflow (default: sd_xl_base_1.0.safetensors)
 *   COMFYUI_FLUX_CKPT         checkpoint filename for the FLUX workflow (default: flux1-dev-fp8.safetensors)
 *   COMFYUI_API_KEY           optional Bearer token
 *
 * The workflow JSON uses the placeholders:
 *   __PROMPT__ __NEGATIVE__ __WIDTH__ __HEIGHT__ __SEED__ __CKPT__
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 10 * 60_000; // 10 minutes — CPU renders can take 7m+

export function isComfyConfigured(): boolean {
  return !!process.env.COMFYUI_BASE_URL?.trim();
}

function getBaseUrl(): string {
  const raw = process.env.COMFYUI_BASE_URL?.trim();
  if (!raw) throw new Error("COMFYUI_BASE_URL is not set");
  return raw.replace(/\/$/, "");
}

function authHeaders(): Record<string, string> {
  const token = process.env.COMFYUI_API_KEY?.trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type ComfyImageParams = {
  prompt: string;
  /** Optional negative prompt (used by SDXL/SD1.5 workflows) */
  negativePrompt?: string;
  width: number;
  height: number;
  seed: number;
  /** When true, ignore COMFYUI_WIDTH/COMFYUI_HEIGHT env overrides (e.g. character portrait renders) */
  skipEnvOverride?: boolean;
};

export type ComfyImageResult = {
  /** Base64-encoded PNG */
  image: string;
  contentType: string;
  seed: number;
};

/**
 * SD1.5 CLIP only sees ~77 tokens (front-weighted attention).
 * This function restructures the assembled prompt so the SCENE/ACTION comes
 * first (what to draw), followed by a SHORT character identity tag (who),
 * and finally style keywords — all within ~77 tokens.
 *
 * If no character anchor is present (e.g. aerial/establishing shots), the
 * full budget goes to the scene description.
 *
 * Also extracts negative prompt from Avoid/DON'T lines + adds base anatomy guards.
 */
export function condenseForSD15(fullPrompt: string): { positive: string; negative: string } {
  // --- Extract negatives from "Avoid:" / "DON'T:" / "--no" lines ---
  const negLines: string[] = [];
  const avoidMatch = fullPrompt.match(/Avoid:\s*([^\n]+)/g);
  if (avoidMatch) {
    for (const line of avoidMatch) {
      negLines.push(line.replace(/^Avoid:\s*/, "").trim());
    }
  }
  const dontMatch = fullPrompt.match(/DON'T:\s*([^\n]+)/g);
  if (dontMatch) {
    for (const line of dontMatch) {
      negLines.push(line.replace(/^DON'T:\s*/, "").trim());
    }
  }
  const noMatch = fullPrompt.match(/--no\s+([^\n]+)/g);
  if (noMatch) {
    for (const line of noMatch) {
      negLines.push(line.replace(/^--no\s+/, "").trim());
    }
  }

  // --- 1. Extract SHOT description (user's actual scene direction) ---
  // assemblePrompt tags this as "[SHOT] ..." — may span multiple lines
  let shotDescription = "";
  const shotMatch = fullPrompt.match(/\[SHOT\]\s*([\s\S]*?)(?=\n\n(?:Subject:|Character |Avoid:|Pattern |Brand color|Cast rules|Scene:|⚠️)|$)/m);
  if (shotMatch) {
    shotDescription = shotMatch[1].replace(/\n/g, ", ").replace(/\s{2,}/g, " ").trim();
  }

  // --- 2. Extract character anchor block ---
  let characterBlock = "";
  // Method A: "Subject: ..." block (current assemblePrompt format)
  // Note: do NOT use $ in lookahead — with /m flag it matches end-of-line, not end-of-string
  const subjectRegex = /^Subject:\s*([\s\S]*?)(?=\n\n|\n\[SHOT\])/m;
  const subjectMatch = fullPrompt.match(subjectRegex);
  if (subjectMatch) {
    characterBlock = subjectMatch[1].trim();
  } else {
    // Method B: "Character <label>: ..." blocks (multi-char)
    const charBlockRegex = /^Character [^:]+:\s*([\s\S]*?)(?=\n\n|^Character |\[SHOT\]|$)/gm;
    const charMatches = [...fullPrompt.matchAll(charBlockRegex)];
    if (charMatches.length > 0) {
      characterBlock = charMatches.map((m) => m[1].trim()).join("; ");
    }
  }
  // Method C: [CHARACTER ANCHOR] marker (legacy)
  if (!characterBlock) {
    const anchorRegex = /\[CHARACTER ANCHOR\]\s*([\s\S]*?)(?=\[|--no|Avoid:|$)/;
    const anchorMatch = fullPrompt.match(anchorRegex);
    if (anchorMatch) characterBlock = anchorMatch[1].trim();
  }

  // --- 3. Extract scene mood (short) ---
  let sceneMood = "";
  const moodMatch = fullPrompt.match(/Mood:\s*([^.\n]+)/m);
  if (moodMatch) sceneMood = moodMatch[1].trim();
  const colorsMatch = fullPrompt.match(/Key colors:\s*([^.\n]+)/m);
  if (colorsMatch && sceneMood) sceneMood += `, ${colorsMatch[1].trim()}`;

  // --- 4. Condense character to identity tag ---
  // Budget is dynamic: when shot description is short (e.g. portrait tests),
  // more space goes to character. When shot is long (keyframes), keep char brief.
  const STYLE_LEN = 50; // "cinematic, 35mm film, shallow depth of field" ~45ch
  const TOTAL_BUDGET = 310;
  const dynamicCharBudget = Math.min(200, Math.max(60, TOTAL_BUDGET - shotDescription.length - STYLE_LEN - (sceneMood.length || 0)));

  let charTag = "";
  if (characterBlock) {
    const raw = characterBlock
      .replace(/\[REF[^\]]*\]/g, "")
      .replace(/\[MODE[^\]]*\]/g, "")
      .replace(/Direction:[^\n]*/g, "")
      .replace(/Mode \w+:[^\n]*/g, "")  // strip mode detail lines
      .replace(/When:[^\n]*/g, "")
      .replace(/Costume:[^\n]*/g, (m) => m)  // keep costume
      .replace(/Posture:[^\n]*/g, "")
      .replace(/Same face[^.]*\./g, "")
      .replace(/\\n/g, ", ")
      .replace(/\n/g, ", ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Take clauses up to the dynamic budget (core physical identity)
    const clauses = raw.split(/[,.;]/).map((s) => s.trim()).filter((s) => s.length > 2);
    const selected: string[] = [];
    let totalLen = 0;
    for (const clause of clauses) {
      if (totalLen + clause.length > dynamicCharBudget) break;
      selected.push(clause);
      totalLen += clause.length + 2;
    }
    charTag = selected.join(", ");

    // Append costume keyword from Mode if present
    const costumeMatch = characterBlock.match(/Costume:\s*([^,\n]+)/i);
    if (costumeMatch && charTag.length + costumeMatch[1].length < dynamicCharBudget + 30) {
      charTag += `, ${costumeMatch[1].trim()}`;
    }
  }

  // --- 5. Assemble: charTag + shot description + scene mood + style ---
  // SD1.5 CLIP: 77 tokens ≈ 310 chars. Priority order:
  //   1. Character identity (WHO) — ~60-90 chars
  //   2. Shot description (WHAT is happening) — full user prompt
  //   3. Scene mood (WHERE/atmosphere) — ~30 chars
  //   4. Style anchor — "cinematic, 35mm film, shallow DOF"
  const positiveSegments: string[] = [];
  if (charTag) positiveSegments.push(charTag);
  if (shotDescription) positiveSegments.push(shotDescription);
  if (sceneMood) positiveSegments.push(sceneMood);
  positiveSegments.push("cinematic, 35mm film, shallow depth of field");

  let positive = positiveSegments.join(", ").replace(/,\s*,/g, ",").trim();

  // Hard-cap at ~75 CLIP tokens (~310 chars). SD1.5 ignores anything beyond.
  if (positive.length > 310) {
    positive = positive.slice(0, 310).replace(/,\s*$/, "").trim();
  }

  // --- Build negative: character-specific avoidances + base quality guards ---
  const baseNeg = "blurry, low quality, deformed, watermark, text, logo, ugly, disfigured, bad anatomy, extra limbs, cropped, out of frame, worst quality, low resolution, jpeg artifacts, anime, cartoon, 3d render";
  const negative = negLines.length > 0
    ? `${negLines.join(", ")}, ${baseNeg}`
    : baseNeg;

  return { positive, negative };
}

type WorkflowChoice = "flux" | "sdxl";

async function loadWorkflow(): Promise<{ template: string; choice: WorkflowChoice | "custom" }> {
  const setting = process.env.COMFYUI_WORKFLOW?.trim() || "flux";
  let filePath: string;
  let choice: WorkflowChoice | "custom";
  if (setting === "flux" || setting === "sdxl") {
    filePath = path.join(process.cwd(), "lib", "comfy", "workflows", `${setting}_txt2img.json`);
    choice = setting;
  } else {
    filePath = setting;
    choice = "custom";
  }
  const template = await fs.readFile(filePath, "utf8");
  return { template, choice };
}

function substitute(template: string, params: ComfyImageParams, choice: WorkflowChoice | "custom"): unknown {
  const ckpt =
    choice === "sdxl"
      ? process.env.COMFYUI_SDXL_CKPT?.trim() || "sd_xl_base_1.0.safetensors"
      : process.env.COMFYUI_FLUX_CKPT?.trim() || "flux1-dev-fp8.safetensors";

  // For SDXL/SD1.5 workflows, condense the prompt to fit CLIP's 77-token window
  // and extract a proper negative prompt from the assembled brand output.
  const isSD = choice === "sdxl";
  const { positive, negative } = isSD
    ? condenseForSD15(params.prompt)
    : { positive: params.prompt, negative: params.negativePrompt || "" };

  // JSON-escape prompts so quotes and newlines don't break parsing
  const safePrompt = JSON.stringify(positive).slice(1, -1);
  const safeNegative = JSON.stringify(negative).slice(1, -1);

  const filled = template
    .replace(/__PROMPT__/g, safePrompt)
    .replace(/__NEGATIVE__/g, safeNegative)
    .replace(/"__WIDTH__"/g, String(params.width))
    .replace(/"__HEIGHT__"/g, String(params.height))
    .replace(/"__SEED__"/g, String(params.seed))
    .replace(/__CKPT__/g, ckpt);

  const parsed = JSON.parse(filled) as Record<string, unknown>;
  // Strip _comment helper key if present (ComfyUI rejects unknown top-level keys)
  delete parsed._comment;
  return parsed;
}

type HistoryEntry = {
  outputs?: Record<
    string,
    { images?: { filename: string; subfolder: string; type: string }[] }
  >;
  status?: { status_str?: string; completed?: boolean; messages?: unknown[] };
};

/**
 * Submit a prompt to ComfyUI, poll until images are available,
 * fetch the first image, return base64.
 */
export async function generateImageComfy(params: ComfyImageParams): Promise<ComfyImageResult> {
  const base = getBaseUrl();
  const clientId = randomUUID();

  // 1. Load + fill workflow
  const { template, choice } = await loadWorkflow();

  // Allow env-level override of dims — useful when the local model can't handle
  // the FLUX-cloud frame (e.g. SD1.5 chokes at 1344x768; native is 768x432 for 16:9).
  // skipEnvOverride: used by character portrait renders that need specific aspect ratios.
  const widthOverride = params.skipEnvOverride ? NaN : parseInt(process.env.COMFYUI_WIDTH ?? "", 10);
  const heightOverride = params.skipEnvOverride ? NaN : parseInt(process.env.COMFYUI_HEIGHT ?? "", 10);
  const effectiveParams: ComfyImageParams = {
    ...params,
    width: Number.isFinite(widthOverride) && widthOverride > 0 ? widthOverride : params.width,
    height: Number.isFinite(heightOverride) && heightOverride > 0 ? heightOverride : params.height,
  };
  const workflow = substitute(template, effectiveParams, choice);

  // 2. POST /prompt
  const submitRes = await fetch(`${base}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
  });
  if (!submitRes.ok) {
    const txt = await submitRes.text();
    throw new Error(`ComfyUI submit ${submitRes.status}: ${txt.slice(0, 400)}`);
  }
  const submitJson = (await submitRes.json()) as { prompt_id?: string; error?: unknown; node_errors?: unknown };
  if (!submitJson.prompt_id) {
    throw new Error(`ComfyUI rejected workflow: ${JSON.stringify(submitJson).slice(0, 400)}`);
  }
  const promptId = submitJson.prompt_id;

  // 3. Poll /history/<id> until outputs appear
  const startedAt = Date.now();
  let entry: HistoryEntry | undefined;
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const hRes = await fetch(`${base}/history/${promptId}`, { headers: authHeaders() });
    if (!hRes.ok) continue;
    const hJson = (await hRes.json()) as Record<string, HistoryEntry>;
    const e = hJson[promptId];
    if (e?.outputs && Object.keys(e.outputs).length > 0) {
      entry = e;
      break;
    }
  }
  if (!entry) {
    throw new Error("ComfyUI timed out after 5 minutes waiting for output");
  }

  // 4. Find the first SaveImage output node
  const firstImg = Object.values(entry.outputs ?? {})
    .flatMap((o) => o.images ?? [])
    .find((img) => img && img.filename);
  if (!firstImg) {
    throw new Error("ComfyUI completed but produced no image");
  }

  // 5. Fetch the image bytes
  const viewUrl =
    `${base}/view?filename=${encodeURIComponent(firstImg.filename)}` +
    `&subfolder=${encodeURIComponent(firstImg.subfolder || "")}` +
    `&type=${encodeURIComponent(firstImg.type || "output")}`;
  const imgRes = await fetch(viewUrl, { headers: authHeaders() });
  if (!imgRes.ok) {
    throw new Error(`ComfyUI /view ${imgRes.status} for ${firstImg.filename}`);
  }
  const contentType = imgRes.headers.get("content-type") || "image/png";
  const buf = Buffer.from(await imgRes.arrayBuffer());
  if (buf.length < 1024) {
    throw new Error(`ComfyUI returned a suspiciously small image (${buf.length} bytes)`);
  }
  return {
    image: buf.toString("base64"),
    contentType,
    seed: params.seed,
  };
}
