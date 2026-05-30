import Link from "next/link";
import {
  UtensilsCrossed,
  Mail,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Tag,
  Database,
  Eye,
  LayoutDashboard,
} from "lucide-react";
import { readMenu } from "@/lib/menu/store";
import { readContacts } from "@/lib/contacts/store";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SyncMenuButton } from "./_components/sync-menu-button";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* Stat card                                                            */
/* ------------------------------------------------------------------ */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  accent?: "green" | "yellow" | "red" | "blue";
}) {
  const accentMap = {
    green: "bg-brand-green/10 text-brand-green",
    yellow: "bg-brand-yellow/20 text-brand-ink",
    red: "bg-red-100 text-red-600",
    blue: "bg-blue-100 text-blue-600",
  };
  const cls = accentMap[accent ?? "green"];

  const inner = (
    <Card className={href ? "hover:shadow-md transition-shadow cursor-pointer" : ""}>
      <CardBody className="flex items-center gap-4">
        <div className={cn("size-12 rounded-xl flex items-center justify-center shrink-0", cls)}>
          <Icon className="size-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
          <p className="text-3xl font-bold tabular-nums text-brand-ink leading-tight mt-0.5">
            {value}
          </p>
          {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
        </div>
        {href && <ArrowRight className="size-4 text-muted shrink-0" />}
      </CardBody>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ------------------------------------------------------------------ */
/* Activity row                                                         */
/* ------------------------------------------------------------------ */
function ActivityRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "green" | "yellow" | "red";
}) {
  const tones = {
    green: "text-brand-green-deep",
    yellow: "text-brand-ink",
    red: "text-red-500",
  };
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <Icon className="size-4 text-muted shrink-0" />
      <span className="flex-1 text-sm">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", tones[tone ?? "green"])}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quick-action button                                                  */
/* ------------------------------------------------------------------ */
function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-border hover:border-brand-green hover:bg-brand-green/5 transition-colors text-sm font-medium"
    >
      <Icon className="size-4 text-brand-green-deep" />
      {label}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default async function DashboardPage() {
  const [menu, contacts] = await Promise.all([
    readMenu(),
    readContacts(),
  ]);

  // Menu stats
  const totalItems = menu.items.filter((i) => i.available).length;
  const totalCategories = menu.categories.filter((c) => c.visible).length;
  const noSkuCount = menu.items.filter((i) => i.available && !i.sku).length;

  // Contact stats
  const totalContacts = contacts.contacts.length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page header */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Overview</p>
        <h1 className="text-2xl font-semibold mt-1">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Live snapshot of the MaMa Zainab admin operating system.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Menu Items"
          value={totalItems}
          sub={`${totalCategories} categories`}
          icon={UtensilsCrossed}
          href="/menu"
          accent="green"
        />
        <StatCard
          label="Missing SKU"
          value={noSkuCount}
          sub={noSkuCount === 0 ? "Catalog ready" : "Needs menu cleanup"}
          icon={Tag}
          href="/menu"
          accent="yellow"
        />
        <StatCard
          label="Subscribers"
          value={totalContacts}
          sub="Coming Soon signups"
          icon={Mail}
          href="/contacts"
          accent="green"
        />
        <StatCard
          label="Public Menu"
          value="Ready"
          sub="Preview and print available"
          icon={Eye}
          href="/menu/preview"
          accent="blue"
        />
      </div>

      {/* ── Command Center (HITL controls) ──────────────────────────── */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted mb-1">Command Center</p>
        <p className="text-sm text-muted mb-4">
          Owner-controlled actions - you decide, the system executes.
        </p>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Publish Menu */}
          <Card>
            <CardBody className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0">
                <Database className="size-5 text-brand-green-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Publish Menu</p>
                <p className="text-xs text-muted mt-0.5 leading-snug">
                  Push <code className="font-mono">menu.json</code> → Supabase.
                  Required after any menu edit.
                </p>
                <SyncMenuButton />
              </div>
            </CardBody>
          </Card>

          {/* Public previews */}
          <Card>
            <CardBody className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Eye className="size-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Public Preview</p>
                <p className="text-xs text-muted mt-0.5 leading-snug">
                  See exactly what customers see - landing page and menu.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/coming-soon"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-border hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="size-3" /> Coming Soon
                  </Link>
                  <Link
                    href="/menu/preview"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-border hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <UtensilsCrossed className="size-3" /> Menu
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Owner's Eye shortcut */}
          <Card className="hover:shadow-md transition-shadow">
            <Link href="/owners-eye" className="block">
              <CardBody className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-brand-yellow/20 flex items-center justify-center shrink-0">
                  <LayoutDashboard className="size-5 text-brand-ink" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Owner's Eye</p>
                  <p className="text-xs text-muted mt-0.5 leading-snug">
                    5-layer operating system hub - frontline, operations, growth, governance.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-green-deep">
                    Open <ArrowRight className="size-3" />
                  </div>
                </div>
              </CardBody>
            </Link>
          </Card>
        </div>
      </div>

      {/* Two-column: status + quick actions */}
      <div className="grid xl:grid-cols-2 gap-6">
        {/* System status */}
        <Card>
          <CardBody>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-brand-green-deep" />
              System Status
            </h3>

            <ActivityRow
              icon={UtensilsCrossed}
              label="Menu items with SKU"
              value={`${totalItems - noSkuCount} / ${totalItems}`}
              tone={noSkuCount === 0 ? "green" : "yellow"}
            />
            <ActivityRow
              icon={Tag}
              label="Items missing SKU"
              value={noSkuCount === 0 ? "None ✓" : String(noSkuCount)}
              tone={noSkuCount === 0 ? "green" : "red"}
            />
            <ActivityRow
              icon={Clock}
              label="Print menu"
              value="Ready"
              tone="green"
            />
          </CardBody>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardBody>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="size-4 text-brand-green-deep" />
              Quick Actions
            </h3>
            <div className="grid gap-2">
              <QuickAction href="/menu/items/new" label="Add menu item" icon={UtensilsCrossed} />
              <QuickAction href="/menu/print" label="Print / Save PDF menu" icon={UtensilsCrossed} />
              <QuickAction href="/menu/preview" label="Preview public menu" icon={UtensilsCrossed} />
              <QuickAction href="/contacts" label="View subscriber list" icon={Mail} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Content summaries */}
      <div className="grid xl:grid-cols-2 gap-6">
        {/* Recent menu items */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Menu items</h3>
              <Link href="/menu" className="text-xs text-brand-green-deep hover:underline">
                View all →
              </Link>
            </div>
            <ul className="space-y-2">
              {menu.items
                .filter((i) => i.available)
                .slice(0, 6)
                .map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-brand-ink">{item.nameEn}</span>
                    <span className="font-mono text-[10px] text-muted ml-2 shrink-0">
                      {item.sku || <span className="text-red-400">no SKU</span>}
                    </span>
                  </li>
                ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Subscribers</h3>
              <Link href="/contacts" className="text-xs text-brand-green-deep hover:underline">
                View all →
              </Link>
            </div>
            {contacts.contacts.length === 0 ? (
              <p className="text-sm text-muted">No subscribers yet.</p>
            ) : (
              <ul className="space-y-2">
                {contacts.contacts.slice(0, 6).map((contact) => (
                  <li key={contact.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-brand-ink">{contact.email}</span>
                    <span className="text-[10px] text-muted ml-2 shrink-0">
                      {new Date(contact.subscribedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
