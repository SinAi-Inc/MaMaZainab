import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guard";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  return NextResponse.json(
    { error: "Video generation is temporarily unavailable. The NVIDIA Stable Video Diffusion model has been deprecated." },
    { status: 503 },
  );
}
