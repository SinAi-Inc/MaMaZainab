"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { readCharacters, writeCharacters } from "./store";
import { uploadFile } from "@/lib/upload";
import { CharacterInputSchema, type Character } from "./schema";

const now = () => new Date().toISOString();

function revalidate() {
  revalidatePath("/characters");
}

/* ---- CRUD --------------------------------------------------- */

export async function createCharacter(input: unknown) {
  const data = CharacterInputSchema.parse(input);
  const state = await readCharacters();
  const character: Character = {
    id: `chr_${nanoid(8)}`,
    ...data,
    sort: data.sort ?? state.characters.length + 1,
    createdAt: now(),
    updatedAt: now(),
  };
  state.characters.push(character);
  await writeCharacters(state);
  revalidate();
  return character;
}

export async function updateCharacter(id: string, input: unknown) {
  const data = CharacterInputSchema.parse(input);
  const state = await readCharacters();
  const idx = state.characters.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error("Character not found");
  state.characters[idx] = { ...state.characters[idx], ...data, updatedAt: now() };
  await writeCharacters(state);
  revalidate();
  return state.characters[idx];
}

export async function deleteCharacter(id: string) {
  const state = await readCharacters();
  state.characters = state.characters.filter((c) => c.id !== id);
  await writeCharacters(state);
  revalidate();
}

export async function toggleCharacterActive(id: string) {
  const state = await readCharacters();
  const idx = state.characters.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error("Character not found");
  state.characters[idx].active = !state.characters[idx].active;
  state.characters[idx].updatedAt = now();
  await writeCharacters(state);
  revalidate();
  return state.characters[idx];
}

/* ---- Reference image upload --------------------------------- */

export async function uploadCharacterImage(formData: FormData): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  if (!file.type.startsWith("image/")) throw new Error("Must be an image");

  const url = await uploadFile(file, "chars", ["png", "jpg", "jpeg", "webp"], 10 * 1024 * 1024);
  revalidate();
  return url;
}

/* ---- Regenerate reference image ----------------------------- */

/**
 * Generates a brand-locked reference image for a character and saves it
 * into their referenceImages array. Uses the character's anchorBlock as
 * the base prompt, wrapped in studio lighting for a clean reference.
 */
export async function regenerateCharacterReference(
  characterId: string,
  mode?: string,
): Promise<{ url: string }> {
  const state = await readCharacters();
  const character = state.characters.find((c) => c.id === characterId);
  if (!character) throw new Error("Character not found");

  const { assemblePrompt, buildAnchorsFromCharacters, getAnchorByValue } = await import("@/lib/ai/brand-bible");

  // Resolve the anchor value (includes mode expansion for multi-mode characters)
  let anchorValue = characterId;
  let modeLabel = "";
  if (mode && character.modes?.length) {
    const m = character.modes.find(
      (am) => am.label.toLowerCase() === mode.toLowerCase() || `${characterId}_${am.label.toLowerCase().replace(/\s+/g, "_")}` === mode,
    );
    if (m) {
      modeLabel = m.label;
      anchorValue = `${characterId}_${m.label.toLowerCase().replace(/\s+/g, "_")}`;
    }
  }

  const anchors = buildAnchorsFromCharacters(state.characters);
  const anchor = getAnchorByValue(anchorValue, anchors);

  // Studio portrait direction — goes into [SHOT]
  const shotPrompt = "standing pose, neutral background, professional studio lighting, full body portrait, 35mm photography, sharp focus";

  const assembled = assemblePrompt({
    characterAnchor: anchor || undefined,
    userPrompt: shotPrompt,
    includePalette: true,
  });

  const { generateImage } = await import("@/lib/nvidia/client");
  const { generateImageComfy, isComfyConfigured } = await import("@/lib/comfy/client");
  const { saveGeneratedImage } = await import("@/lib/generations/actions");

  const seed = Math.floor(Math.random() * 2_000_000_000);
  // Portrait aspect for character refs — 512x768 is SD1.5-native and fast on CPU
  const width = 512;
  const height = 768;

  let result: { image: string; contentType: string; seed: number };
  if (isComfyConfigured()) {
    try {
      result = await generateImageComfy({ prompt: assembled, width, height, seed, skipEnvOverride: true });
    } catch (err) {
      console.warn("[regen-ref] ComfyUI failed, falling back to NVIDIA:", err instanceof Error ? err.message : err);
      result = await generateImage({ model: "black-forest-labs/flux.1-dev", prompt: assembled, width: 1024, height: 1024, seed });
    }
  } else {
    result = await generateImage({ model: "black-forest-labs/flux.1-dev", prompt: assembled, width: 1024, height: 1024, seed });
  }

  const ext = result.contentType.includes("png") ? "png" : "jpg";
  const url = await saveGeneratedImage(result.image, ext);

  // Append to referenceImages
  const label = modeLabel ? `Generated — ${modeLabel}` : "Generated reference";
  character.referenceImages.push({ url, label, isPrimary: character.referenceImages.length === 0 });
  character.updatedAt = now();
  await writeCharacters(state);
  revalidate();

  return { url };
}

