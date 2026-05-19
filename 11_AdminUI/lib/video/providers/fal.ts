/**
 * fal.ai unified video provider — accesses Kling, Luma, HunyuanVideo,
 * and Wan models through a single backend API.
 *
 * Docs: https://fal.ai/docs
 *   POST https://queue.fal.run/{model}    (submit)
 *   GET  https://queue.fal.run/{model}/requests/{id}/status  (poll)
 *
 * Auth: Key FAL_KEY
 *
 * Models available:
 *   fal-ai/kling-video/v2/master/image-to-video  → Kling 3.0
 *   fal-ai/luma-dream-machine                    → Luma Dream Machine
 *   fal-ai/hunyuan-video                         → HunyuanVideo
 *   fal-ai/wan/v2.1/image-to-video               → Wan 2.1
 */
import type { VideoJob } from "../schema";
import type {
  VideoProvider,
  ProviderSubmitResult,
  ProviderPollResult,
} from "../provider";

const FAL_QUEUE_BASE = "https://queue.fal.run";

/**
 * Sub-model IDs that fal.ai hosts — each maps to one of our VideoModel values.
 * The caller sets the desired model via `job.providerMeta.falModel`.
 */
export type FalModel =
  | "fal-ai/kling-video/v2/master/image-to-video"
  | "fal-ai/kling-video/v2/master/text-to-video"
  | "fal-ai/luma-dream-machine"
  | "fal-ai/hunyuan-video"
  | "fal-ai/wan/v2.1/image-to-video"
  | "fal-ai/wan/v2.1/text-to-video"
  | "fal-ai/pika/v2.2/image-to-video"
  | "fal-ai/pika/v2.2/text-to-video"
  | "fal-ai/veo3";

