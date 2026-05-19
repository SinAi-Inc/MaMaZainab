/**
 * Local NIM (NVIDIA Inference Microservice) provider.
 *
 * Use when you spin up a NIM video model container locally or on
 * RunPod/Lambda using NVIDIA's container registry.
 *
 * Expects an OpenAI-compatible-ish video API:
 *   POST {NVIDIA_NIM_BASE_URL}/v1/video/generations
 *     body: { prompt, negative_prompt, width, height, num_frames, seed }
 *     response: { video_url } (sync) OR { task_id, status } (async)
 *   GET  {NVIDIA_NIM_BASE_URL}/v1/video/tasks/{id}
 *
 * Character references:
 *   When a reference image is available (from characters.json),
 *   the file is read from disk and sent as base64 in the `image` field.
 *   NIM containers cannot reach the Next.js public/ folder by URL,
 *   so base64 encoding is required. The presence of `image` switches
 *   most NIM video models to image-conditioned (img-to-vid) mode.
 *
 * If your NIM container exposes a different shape, adjust this file.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { VideoJob } from "../schema";
import type { VideoProvider, ProviderSubmitResult, ProviderPollResult } from "../provider";

function getBase(): string {
  const b = process.env.NVIDIA_NIM_BASE_URL;
  if (!b) throw new Error("NVIDIA_NIM_BASE_URL is not set");
  return b.replace(/\/(v1\/genai)?\/?$/, "");
}

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (process.env.NVIDIA_API_KEY) h.Authorization = `Bearer ${process.env.NVIDIA_API_KEY}`;
  return h;
}

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * Resolve a public-relative image path (e.g. /uploads/chars/abc.jpg)
 * to a base64 data-URI that a NIM container can consume directly.
 * Returns undefined if the file doesn't exist or isn't an image.
 */
async function resolveImageToBase64(urlOrPath: string): Promise<string | undefined> {
  if (!urlOrPath) return undefined;

  // Already a data URI or full http(s) URL — pass through
  if (urlOrPath.startsWith("data:") || urlOrPath.startsWith("http")) return urlOrPath;

  // Treat as a path relative to the public/ directory
  const publicDir = path.join(process.cwd(), "public");
  const resolved = path.resolve(publicDir, urlOrPath.replace(/^\//, ""));

  // Path-traversal guard — must stay inside public/
  if (!resolved.startsWith(publicDir)) return undefined;

  try {
    const buf = await fs.readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    // File not found — degrade gracefully to text-only generation
    return undefined;
  }
}

function mapAspect(aspect: string): { width: number; height: number } {
  const map: Record<string, { width: number; height: number }> = {
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 720, height: 1280 },
    "1:1": { width: 1024, height: 1024 },
    "4:3": { width: 1024, height: 768 },
    "2.39:1": { width: 1536, height: 640 },
  };
  return map[aspect] ?? { width: 1280, height: 720 };
}

export const localNimProvider: VideoProvider = {
  id: "local-nim",
  label: "Local NIM (NVIDIA)",
  tier: "draft",
  capabilities: {
    maxDurationSec: 8,
    aspects: ["16:9", "9:16", "1:1", "4:3"],
    imageToVideo: true,
    characterRefs: true,
    async: true,
  },
  isConfigured() {
    return !!process.env.NVIDIA_NIM_BASE_URL;
  },

  async submit(job: VideoJob): Promise<ProviderSubmitResult> {
    const { width, height } = mapAspect(job.aspectRatio);

    // Resolve character reference image to base64 so the NIM container
    // can consume it without needing network access to Next.js public/.
    const refSrc = job.imageUrl || job.referenceImageUrls[0] || "";
    const imageBase64 = refSrc ? await resolveImageToBase64(refSrc) : undefined;

    const body: Record<string, unknown> = {
      prompt: job.prompt,
      negative_prompt: job.negativePrompt,
      width,
      height,
      num_frames: job.durationSec * 16,
      seed: job.seed || undefined,
    };

    // NIM image-conditioned generation: send base64 in `image` field.
    // Also keep `reference_image` for custom NIM handlers that expect it.
    if (imageBase64) {
      body.image = imageBase64;
      body.reference_image = imageBase64;
    }

    const res = await fetch(`${getBase()}/v1/video/generations`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    }).catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(
        `Cannot reach NIM container at ${getBase()} — is it running? (${msg})`
      );
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`NIM submit ${res.status}: ${text.slice(0, 400)}`);
    }
    type NimResponse = { video_url?: string; task_id?: string; id?: string; status?: string };
    const json = (await res.json()) as NimResponse;
    if (json.video_url) {
      // Synchronous return — done
      return {
        providerJobId: `sync_${Date.now()}`,
        status: "completed",
        outputUrl: json.video_url,
        meta: { sync: true },
      };
    }
    const taskId = json.task_id ?? json.id;
    if (!taskId) throw new Error("NIM: no task id and no video_url");
    return {
      providerJobId: taskId,
      status: "queued",
      meta: { sync: false },
    };
  },

  async poll(providerJobId: string): Promise<ProviderPollResult> {
    if (providerJobId.startsWith("sync_")) {
      // Sync jobs are already done at submit
      return { status: "completed", progress: 1 };
    }
    const res = await fetch(`${getBase()}/v1/video/tasks/${providerJobId}`, {
      headers: headers(),
    }).catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Cannot reach NIM container at ${getBase()} — is it running? (${msg})`);
    });
    if (!res.ok) {
      const text = await res.text();
      return { status: "failed", error: `NIM poll ${res.status}: ${text.slice(0, 200)}` };
    }
    type StatusResponse = { status?: string; video_url?: string; output?: string; error?: string; progress?: number };
    const json = (await res.json()) as StatusResponse;
    const s = (json.status || "").toLowerCase();
    if (s === "completed" || s === "succeeded") {
      return { status: "completed", outputUrl: json.video_url || json.output || "", progress: 1 };
    }
    if (s === "failed") return { status: "failed", error: json.error || "NIM job failed" };
    if (s === "canceled" || s === "cancelled") return { status: "canceled" };
    if (s === "running" || s === "in_progress") return { status: "running", progress: json.progress ?? 0.5 };
    return { status: "queued", progress: 0 };
  },
};
