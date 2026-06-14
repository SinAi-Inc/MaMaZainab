import type { MenuItem, MenuState } from "@/lib/menu/schema";
import type { InventoryItem, InventoryMovement, InventoryState } from "./schema";

export type RecipeIngredient = {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  availableQty: number;
};

export type SmartInventoryAlert = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  href?: string;
};

export type KitchenOrderSummary = {
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  createdAt: string;
  ageMinutes: number;
  targetMinutes: number;
  movementCount: number;
  status: "fresh" | "watch" | "late";
};

const ORDER_NOTE_PREFIX = "KDS_ORDER";

function includesAny(value: string, words: string[]) {
  const lower = value.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function findItem(items: InventoryItem[], words: string[]) {
  return items.find((item) => item.isActive && includesAny(`${item.name} ${item.notes}`, words));
}

function pushIngredient(
  ingredients: RecipeIngredient[],
  item: InventoryItem | undefined,
  quantity: number,
) {
  if (!item || quantity <= 0) return;
  if (ingredients.some((entry) => entry.itemId === item.id)) return;
  ingredients.push({
    itemId: item.id,
    itemName: item.name,
    quantity,
    unit: item.unit,
    availableQty: item.onHand,
  });
}

export function buildRecipeForMenuItem(menuItem: MenuItem, items: InventoryItem[]): RecipeIngredient[] {
  const text = `${menuItem.nameEn} ${menuItem.descriptionEn} ${menuItem.highlights.join(" ")}`;
  const ingredients: RecipeIngredient[] = [];
  const linked = items.filter((item) => item.isActive && item.linkedMenuItemId === menuItem.id);

  linked.forEach((item) => {
    pushIngredient(ingredients, item, item.category === "packaging" ? 1 : 0.1);
  });

  if (includesAny(text, ["grape", "vine", "ورق"])) {
    pushIngredient(ingredients, findItem(items, ["grape", "vine"]), 0.12);
  }
  if (includesAny(text, ["rice", "mahshi", "stuff", "محشي", "رز"])) {
    pushIngredient(ingredients, findItem(items, ["rice"]), 0.08);
  }

  pushIngredient(ingredients, findItem(items, ["box", "takeaway", "packaging"]), 1);
  return ingredients;
}

export function serializeKitchenOrderNote(input: {
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  targetMinutes: number;
}) {
  return [
    ORDER_NOTE_PREFIX,
    input.orderId,
    input.menuItemId,
    input.menuItemName.replaceAll("|", "/"),
    String(input.quantity),
    String(input.targetMinutes),
  ].join("|");
}

export function parseKitchenOrderNote(note: string) {
  const [prefix, orderId, menuItemId, menuItemName, quantity, targetMinutes] = note.split("|");
  if (prefix !== ORDER_NOTE_PREFIX || !orderId || !menuItemId) return null;
  return {
    orderId,
    menuItemId,
    menuItemName: menuItemName || "Kitchen order",
    quantity: Number(quantity) || 1,
    targetMinutes: Number(targetMinutes) || 12,
  };
}

export function getKitchenOrders(movements: InventoryMovement[], now = new Date()): KitchenOrderSummary[] {
  const grouped = new Map<string, KitchenOrderSummary>();

  movements.forEach((movement) => {
    const parsed = parseKitchenOrderNote(movement.note);
    if (!parsed) return;
    const created = new Date(movement.createdAt);
    const ageMinutes = Math.max(0, Math.floor((now.getTime() - created.getTime()) / 60_000));
    const status: KitchenOrderSummary["status"] =
      ageMinutes > parsed.targetMinutes ? "late" : ageMinutes > Math.floor(parsed.targetMinutes * 0.75) ? "watch" : "fresh";
    const existing = grouped.get(parsed.orderId);
    if (existing) {
      existing.movementCount += 1;
      if (movement.createdAt < existing.createdAt) existing.createdAt = movement.createdAt;
      if (status === "late" || (status === "watch" && existing.status === "fresh")) existing.status = status;
      return;
    }

    grouped.set(parsed.orderId, {
      ...parsed,
      createdAt: movement.createdAt,
      ageMinutes,
      status,
      movementCount: 1,
    });
  });

  return Array.from(grouped.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function buildSmartInventoryAlerts(state: InventoryState, menu: MenuState): SmartInventoryAlert[] {
  const activeItems = state.items.filter((item) => item.isActive);
  const alerts: SmartInventoryAlert[] = [];
  const low = activeItems.filter((item) => item.reorderPoint > 0 && item.onHand <= item.reorderPoint);
  const watch = activeItems.filter((item) => item.parLevel > 0 && item.onHand < item.parLevel && item.onHand > item.reorderPoint);
  const availableMenuItems = menu.items.filter((item) => item.available);
  const uncoveredRecipes = availableMenuItems.filter((item) => buildRecipeForMenuItem(item, activeItems).length === 0);
  const recentOrders = getKitchenOrders(state.movements);
  const lateOrders = recentOrders.filter((order) => order.status === "late");

  if (low.length > 0) {
    alerts.push({
      id: "low-stock",
      severity: "critical",
      title: `${low.length} SKU${low.length === 1 ? "" : "s"} at reorder point`,
      detail: low.slice(0, 3).map((item) => `${item.name}: ${item.onHand} ${item.unit}`).join(" / "),
      href: "/inventory",
    });
  }

  if (lateOrders.length > 0) {
    alerts.push({
      id: "late-kitchen-orders",
      severity: "warning",
      title: `${lateOrders.length} kitchen order${lateOrders.length === 1 ? "" : "s"} aging past target`,
      detail: lateOrders.slice(0, 3).map((order) => `${order.menuItemName}: ${order.ageMinutes} min`).join(" / "),
      href: "/inventory",
    });
  }

  if (uncoveredRecipes.length > 0) {
    alerts.push({
      id: "recipe-coverage",
      severity: "warning",
      title: `${uncoveredRecipes.length} sellable menu item${uncoveredRecipes.length === 1 ? "" : "s"} missing recipe mapping`,
      detail: "Link inventory SKUs or add ingredient names so order deduction can cover every item.",
      href: "/inventory",
    });
  }

  if (watch.length > 0) {
    alerts.push({
      id: "below-par",
      severity: "info",
      title: `${watch.length} SKU${watch.length === 1 ? "" : "s"} below par`,
      detail: "Plan replenishment before the next prep cycle.",
      href: "/inventory",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "inventory-clear",
      severity: "info",
      title: "No urgent stock or kitchen aging alerts",
      detail: "Inventory, recipe coverage, and recent order age are within current thresholds.",
      href: "/inventory",
    });
  }

  return alerts;
}
