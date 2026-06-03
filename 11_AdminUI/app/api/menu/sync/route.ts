import { type NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { MenuStateSchema } from "@/lib/menu/schema";
import { writeMenu } from "@/lib/menu/store";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { menuSyncLimiter } from "@/lib/rate-limit";
import menuData from "@/data/menu.json";

/**
 * POST /api/menu/sync
 *
 * Pushes the committed data/menu.json into Supabase.
 * This closes the loop: local edits → git push → Vercel deploy → hit sync → Supabase updated.
 * Requires admin auth.
 */
export async function POST(req: NextRequest) {
  // Auth check
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = menuSyncLimiter(req);
  if (limited) return limited;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured - nothing to sync" },
      { status: 400 },
    );
  }

  // Parse the bundled menu.json (included at build time)
  const state = MenuStateSchema.parse(menuData);

  try {
    await writeMenu(state);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Menu sync failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    synced: { categories: state.categories.length, items: state.items.length },
  });
}
