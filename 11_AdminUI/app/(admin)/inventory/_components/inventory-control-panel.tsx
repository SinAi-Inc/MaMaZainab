"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  ClipboardCheck,
  Pencil,
  Plus,
  Save,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  adjustInventoryStock,
  createInventoryItem,
  toggleInventoryItemActive,
  updateInventoryItem,
} from "@/lib/inventory/actions";
import {
  INVENTORY_CATEGORY_META,
  INVENTORY_MOVEMENT_META,
  type InventoryCategory,
  type InventoryItem,
  type InventoryMovement,
  type InventoryMovementType,
} from "@/lib/inventory/schema";
import type { MenuItem } from "@/lib/menu/schema";

type ItemDraft = {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  onHand: string;
  parLevel: string;
  reorderPoint: string;
  unitCostEgp: string;
  supplier: string;
  storageLocation: string;
  linkedMenuItemId: string;
  notes: string;
  isActive: boolean;
};

const categoryOptions = Object.entries(INVENTORY_CATEGORY_META) as [InventoryCategory, { label: string }][];
const movementOptions = Object.entries(INVENTORY_MOVEMENT_META) as [InventoryMovementType, { label: string; sign: "in" | "out" | "set" }][];

function emptyDraft(): ItemDraft {
  return {
    id: "",
    sku: "",
    name: "",
    category: "raw",
    unit: "kg",
    onHand: "0",
    parLevel: "0",
    reorderPoint: "0",
    unitCostEgp: "0",
    supplier: "",
    storageLocation: "",
    linkedMenuItemId: "",
    notes: "",
    isActive: true,
  };
}

function draftFromItem(item: InventoryItem): ItemDraft {
  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    category: item.category,
    unit: item.unit,
    onHand: String(item.onHand),
    parLevel: String(item.parLevel),
    reorderPoint: String(item.reorderPoint),
    unitCostEgp: String(item.unitCostEgp),
    supplier: item.supplier,
    storageLocation: item.storageLocation,
    linkedMenuItemId: item.linkedMenuItemId,
    notes: item.notes,
    isActive: item.isActive,
  };
}

function draftToInput(draft: ItemDraft) {
  return {
    sku: draft.sku,
    name: draft.name,
    category: draft.category,
    unit: draft.unit,
    onHand: Number(draft.onHand) || 0,
    parLevel: Number(draft.parLevel) || 0,
    reorderPoint: Number(draft.reorderPoint) || 0,
    unitCostEgp: Number(draft.unitCostEgp) || 0,
    supplier: draft.supplier,
    storageLocation: draft.storageLocation,
    linkedMenuItemId: draft.linkedMenuItemId,
    notes: draft.notes,
    isActive: draft.isActive,
  };
}

function stockTone(item: InventoryItem) {
  if (!item.isActive) return "off";
  if (item.reorderPoint > 0 && item.onHand <= item.reorderPoint) return "low";
  if (item.parLevel > 0 && item.onHand < item.parLevel) return "watch";
  return "ok";
}

