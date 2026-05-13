import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toCamel, toSnake } from "@/lib/case";
import {
  MenuCategorySchema,
  MenuItemSchema,
  MenuStateSchema,
  type MenuState,
  type MenuCategory,
  type MenuItem,
} from "./schema";

const FILE = path.join(process.cwd(), "data", "menu.json");
const DATA_DIR = path.join(process.cwd(), "data");
const SUPABASE_PUBLIC_UPLOADS_SEGMENT = "/storage/v1/object/public/uploads/";
const LEGACY_MENU_ITEM_COLUMNS = [
  "name_ar",
  "description_ar",
  "calories_label",
  "serving_info",
  "highlights",
] as const;

let menuItemWriteMode: "full" | "legacy" = "full";

/* ---- Seed data (used when tables are empty) ---- */

const now = () => new Date().toISOString();

const SEED_CATEGORIES: MenuCategory[] = [
  { id: "cat_stuffy", nameEn: "Stuffy Fingers", descriptionEn: "Hand-rolled, slow-cooked. Mama's signature.", sort: 1, visible: true, createdAt: now(), updatedAt: now() },
  { id: "cat_sides",  nameEn: "Sides",          descriptionEn: "", sort: 2, visible: true, createdAt: now(), updatedAt: now() },
  { id: "cat_drinks", nameEn: "Drinks",         descriptionEn: "", sort: 3, visible: true, createdAt: now(), updatedAt: now() },
];

const SEED_ITEMS: MenuItem[] = [
  { id: "itm_stuffy_grape",   categoryId: "cat_stuffy", sku: "MZ-STF-0001", nameEn: "Grape Leaf Rolls",  nameAr: "", descriptionEn: "Vine leaves rolled with rice, herbs, and a hint of lemon.", descriptionAr: "", priceEgp: 95, caloriesLabel: "", servingInfo: "", highlights: [], imageUrl: "", badges: ["bestseller"], available: true, sort: 1, createdAt: now(), updatedAt: now() },
  { id: "itm_stuffy_cabbage", categoryId: "cat_stuffy", sku: "MZ-STF-0002", nameEn: "Cabbage Rolls",     nameAr: "", descriptionEn: "Cabbage rolls, slow-cooked in tomato broth.", descriptionAr: "", priceEgp: 90, caloriesLabel: "", servingInfo: "", highlights: [], imageUrl: "", badges: ["chefs_pick"], available: true, sort: 2, createdAt: now(), updatedAt: now() },
  { id: "itm_side_salad",     categoryId: "cat_sides",  sku: "MZ-SID-0001", nameEn: "Country Salad",     nameAr: "", descriptionEn: "Fresh tomato, cucumber, onion, parsley.", descriptionAr: "", priceEgp: 30, caloriesLabel: "", servingInfo: "", highlights: [], imageUrl: "", badges: ["vegan"], available: true, sort: 1, createdAt: now(), updatedAt: now() },
  { id: "itm_drink_hibiscus", categoryId: "cat_drinks", sku: "MZ-DRK-0001", nameEn: "Hibiscus Cooler",   nameAr: "", descriptionEn: "Chilled hibiscus, lightly sweet.", descriptionAr: "", priceEgp: 25, caloriesLabel: "", servingInfo: "", highlights: [], imageUrl: "", badges: [], available: true, sort: 1, createdAt: now(), updatedAt: now() },
];

function normalizeImageUrl(imageUrl: string) {
  if (!imageUrl) return "";
  const markerIndex = imageUrl.indexOf(SUPABASE_PUBLIC_UPLOADS_SEGMENT);
  if (markerIndex < 0) return imageUrl;
  return `/uploads/${imageUrl.slice(markerIndex + SUPABASE_PUBLIC_UPLOADS_SEGMENT.length)}`;
}

