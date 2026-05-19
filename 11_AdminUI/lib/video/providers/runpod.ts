/**
 * RunPod serverless provider — runs Wan 2.2 (or any OSS video model)
 * on a RunPod Serverless endpoint.
 *
 * Setup: Create a Serverless endpoint at https://runpod.io/console/serverless
 *   using the official Wan 2.2 image (or community alternatives).
 *
 * ENV:
 *   RUNPOD_API_KEY            — your RunPod API key
 *   RUNPOD_WAN_ENDPOINT_ID    — endpoint ID (e.g. "abcd1234")
 *
 * API:
 *   POST https://api.runpod.ai/v2/{endpoint_id}/run     → { id, status }
 *   GET  https://api.runpod.ai/v2/{endpoint_id}/status/{id}
 *   POST https://api.runpod.ai/v2/{endpoint_id}/cancel/{id}
 */
import type { VideoJob } from "../schema";
import type { VideoProvider, ProviderSubmitResult, ProviderPollResult } from "../provider";

function getKey(): string {
  const k = process.env.RUNPOD_API_KEY;
  if (!k) throw new Error("RUNPOD_API_KEY is not set");
  return k;
}

function getEndpoint(): string {
  const e = process.env.RUNPOD_WAN_ENDPOINT_ID;
  if (!e) throw new Error("RUNPOD_WAN_ENDPOINT_ID is not set");
  return e;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getKey()}`,
    "Content-Type": "application/json",
  };
}

function mapAspect(aspect: string): { width: number; height: number } {
  const map: Record<string, { width: number; height: number }> = {
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 720, height: 1280 },
    "1:1": { width: 960, height: 960 },
    "4:3": { width: 1024, height: 768 },
    "2.39:1": { width: 1584, height: 672 },
  };
  return map[aspect] ?? { width: 1280, height: 720 };
}

export const runpodProvider: VideoProvider = {
  id: "runpod",
  label: "RunPod · Wan 2.2 (OSS)",
  tier: "draft",
  capabilities: {
    maxDurationSec: 8,
    aspects: ["16:9", "9:16", "1:1", "4:3"],
    imageToVideo: true,
    characterRefs: true,
    async: true,
  },
  isConfigured() {
    return !!(process.env.RUNPOD_API_KEY && process.env.RUNPOD_WAN_ENDPOINT_ID);
  },

  async submit(job: VideoJob): Promise<ProviderSubmitResult> {
    const { width, height } = mapAspect(job.aspectRatio);
    const input = {
      prompt: job.prompt,
      negative_prompt: job.negativePrompt,
      width,
      height,
      num_frames: Math.min(job.durationSec * 16, 128), // Wan default ~16fps
      seed: job.seed || undefined,
      reference_image: job.imageUrl || job.referenceImageUrls[0] || undefined,
    };

    const res = await fetch(`https://api.runpod.ai/v2/${getEndpoint()}/run`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ input }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`RunPod submit ${res.status}: ${text.slice(0, 400)}`);
    }
    const json = (await res.json()) as { id?: string; status?: string };
    if (!json.id) throw new Error("RunPod: no job id returned");

    return {
      providerJobId: json.id,
      status: "queued",
      meta: { model: "wan-2.2", width, height },
    };
  },

  async poll(providerJobId: string): Promise<ProviderPollResult> {
    const res = await fetch(`https://api.runpod.ai/v2/${getEndpoint()}/status/${providerJobId}`, {
      headers: headers(),
    });
    if (!res.ok) {
      const text = await res.text();
      return { status: "failed", error: `RunPod poll ${res.status}: ${text.slice(0, 200)}` };
    }
    type StatusResponse = {
      status?: string;
      output?: { video_url?: string; poster_url?: string } | string[];
      error?: string;
      executionTime?: number;
    };
    const json = (await res.json()) as StatusResponse;
    const s = (json.status || "").toUpperCase();

    if (s === "COMPLETED") {
      const out = json.output;
      const videoUrl = Array.isArray(out)
        ? out[0]
        : out?.video_url ?? "";
      const posterUrl = Array.isArray(out) ? "" : out?.poster_url ?? "";
      return {
        status: "completed",
        outputUrl: videoUrl,
        posterUrl,
        progress: 1,
        // approximate cost: $0.0007/s GPU × execution time (ms → s)
        actualCostUsd: json.executionTime ? Number(((json.executionTime / 1000) * 0.0007).toFixed(4)) : undefined,
      };
    }
    if (s === "FAILED") return { status: "failed", error: json.error || "RunPod job failed" };
    if (s === "CANCELLED" || s === "CANCELED") return { status: "canceled" };
    if (s === "IN_PROGRESS") return { status: "running", progress: 0.5 };
    return { status: "queued", progress: 0 };
  },

  async cancel(providerJobId: string): Promise<void> {
    await fetch(`https://api.runpod.ai/v2/${getEndpoint()}/cancel/${providerJobId}`, {
      method: "POST",
      headers: headers(),
    });
  },
};
