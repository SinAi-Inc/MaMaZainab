/**
 * Runway Gen-4 Turbo provider.
 *
 * Docs: https://docs.dev.runwayml.com/api/
 *   POST https://api.dev.runwayml.com/v1/image_to_video   (img-to-vid)
 *   POST https://api.dev.runwayml.com/v1/text_to_video    (text-only)
 *   GET  https://api.dev.runwayml.com/v1/tasks/{id}
 *
 * Auth: Bearer RUNWAY_API_KEY
 * Header: X-Runway-Version: 2024-11-06
 */
import type { VideoJob } from "../schema";
import type { VideoProvider, ProviderSubmitResult, ProviderPollResult } from "../provider";

const RUNWAY_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_API_VERSION = "2024-11-06";

function getKey(): string {
  const k = process.env.RUNWAY_API_KEY;
  if (!k) throw new Error("RUNWAY_API_KEY is not set");
  return k;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getKey()}`,
    "Content-Type": "application/json",
    "X-Runway-Version": RUNWAY_API_VERSION,
  };
}

/** Map our aspect ratios to Runway gen4.5's two accepted ratios. */
function mapAspect(aspect: string): string {
  // gen4.5 only supports 1280:720 (landscape) or 720:1280 (portrait)
  return aspect === "9:16" ? "720:1280" : "1280:720";
}

export const runwayProvider: VideoProvider = {
  id: "runway",
  label: "Runway Gen-4.5",
  tier: "hero",
  capabilities: {
    maxDurationSec: 10,
    aspects: ["16:9", "9:16"],
    imageToVideo: true,
    characterRefs: true,
    async: true,
  },
  isConfigured() {
    return !!process.env.RUNWAY_API_KEY;
  },

  async submit(job: VideoJob): Promise<ProviderSubmitResult> {
    // Runway only accepts publicly reachable https:// image URLs.
    // Local /uploads/... paths are unreachable from Runway's servers → fall back to text-only.
    const rawImage = job.imageUrl || job.referenceImageUrls[0] || "";
    const useImage = rawImage.startsWith("https://");
    const endpoint = useImage ? "image_to_video" : "text_to_video";

    const body: Record<string, unknown> = {
      model: "gen4.5",
      // Runway caps promptText at 1000 characters
      promptText: job.prompt.slice(0, 1000),
      duration: Math.min(Math.max(job.durationSec, 5), 10),
      ratio: mapAspect(job.aspectRatio),
      ...(job.seed ? { seed: job.seed } : {}),
    };
    if (useImage) body.promptImage = rawImage;

    const res = await fetch(`${RUNWAY_BASE}/${endpoint}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Runway submit ${res.status}: ${text.slice(0, 400)}`);
    }
    const json = (await res.json()) as { id?: string };
    if (!json.id) throw new Error("Runway: no task id returned");

    return {
      providerJobId: json.id,
      status: "queued",
      meta: { endpoint, model: "gen4.5" },
    };
  },

  async poll(providerJobId: string): Promise<ProviderPollResult> {
    const res = await fetch(`${RUNWAY_BASE}/tasks/${providerJobId}`, {
      headers: headers(),
    });
    if (!res.ok) {
      const text = await res.text();
      return { status: "failed", error: `Runway poll ${res.status}: ${text.slice(0, 200)}` };
    }
    type TaskResponse = {
      status?: string;
      progress?: number;
      output?: string[];
      failure?: string;
      failureCode?: string;
    };
    const json = (await res.json()) as TaskResponse;
    // Runway statuses: PENDING, RUNNING, SUCCEEDED, FAILED, CANCELED, THROTTLED
    const s = (json.status || "").toUpperCase();
    if (s === "SUCCEEDED" || s === "SUCCESS") {
      return {
        status: "completed",
        outputUrl: json.output?.[0] ?? "",
        progress: 1,
      };
    }
    if (s === "FAILED") {
      return { status: "failed", error: json.failure || json.failureCode || "Runway task failed" };
    }
    if (s === "CANCELED" || s === "CANCELLED") {
      return { status: "canceled" };
    }
    if (s === "RUNNING") return { status: "running", progress: json.progress ?? 0 };
    return { status: "queued", progress: 0 };
  },

  async cancel(providerJobId: string): Promise<void> {
    await fetch(`${RUNWAY_BASE}/tasks/${providerJobId}`, {
      method: "DELETE",
      headers: headers(),
    });
  },
};