function isLegacyMenuItemColumnError(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message ?? "";
  const mentionsLegacyColumn = LEGACY_MENU_ITEM_COLUMNS.some(
    (column) => message.includes(`menu_items.${column}`) || message.includes(`'${column}' column of 'menu_items'`)
  );

  return Boolean(
    (error?.code === "42703" || error?.code === "PGRST204") &&
      mentionsLegacyColumn
  );
}

function serializeMenuItemRow(item: MenuItem, mode: "full" | "legacy" = menuItemWriteMode) {
  const row = toSnake(item as unknown as Record<string, unknown>);
  if (Array.isArray(row.badges)) row.badges = JSON.stringify(row.badges);
  if (Array.isArray(row.highlights)) row.highlights = JSON.stringify(row.highlights);

  if (mode === "legacy") {
    delete row.name_ar;
    delete row.description_ar;
    delete row.calories_label;
    delete row.serving_info;
    delete row.highlights;
  }

  return row;
}

async function upsertMenuItemRow(sb: ReturnType<typeof getSupabase>, item: MenuItem) {
  const firstAttempt = await sb.from("menu_items").upsert(serializeMenuItemRow(item));
  if (!firstAttempt.error) return;

  if (menuItemWriteMode === "full" && isLegacyMenuItemColumnError(firstAttempt.error)) {
    menuItemWriteMode = "legacy";
    const fallbackAttempt = await sb.from("menu_items").upsert(serializeMenuItemRow(item, "legacy"));
    if (fallbackAttempt.error) throw fallbackAttempt.error;
    return;
  }

  throw firstAttempt.error;
}

async function insertMenuItems(sb: ReturnType<typeof getSupabase>, items: MenuItem[]) {
  const insertRows = (mode: "full" | "legacy") =>
    items.map((item) => serializeMenuItemRow(item, mode));

  const firstAttempt = await sb.from("menu_items").insert(insertRows(menuItemWriteMode));
  if (!firstAttempt.error) return;

  if (menuItemWriteMode === "full" && isLegacyMenuItemColumnError(firstAttempt.error)) {
    menuItemWriteMode = "legacy";
    const fallbackAttempt = await sb.from("menu_items").insert(insertRows("legacy"));
    if (fallbackAttempt.error) throw fallbackAttempt.error;
    return;
  }

  throw firstAttempt.error;
}

function normalizeCategory(category: MenuCategory) {
  return MenuCategorySchema.parse(category);
}

function normalizeItem(item: MenuItem) {
  return MenuItemSchema.parse({
    ...item,
    imageUrl: normalizeImageUrl(item.imageUrl),
  });
}

function normalizeState(state: unknown): MenuState {
  const parsed = MenuStateSchema.parse(state);
  return {
    version: parsed.version,
    categories: parsed.categories.map(normalizeCategory),
    items: parsed.items.map(normalizeItem),
  };
}

function parseTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function preferFilledString(primary: string, fallback: string) {
  return primary.trim() ? primary : fallback;
}

function preferFilledList<T>(primary: T[], fallback: T[]) {
  return primary.length > 0 ? primary : fallback;
}

function mergeCategoryRecord(left: MenuCategory, right: MenuCategory) {
  const leftTime = parseTimestamp(left.updatedAt);
  const rightTime = parseTimestamp(right.updatedAt);
  const primary = rightTime >= leftTime ? right : left;
  const fallback = primary === right ? left : right;

  return normalizeCategory({
    ...fallback,
    ...primary,
    descriptionEn: preferFilledString(primary.descriptionEn, fallback.descriptionEn),
  });
}

