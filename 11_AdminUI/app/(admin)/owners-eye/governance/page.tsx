import Link from "next/link";
import { ShieldCheck, Building2, BookOpen, Lock, Scale, Users } from "lucide-react";
import { readBranches } from "@/lib/branches/store";
import { readMenu } from "@/lib/menu/store";
import { readCharacters } from "@/lib/characters/store";
import { readSettings } from "@/lib/settings/store";
import { Card, CardBody } from "@/components/ui/card";
import { KpiTile } from "../_components/kpi-tile";
import { DecisionSurface, type DecisionItem } from "../_components/decision-surface";

export const dynamic = "force-dynamic";

/**
 * Layer 5 — Corporate Governance
 *
 * Chain-wide policy, brand integrity, franchise rules, compliance.
 *
 * Per the inspiration doc: "Corporate HQ controls — central pricing,
 * menu rollout, promotions, supplier rules, compliance, franchise
 * governance, recipe synchronization."
 *
 * Wired live: Branches, Menu (central catalog), Characters (brand IP),
 *             Settings (security + integrations).
 * Scaffold:   Franchise contracts, audit log, compliance checklist,
 *             role-based access matrix.
 */

const MODULES = [
  { id: "franchise", name: "Franchise Governance", icon: Building2, note: "Per-franchisee contracts, royalties, compliance" },
  { id: "policy", name: "Policy & SOP Library", icon: BookOpen, note: "Operational SOPs distributed to all branches" },
  { id: "audit", name: "Audit Log", icon: Scale, note: "Who changed what, when — full trail" },
  { id: "rbac", name: "Roles & Access (RBAC)", icon: Users, note: "Cashier, Manager, Owner, Accountant matrix" },
  { id: "vault", name: "Secrets & API Keys", icon: Lock, note: "Centralized credential management" },
] as const;

export default async function GovernancePage() {
  const [branches, menu, characters, settings] = await Promise.all([
    readBranches(),
    readMenu(),
    readCharacters(),
    readSettings(),
  ]);

  const totalBranches = branches.branches.length;
  const activeBranches = branches.branches.filter((b) => b.status === "active").length;
  const activeChars = characters.characters.filter((c) => c.active).length;

  // Brand IP integrity
  const charsWithRefImages = characters.characters.filter(
    (c) => Array.isArray(c.referenceImages) && c.referenceImages.length > 0,
  ).length;

  // Settings hygiene
  const securityEnabled = !!settings.requirePassword;
  const apisEnabled =
    (settings.orderingApiEnabled ? 1 : 0) +
    (settings.posApiEnabled ? 1 : 0) +
    (settings.deliveryApiEnabled ? 1 : 0);

  const decisions: DecisionItem[] = [];
  if (!securityEnabled) {
    decisions.push({
      id: "no-password",
      severity: "warning",
      title: "Admin password gate is disabled",
      detail: "Anyone with the URL can access the admin UI.",
      href: "/settings",
      cta: "Enable",
    });
  }
  if (apisEnabled === 0) {
    decisions.push({
      id: "no-apis",
      severity: "info",
      title: "No external APIs configured",
      detail: "POS, ordering, and delivery integrations are all disabled.",
      href: "/settings",
      cta: "Configure",
    });
  }
  if (charsWithRefImages < characters.characters.length) {
    decisions.push({
      id: "char-ref-missing",
      severity: "warning",
      title: "Some characters lack reference images",
      detail: "AI generation quality depends on canonical reference images.",
      href: "/characters",
      cta: "Review",
    });
  }
  decisions.push({
    id: "audit-log-soon",
    severity: "info",
    title: "Audit log not yet enabled",
    detail: "Required before adding multi-user roles.",
  });

  return (
    <div className="space-y-8">
      <header className="flex items-start gap-4">
        <div className="size-14 rounded-2xl bg-brand-ink/10 text-brand-ink flex items-center justify-center ring-1 ring-brand-ink/20">
          <ShieldCheck className="size-7" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-ink">Layer 5</p>
          <h2 className="text-2xl font-bold text-brand-ink leading-tight">Corporate Governance</h2>
          <p className="mt-1 text-sm text-muted">
            Chain-wide policy, brand integrity, franchise rules, compliance.
          </p>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiTile label="Branches" value={totalBranches} accent="ink" />
        <KpiTile label="Active" value={activeBranches} accent="green" />
        <KpiTile label="Menu Items" value={menu.items.length} hint="central catalog" />
        <KpiTile label="Brand IPs" value={`${activeChars}/${characters.characters.length}`} hint="active chars" />
        <KpiTile label="APIs Active" value={apisEnabled} accent={apisEnabled ? "green" : "yellow"} />
      </section>

      {/* Brand IP integrity panel */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-brand-ink">
                Brand IP Integrity
              </h3>
              <Link href="/brand" className="text-xs font-semibold text-brand-green-deep hover:underline">
                Brand Bible →
              </Link>
            </div>
            <ul className="divide-y divide-border/40">
              {characters.characters.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-brand-ink font-medium truncate">{c.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted">
                      {c.referenceImages?.length ?? 0} ref{(c.referenceImages?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                    {c.active ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                        Inactive
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-brand-ink">
                Security &amp; Integrations
              </h3>
              <Link href="/settings" className="text-xs font-semibold text-brand-green-deep hover:underline">
                Settings →
              </Link>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-brand-ink">Admin password gate</span>
                <span
                  className={
                    securityEnabled
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                      : "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                  }
                >
                  {securityEnabled ? "Enabled" : "Disabled"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-brand-ink">Ordering API</span>
                <span
                  className={
                    settings.orderingApiEnabled
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                      : "rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600"
                  }
                >
                  {settings.orderingApiEnabled ? "On" : "Off"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-brand-ink">POS API</span>
                <span
                  className={
                    settings.posApiEnabled
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                      : "rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600"
                  }
                >
                  {settings.posApiEnabled ? "On" : "Off"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-brand-ink">Delivery API</span>
                <span
                  className={
                    settings.deliveryApiEnabled
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                      : "rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600"
                  }
                >
                  {settings.deliveryApiEnabled ? "On" : "Off"}
                </span>
              </li>
            </ul>
          </CardBody>
        </Card>
      </section>

      {/* Modules */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-brand-ink">
          Governance Modules
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

      <DecisionSurface
        title="Governance signals"
        subtitle="Compliance, brand-integrity, and security watchlist."
        items={decisions}
      />
    </div>
  );
}
