/**
 * DEV-ONLY: Trigger character validation renders.
 *
 * GET /api/dev/char-render?id=chr_mama_zainab&mode=Warrior
 * GET /api/dev/char-render?id=all  (queue all characters sequentially)
 *
 * Returns { url, condensedPrompt } on success.
 * Only enabled when NODE_ENV !== "production".
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const characterId = searchParams.get("id");
  const mode = searchParams.get("mode") || undefined;

  if (!characterId) {
    return NextResponse.json(
      { error: "Missing ?id= parameter. Use a character ID or 'all'." },
      { status: 400 },
    );
  }

  const { validateCharacterRender } = await import("@/lib/characters/actions");

  if (characterId === "all") {
    const { readCharacters } = await import("@/lib/characters/store");
    const state = await readCharacters();
    const results: { id: string; mode?: string; url?: string; condensedPrompt?: string; error?: string }[] = [];

    for (const char of state.characters.filter((c) => c.active)) {
      if (char.modes.length > 0) {
        for (const m of char.modes) {
          try {
            const r = await validateCharacterRender(char.id, m.label);
            results.push({ id: char.id, mode: m.label, url: r.url, condensedPrompt: r.condensedPrompt });
          } catch (err) {
            results.push({ id: char.id, mode: m.label, error: err instanceof Error ? err.message : String(err) });
          }
        }
      } else {
        try {
          const r = await validateCharacterRender(char.id);
          results.push({ id: char.id, url: r.url, condensedPrompt: r.condensedPrompt });
        } catch (err) {
          results.push({ id: char.id, error: err instanceof Error ? err.message : String(err) });
        }
      }
    }

    return NextResponse.json({ results });
  }

  // Single character
  try {
    const result = await validateCharacterRender(characterId, mode);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
