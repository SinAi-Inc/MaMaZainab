/**
 * NVIDIA API Catalog client for image and video generation.
 * Endpoint: ai.api.nvidia.com — hosts models from Stability AI,
 * Black Forest Labs, and other partners under one API key.
 *
 * Reads NVIDIA key from: settings store first, then NVIDIA_API_KEY env var.
 *
 * Video generation is a two-step pipeline:
 *   1. Generate a still frame from a text prompt (Flux / SD)
 *   2. Animate the frame via Stable Video Diffusion (image-to-video)
 */

import { readSettings } from "@/lib/settings/store";

const CLOUD_BASE_URL = "https://ai.api.nvidia.com/v1/genai";
const ALLOWED_IMAGE_MODEL_IDS = new Set<string>(NVIDIA_IMAGE_MODELS.map((m) => m.id));

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
  // 1. Check settings store (user-entered key via UI)
  try {
    const settings = await readSettings();
    if (settings.nvidiaApiKey) return settings.nvidiaApiKey;
  } catch {
    // settings file may not exist yet
  }
  // 2. Fall back to environment variable
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
  {
    id: "black-forest-labs/flux.2-klein-4b",
    label: "Flux.2 Klein",
    vendor: "Black Forest Labs",
    /** Requires a local or cloud NVIDIA NIM container (NVIDIA_NIM_BASE_URL). */
    nimOnly: true,
  },
] as const;

export type NvidiaImageModelId = (typeof NVIDIA_IMAGE_MODELS)[number]["id"];

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

  const usingNim = nimAvailable();
  const baseUrl = getBaseUrl();

  let url: string;
  let body: Record<string, unknown>;

  if (usingNim) {
    // Strip /v1/genai suffix if user included it — NIM base is just the host
    const nimBase = baseUrl.replace(/\/v1\/genai\/?$/, "").replace(/\/$/, "");
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
    // NVIDIA API Catalog: path includes model ID
    url = `${baseUrl}/${encodeURIComponent(model)}`;
    body = {
      prompt,
      width,
      height,
      ...(seed ? { seed } : {}),
    };
  }

  // 90-second hard timeout — NVIDIA can queue; without this the route hangs 370s+
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getApiKey()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("NVIDIA API timed out after 90 s — try Flux.1 Schnell (faster) or retry");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NVIDIA API error (${res.status}): ${text}`);
  }

  const json = await res.json();

  // Parse response — NIM returns OpenAI shape, Catalog returns artifacts shape
  let imageData: string;
  let resultSeed = seed;

  if (json.data?.[0]?.b64_json) {
    // NIM / OpenAI Images format
    imageData = json.data[0].b64_json;
  } else if (json.artifacts?.[0]) {
    // NVIDIA API Catalog format
    imageData = json.artifacts[0].base64;
    resultSeed = json.artifacts[0].seed ?? seed;
  } else if (json.image) {
    imageData = json.image;
  } else if (json.b64_json) {
    imageData = json.b64_json;
  } else {
    throw new Error("Unexpected NVIDIA API response shape");
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
  switch (aspect) {
    case "1:1": return { width: 1024, height: 1024 };
    // Flux.1 valid sizes: multiples of 64 in [768,1152]. Keeping closest valid pairs.
    case "16:9": return { width: 1024, height: 576 };  // 576 rounds to 1024x576 accepted
    case "9:16": return { width: 576, height: 1024 };
    case "4:3": return { width: 1024, height: 768 };
    case "3:2": return { width: 1024, height: 680 };
    case "2.39:1": return { width: 1152, height: 480 };
    default: return { width: 1024, height: 1024 };
  }
}
