import { promises as fs } from "node:fs";
import path from "node:path";
import {
  getSupabase,
  isSupabaseConfigured,
  isVercelRuntime,
  requireSupabaseConfigured,
} from "@/lib/supabase";
import { toCamel, toSnake } from "@/lib/case";
import {
  InventoryItemSchema,
  InventoryMovementSchema,
  InventoryStateSchema,
  type InventoryItem,
  type InventoryMovement,
  type InventoryState,
} from "./schema";

const FILE = path.join(process.cwd(), "data", "inventory.json");
const DATA_DIR = path.join(process.cwd(), "data");

const now = () => new Date().toISOString();

const SEED_ITEMS: InventoryItem[] = [
  {
    id: "inv_grape_leaves",
    sku: "MZ-RAW-0001",
    name: "Grape leaves",
    category: "raw",
    unit: "kg",
    onHand: 18,
    parLevel: 30,
    reorderPoint: 12,
    unitCostEgp: 95,
    supplier: "Alexandria Produce Market",
    storageLocation: "Cold storage",
    linkedMenuItemId: "itm_stuffy_grape",
    notes: "Primary driver for grape leaf rolls.",
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "inv_rice",
    sku: "MZ-RAW-0002",
    name: "Egyptian rice",
    category: "raw",
    unit: "kg",
    onHand: 42,
    parLevel: 50,
    reorderPoint: 20,
    unitCostEgp: 38,
    supplier: "Staples wholesaler",
    storageLocation: "Dry store",
    linkedMenuItemId: "",
    notes: "",
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "inv_takeaway_boxes",
    sku: "MZ-PKG-0001",
    name: "Takeaway boxes",
    category: "packaging",
    unit: "pcs",
    onHand: 320,
    parLevel: 500,
    reorderPoint: 150,
    unitCostEgp: 4.5,
    supplier: "Packaging supplier",
    storageLocation: "Back shelf",
    linkedMenuItemId: "",
    notes: "Branded box v2.",
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
];

const SEED_STATE: InventoryState = {
  version: 1,
  items: SEED_ITEMS,
  movements: [],
};

function normalizeState(state: unknown): InventoryState {
  const parsed = InventoryStateSchema.parse(state);
  return {
    version: 1,
    items: parsed.items.map((item) => InventoryItemSchema.parse(item)),
    movements: parsed.movements.map((movement) => InventoryMovementSchema.parse(movement)),
  };
}

async function readJson(): Promise<InventoryState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch {
    await writeJson(SEED_STATE);
    return SEED_STATE;
  }
}

async function writeJson(state: InventoryState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(normalizeState(state), null, 2), "utf8");
}

function parseItemRow(row: Record<string, unknown>): InventoryItem {
  return InventoryItemSchema.parse(toCamel(row) as Record<string, unknown>);
}

function parseMovementRow(row: Record<string, unknown>): InventoryMovement {
  return InventoryMovementSchema.parse(toCamel(row) as Record<string, unknown>);
}

function isMissingInventoryTable(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message ?? "";
  return error?.code === "42P01" || message.includes("inventory_items") || message.includes("inventory_movements");
}

export async function readInventory(): Promise<InventoryState> {
  const fileState = await readJson();
  if (!isSupabaseConfigured()) return fileState;

  const sb = getSupabase();
  const { data: items, error: itemsError } = await sb
    .from("inventory_items")
    .select("*")
    .order("name");

  if (itemsError) {
    if (!isVercelRuntime() && isMissingInventoryTable(itemsError)) return fileState;
    throw itemsError;
  }

  const { data: movements, error: movementsError } = await sb
    .from("inventory_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (movementsError) {
    if (!isVercelRuntime() && isMissingInventoryTable(movementsError)) return fileState;
    throw movementsError;
  }

  return {
    version: 1,
    items: (items ?? []).map((row) => parseItemRow(row as Record<string, unknown>)),
    movements: (movements ?? []).map((row) => parseMovementRow(row as Record<string, unknown>)),
  };
}

export async function writeInventory(state: InventoryState): Promise<void> {
  const normalized = normalizeState(state);

  if (!isSupabaseConfigured()) {
    if (isVercelRuntime()) requireSupabaseConfigured("Updating inventory");
    return writeJson(normalized);
  }

  if (!isVercelRuntime()) {
    try { await writeJson(normalized); } catch { /* local mirror is best-effort */ }
  }

  const sb = getSupabase();
  const deleteMovements = await sb.from("inventory_movements").delete().neq("id", "");
  if (deleteMovements.error) {
    if (!isVercelRuntime() && isMissingInventoryTable(deleteMovements.error)) return writeJson(normalized);
    throw deleteMovements.error;
  }

  const deleteItems = await sb.from("inventory_items").delete().neq("id", "");
  if (deleteItems.error) throw deleteItems.error;

  if (normalized.items.length > 0) {
    const rows = normalized.items.map((item) => toSnake(item as unknown as Record<string, unknown>));
    const { error } = await sb.from("inventory_items").insert(rows);
    if (error) throw error;
  }

  if (normalized.movements.length > 0) {
    const rows = normalized.movements.map((movement) => toSnake(movement as unknown as Record<string, unknown>));
    const { error } = await sb.from("inventory_movements").insert(rows);
    if (error) throw error;
  }
}
