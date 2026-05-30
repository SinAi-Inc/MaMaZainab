import { NextRequest, NextResponse } from "next/server";
import { requireCreative } from "@/lib/api-guard";

export async function POST(req: NextRequest) {
  const denied = await requireCreative(req);
  if (denied) return denied;

  return NextResponse.json(
    {
      error:
        "This legacy video API has been retired. Use the Studio video workflow, which submits provider-backed jobs through server actions.",
    },
    { status: 410 },
  );
}
