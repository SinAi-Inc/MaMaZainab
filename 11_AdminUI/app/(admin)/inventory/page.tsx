import { Boxes, ClipboardList, PackageCheck, TriangleAlert } from "lucide-react";
import { readInventory } from "@/lib/inventory/store";
import { readMenu } from "@/lib/menu/store";
import { buildSmartInventoryAlerts, getKitchenOrders } from "@/lib/inventory/smart";
import { Card, CardBody } from "@/components/ui/card";
import { InventoryControlPanel } from "./_components/inventory-control-panel";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [inventory, menu] = await Promise.all([readInventory(), readMenu()]);
  const activeItems = inventory.items.filter((item) => item.isActive);
  const lowItems = activeItems.filter((item) => item.reorderPoint > 0 && item.onHand <= item.reorderPoint);
  const inventoryValue = activeItems.reduce((sum, item) => sum + item.onHand * item.unitCostEgp, 0);
  const smartAlerts = buildSmartInventoryAlerts(inventory, menu);
  const kitchenOrders = getKitchenOrders(inventory.movements);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Operations</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <Boxes className="size-5 text-brand-green-deep" />
            Inventory Control
          </h2>
          <p className="mt-1 text-sm text-muted">
            Track stock on hand, reorder pressure, and count adjustments for kiosk ingredients and packaging.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active SKUs" value={activeItems.length.toString()} icon={ClipboardList} />
        <StatCard label="Low Stock" value={lowItems.length.toString()} icon={TriangleAlert} tone={lowItems.length > 0 ? "warn" : "ok"} />
        <StatCard label="Inventory Value" value={`${Math.round(inventoryValue).toLocaleString()} EGP`} icon={PackageCheck} />
        <StatCard label="Movements" value={inventory.movements.length.toString()} icon={Boxes} />
      </div>

      <InventoryControlPanel
        items={inventory.items}
        movements={inventory.movements}
        menuItems={menu.items}
        smartAlerts={smartAlerts}
        kitchenOrders={kitchenOrders}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "ok" | "warn";
}) {
  return (
    <Card>
      <CardBody className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-brand-ink">{value}</p>
        </div>
        <div className={tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-brand-green" : "text-muted"}>
          <Icon className="size-5" />
        </div>
      </CardBody>
    </Card>
  );
}
