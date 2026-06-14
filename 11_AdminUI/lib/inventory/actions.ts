"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { requireAdminAction } from "@/lib/server-action-auth";
import { readMenu } from "@/lib/menu/store";
import {
  InventoryAdjustmentInputSchema,
  InventoryItemInputSchema,
  INVENTORY_MOVEMENT_META,
  type InventoryItem,
  type InventoryMovement,
} from "./schema";
import { readInventory, writeInventory } from "./store";
import { buildRecipeForMenuItem, serializeKitchenOrderNote } from "./smart";

function now() {
  return new Date().toISOString();
}

function revalidateInventory() {
  revalidatePath("/inventory");
}

function buildSku(category: string, existingSkus: string[]) {
  const prefix = `MZ-${category.slice(0, 3).toUpperCase()}-`;
  const next = existingSkus
    .filter((sku) => sku.startsWith(prefix))
    .map((sku) => Number.parseInt(sku.slice(prefix.length), 10))
    .filter(Number.isFinite)
    .reduce((max, value) => Math.max(max, value), 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function createInventoryItem(input: unknown) {
  await requireAdminAction();
  const data = InventoryItemInputSchema.parse(input);
  const state = await readInventory();
  const timestamp = now();
  const item: InventoryItem = {
    id: `inv_${nanoid(8)}`,
    ...data,
    sku: data.sku || buildSku(data.category, state.items.map((existing) => existing.sku).filter(Boolean)),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  state.items.push(item);
  await writeInventory(state);
  revalidateInventory();
  return item;
}

export async function updateInventoryItem(id: string, input: unknown) {
  await requireAdminAction();
  const data = InventoryItemInputSchema.parse(input);
  const state = await readInventory();
  const index = state.items.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Inventory item not found");
  state.items[index] = {
    ...state.items[index],
    ...data,
    sku: data.sku || state.items[index].sku,
    updatedAt: now(),
  };
  await writeInventory(state);
  revalidateInventory();
  return state.items[index];
}

export async function toggleInventoryItemActive(id: string) {
  await requireAdminAction();
  const state = await readInventory();
  const item = state.items.find((entry) => entry.id === id);
  if (!item) throw new Error("Inventory item not found");
  item.isActive = !item.isActive;
  item.updatedAt = now();
  await writeInventory(state);
  revalidateInventory();
  return item;
}

export async function adjustInventoryStock(input: unknown) {
  await requireAdminAction();
  const data = InventoryAdjustmentInputSchema.parse(input);
  const state = await readInventory();
  const item = state.items.find((entry) => entry.id === data.itemId);
  if (!item) throw new Error("Inventory item not found");

  const beforeQty = item.onHand;
  const sign = INVENTORY_MOVEMENT_META[data.type].sign;
  const delta =
    sign === "set"
      ? data.quantity - beforeQty
      : sign === "out"
        ? -data.quantity
        : data.quantity;
  const afterQty = Math.max(0, beforeQty + delta);
  const timestamp = now();

  item.onHand = afterQty;
  item.updatedAt = timestamp;

  const movement: InventoryMovement = {
    id: `mov_${nanoid(10)}`,
    itemId: item.id,
    type: data.type,
    quantity: data.quantity,
    delta: afterQty - beforeQty,
    beforeQty,
    afterQty,
    unitCostEgp: item.unitCostEgp,
    note: data.note,
    createdAt: timestamp,
    createdBy: "admin",
  };

  state.movements.unshift(movement);
  state.movements = state.movements.slice(0, 200);
  await writeInventory(state);
  revalidateInventory();
  return { item, movement };
}

export async function recordKitchenOrder(input: unknown) {
  await requireAdminAction();
  const data = z.object({
    menuItemId: z.string().min(1, "Menu item is required"),
    quantity: z.coerce.number().int().positive().default(1),
    targetMinutes: z.coerce.number().int().positive().default(12),
  }).parse(input);
  const [state, menu] = await Promise.all([readInventory(), readMenu()]);
  const menuItem = menu.items.find((item) => item.id === data.menuItemId);
  if (!menuItem) throw new Error("Menu item not found");

  const recipe = buildRecipeForMenuItem(menuItem, state.items);
  if (recipe.length === 0) {
    throw new Error("No recipe mapping found for this menu item. Link inventory items first.");
  }

  const timestamp = now();
  const orderId = `ord_${nanoid(8)}`;
  const note = serializeKitchenOrderNote({
    orderId,
    menuItemId: menuItem.id,
    menuItemName: menuItem.nameEn,
    quantity: data.quantity,
    targetMinutes: data.targetMinutes,
  });

  const movements: InventoryMovement[] = [];
  recipe.forEach((ingredient) => {
    const item = state.items.find((entry) => entry.id === ingredient.itemId);
    if (!item) return;
    const beforeQty = item.onHand;
    const usedQty = ingredient.quantity * data.quantity;
    const afterQty = Math.max(0, beforeQty - usedQty);
    item.onHand = afterQty;
    item.updatedAt = timestamp;
    movements.push({
      id: `mov_${nanoid(10)}`,
      itemId: item.id,
      type: "use",
      quantity: usedQty,
      delta: afterQty - beforeQty,
      beforeQty,
      afterQty,
      unitCostEgp: item.unitCostEgp,
      note,
      createdAt: timestamp,
      createdBy: "kitchen",
    });
  });

  state.movements = [...movements, ...state.movements].slice(0, 200);
  await writeInventory(state);
  revalidateInventory();
  revalidatePath("/owners-eye/operations");
  revalidatePath("/owners-eye/intelligence");
  return { orderId, menuItem, recipe, movements };
}
