import { NextRequest, NextResponse } from "next/server";
import {
  generateImage,
  NVIDIA_IMAGE_MODELS,
  nimAvailable,
  type NvidiaImageModelId,
} from "@/lib/nvidia/client";
import { requireAdmin } from "@/lib/api-guard";

// Each test generates a 512×512 image — small enough to be fast.
export const maxDuration = 90;

const VALID_MODELS = new Set(
  NVIDIA_IMAGE_MODELS.filter((m) => !m.nimOnly || nimAvailable()).map((m) => m.id),
);

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const model = req.nextUrl.searchParams.get("model") as NvidiaImageModelId | null;
  if (!model) {
    return NextResponse.json({ error: "model param required" }, { status: 400 });
  }
  if (!VALID_MODELS.has(model)) {
    return NextResponse.json({ ok: false, error: "Model not available or requires NIM" });
  }

  const start = Date.now();
  try {
    await generateImage({ model, prompt: "a single ripe tomato on a white plate, photorealistic", width: 512, height: 512 });
    return NextResponse.json({ ok: true, elapsedMs: Date.now() - start });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
      elapsedMs: Date.now() - start,
    });
  }
}
