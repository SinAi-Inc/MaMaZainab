import { NextRequest, NextResponse } from "next/server";
import { generateImage, NVIDIA_IMAGE_MODELS, nimAvailable, type NvidiaImageModelId } from "@/lib/nvidia/client";
import { requireAdmin } from "@/lib/api-guard";
import { recordGeneration } from "@/lib/generations/actions";

// Vercel Hobby: 60s max. Vercel Pro: up to 300s. Set 90s to match client timeout.
export const maxDuration = 90;

// NIM-only models are only valid when NVIDIA_NIM_BASE_URL is configured.
const VALID_MODELS = new Set(
  NVIDIA_IMAGE_MODELS.filter((m) => !m.nimOnly || nimAvailable()).map((m) => m.id)
);

// NVIDIA FLUX.1 practical prompt limit — beyond ~2000 chars quality degrades
const MAX_PROMPT_CHARS = 3000;

function aspectToSize(aspect: string): { width: number; height: number } {
  switch (aspect) {
    case "16:9": return { width: 1344, height: 768 };
    case "9:16": return { width: 768, height: 1344 };
    case "4:3": return { width: 1152, height: 896 };
    case "3:2": return { width: 1216, height: 832 };
    case "2.39:1": return { width: 1344, height: 768 };
    default: return { width: 1024, height: 1024 };
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { model, prompt, aspect, characterAnchor = "", sceneContext = "" } = body as {
      model: string;
      prompt: string;
      aspect: string;
      characterAnchor?: string;
      sceneContext?: string;
    };

    if (!model || !prompt) {
      return NextResponse.json({ error: "model and prompt are required" }, { status: 400 });
    }

    if (!VALID_MODELS.has(model as NvidiaImageModelId)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    if (typeof prompt !== "string" || prompt.length > MAX_PROMPT_CHARS) {
      return NextResponse.json(
        { error: `Prompt too long (${prompt.length} chars) — keep under ${MAX_PROMPT_CHARS}` },
        { status: 400 },
      );
    }

    const { width, height } = aspectToSize(aspect ?? "1:1");

    const result = await generateImage({
      model: model as NvidiaImageModelId,
      prompt,
      width,
      height,
    });

    const elapsedMs = Date.now() - startTime;

    // Save to generation history server-side — survives browser tab switches/disconnects
    let savedEntry;
    try {
      savedEntry = await recordGeneration({
        type: "image",
        model,
        prompt,
        characterAnchor,
        sceneContext,
        aspect: aspect ?? "1:1",
        status: "completed",
        elapsedMs,
        base64Output: result.image,
      });
    } catch (saveErr) {
      // Non-fatal — still return the image even if history save fails
      console.error("[/api/generate/image] history save failed:", saveErr);
    }

    return NextResponse.json({
      image: result.image,
      elapsedMs,
      generationId: savedEntry?.id ?? null,
      outputPath: savedEntry?.outputPath ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[/api/generate/image]", message);

    // Record failure in history too (best-effort)
    recordGeneration({
      type: "image",
      model: "unknown",
      prompt: "",
      status: "failed",
      error: message,
      elapsedMs: Date.now() - startTime,
    }).catch(() => {});

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
