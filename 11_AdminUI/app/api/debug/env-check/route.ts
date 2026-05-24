import { type NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { readCharacters } from "@/lib/characters/store";
import { readSettings } from "@/lib/settings/store";
import { readMenu } from "@/lib/menu/store";
import { readContacts } from "@/lib/contacts/store";
import { readStudio } from "@/lib/videos/store";

/**
 * GET /api/debug/env-check
 * Returns env var presence + store health check.
 * DELETE THIS ROUTE after diagnosing issues.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  let sessionValid = false;
  let sessionError: string | null = null;
  try {
    sessionValid = token ? await verifySessionToken(token) : false;
  } catch (e) {
    sessionError = String(e);
  }

  // Test each store independently
  async function probe(name: string, fn: () => Promise<unknown>) {
    try { await fn(); return { ok: true }; }
    catch (e) { return { ok: false, error: String(e) }; }
  }

  const [chars, settings, menu, contacts, studio] = await Promise.all([
    probe("characters", () => readCharacters()),
    probe("settings",   () => readSettings()),
    probe("menu",       () => readMenu()),
    probe("contacts",   () => readContacts()),
    probe("studio",     () => readStudio()),
  ]);

  return NextResponse.json({
    env: {
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      ADMIN_JWT_SECRET: !!process.env.ADMIN_JWT_SECRET,
      PARTNER_JWT_SECRET: !!process.env.PARTNER_JWT_SECRET,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
      BRAND_PRIVATE_DATA: !!process.env.BRAND_PRIVATE_DATA,
    },
    session: { hasCookie: !!token, valid: sessionValid, error: sessionError },
    stores: { chars, settings, menu, contacts, studio },
    node_env: process.env.NODE_ENV,
  });
}
