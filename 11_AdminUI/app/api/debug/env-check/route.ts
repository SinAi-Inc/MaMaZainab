import { type NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

/**
 * GET /api/debug/env-check
 * Returns which auth env vars are set (not their values).
 * Requires a valid admin session (or allow-all for initial diagnosis).
 * DELETE THIS ROUTE after diagnosing Vercel env var issues.
 */
export async function GET(req: NextRequest) {
  // Attempt to verify session — report result regardless
  const token = req.cookies.get(COOKIE_NAME)?.value;
  let sessionValid = false;
  let sessionError: string | null = null;
  try {
    sessionValid = token ? await verifySessionToken(token) : false;
  } catch (e) {
    sessionError = String(e);
  }

  return NextResponse.json({
    env: {
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      ADMIN_JWT_SECRET: !!process.env.ADMIN_JWT_SECRET,
      PARTNER_JWT_SECRET: !!process.env.PARTNER_JWT_SECRET,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
      BRAND_PRIVATE_DATA: !!process.env.BRAND_PRIVATE_DATA,
    },
    session: {
      hasCookie: !!token,
      valid: sessionValid,
      error: sessionError,
    },
    node_env: process.env.NODE_ENV,
  });
}
