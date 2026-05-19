/**
 * NVIDIA API Catalog client for image and video generation.
 * Endpoint: ai.api.nvidia.com — hosts models from Stability AI,
 * Black Forest Labs, and other partners under one API key.
 *
 * Reads NVIDIA key from the server environment only.
 *
 * Video generation is a two-step pipeline:
 *   1. Generate a still frame from a text prompt (Flux / SD)
 *   2. Animate the frame via Stable Video Diffusion (image-to-video)
 */
const CLOUD_BASE_URL = "https://ai.api.nvidia.com/v1/genai";

/**
 * Base URL for NVIDIA API requests.
 * Set NVIDIA_NIM_BASE_URL to point at a local or cloud NIM container,
 * e.g. "http://localhost:8000/v1/genai" or "https://my-runpod-xxx.runpod.net/v1/genai".
 * When unset, defaults to the NVIDIA API Catalog (requires NVIDIA_API_KEY).
 */
function getBaseUrl(): string {
  return process.env.NVIDIA_NIM_BASE_URL?.replace(/\/$/, "") ?? CLOUD_BASE_URL;
}

/** Whether a custom NIM endpoint is configured (local or cloud GPU host). */
export function nimAvailable(): boolean {
  return !!process.env.NVIDIA_NIM_BASE_URL;
}

async function getApiKey(): Promise<string> {
  const key = process.env.NVIDIA_API_KEY;
  // When using a local NIM container, no API key is required.
  // Return a placeholder so the Authorization header is present but harmless.
  if (!key) {
    if (nimAvailable()) return "no-key-required";
    throw new Error("NVIDIA_API_KEY is not set — add it in Settings → AI Model Keys");
  }
  return key;
}

/* ---- Image Models (NVIDIA API Catalog) ---- */

export const NVIDIA_IMAGE_MODELS = [
  {
    id: "black-forest-labs/flux.1-dev",
    label: "Flux.1 Dev",
    vendor: "Black Forest Labs",
    nimOnly: false,
  },
  {
    id: "black-forest-labs/flux.1-schnell",
    label: "Flux.1 Schnell",
    vendor: "Black Forest Labs",
    nimOnly: false,
  },
] as const;

export type NvidiaImageModelId = (typeof NVIDIA_IMAGE_MODELS)[number]["id"];
const ALLOWED_IMAGE_MODEL_IDS = new Set<string>(NVIDIA_IMAGE_MODELS.map((m) => m.id));

/* ---- Video Models (NVIDIA API Catalog) ---- */

// NOTE: Stable Video Diffusion was deprecated on NVIDIA API Catalog (as of 2026-05).
// Video generation is currently unavailable. This list will be updated when a
// replacement model is available.
export const NVIDIA_VIDEO_MODELS = [] as const;

export type NvidiaVideoModelId = (typeof NVIDIA_VIDEO_MODELS)[number]["id"];

/* ---- Image Generation ---- */

export type ImageGenParams = {
  model: NvidiaImageModelId;
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  steps?: number;
  cfgScale?: number;
};

export type ImageGenResult = {
  /** Base64-encoded image data */
  image: string;
  /** MIME type (image/jpeg or image/png) */
  contentType: string;
  seed: number;
};

