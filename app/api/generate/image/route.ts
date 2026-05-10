import { NextRequest, NextResponse } from "next/server";
import { generateImage, NVIDIA_IMAGE_MODELS, type NvidiaImageModelId } from "@/lib/nvidia/client";
import { requireAdmin } from "@/lib/api-guard";

const VALID_MODELS = new Set(NVIDIA_IMAGE_MODELS.map((m) => m.id));

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

  try {
    const body = await req.json();
    const { model, prompt, aspect } = body as {
      model: string;
      prompt: string;
      aspect: string;
    };

    if (!model || !prompt) {
      return NextResponse.json({ error: "model and prompt are required" }, { status: 400 });
    }

    if (!VALID_MODELS.has(model as NvidiaImageModelId)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    if (typeof prompt !== "string" || prompt.length > 10000) {
      return NextResponse.json({ error: "Prompt must be a string under 10000 chars" }, { status: 400 });
    }

    const { width, height } = aspectToSize(aspect ?? "1:1");

    const result = await generateImage({
      model: model as NvidiaImageModelId,
      prompt,
      width,
      height,
    });

    return NextResponse.json({ image: result.image });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[/api/generate/image]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
