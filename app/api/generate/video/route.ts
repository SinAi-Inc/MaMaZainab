import { NextRequest, NextResponse } from "next/server";
import { submitVideoJob, NVIDIA_VIDEO_MODELS, type NvidiaVideoModelId } from "@/lib/nvidia/client";

const VALID_MODELS = new Set(NVIDIA_VIDEO_MODELS.map((m) => m.id));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, prompt, image } = body as {
      model: string;
      prompt: string;
      image?: string;
    };

    if (!model || (!prompt && !image)) {
      return NextResponse.json({ error: "model and (prompt or image) are required" }, { status: 400 });
    }

    if (!VALID_MODELS.has(model as NvidiaVideoModelId)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    if (prompt && (typeof prompt !== "string" || prompt.length > 10000)) {
      return NextResponse.json({ error: "Prompt must be a string under 10000 chars" }, { status: 400 });
    }

    const result = await submitVideoJob({
      model: model as NvidiaVideoModelId,
      prompt: prompt ?? "",
      image,
    });

    if (result.status === "completed" && result.video) {
      return NextResponse.json({ video: result.video });
    }

    return NextResponse.json({ reqId: result.reqId, status: result.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[/api/generate/video]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
