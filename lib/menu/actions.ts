"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { promises as fs } from "node:fs";
import path from "node:path";
import { readMenu, writeMenu } from "./store";
import {
  CategoryInputSchema,
  ItemInputSchema,
  type MenuCategory,
  type MenuItem,
} from "./schema";

function now() {
  return new Date().toISOString();
}

function revalidateMenu() {
  revalidatePath("/menu");
  revalidatePath("/menu/preview");
}

/* ---------------- Categories ---------------- */

export async function createCategory(input: unknown) {
  const data = CategoryInputSchema.parse(input);
  const state = await readMenu();
  const cat: MenuCategory = {
    id: `cat_${nanoid(8)}`,
    ...data,
    sort: data.sort ?? state.categories.length + 1,
    createdAt: now(),
    updatedAt: now(),
  };
  state.categories.push(cat);
  await writeMenu(state);
  revalidateMenu();
  return cat;
}

export async function updateCategory(id: string, input: unknown) {
  const data = CategoryInputSchema.parse(input);
  const state = await readMenu();
  const idx = state.categories.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error("Category not found");
  state.categories[idx] = {
    ...state.categories[idx],
    ...data,
    updatedAt: now(),
  };
  await writeMenu(state);
  revalidateMenu();
  return state.categories[idx];
}

export async function deleteCategory(id: string) {
  const state = await readMenu();
  state.categories = state.categories.filter((c) => c.id !== id);
  state.items = state.items.filter((i) => i.categoryId !== id);
  await writeMenu(state);
  revalidateMenu();
}

export async function reorderCategories(orderedIds: string[]) {
  const state = await readMenu();
  state.categories = state.categories
    .map((c) => ({ ...c, sort: orderedIds.indexOf(c.id) + 1, updatedAt: now() }))
    .sort((a, b) => a.sort - b.sort);
  await writeMenu(state);
  revalidateMenu();
}

/* ---------------- Items ---------------- */

export async function createItem(input: unknown) {
  const data = ItemInputSchema.parse(input);
  const state = await readMenu();
  const item: MenuItem = {
    id: `itm_${nanoid(8)}`,
    ...data,
    sort:
      data.sort ??
      state.items.filter((i) => i.categoryId === data.categoryId).length + 1,
    createdAt: now(),
    updatedAt: now(),
  };
  state.items.push(item);
  await writeMenu(state);
  revalidateMenu();
  return item;
}

export async function updateItem(id: string, input: unknown) {
  const data = ItemInputSchema.parse(input);
  const state = await readMenu();
  const idx = state.items.findIndex((i) => i.id === id);
  if (idx < 0) throw new Error("Item not found");
  state.items[idx] = { ...state.items[idx], ...data, updatedAt: now() };
  await writeMenu(state);
  revalidateMenu();
  return state.items[idx];
}

export async function deleteItem(id: string) {
  const state = await readMenu();
  state.items = state.items.filter((i) => i.id !== id);
  await writeMenu(state);
  revalidateMenu();
}

export async function toggleItemAvailable(id: string) {
  const state = await readMenu();
  const idx = state.items.findIndex((i) => i.id === id);
  if (idx < 0) throw new Error("Item not found");
  state.items[idx].available = !state.items[idx].available;
  state.items[idx].updatedAt = now();
  await writeMenu(state);
  revalidateMenu();
  return state.items[idx];
}

/* ---------------- Image upload (Server Action) ---------------- */

export async function uploadItemImage(formData: FormData): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  if (!file.type.startsWith("image/")) throw new Error("Must be an image");
  if (file.size > 5 * 1024 * 1024) throw new Error("Max 5MB");

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext) ? ext : "png";
  const filename = `${nanoid(10)}.${safeExt}`;

  const dir = path.join(process.cwd(), "public", "uploads", "menu");
  await fs.mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buf);

  const publicPath = `/uploads/menu/${filename}`;
  revalidateMenu();
  return publicPath;
}
