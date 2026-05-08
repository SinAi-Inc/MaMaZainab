import { NextRequest, NextResponse } from "next/server";
import { pollVideoJob } from "@/lib/nvidia/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reqId: string }> }
) {
  try {
    const { reqId } = await params;

    if (!reqId || typeof reqId !== "string" || reqId.length > 200) {
      return NextResponse.json({ error: "Invalid reqId" }, { status: 400 });
    }

    const result = await pollVideoJob(reqId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Poll failed";
    console.error("[/api/generate/video/poll]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
