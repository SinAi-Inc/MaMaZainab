import { promises as fs } from "node:fs";
import path from "node:path";
import { MenuStateSchema, type MenuState } from "./schema";

/* JSON-file persistence. Easy swap for SQLite/Postgres later. */

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "menu.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function fileExists() {
  try {
    await fs.access(FILE);
    return true;
  } catch {
    return false;
  }
}

const SEED: MenuState = {
  version: 1,
  categories: [
    {
      id: "cat_stuffy",
      nameEn: "Stuffy Fingers",
      descriptionEn: "Hand-rolled, slow-cooked. Mama's signature.",
      sort: 1,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cat_sides",
      nameEn: "Sides",
      descriptionEn: "",
      sort: 2,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cat_drinks",
      nameEn: "Drinks",
      descriptionEn: "",
      sort: 3,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  items: [
    {
      id: "itm_stuffy_grape",
      categoryId: "cat_stuffy",
      nameEn: "Grape Leaf Rolls",
      descriptionEn: "Vine leaves rolled with rice, herbs, and a hint of lemon.",
      priceEgp: 95,
      imageUrl: "",
      badges: ["bestseller"],
      available: true,
      sort: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "itm_stuffy_cabbage",
      categoryId: "cat_stuffy",
      nameEn: "Cabbage Rolls",
      descriptionEn: "Cabbage rolls, slow-cooked in tomato broth.",
      priceEgp: 90,
      imageUrl: "",
      badges: ["chefs_pick"],
      available: true,
      sort: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "itm_side_salad",
      categoryId: "cat_sides",
      nameEn: "Country Salad",
      descriptionEn: "Fresh tomato, cucumber, onion, parsley.",
      priceEgp: 30,
      imageUrl: "",
      badges: ["vegan"],
      available: true,
      sort: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "itm_drink_hibiscus",
      categoryId: "cat_drinks",
      nameEn: "Hibiscus Cooler",
      descriptionEn: "Chilled hibiscus, lightly sweet.",
      priceEgp: 25,
      imageUrl: "",
      badges: [],
      available: true,
      sort: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

export async function readMenu(): Promise<MenuState> {
  await ensureDir();
  if (!(await fileExists())) {
    await writeMenu(SEED);
    return SEED;
  }
  const raw = await fs.readFile(FILE, "utf8");
  const json = JSON.parse(raw);
  return MenuStateSchema.parse(json);
}

export async function writeMenu(state: MenuState): Promise<void> {
  await ensureDir();
  const validated = MenuStateSchema.parse(state);
  await fs.writeFile(FILE, JSON.stringify(validated, null, 2), "utf8");
}
