/**
 * DEV-ONLY: Dry-run character prompt assembly.
 * Shows what would be sent to ComfyUI without actually generating.
 *
 * GET /api/dev/char-prompt?id=chr_mama_zainab
 * GET /api/dev/char-prompt?id=chr_wong&mode=Warrior
 * GET /api/dev/char-prompt?id=all
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

  const { readCharacters } = await import("@/lib/characters/store");
  const { assemblePrompt, buildAnchorsFromCharacters, getAnchorByValue } = await import("@/lib/ai/brand-bible");
  const { condenseForSD15 } = await import("@/lib/comfy/client");

  const state = await readCharacters();
  const anchors = buildAnchorsFromCharacters(state.characters);

  function buildDryRun(charId: string, modeLabel?: string) {
    const character = state.characters.find((c) => c.id === charId);
    if (!character) return { id: charId, error: "Character not found" };

    // Resolve anchor value (with mode expansion)
    let anchorValue = charId;
    let resolvedMode = "";
    if (modeLabel && character.modes?.length) {
      const m = character.modes.find(
        (am) => am.label.toLowerCase() === modeLabel.toLowerCase(),
      );
      if (m) {
        resolvedMode = m.label;
        anchorValue = `${charId}_${m.label.toLowerCase().replace(/\s+/g, "_")}`;
      }
    }

    const anchor = getAnchorByValue(anchorValue, anchors);
    const shotPrompt = "standing in a neutral studio, even lighting, full body, plain grey background";

    const assembled = assemblePrompt({
      characterAnchor: anchor || undefined,
      userPrompt: shotPrompt,
      includePalette: false,
    });
    const { positive, negative } = condenseForSD15(assembled);

    // Debug: manually re-extract to show intermediate state
    const subjectRegex = /^Subject:\s*([\s\S]*?)(?=\n\n|\n\[SHOT\])/m;
    const subjectMatch = assembled.match(subjectRegex);
    const charBlockLen = subjectMatch ? subjectMatch[1].trim().length : 0;

    return {
      id: charId,
      name: character.name,
      mode: resolvedMode || undefined,
      anchorValue,
      anchorFound: !!anchor,
      promptAnchor: anchor?.promptAnchor?.slice(0, 200),
      assembled,
      _debug: {
        charBlockLength: charBlockLen,
      },
      condensed: {
        positive,
        positiveLength: positive.length,
        positiveTokensEst: Math.ceil(positive.length / 4),
        negative,
      },
    };
  }

  if (characterId === "all") {
    const results = [];
    for (const char of state.characters.filter((c) => c.active)) {
      if (char.modes.length > 0) {
        for (const m of char.modes) {
          results.push(buildDryRun(char.id, m.label));
        }
      } else {
        results.push(buildDryRun(char.id));
      }
    }
    return NextResponse.json({ results });
  }

  return NextResponse.json(buildDryRun(characterId, mode));
}