export function InventoryControlPanel({
  items,
  movements,
  menuItems,
}: {
  items: InventoryItem[];
  movements: InventoryMovement[];
  menuItems: MenuItem[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ItemDraft>(() => emptyDraft());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<InventoryCategory | "all">("all");
  const [adjustItemId, setAdjustItemId] = useState(items[0]?.id ?? "");
  const [movementType, setMovementType] = useState<InventoryMovementType>("receive");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items
      .filter((item) => category === "all" || item.category === category)
      .filter((item) => {
        if (!needle) return true;
        return [item.name, item.sku, item.supplier, item.storageLocation]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => {
        const toneOrder = { low: 0, watch: 1, ok: 2, off: 3 };
        return toneOrder[stockTone(a)] - toneOrder[stockTone(b)] || a.name.localeCompare(b.name);
      });
  }, [items, category, query]);

  function updateDraft<K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function resetDraft() {
    setDraft(emptyDraft());
    setError(null);
    setMessage(null);
  }

  function saveDraft() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const input = draftToInput(draft);
        if (draft.id) {
          await updateInventoryItem(draft.id, input);
          setMessage("Inventory item updated.");
        } else {
          await createInventoryItem(input);
          setMessage("Inventory item created.");
        }
        setDraft(emptyDraft());
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function submitAdjustment() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await adjustInventoryStock({
          itemId: adjustItemId,
          type: movementType,
          quantity: Number(quantity) || 0,
          note,
        });
        setQuantity("");
        setNote("");
        setMessage("Stock movement recorded.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function toggleActive(id: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await toggleInventoryItemActive(id);
        setMessage("Inventory item status updated.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        {(message || error) && (
          <div
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              error ? "border-red-200 bg-red-50 text-red-700" : "border-brand-green/20 bg-brand-green/5 text-brand-green-deep",
            )}
          >
            {error || message}
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Stock Ledger</h3>
              <p className="mt-0.5 text-xs text-muted">Current quantities, par levels, and reorder pressure.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search stock"
                  className="pl-9"
                />
              </div>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as InventoryCategory | "all")}
                className="h-10 rounded-md border border-border-strong bg-white px-3 text-sm outline-none focus:border-brand-green"
                aria-label="Filter category"
              >
                <option value="all">All categories</option>
                {categoryOptions.map(([value, meta]) => (
                  <option key={value} value={value}>{meta.label}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-border bg-surface">
                  <tr className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">On Hand</th>
                    <th className="px-4 py-3 font-medium">Par / Reorder</th>
                    <th className="px-4 py-3 font-medium">Value</th>
                    <th className="px-4 py-3 font-medium">Supplier</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.map((item) => {
                    const tone = stockTone(item);
                    return (
                      <tr key={item.id} className={!item.isActive ? "opacity-55" : ""}>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            {tone === "low" ? (
                              <TriangleAlert className="mt-0.5 size-4 text-amber-600" />
                            ) : tone === "ok" ? (
                              <CheckCircle2 className="mt-0.5 size-4 text-brand-green" />
                            ) : (
                              <ClipboardCheck className="mt-0.5 size-4 text-muted" />
                            )}
                            <div>
                              <p className="font-medium text-brand-ink">{item.name}</p>
                              <p className="mt-0.5 text-[11px] text-muted">{item.sku || "No SKU"} · {item.storageLocation || "No location"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">{INVENTORY_CATEGORY_META[item.category].label}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold tabular-nums">{item.onHand.toLocaleString()}</span>
                          <span className="ml-1 text-xs text-muted">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {item.parLevel.toLocaleString()} / {item.reorderPoint.toLocaleString()} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums">
                          {Math.round(item.onHand * item.unitCostEgp).toLocaleString()} EGP
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">{item.supplier || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setDraft(draftFromItem(item))}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green hover:underline"
                            >
                              <Pencil className="size-3" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleActive(item.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-brand-ink"
                            >
                              <Archive className="size-3" />
                              {item.isActive ? "Archive" : "Restore"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                        No inventory items match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Recent Movements</h3>
          </CardHeader>
          <CardBody className="space-y-2">
            {movements.slice(0, 12).map((movement) => {
              const item = itemsById.get(movement.itemId);
              return (
                <div key={movement.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{item?.name ?? "Unknown item"}</p>
                    <p className="truncate text-xs text-muted">
                      {INVENTORY_MOVEMENT_META[movement.type].label}
                      {movement.note ? ` · ${movement.note}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("font-semibold tabular-nums", movement.delta < 0 ? "text-red-600" : "text-brand-green-deep")}>
                      {movement.delta > 0 ? "+" : ""}{movement.delta.toLocaleString()} {item?.unit ?? ""}
                    </p>
                    <p className="text-[10px] text-muted">{new Date(movement.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
            {movements.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">No stock movements recorded yet.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">{draft.id ? "Edit Item" : "New Inventory Item"}</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <div>
              <Label required>Name</Label>
              <Input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Grape leaves" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SKU</Label>
                <Input value={draft.sku} onChange={(event) => updateDraft("sku", event.target.value)} placeholder="Auto" />
              </div>
              <div>
                <Label required>Unit</Label>
                <Input value={draft.unit} onChange={(event) => updateDraft("unit", event.target.value)} placeholder="kg / pcs" />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <select
                value={draft.category}
                onChange={(event) => updateDraft("category", event.target.value as InventoryCategory)}
                className="h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm outline-none focus:border-brand-green"
              >
                {categoryOptions.map(([value, meta]) => (
                  <option key={value} value={value}>{meta.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>On hand</Label>
                <Input type="number" value={draft.onHand} onChange={(event) => updateDraft("onHand", event.target.value)} />
              </div>
              <div>
                <Label>Par</Label>
                <Input type="number" value={draft.parLevel} onChange={(event) => updateDraft("parLevel", event.target.value)} />
              </div>
              <div>
                <Label>Reorder</Label>
                <Input type="number" value={draft.reorderPoint} onChange={(event) => updateDraft("reorderPoint", event.target.value)} />
              </div>
            </div>
            <div>
              <Label>Unit cost EGP</Label>
              <Input type="number" value={draft.unitCostEgp} onChange={(event) => updateDraft("unitCostEgp", event.target.value)} />
            </div>
            <div>
              <Label>Supplier</Label>
              <Input value={draft.supplier} onChange={(event) => updateDraft("supplier", event.target.value)} placeholder="Supplier name" />
            </div>
            <div>
              <Label>Storage location</Label>
              <Input value={draft.storageLocation} onChange={(event) => updateDraft("storageLocation", event.target.value)} placeholder="Cold storage" />
            </div>
            <div>
              <Label>Linked menu item</Label>
              <select
                value={draft.linkedMenuItemId}
                onChange={(event) => updateDraft("linkedMenuItemId", event.target.value)}
                className="h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm outline-none focus:border-brand-green"
              >
                <option value="">None</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.nameEn}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} rows={3} />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) => updateDraft("isActive", event.target.checked)}
                className="accent-brand-green"
              />
              Active item
            </label>
            <div className="flex gap-2">
              <Button type="button" onClick={saveDraft} disabled={isPending || !draft.name.trim()}>
                <Save className="size-4" />
                {isPending ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={resetDraft}>
                <Plus className="size-4" />
                New
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Stock Movement</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <div>
              <Label>Item</Label>
              <select
                value={adjustItemId}
                onChange={(event) => setAdjustItemId(event.target.value)}
                className="h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm outline-none focus:border-brand-green"
              >
                {items.filter((item) => item.isActive).map((item) => (
                  <option key={item.id} value={item.id}>{item.name} · {item.onHand} {item.unit}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <select
                  value={movementType}
                  onChange={(event) => setMovementType(event.target.value as InventoryMovementType)}
                  className="h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm outline-none focus:border-brand-green"
                >
                  {movementOptions.map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>{movementType === "count" ? "Counted qty" : "Quantity"}</Label>
                <Input type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </div>
            </div>
            <div>
              <Label>Note</Label>
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Supplier invoice, waste reason, count note..." />
            </div>
            <Button type="button" onClick={submitAdjustment} disabled={isPending || !adjustItemId || !quantity}>
              {INVENTORY_MOVEMENT_META[movementType].sign === "out" ? <ArrowDownCircle className="size-4" /> : <ArrowUpCircle className="size-4" />}
              Record Movement
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
