import { NextRequest, NextResponse } from "next/server";
import { requireCreative } from "@/lib/api-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reqId: string }> }
) {
  const denied = await requireCreative(req);
  if (denied) return denied;

  const { reqId } = await params;

  if (
    !reqId ||
    typeof reqId !== "string" ||
    reqId.length > 200 ||
    !/^[a-zA-Z0-9-]+$/.test(reqId)
  ) {
    return NextResponse.json({ error: "Invalid reqId" }, { status: 400 });
  }

  return NextResponse.json(
    {
      error:
        "This legacy NVIDIA polling API has been retired. Use the Studio video workflow, which tracks provider-backed jobs through server actions.",
    },
    { status: 410 },
  );
}