/** Strip tags FLUX can't process to keep prompt lean */
function cleanPrompt(raw: string): string {
  return raw
    // Remove [REF: ...] image reference tags (FLUX is text-only)
    .replace(/\[REF:[^\]]*\]/gi, "")
    // Strip any remaining [TAG: ...] or [TAG] bracket markers — FLUX treats
    // these as literal text garbage and produces black / 3D-looking output.
    .replace(/\[[A-Z][A-Z _]*(?::[^\]]*)?\]/gi, "")
    // Remove cinematography terms that trigger NVIDIA's content filter when
    // combined with dramatic scene descriptions (rain, night, shadows, etc.)
    .replace(/\b(shot on |ARRI Alexa \d+|anamorphic \d+:\d+|cinematic color grade|film grain)\b/gi, "")
    // Replace "dystopian" and other filter-trigger adjectives with neutral alternatives
    .replace(/\bdystopian\b/gi, "futuristic")
    .replace(/\bdramatic mood\b/gi, "moody atmosphere")
    // Collapse extra commas and spaces from removals
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    // Collapse multiple blank lines left by removals
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateImage(params: ImageGenParams): Promise<ImageGenResult> {
  const { model, prompt: rawPrompt, width = 1024, height = 1024, seed = 0, steps, cfgScale } = params;
  if (!ALLOWED_IMAGE_MODEL_IDS.has(model)) {
    throw new Error("Invalid model");
  }
  const prompt = cleanPrompt(rawPrompt);

  // ── Request format ────────────────────────────────────────────────────────
  // NIM containers (NVIDIA_NIM_BASE_URL set) expose OpenAI-compatible Images API:
  //   POST /v1/images/generations  { model, prompt, width, height, n, response_format }
  //   Response: { data: [{ b64_json, ... }] }
  //
  // NVIDIA API Catalog (cloud) uses a different path per-model:
  //   POST /v1/genai/<model-id>  { prompt, width, height, seed }
  //   Response: { artifacts: [{ base64, seed }] } or { image }

  // Route per-model: NIM-only models → NIM endpoint; cloud models → always cloud.
  // This prevents "fetch failed" when NIM_BASE_URL is set but container isn't running
  // for models that work fine via the cloud catalog.
  const modelDef = NVIDIA_IMAGE_MODELS.find((m) => m.id === model);
  const usingNim = modelDef?.nimOnly ? true : false;

  let url: string;
  let body: Record<string, unknown>;

  if (usingNim) {
    if (!nimAvailable()) {
      throw new Error(
        `${modelDef?.label ?? model} requires a NIM container — set NVIDIA_NIM_BASE_URL or choose a cloud model (Flux.1 Dev / Schnell)`
      );
    }
    const nimBase = getBaseUrl().replace(/\/v1\/genai\/?$/, "").replace(/\/$/, "");
    url = `${nimBase}/v1/images/generations`;
    body = {
      model,
      prompt,
      n: 1,
      width,
      height,
      response_format: "b64_json",
      ...(seed ? { seed } : {}),
    };
  } else {
    // NVIDIA API Catalog: path includes model ID. Encode each path segment
    // separately so the `/` between vendor and model is preserved — using
    // encodeURIComponent on the whole id turns it into %2F and yields 404.
    const modelPath = model.split("/").map(encodeURIComponent).join("/");
    url = `${CLOUD_BASE_URL}/${modelPath}`;
    body = {
      prompt,
      width,
      height,
      ...(seed ? { seed } : {}),
    };
  }

  // 180-second hard timeout — Flux.1 Dev regularly needs 90–120 s;
  // without a cap the route can hang 370 s+.
  const apiKey = await getApiKey();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const bodyStr = JSON.stringify(body);

  /** Single fetch attempt with abort timeout. */
  async function attempt(): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180_000);
    try {
      return await fetch(url, {
        method: "POST",
        headers,
        body: bodyStr,
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new Error("NVIDIA API timed out after 180 s — try Flux.1 Schnell (faster) or retry");
      }
      if (usingNim) {
        throw new Error(
          `Cannot reach NIM container at ${url} — is the container running? (${(err as Error).message})`
        );
      }
      throw new Error(
        `Cannot reach NVIDIA API — check your internet connection and API key (${(err as Error).message})`
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Retry once on transient 500/502/503 — NVIDIA API has intermittent failures.
  let res = await attempt();
  if (res.status >= 500 && res.status < 600) {
    console.warn(`[nvidia] ${res.status} on first attempt — retrying once...`);
    await new Promise((r) => setTimeout(r, 2000));
    res = await attempt();
  }

  if (!res.ok) {
    const text = await res.text();
    // Try to extract a meaningful message from NVIDIA's JSON error body
    let detail = text;
    try {
      const errJson = JSON.parse(text);
      detail = errJson.detail || errJson.error?.message || errJson.message || text;
    } catch { /* plain text is fine */ }
    throw new Error(`NVIDIA API error (${res.status}): ${detail}`);
  }

  const json = await res.json();

  // Parse response — NIM returns OpenAI shape, Catalog returns artifacts shape
  let imageData: string;
  let resultSeed = seed;

  if (json.data?.[0]?.b64_json) {
    // NIM / OpenAI Images format
    imageData = json.data[0].b64_json;
  } else if (json.artifacts?.[0]) {
    // NVIDIA API Catalog format. `finishReason` is "SUCCESS" | "CONTENT_FILTERED" | "ERROR".
    const art = json.artifacts[0] as { base64?: string; seed?: number; finishReason?: string };
    if (art.finishReason && art.finishReason !== "SUCCESS") {
      throw new Error(
        `NVIDIA returned ${art.finishReason} — prompt was rejected by the safety filter. ` +
        `Try simplifying the description or remove dramatic keywords (e.g. "blood", "weapon", "neon", action verbs).`
      );
    }
    imageData = art.base64 ?? "";
    resultSeed = art.seed ?? seed;
  } else if (json.image) {
    imageData = json.image;
  } else if (json.b64_json) {
    imageData = json.b64_json;
  } else {
    throw new Error("Unexpected NVIDIA API response shape");
  }

  // Sanity check: empty / suspiciously small payload usually means a silent
  // content filter or a model failure. Better to throw than save a black PNG.
  if (!imageData || imageData.length < 1024) {
    throw new Error("NVIDIA returned an empty image — likely a content filter or model failure. Try a different seed or prompt.");
  }

  return {
    image: imageData,
    contentType: "image/jpeg",
    seed: resultSeed,
  };
}

/* ---- Video Generation ---- */

export type VideoGenParams = {
  model: NvidiaVideoModelId;
  /** Text prompt — will be used to generate an initial frame first */
  prompt: string;
  /** Pre-existing base64 image to animate (skips frame generation) */
  image?: string;
  seed?: number;
  cfgScale?: number;
};

export type VideoGenResult = {
  /** Base64-encoded video data (mp4) */
  video: string;
  contentType: string;
  seed: number;
};

/**
 * Submit a video generation job via Stable Video Diffusion.
 * SVD is image-to-video only, so we implement a two-step pipeline:
 *   1. If no image is provided, generate a frame from the prompt using Flux
 *   2. Send the frame to SVD for animation
 *
 * NVIDIA video models are async — they return a request ID for polling.
 */
export type VideoJobResponse = {
  reqId: string;
  status: "pending" | "running" | "completed" | "failed";
  video?: string;
  error?: string;
};

export async function submitVideoJob(params: VideoGenParams): Promise<VideoJobResponse> {
  const { prompt, image, seed = 0, cfgScale = 1.8 } = params;

  // Step 1: Get or generate the source image
  let sourceImage = image;
  if (!sourceImage) {
    // Generate a frame from the prompt using Flux.1 Dev
    const frameResult = await generateImage({
      model: "black-forest-labs/flux.1-dev",
      prompt,
      width: 1344,
      height: 768,
      seed,
    });
    sourceImage = frameResult.image;
  }

  // Step 2: Send to Stable Video Diffusion (image-to-video)
  const body = {
    image: sourceImage.startsWith("data:") ? sourceImage : `data:image/jpeg;base64,${sourceImage}`,
    seed,
    cfg_scale: cfgScale,
    motion_bucket_id: 127,
  };

  const res = await fetch(`${getBaseUrl()}/stabilityai/stable-video-diffusion`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getApiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "NVCF-POLL-SECONDS": "0", // Don't long-poll, return immediately with request ID
    },
    body: JSON.stringify(body),
  });

  // If 202 → async job submitted
  if (res.status === 202) {
    const reqId = res.headers.get("NVCF-REQID") ?? "";
    return { reqId, status: "pending" };
  }

  // If 200 → completed synchronously (rare for video)
  if (res.ok) {
    const json = await res.json();
    return {
      reqId: "",
      status: "completed",
      video: json.video ?? json.artifacts?.[0]?.base64 ?? "",
    };
  }

  const text = await res.text();
  throw new Error(`NVIDIA Video API error (${res.status}): ${text}`);
}

