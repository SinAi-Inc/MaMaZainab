import Link from "next/link";
import { Boxes, ChefHat, Trash2, Truck, BookOpen } from "lucide-react";
import { readInventory } from "@/lib/inventory/store";
import { buildSmartInventoryAlerts, getKitchenOrders } from "@/lib/inventory/smart";
import { readMenu } from "@/lib/menu/store";
import { Card, CardBody } from "@/components/ui/card";
import { formatEGP } from "@/lib/utils";
import { KpiTile } from "../_components/kpi-tile";
import { DecisionSurface, type DecisionItem } from "../_components/decision-surface";

export const dynamic = "force-dynamic";

/**
 * Layer 2 - Operational Management
 *
 * Cost-control engine: inventory, suppliers, recipes, waste, procurement.
 *
 * Wired live: Menu, inventory, recipe deduction, kitchen order age.
 * Scaffold:   Suppliers, waste tracking, procurement automation.
 */

const MODULES = [
  { id: "inventory", name: "Inventory", icon: Boxes, note: "Stock levels, par pressure, movement ledger", status: "Live" },
  { id: "recipes", name: "Recipes & BOM", icon: BookOpen, note: "Order-based ingredient and packaging deduction", status: "Live" },
  { id: "kitchen", name: "Kitchen Age", icon: ChefHat, note: "Order target minutes and late prep signals", status: "Live" },
  { id: "suppliers", name: "Suppliers", icon: Truck, note: "Vendor catalog, lead times, pricing", status: "Soon" },
  { id: "waste", name: "Waste Tracking", icon: Trash2, note: "Spoilage, returns, comp tracking", status: "Signal" },
  { id: "procurement", name: "Procurement", icon: ChefHat, note: "Auto-reorder rules + PO generation", status: "Signal" },
] as const;

export default async function OperationsPage() {
  const [menu, inventory] = await Promise.all([readMenu(), readInventory()]);
  const allItems = menu.items;
  const available = allItems.filter((i) => i.available).length;
  const totalCats = menu.categories.length;
  const activeSkus = inventory.items.filter((item) => item.isActive);
  const lowItems = activeSkus.filter((item) => item.reorderPoint > 0 && item.onHand <= item.reorderPoint);
  const kitchenOrders = getKitchenOrders(inventory.movements);
  const lateOrders = kitchenOrders.filter((order) => order.status === "late");
  const smartAlerts = buildSmartInventoryAlerts(inventory, menu);

  const prices = allItems.filter((i) => i.priceEgp > 0).map((i) => i.priceEgp);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const noPhoto = allItems.filter((i) => !i.imageUrl).length;
  const noPrice = allItems.filter((i) => !i.priceEgp).length;

  const decisions: DecisionItem[] = [];
  if (noPrice > 0) {
    decisions.push({
      id: "no-price",
      severity: "critical",
      title: `${noPrice} item${noPrice > 1 ? "s" : ""} have no price`,
      detail: "Items cannot be sold at POS without a price.",
      href: "/menu",
      cta: "Open menu",
    });
  }
  if (noPhoto > 0) {
    decisions.push({
      id: "no-photo",
      severity: "warning",
      title: `${noPhoto} item${noPhoto > 1 ? "s" : ""} missing photos`,
      detail: "Customer-facing menu looks incomplete.",
      href: "/menu",
      cta: "Add photos",
    });
  }
  smartAlerts.forEach((alert) => {
    decisions.push({
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      detail: alert.detail,
      href: alert.href,
      cta: alert.href ? "Open inventory" : undefined,
    });
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="flex items-start gap-4">
        <div className="size-14 rounded-2xl bg-brand-yellow/20 text-brand-ink flex items-center justify-center ring-1 ring-brand-yellow/40">
          <Boxes className="size-7" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-600">Layer 2</p>
          <h2 className="text-2xl font-bold text-brand-ink leading-tight">Operational Management</h2>
          <p className="mt-1 text-sm text-muted">
            Cost-control engine - inventory, suppliers, recipes, waste, procurement.
          </p>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiTile label="Total Items" value={allItems.length} accent="ink" />
        <KpiTile label="Available" value={available} accent="green" />
        <KpiTile label="Inventory SKUs" value={activeSkus.length} accent="blue" />
        <KpiTile label="Low Stock" value={lowItems.length} accent={lowItems.length ? "red" : "green"} />
        <KpiTile label="Kitchen Late" value={lateOrders.length} accent={lateOrders.length ? "red" : "green"} />
        <KpiTile label="Avg Price" value={avgPrice ? formatEGP(avgPrice) : "—"} accent="blue" />
      </section>

      {/* Modules grid */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-brand-ink">
          Operational Modules
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardBody className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
                <BookOpen className="size-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-brand-ink">Menu Catalog</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    Live
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {allItems.length} items across {totalCats} categories
                </p>
                <Link href="/menu" className="mt-2 inline-block text-xs font-semibold text-brand-green-deep hover:underline">
                  Open menu →
                </Link>
              </div>
            </CardBody>
          </Card>
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.id}>
                <CardBody className="flex items-start gap-3">
                  <div className="size-10 rounded-lg bg-brand-cream flex items-center justify-center text-brand-ink/60">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-brand-ink">{m.name}</p>
                      <span className={m.status === "Live"
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700"
                        : "rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600"}
                      >
                        {m.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{m.note}</p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>

      <DecisionSurface
        title="Cost-control alerts"
        subtitle="Catalog gaps and operational signals."
        items={decisions}
      />
    </div>
  );
}