function getKey(): string {
  const k = process.env.FAL_KEY;
  if (!k) throw new Error("FAL_KEY is not set");
  return k;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Key ${getKey()}`,
    "Content-Type": "application/json",
  };
}

/**
 * Pick the fal model endpoint based on job metadata.
 * Priority: explicit `providerMeta.falModel` → infer from VideoModel → default kling.
 */
function resolveFalModel(job: VideoJob): string {
  // Explicit override
  const explicit = job.providerMeta?.falModel;
  if (typeof explicit === "string" && explicit.startsWith("fal-ai/")) return explicit;

  // Infer from the Take's video model field (set by motion stage UI)
  const hasImage = !!job.imageUrl;
  switch (job.providerMeta?.targetModel) {
    case "kling/3.0":
      return hasImage
        ? "fal-ai/kling-video/v2/master/image-to-video"
        : "fal-ai/kling-video/v2/master/text-to-video";
    case "google/veo-3":
      return "fal-ai/veo3";
    case "pika/2.2":
      return hasImage
        ? "fal-ai/pika/v2.2/image-to-video"
        : "fal-ai/pika/v2.2/text-to-video";
    case "luma/dream-machine":
      return "fal-ai/luma-dream-machine";
    default:
      // Default to Kling (best for action/martial arts/robes)
      return hasImage
        ? "fal-ai/kling-video/v2/master/image-to-video"
        : "fal-ai/kling-video/v2/master/text-to-video";
  }
}

/** Map aspect ratios to fal.ai's accepted formats */
function mapAspect(aspect: string): string {
  switch (aspect) {
    case "9:16":
      return "9:16";
    case "1:1":
      return "1:1";
    case "4:3":
      return "4:3";
    case "2.39:1":
      return "21:9";
    default:
      return "16:9";
  }
}

export const falProvider: VideoProvider = {
  id: "fal",
  label: "fal.ai (Kling / Luma / Veo / Pika / Wan)",
  tier: "hero",
  capabilities: {
    maxDurationSec: 10,
    aspects: ["16:9", "9:16", "1:1", "4:3"],
    imageToVideo: true,
    characterRefs: true,
    async: true,
  },
  isConfigured() {
    return !!process.env.FAL_KEY;
  },

  async submit(job: VideoJob): Promise<ProviderSubmitResult> {
    const model = resolveFalModel(job);
    const hasImage = !!job.imageUrl && job.imageUrl.startsWith("https://");

    // Build request body — fal.ai schema varies per model but most share:
    const body: Record<string, unknown> = {
      prompt: job.prompt.slice(0, 2000),
      aspect_ratio: mapAspect(job.aspectRatio),
      duration: String(Math.min(job.durationSec, 10)),
    };

    // Image-to-video: attach the keyframe
    if (hasImage && model.includes("image-to-video")) {
      body.image_url = job.imageUrl;
    } else if (hasImage && model === "fal-ai/luma-dream-machine") {
      body.image_url = job.imageUrl;
    } else if (hasImage && model === "fal-ai/veo3") {
      body.image = { url: job.imageUrl };
    }

    // Negative prompt if supported
    if (job.negativePrompt) {
      body.negative_prompt = job.negativePrompt;
    }

    // Seed
    if (job.seed) {
      body.seed = job.seed;
    }

    const res = await fetch(`${FAL_QUEUE_BASE}/${model}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`fal.ai submit ${res.status}: ${text.slice(0, 400)}`);
    }

    const json = (await res.json()) as {
      request_id?: string;
      status?: string;
      // Some models return result inline for fast completions
      video?: { url?: string };
      images?: Array<{ url?: string }>;
    };

    const requestId = json.request_id;
    if (!requestId) throw new Error("fal.ai: no request_id returned");

    return {
      providerJobId: `${model}::${requestId}`,
      status: json.status === "COMPLETED" ? "completed" : "queued",
      outputUrl: json.video?.url ?? undefined,
      meta: { falModel: model, requestId },
    };
  },

  async poll(providerJobId: string): Promise<ProviderPollResult> {
    // providerJobId format: "fal-ai/model-name::request_id"
    const sepIdx = providerJobId.lastIndexOf("::");
    if (sepIdx < 0) return { status: "failed", error: "Invalid fal job ID format" };

    const model = providerJobId.slice(0, sepIdx);
    const requestId = providerJobId.slice(sepIdx + 2);

    const res = await fetch(
      `${FAL_QUEUE_BASE}/${model}/requests/${requestId}/status`,
      { headers: headers() },
    );

    if (!res.ok) {
      const text = await res.text();
      return { status: "failed", error: `fal.ai poll ${res.status}: ${text.slice(0, 200)}` };
    }

    const json = (await res.json()) as {
      status: string;
      response_url?: string;
      logs?: Array<{ message: string }>;
    };

    const falStatus = json.status?.toUpperCase();

    if (falStatus === "COMPLETED") {
      // Fetch the actual result to get the output URL
      const resultRes = await fetch(
        `${FAL_QUEUE_BASE}/${model}/requests/${requestId}`,
        { headers: headers() },
      );
      if (!resultRes.ok) {
        return { status: "completed", outputUrl: json.response_url };
      }
      const result = (await resultRes.json()) as {
        video?: { url?: string };
        images?: Array<{ url?: string }>;
      };
      return {
        status: "completed",
        outputUrl: result.video?.url ?? result.images?.[0]?.url,
      };
    }

    if (falStatus === "FAILED") {
      const lastLog = json.logs?.[json.logs.length - 1]?.message;
      return { status: "failed", error: lastLog || "fal.ai job failed" };
    }

    // IN_QUEUE or IN_PROGRESS
    return { status: "running" };
  },

  async cancel(providerJobId: string): Promise<void> {
    const sepIdx = providerJobId.lastIndexOf("::");
    if (sepIdx < 0) return;
    const model = providerJobId.slice(0, sepIdx);
    const requestId = providerJobId.slice(sepIdx + 2);

    await fetch(`${FAL_QUEUE_BASE}/${model}/requests/${requestId}/cancel`, {
      method: "PUT",
      headers: headers(),
    }).catch(() => {});
  },
};
