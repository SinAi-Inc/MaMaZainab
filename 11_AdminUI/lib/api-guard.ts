import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, CREATIVE_ROLES, verifySessionToken } from "@/lib/auth";

/**
 * requireAdmin - Route-level auth guard (defense-in-depth).
 *
 * The proxy (proxy.ts) already gates every non-public path, but sensitive
 * API routes (generate, sync, etc.) re-verify at the handler level so they
 * remain protected even if the proxy matcher is ever widened by mistake.
 *
 * Usage:
 *   const denied = await requireAdmin(req);
 *   if (denied) return denied;
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function requireCreative(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifySessionToken(token, CREATIVE_ROLES))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
