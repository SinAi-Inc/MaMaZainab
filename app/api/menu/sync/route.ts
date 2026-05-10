import { type NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toSnake } from "@/lib/case";
import { MenuStateSchema } from "@/lib/menu/schema";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
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

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured — nothing to sync" },
      { status: 400 },
    );
  }

  // Parse the bundled menu.json (included at build time)
  const state = MenuStateSchema.parse(menuData);

  const sb = getSupabase();

  // Clear and re-insert (matching writeMenu pattern)
  await sb.from("menu_items").delete().neq("id", "");
  await sb.from("menu_categories").delete().neq("id", "");

  let catCount = 0;
  let itemCount = 0;

  if (state.categories.length > 0) {
    const catRows = state.categories.map((c) =>
      toSnake(c as unknown as Record<string, unknown>),
    );
    const { error } = await sb.from("menu_categories").insert(catRows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    catCount = catRows.length;
  }

  if (state.items.length > 0) {
    const itemRows = state.items.map((i) => {
      const row = toSnake(i as unknown as Record<string, unknown>);
      // Supabase stores badges as JSONB text — ensure array is serialized
      if (Array.isArray(row.badges)) {
        row.badges = JSON.stringify(row.badges);
      }
      return row;
    });
    const { error } = await sb.from("menu_items").insert(itemRows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    itemCount = itemRows.length;
  }

  return NextResponse.json({
    ok: true,
    synced: { categories: catCount, items: itemCount },
  });
}