export async function pollVideoJob(reqId: string): Promise<VideoJobResponse> {
  const res = await fetch(
    `https://api.nvcf.nvidia.com/v2/nvcf/exec/status/${reqId}`,
    {
      headers: {
        Authorization: `Bearer ${await getApiKey()}`,
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NVIDIA poll error (${res.status}): ${text}`);
  }

  const json = await res.json();

  if (json.status === "fulfilled" || json.status === "completed") {
    // Response body contains the video
    const videoData = json.response?.body ?? json.video ?? "";
    return { reqId, status: "completed", video: videoData };
  }

  if (json.status === "failed" || json.status === "rejected") {
    return { reqId, status: "failed", error: json.error ?? "Generation failed" };
  }

  return { reqId, status: "running" };
}

/* ---- Helpers ---- */

export function aspectToSize(aspect: string): { width: number; height: number } {
  // FLUX.1 valid sizes: multiples of 64 within the supported range.
  // Aligned with API route mapping for consistency.
  switch (aspect) {
    case "1:1":    return { width: 1024, height: 1024 };
    case "16:9":   return { width: 1344, height: 768 };
    case "9:16":   return { width: 768, height: 1344 };
    case "4:3":    return { width: 1152, height: 896 };
    case "3:2":    return { width: 1216, height: 832 };
    case "2.39:1": return { width: 1344, height: 768 };
    default:       return { width: 1024, height: 1024 };
  }
}
