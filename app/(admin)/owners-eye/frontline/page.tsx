import { Store, ScanLine, Smartphone, Truck, MonitorPlay } from "lucide-react";
import { readBranches } from "@/lib/branches/store";
import { STATUS_META } from "@/lib/branches/schema";
import { Card, CardBody } from "@/components/ui/card";
import Link from "next/link";
import { KpiTile } from "../_components/kpi-tile";
import { DecisionSurface, type DecisionItem } from "../_components/decision-surface";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Layer 1 — Frontline Operations
 *
 * The customer-facing speed layer. Per the inspiration doc:
 * "Every critical task should take 1–2 taps. Optimize for rush-hour."
 *
 * Modules (status tracked in MODULE_GRID):
 *   - POS               — coming
 *   - Self-Order Kiosk  — coming
 *   - Kitchen Display   — coming
 *   - Waiter App        — coming
 *   - Delivery routing  — coming
 *
 * Wired live: Branches/Kiosks (already shipped at /branches).
 */

const MODULES = [
  { id: "pos", name: "POS Terminal", icon: ScanLine, status: "soon", note: "Cashier-side checkout" },
  { id: "kiosk", name: "Self-Order Kiosk", icon: MonitorPlay, status: "soon", note: "Customer-facing kiosk UI" },
  { id: "kds", name: "Kitchen Display", icon: MonitorPlay, status: "soon", note: "Order routing to kitchen" },
  { id: "waiter", name: "Waiter App", icon: Smartphone, status: "soon", note: "Table mgmt (post-MVP)" },
  { id: "delivery", name: "Delivery Routing", icon: Truck, status: "soon", note: "Dispatch + tracking" },
] as const;

export default async function FrontlinePage() {
  const branches = await readBranches();
  const total = branches.branches.length;
  const active = branches.branches.filter((b) => b.status === "active").length;
  const construction = branches.branches.filter((b) => b.status === "construction").length;
  const paused = branches.branches.filter((b) => b.status === "paused").length;

  const decisions: DecisionItem[] = [];
  if (active === 0) {
    decisions.push({
      id: "no-live-kiosks",
      severity: "critical",
      title: "No kiosks are operational",
      detail: "Frontline layer cannot collect order data until at least one kiosk is live.",
      href: "/branches",
      cta: "Open branches",
    });
  }
  for (const b of branches.branches.filter((x) => x.status === "construction")) {
    decisions.push({
      id: `build-${b.id}`,
      severity: "warning",
      title: `${b.name} — under construction`,
      detail: b.address || `Kiosk #${b.kioskNumber} buildout in progress`,
      href: `/branches/${b.id}`,
      cta: "View",
    });
  }

  return (
    <div className="space-y-8">
      {/* Layer hero */}
      <header className="flex items-start gap-4">
        <div className="size-14 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center ring-1 ring-brand-green/20">
          <Store className="size-7" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-green-deep">
            Layer 1
          </p>
          <h2 className="text-2xl font-bold text-brand-ink leading-tight">Frontline Operations</h2>
          <p className="mt-1 text-sm text-muted">
            Customer-facing speed layer. Every tap counts during rush hour.
          </p>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Total Sites" value={total} accent="ink" />
        <KpiTile label="Active" value={active} accent="green" hint="Live revenue" />
        <KpiTile label="In Build" value={construction} accent="yellow" hint="Pre-launch" />
        <KpiTile label="Paused" value={paused} accent="red" hint="Temporarily off" />
      </section>

      {/* Branches table */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-brand-ink">
            Kiosks &amp; Branches
          </h3>
          <Link href="/branches" className="text-xs font-semibold text-brand-green-deep hover:underline">
            Manage all →
          </Link>
        </div>
        <Card>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-brand-cream/40 text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Kiosk</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">District</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Manager</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {branches.branches.map((b) => {
                  const meta = STATUS_META[b.status];
                  const toneCls = {
                    success: "bg-emerald-100 text-emerald-700",
                    warning: "bg-amber-100 text-amber-700",
                    info: "bg-blue-100 text-blue-700",
                    neutral: "bg-zinc-100 text-zinc-700",
                    error: "bg-red-100 text-red-700",
                  }[meta.tone];
                  return (
                    <tr key={b.id} className="hover:bg-brand-cream/30">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted">#{b.kioskNumber}</td>
                      <td className="px-4 py-2.5">
                        <Link href={`/branches/${b.id}`} className="font-semibold text-brand-ink hover:text-brand-green-deep">
                          {b.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted">{b.district || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", toneCls)}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted">{b.manager || "—"}</td>
                    </tr>
                  );
                })}
                {branches.branches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted">
                      No kiosks yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </section>

      {/* Modules grid (scaffold placeholders) */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-brand-ink">
          Frontline Modules
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                        Soon
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

      {/* Decisions */}
      <DecisionSurface
        title="Frontline alerts"
        subtitle="Operational signals from active and pre-launch sites."
        items={decisions}
      />
    </div>
  );
}
