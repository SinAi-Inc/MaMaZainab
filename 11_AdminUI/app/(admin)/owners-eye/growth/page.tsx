import Link from "next/link";
import { Users, Mail, Gift, Megaphone, Star, Target } from "lucide-react";
import { readContacts } from "@/lib/contacts/store";
import { Card, CardBody } from "@/components/ui/card";
import { KpiTile } from "../_components/kpi-tile";
import { DecisionSurface, type DecisionItem } from "../_components/decision-surface";

export const dynamic = "force-dynamic";

/**
 * Layer 4 — Growth
 *
 * Customer growth + retention layer: CRM, loyalty, segmentation, campaigns.
 *
 * Wired live: Coming-soon subscribers (data/contacts.json or Supabase).
 * Scaffold:   CRM profiles, loyalty engine, segmentation, email/SMS campaigns,
 *             reviews aggregation.
 */

const MODULES = [
  { id: "crm", name: "Customer CRM", icon: Users, note: "Unified profile per customer across kiosks + delivery" },
  { id: "loyalty", name: "Loyalty Engine", icon: Gift, note: "Points, tiers, rewards, MaMa-coins" },
  { id: "segments", name: "Segmentation", icon: Target, note: "RFM analysis: regulars, lapsed, high-value" },
  { id: "campaigns", name: "Campaigns", icon: Megaphone, note: "Email, SMS, WhatsApp blasts" },
  { id: "reviews", name: "Reviews & Feedback", icon: Star, note: "Aggregated from Google, TripAdvisor, Talabat" },
] as const;

export default async function GrowthPage() {
  const contacts = await readContacts();
  const total = contacts.contacts.length;
  const recent = contacts.contacts.slice(-5).reverse();

  // Source distribution
  const bySource = contacts.contacts.reduce<Record<string, number>>((acc, c) => {
    acc[c.source] = (acc[c.source] ?? 0) + 1;
    return acc;
  }, {});

  // Last-7-day signups
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7 = contacts.contacts.filter((c) => {
    const t = Date.parse(c.subscribedAt);
    return Number.isFinite(t) && t >= cutoff;
  }).length;

  const decisions: DecisionItem[] = [];
  if (total === 0) {
    decisions.push({
      id: "no-subs",
      severity: "info",
      title: "No subscribers yet",
      detail: "Promote /coming-soon on social to start building the launch list.",
      href: "/coming-soon",
      cta: "View page",
    });
  } else if (last7 === 0) {
    decisions.push({
      id: "no-recent-signups",
      severity: "warning",
      title: "No new signups in the last 7 days",
      detail: "Top-of-funnel may need a fresh marketing push.",
      href: "/contacts",
      cta: "Open list",
    });
  }
  decisions.push({
    id: "loyalty-soon",
    severity: "info",
    title: "Loyalty engine not yet enabled",
    detail: "Wire after first POS transactions land.",
  });

  return (
    <div className="space-y-8">
      <header className="flex items-start gap-4">
        <div className="size-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center ring-1 ring-red-200">
          <Users className="size-7" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-red-600">Layer 4</p>
          <h2 className="text-2xl font-bold text-brand-ink leading-tight">Growth</h2>
          <p className="mt-1 text-sm text-muted">
            Acquire, engage, retain — turn customers into regulars.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Subscribers" value={total} accent="ink" />
        <KpiTile label="Last 7 Days" value={last7} accent={last7 ? "green" : "yellow"} hint="new signups" />
        <KpiTile label="Sources" value={Object.keys(bySource).length} hint="acquisition channels" />
        <KpiTile label="Loyalty Members" value={0} hint="engine offline" />
      </section>

      {/* Recent + Source split */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-brand-ink">
                Recent Subscribers
              </h3>
              <Link href="/contacts" className="text-xs font-semibold text-brand-green-deep hover:underline">
                View all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No subscribers yet.</p>
            ) : (
              <ul className="divide-y divide-border/40">
                {recent.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                    <Mail className="size-4 text-muted" />
                    <span className="flex-1 truncate text-brand-ink">{c.email}</span>
                    <span className="text-[11px] text-muted">{c.source}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-brand-ink">
              By Source
            </h3>
            {Object.keys(bySource).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No data yet.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(bySource).map(([src, count]) => (
                  <li key={src} className="flex items-center justify-between text-sm">
                    <span className="text-brand-ink">{src}</span>
                    <span className="font-bold tabular-nums text-brand-green-deep">{count}</span>
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
          Growth Modules
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.id}>
                <CardBody className="flex items-start gap-3">
                  <div className="size-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
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
        title="Growth signals"
        subtitle="Customer-funnel health and engagement opportunities."
        items={decisions}
      />
    </div>
  );
}
