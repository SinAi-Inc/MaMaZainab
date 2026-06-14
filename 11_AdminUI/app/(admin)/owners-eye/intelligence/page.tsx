import Link from "next/link";
import { Brain, TrendingUp, AlertTriangle, Sparkles, BarChart3, Zap } from "lucide-react";
import { readGenerations } from "@/lib/generations/store";
import { readInventory } from "@/lib/inventory/store";
import { buildSmartInventoryAlerts, getKitchenOrders } from "@/lib/inventory/smart";
import { readMenu } from "@/lib/menu/store";
import { Card, CardBody } from "@/components/ui/card";
import { KpiTile } from "../_components/kpi-tile";
import { DecisionSurface, type DecisionItem } from "../_components/decision-surface";

export const dynamic = "force-dynamic";

/**
 * Layer 3 - Intelligence
 *
 * AI-native predictive operations layer. Per the inspiration doc:
 * "Move from reporting → autonomous operational intelligence."
 *
 * Wired live: Studio generations, inventory alerts, kitchen order age.
 * Scaffold:   Demand forecasting, profitability AI, dynamic pricing.
 */

const MODULES = [
  { id: "anomaly", name: "Operational Anomalies", icon: AlertTriangle, note: "Low stock, recipe coverage, late kitchen orders", status: "Live" },
  { id: "forecast", name: "Demand Forecasting", icon: TrendingUp, note: "Predict per-item sales by hour/day/season", status: "Signal" },
  { id: "profitability", name: "Menu Engineering", icon: BarChart3, note: "Star / plow-horse / dog / puzzle classification", status: "Signal" },
  { id: "dynamic-pricing", name: "Dynamic Pricing", icon: Zap, note: "Time-of-day / load-based price suggestions", status: "Soon" },
  { id: "staff-optimizer", name: "Staffing Optimizer", icon: Sparkles, note: "Predicted footfall vs. roster", status: "Soon" },
] as const;

export default async function IntelligencePage() {
  const [gens, menu, inventory] = await Promise.all([readGenerations(), readMenu(), readInventory()]);
  const total = gens.entries.length;
  const completed = gens.entries.filter((g) => g.status === "completed").length;
  const failed = gens.entries.filter((g) => g.status === "failed").length;
  const recent = gens.entries.slice(0, 5);
  const smartAlerts = buildSmartInventoryAlerts(inventory, menu);
  const actionableAlerts = smartAlerts.filter((alert) => alert.id !== "inventory-clear");
  const kitchenOrders = getKitchenOrders(inventory.movements);
  const lateKitchenOrders = kitchenOrders.filter((order) => order.status === "late");

  const decisions: DecisionItem[] = [];
  if (failed > 0) {
    decisions.push({
      id: "studio-failures",
      severity: "warning",
      title: `${failed} Studio generation${failed > 1 ? "s" : ""} failed`,
      detail: "Check API keys, rate limits, or prompt complexity.",
      href: "/ai",
      cta: "Review",
    });
  }
  actionableAlerts.forEach((alert) => {
    decisions.push({
      id: `smart-${alert.id}`,
      severity: alert.severity,
      title: alert.title,
      detail: alert.detail,
      href: alert.href,
      cta: alert.href ? "Open inventory" : undefined,
    });
  });
  if (menu.items.length > 0) {
    decisions.push({
      id: "no-sales-data",
      severity: "info",
      title: "No sales data available yet for menu engineering",
      detail: "Once frontline POS goes live, AI will classify each item by margin × velocity.",
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start gap-4">
        <div className="size-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center ring-1 ring-blue-200">
          <Brain className="size-7" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-600">Layer 3</p>
          <h2 className="text-2xl font-bold text-brand-ink leading-tight">Intelligence</h2>
          <p className="mt-1 text-sm text-muted">
            From reporting → autonomous operational intelligence.
          </p>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiTile label="AI Generations" value={total} accent="blue" />
        <KpiTile label="Completed" value={completed} accent="green" />
        <KpiTile label="Failed" value={failed} accent={failed ? "red" : "ink"} />
        <KpiTile label="Smart Alerts" value={actionableAlerts.length} accent={actionableAlerts.length ? "red" : "green"} />
        <KpiTile label="Kitchen Late" value={lateKitchenOrders.length} accent={lateKitchenOrders.length ? "red" : "green"} />
      </section>

      {/* Live: Studio output stream */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-brand-ink">
            Recent AI Outputs (Studio)
          </h3>
          <Link href="/ai" className="text-xs font-semibold text-brand-green-deep hover:underline">
            Open Studio →
          </Link>
        </div>
        <Card>
          <CardBody className="p-0">
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                No generations yet. Generate from <Link href="/ai" className="text-brand-green-deep hover:underline">Studio</Link>.
              </p>
            ) : (
              <ul className="divide-y divide-border/40">
                {recent.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="rounded bg-brand-cream px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-ink">
                      {g.type}
                    </span>
                    <span className="flex-1 truncate text-brand-ink">{g.prompt}</span>
                    <span className="font-mono text-[11px] text-muted">{g.model.split("/").pop()}</span>
                    <span
                      className={
                        g.status === "completed"
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                          : g.status === "failed"
                          ? "rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700"
                          : "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                      }
                    >
                      {g.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Modules */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-brand-ink">
          Predictive Modules
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.id}>
                <CardBody className="flex items-start gap-3">
                  <div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
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
        title="Intelligence signals"
        subtitle="AI-derived insights and operational anomalies."
        items={decisions}
      />
    </div>
  );
}
