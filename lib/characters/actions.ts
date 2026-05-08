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
