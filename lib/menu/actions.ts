"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { readMenu, writeMenu } from "./store";
import { uploadFile } from "@/lib/upload";
import {
  CategoryInputSchema,
  ItemInputSchema,
  type MenuCategory,
  type MenuItem,
} from "./schema";

function now() {
  return new Date().toISOString();
}

/**
 * Generates a unique SKU for a menu item.
 * Format: MZ-{3-CHAR-CAT}-{4-DIGIT-SEQ}
 * Example: MZ-STF-0003 (Stuffy Fingers, 3rd item)
 */
function buildSku(categoryId: string, catName: string, existingSkus: string[]): string {
  const catCode = catName
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");
  const prefix = `MZ-${catCode}-`;
  // Find the highest sequential number already used for this prefix
  const nums = existingSkus
    .filter((s) => s.startsWith(prefix))
    .map((s) => parseInt(s.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function revalidateMenu() {
  revalidatePath("/menu");
  revalidatePath("/menu/preview");
  revalidatePath("/menu/print");
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
  const cat = state.categories.find((c) => c.id === data.categoryId);
  const allSkus = state.items.map((i) => i.sku).filter(Boolean);
  const sku = buildSku(data.categoryId, cat?.nameEn ?? "GEN", allSkus);
  const item: MenuItem = {
    id: `itm_${nanoid(8)}`,
    ...data,
    sku,
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

/** Assign a new auto-generated SKU to an existing item that has none. */
export async function assignItemSku(id: string) {
  const state = await readMenu();
  const idx = state.items.findIndex((i) => i.id === id);
  if (idx < 0) throw new Error("Item not found");
  const item = state.items[idx];
  const cat = state.categories.find((c) => c.id === item.categoryId);
  const allSkus = state.items.map((i) => i.sku).filter(Boolean);
  state.items[idx].sku = buildSku(item.categoryId, cat?.nameEn ?? "GEN", allSkus);
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

  const url = await uploadFile(file, "menu", ["png", "jpg", "jpeg", "webp", "gif"], 5 * 1024 * 1024);
  revalidateMenu();
  return url;
}