function mergeItemRecord(left: MenuItem, right: MenuItem) {
  const leftTime = parseTimestamp(left.updatedAt);
  const rightTime = parseTimestamp(right.updatedAt);
  const primary = rightTime >= leftTime ? right : left;
  const fallback = primary === right ? left : right;

  return normalizeItem({
    ...fallback,
    ...primary,
    nameAr: preferFilledString(primary.nameAr, fallback.nameAr),
    descriptionEn: preferFilledString(primary.descriptionEn, fallback.descriptionEn),
    descriptionAr: preferFilledString(primary.descriptionAr, fallback.descriptionAr),
    caloriesLabel: preferFilledString(primary.caloriesLabel, fallback.caloriesLabel),
    servingInfo: preferFilledString(primary.servingInfo, fallback.servingInfo),
    highlights: preferFilledList(primary.highlights, fallback.highlights),
    imageUrl: preferFilledString(normalizeImageUrl(primary.imageUrl), normalizeImageUrl(fallback.imageUrl)),
  });
}

function mergeRecords<T extends { id: string; sort: number }>(
  fileRecords: T[],
  supabaseRecords: T[],
  merge: (left: T, right: T) => T,
) {
  const merged = new Map<string, T>();

  for (const record of fileRecords) {
    merged.set(record.id, record);
  }

  for (const record of supabaseRecords) {
    const existing = merged.get(record.id);
    merged.set(record.id, existing ? merge(existing, record) : record);
  }

  return [...merged.values()].sort((a, b) => a.sort - b.sort);
}



async function readJson(): Promise<MenuState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch {
    const state: MenuState = { version: 1, categories: SEED_CATEGORIES, items: SEED_ITEMS };
    await writeJson(state);
    return state;
  }
}

async function writeJson(state: MenuState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(normalizeState(state), null, 2), "utf8");
}



async function seed(state: MenuState) {
  const sb = getSupabase();
  for (const c of state.categories) {
    await sb.from("menu_categories").upsert(toSnake(c as unknown as Record<string, unknown>));
  }
  for (const i of state.items) {
    await upsertMenuItemRow(sb, i);
  }
}



export async function readMenu(): Promise<MenuState> {
  const fileState = await readJson();
  if (!isSupabaseConfigured()) return fileState;

  const sb = getSupabase();
  const { data: cats } = await sb
    .from("menu_categories")
    .select("*")
    .order("sort");

  if (!cats || cats.length === 0) {
    await seed(fileState);
    return fileState;
  }

  const { data: items } = await sb
    .from("menu_items")
    .select("*")
    .order("sort");

  const supabaseCategories = (cats ?? []).map((r) =>
    MenuCategorySchema.parse(toCamel(r) as unknown as Record<string, unknown>)
  );

  const supabaseItems = (items ?? []).map((r) => {
    const parsed = { ...(r as Record<string, unknown>) };
    if (typeof parsed.badges === "string") {
      try { parsed.badges = JSON.parse(parsed.badges); } catch { parsed.badges = []; }
    }
    if (typeof parsed.highlights === "string") {
      try { parsed.highlights = JSON.parse(parsed.highlights); } catch { parsed.highlights = []; }
    }
    return MenuItemSchema.parse(toCamel(parsed) as unknown as Record<string, unknown>);
  });

  return {
    version: 1,
    categories: mergeRecords(fileState.categories, supabaseCategories, mergeCategoryRecord),
    items: mergeRecords(fileState.items, supabaseItems, mergeItemRecord),
  };
}

export async function writeMenu(state: MenuState): Promise<void> {
  const normalizedState = normalizeState(state);

  if (!isSupabaseConfigured()) {
    // Local dev — persist to JSON only
    return writeJson(normalizedState);
  }

  // Production (Vercel) — write to Supabase; also try JSON for dev parity but don't fail
  try { await writeJson(normalizedState); } catch { /* read-only FS on Vercel — expected */ }

  const sb = getSupabase();
  await sb.from("menu_items").delete().neq("id", "");
  await sb.from("menu_categories").delete().neq("id", "");

  if (normalizedState.categories.length > 0) {
    const catRows = normalizedState.categories.map((c) => toSnake(c as unknown as Record<string, unknown>));
    const { error } = await sb.from("menu_categories").insert(catRows);
    if (error) throw error;
  }
  if (normalizedState.items.length > 0) {
    await insertMenuItems(sb, normalizedState.items);
  }
}