/* ---- Validate character (test render) ----------------------- */

/**
 * Runs a standard validation prompt for a character to verify the pipeline
 * produces a recognizable result. Does NOT save to referenceImages.
 */
export async function validateCharacterRender(
  characterId: string,
  mode?: string,
): Promise<{ url: string; condensedPrompt: string }> {
  const state = await readCharacters();
  const character = state.characters.find((c) => c.id === characterId);
  if (!character) throw new Error("Character not found");

  const { assemblePrompt, buildAnchorsFromCharacters, getAnchorByValue } = await import("@/lib/ai/brand-bible");
  const { condenseForSD15 } = await import("@/lib/comfy/client");

  // Resolve anchor value (with mode if multi-mode character)
  let anchorValue = characterId;
  if (mode && character.modes?.length) {
    const m = character.modes.find(
      (am) => am.label.toLowerCase() === mode.toLowerCase(),
    );
    if (m) {
      anchorValue = `${characterId}_${m.label.toLowerCase().replace(/\s+/g, "_")}`;
    }
  }

  const anchors = buildAnchorsFromCharacters(state.characters);
  const anchor = getAnchorByValue(anchorValue, anchors);

  // Neutral studio direction — goes into [SHOT]
  const shotPrompt = "standing in a neutral studio, even lighting, full body, plain grey background";

  const assembled = assemblePrompt({
    characterAnchor: anchor || undefined,
    userPrompt: shotPrompt,
    includePalette: false,
  });
  const { positive: condensedPrompt } = condenseForSD15(assembled);

  const { generateImage } = await import("@/lib/nvidia/client");
  const { generateImageComfy, isComfyConfigured } = await import("@/lib/comfy/client");
  const { saveGeneratedImage } = await import("@/lib/generations/actions");

  const seed = Math.floor(Math.random() * 2_000_000_000);
  // Portrait aspect — SD1.5-native dims for fast CPU renders
  const width = 512;
  const height = 768;

  let result: { image: string; contentType: string; seed: number };
  if (isComfyConfigured()) {
    try {
      result = await generateImageComfy({ prompt: assembled, width, height, seed, skipEnvOverride: true });
    } catch (err) {
      console.warn("[validate-char] ComfyUI failed, falling back to NVIDIA:", err instanceof Error ? err.message : err);
      result = await generateImage({ model: "black-forest-labs/flux.1-dev", prompt: assembled, width: 1024, height: 1024, seed });
    }
  } else {
    result = await generateImage({ model: "black-forest-labs/flux.1-dev", prompt: assembled, width: 1024, height: 1024, seed });
  }

  const ext = result.contentType.includes("png") ? "png" : "jpg";
  const url = await saveGeneratedImage(result.image, ext);

  return { url, condensedPrompt };
}
