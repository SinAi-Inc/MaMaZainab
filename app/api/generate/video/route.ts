import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "Video generation is temporarily unavailable. The NVIDIA Stable Video Diffusion model has been deprecated." },
    { status: 503 },
  );
}
