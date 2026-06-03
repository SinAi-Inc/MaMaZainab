/**
 * OpenAI Image Generation - reference-image-aware provider.
 *
 * Model: gpt-image-1 (supports reference images for character consistency)
 *
 * Two modes:
 *   1. Text-to-image: POST /v1/images/generations
 *   2. Reference-guided: POST /v1/images/edits (accepts reference images)
 *
 * The reference-guided path is the key differentiator vs NVIDIA/ComfyUI —
 * it uses a visual reference photo to anchor character identity, eliminating
 * the 77-token CLIP constraint that limits text-only pipelines.
 *
 * Required env vars:
 *   OPENAI_API_KEY   - OpenAI API key (or Bedrock-proxied OpenAI endpoint)
 *
 * Optional:
 *   OPENAI_BASE_URL  - Override base URL (for Bedrock proxy, Azure OpenAI, etc.)
 *                      Default: https://api.openai.com/v1
 */

import { promises as fs } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OpenAIImageModel = "gpt-image-1" | "dall-e-3";

export type OpenAIImageSize =
  | "1024x1024"
  | "1024x1536"  // portrait
  | "1536x1024"  // landscape
  | "auto";

export type OpenAIImageQuality = "low" | "medium" | "high";

export interface OpenAIImageParams {
  /** The generation prompt - can be the full assemblePrompt() output (no condensation needed). */
  prompt: string;
  /** Model to use. Default: gpt-image-1 */
  model?: OpenAIImageModel;
  /** Output size. Default: 1024x1536 (portrait for character renders) */
  size?: OpenAIImageSize;
  /** Quality tier. Default: high */
  quality?: OpenAIImageQuality;
  /**
   * Reference image(s) for character anchoring.
   * Can be:
   *   - Absolute file paths (loaded from disk)
   *   - /uploads/... paths (resolved relative to public/)
   *   - Base64 strings (passed directly)
   *   - HTTP(S) URLs (fetched and sent)
   */
  referenceImages?: string[];
  /** Number of images to generate. Default: 1 */
  n?: number;
}

export interface OpenAIImageResult {
  /** Base64-encoded image data */
  image: string;
  /** MIME type */
  contentType: string;
  /** Revised prompt (if model adjusted it) */
  revisedPrompt?: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return key;
}

function getBaseUrl(): string {
  return process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
}

/** Returns true when an OpenAI API key is configured. */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// ---------------------------------------------------------------------------
// Reference image resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a reference image path/URL to a Buffer + mime type.
 * Supports:
 *   - /uploads/... paths → resolved from public/
 *   - Absolute file paths → read directly
 *   - data:image/... base64 → decoded
 *   - https://... URLs → fetched
 */
