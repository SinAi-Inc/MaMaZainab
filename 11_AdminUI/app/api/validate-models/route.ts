import { NextRequest, NextResponse } from "next/server";
import {
  generateImage,
  NVIDIA_IMAGE_MODELS,
  nimAvailable,
  type NvidiaImageModelId,
} from "@/lib/nvidia/client";
import { generateImageComfy, isComfyConfigured } from "@/lib/comfy/client";
import { requireCreative } from "@/lib/api-guard";
import { validateModelsLimiter } from "@/lib/rate-limit";

// Each test generates a 512×512 image - small enough to be fast.
export const maxDuration = 90;

const VALID_MODELS = new Set(
  NVIDIA_IMAGE_MODELS.filter((m) => !m.nimOnly || nimAvailable()).map((m) => m.id),
);
type ImageModelId = NvidiaImageModelId | "comfyui";

export async function GET(req: NextRequest) {
  const denied = await requireCreative(req);
  if (denied) return denied;

  const limited = validateModelsLimiter(req);
  if (limited) return limited;

  const model = req.nextUrl.searchParams.get("model") as ImageModelId | null;
  if (!model) {
    return NextResponse.json({ error: "model param required" }, { status: 400 });
  }
  if (model === "comfyui" && !isComfyConfigured()) {
    return NextResponse.json({ ok: false, error: "ComfyUI is not configured" });
  }
  if (model !== "comfyui" && !VALID_MODELS.has(model)) {
    return NextResponse.json({ ok: false, error: "Model not available or requires NIM" });
  }

  const start = Date.now();
  try {
    if (model === "comfyui") {
      await generateImageComfy({
        prompt: "a single ripe tomato on a white plate, photorealistic",
        width: 512,
        height: 512,
        seed: Math.floor(Math.random() * 2_000_000_000),
        skipEnvOverride: true,
      });
    } else {
      await generateImage({ model, prompt: "a single ripe tomato on a white plate, photorealistic", width: 512, height: 512 });
    }
    return NextResponse.json({ ok: true, elapsedMs: Date.now() - start });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
      elapsedMs: Date.now() - start,
    });
  }
}
