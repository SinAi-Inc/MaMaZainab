import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toCamel, toSnake } from "@/lib/case";
import { MenuStateSchema, type MenuState, type MenuCategory, type MenuItem } from "./schema";

const FILE = path.join(process.cwd(), "data", "menu.json");
const DATA_DIR = path.join(process.cwd(), "data");

/* ---- Seed data (used when tables are empty) ---- */

const now = () => new Date().toISOString();

const SEED_CATEGORIES: MenuCategory[] = [
  { id: "cat_stuffy", nameEn: "Stuffy Fingers", descriptionEn: "Hand-rolled, slow-cooked. Mama's signature.", sort: 1, visible: true, createdAt: now(), updatedAt: now() },
  { id: "cat_sides",  nameEn: "Sides",          descriptionEn: "", sort: 2, visible: true, createdAt: now(), updatedAt: now() },
  { id: "cat_drinks", nameEn: "Drinks",         descriptionEn: "", sort: 3, visible: true, createdAt: now(), updatedAt: now() },
];

const SEED_ITEMS: MenuItem[] = [
  { id: "itm_stuffy_grape",   categoryId: "cat_stuffy", sku: "MZ-STF-0001", nameEn: "Grape Leaf Rolls",  descriptionEn: "Vine leaves rolled with rice, herbs, and a hint of lemon.", priceEgp: 95, imageUrl: "", badges: ["bestseller"], available: true, sort: 1, createdAt: now(), updatedAt: now() },
  { id: "itm_stuffy_cabbage", categoryId: "cat_stuffy", sku: "MZ-STF-0002", nameEn: "Cabbage Rolls",     descriptionEn: "Cabbage rolls, slow-cooked in tomato broth.", priceEgp: 90, imageUrl: "", badges: ["chefs_pick"], available: true, sort: 2, createdAt: now(), updatedAt: now() },
  { id: "itm_side_salad",     categoryId: "cat_sides",  sku: "MZ-SID-0001", nameEn: "Country Salad",     descriptionEn: "Fresh tomato, cucumber, onion, parsley.", priceEgp: 30, imageUrl: "", badges: ["vegan"], available: true, sort: 1, createdAt: now(), updatedAt: now() },
  { id: "itm_drink_hibiscus", categoryId: "cat_drinks", sku: "MZ-DRK-0001", nameEn: "Hibiscus Cooler",   descriptionEn: "Chilled hibiscus, lightly sweet.", priceEgp: 25, imageUrl: "", badges: [], available: true, sort: 1, createdAt: now(), updatedAt: now() },
];

/* ── JSON fallback ───────────────────────────────── */

async function readJson(): Promise<MenuState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return MenuStateSchema.parse(JSON.parse(raw));
  } catch {
    const state: MenuState = { version: 1, categories: SEED_CATEGORIES, items: SEED_ITEMS };
    await writeJson(state);
    return state;
  }
}

async function writeJson(state: MenuState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(state, null, 2), "utf8");
}

/* ── Supabase seed ───────────────────────────────── */

async function seed() {
  const sb = getSupabase();
  for (const c of SEED_CATEGORIES) {
    await sb.from("menu_categories").upsert(toSnake(c as unknown as Record<string, unknown>));
  }
  for (const i of SEED_ITEMS) {
    await sb.from("menu_items").upsert(toSnake(i as unknown as Record<string, unknown>));
  }
}

/* ── Public API ──────────────────────────────────── */

export async function readMenu(): Promise<MenuState> {
  if (!isSupabaseConfigured()) return readJson();

  const sb = getSupabase();
  const { data: cats } = await sb
    .from("menu_categories")
    .select("*")
    .order("sort");

  if (!cats || cats.length === 0) {
    await seed();
    return { version: 1, categories: SEED_CATEGORIES, items: SEED_ITEMS };
  }

  const { data: items } = await sb
    .from("menu_items")
    .select("*")
    .order("sort");

  return {
    version: 1,
    categories: (cats ?? []).map((r) => toCamel(r) as unknown as MenuCategory),
    items: (items ?? []).map((r) => toCamel(r) as unknown as MenuItem),
  };
}

export async function writeMenu(state: MenuState): Promise<void> {
  if (!isSupabaseConfigured()) return writeJson(state);

  const sb = getSupabase();
  await sb.from("menu_items").delete().neq("id", "");
  await sb.from("menu_categories").delete().neq("id", "");

  if (state.categories.length > 0) {
    const catRows = state.categories.map((c) => toSnake(c as unknown as Record<string, unknown>));
    const { error } = await sb.from("menu_categories").insert(catRows);
    if (error) throw error;
  }
  if (state.items.length > 0) {
    const itemRows = state.items.map((i) => toSnake(i as unknown as Record<string, unknown>));
    const { error } = await sb.from("menu_items").insert(itemRows);
    if (error) throw error;
  }
}
