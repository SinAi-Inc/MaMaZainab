import { NextRequest, NextResponse } from "next/server";
import { pollVideoJob } from "@/lib/nvidia/client";
import { requireAdmin } from "@/lib/api-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reqId: string }> }
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { reqId } = await params;

    // Validate reqId is a UUID or NVIDIA request ID (alphanumeric + hyphens only)
    if (!reqId || typeof reqId !== "string" || reqId.length > 200 || !/^[a-zA-Z0-9\-]+$/.test(reqId)) {
      return NextResponse.json({ error: "Invalid reqId" }, { status: 400 });
    }

    const result = await pollVideoJob(reqId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Poll failed";
    console.error("[/api/generate/video/poll]", String(message).slice(0, 500).replace(/[\r\n]/g, " "));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