async function resolveReferenceImage(ref: string): Promise<{ buffer: Buffer; mimeType: string }> {
  // Base64 data URI
  if (ref.startsWith("data:image/")) {
    const match = ref.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!match) throw new Error("Invalid base64 data URI");
    const mimeType = `image/${match[1] === "jpg" ? "jpeg" : match[1]}`;
    return { buffer: Buffer.from(match[2], "base64"), mimeType };
  }

  // Local /uploads/ path - resolve from public/
  if (ref.startsWith("/uploads/") || ref.startsWith("/chars/")) {
    const absPath = path.join(process.cwd(), "public", ref.replace(/^\//, ""));
    const buffer = await fs.readFile(absPath);
    const ext = path.extname(absPath).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return { buffer, mimeType };
  }

  // HTTP(S) URL - fetch it
  if (ref.startsWith("http://") || ref.startsWith("https://")) {
    const resp = await fetch(ref);
    if (!resp.ok) throw new Error(`Failed to fetch reference image: ${resp.status}`);
    const buffer = Buffer.from(await resp.arrayBuffer());
    const ct = resp.headers.get("content-type") || "image/png";
    return { buffer, mimeType: ct };
  }

  // Absolute file path
  const buffer = await fs.readFile(ref);
  const ext = path.extname(ref).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return { buffer, mimeType };
}

// ---------------------------------------------------------------------------
// Generation - reference-guided (edits endpoint)
// ---------------------------------------------------------------------------

/**
 * Generate an image using reference photos for character anchoring.
 * Uses the /images/edits endpoint which accepts reference images + prompt.
 */
async function generateWithReference(
  params: Required<Pick<OpenAIImageParams, "prompt" | "model" | "size" | "quality">> & { referenceImages: string[] },
): Promise<OpenAIImageResult> {
  const apiKey = getApiKey();
  const baseUrl = getBaseUrl();

  // Build multipart form data
  const formData = new FormData();
  formData.append("model", params.model);
  formData.append("prompt", params.prompt);
  formData.append("size", params.size);
  formData.append("quality", params.quality);
  formData.append("n", "1");
  formData.append("response_format", "b64_json");

  // Resolve and attach reference images
  for (const ref of params.referenceImages) {
    try {
      const { buffer, mimeType } = await resolveReferenceImage(ref);
      const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
      const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
      formData.append("image[]", blob, `reference.${ext}`);
    } catch (err) {
      console.warn("[openai-image] Failed to load reference image:", ref, err instanceof Error ? err.message : err);
      // Continue without this reference - non-fatal
    }
  }

  const resp = await fetch(`${baseUrl}/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!resp.ok) {
    const errorBody = await resp.text().catch(() => "");
    throw new Error(`OpenAI images/edits failed (${resp.status}): ${errorBody.slice(0, 500)}`);
  }

  const json = await resp.json() as {
    data: Array<{ b64_json?: string; revised_prompt?: string }>;
  };

  const first = json.data?.[0];
  if (!first?.b64_json) {
    throw new Error("OpenAI returned no image data");
  }

  return {
    image: first.b64_json,
    contentType: "image/png",
    revisedPrompt: first.revised_prompt,
  };
}

// ---------------------------------------------------------------------------
// Generation - text-only (generations endpoint)
// ---------------------------------------------------------------------------

/**
 * Generate an image from text prompt only (no reference).
 * Uses the /images/generations endpoint.
 */
async function generateTextOnly(
  params: Required<Pick<OpenAIImageParams, "prompt" | "model" | "size" | "quality">>,
): Promise<OpenAIImageResult> {
  const apiKey = getApiKey();
  const baseUrl = getBaseUrl();

  const body = {
    model: params.model,
    prompt: params.prompt,
    size: params.size,
    quality: params.quality,
    n: 1,
    response_format: "b64_json",
  };

  const resp = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errorBody = await resp.text().catch(() => "");
    throw new Error(`OpenAI images/generations failed (${resp.status}): ${errorBody.slice(0, 500)}`);
  }

  const json = await resp.json() as {
    data: Array<{ b64_json?: string; revised_prompt?: string }>;
  };

  const first = json.data?.[0];
  if (!first?.b64_json) {
    throw new Error("OpenAI returned no image data");
  }

  return {
    image: first.b64_json,
    contentType: "image/png",
    revisedPrompt: first.revised_prompt,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate an image using OpenAI's gpt-image-1.
 *
 * When referenceImages are provided, uses the edits endpoint for visual
 * character anchoring. Otherwise, uses the generations endpoint.
 *
 * Unlike SD1.5/ComfyUI, there is NO 310-char prompt limit - send the
 * full assemblePrompt() output directly.
 */
export async function generateImageOpenAI(params: OpenAIImageParams): Promise<OpenAIImageResult> {
  const model = params.model ?? "gpt-image-1";
  const size = params.size ?? "1024x1536";
  const quality = params.quality ?? "high";
  const refs = params.referenceImages?.filter(Boolean) ?? [];

  if (refs.length > 0) {
    return generateWithReference({ prompt: params.prompt, model, size, quality, referenceImages: refs });
  }
  return generateTextOnly({ prompt: params.prompt, model, size, quality });
}

/**
 * Map aspect ratio string to OpenAI image size.
 */
export function aspectToOpenAISize(aspect: string): OpenAIImageSize {
  switch (aspect) {
    case "9:16":
    case "2:3":
      return "1024x1536";  // portrait
    case "16:9":
    case "3:2":
    case "2.39:1":
      return "1536x1024";  // landscape
    case "1:1":
    default:
      return "1024x1024";  // square
  }
}
