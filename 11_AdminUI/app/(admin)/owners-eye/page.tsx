import { Store, Boxes, Brain, Users, ShieldCheck } from "lucide-react";
import { readMenu } from "@/lib/menu/store";
import { readBranches } from "@/lib/branches/store";
import { readCharacters } from "@/lib/characters/store";
import { readContacts } from "@/lib/contacts/store";
import { readGenerations } from "@/lib/generations/store";
import { LayerCard } from "./_components/layer-card";
import { DecisionSurface, type DecisionItem } from "./_components/decision-surface";

export const dynamic = "force-dynamic";

/**
 * Owner's Eye — Hub page.
 *
 * 5-layer Restaurant Operating System overview, inspired by Foodics
 * + AI-native chain operations analysis.
 *
 *   Layer 1 — Frontline Operations  (POS, Kiosk, KDS, Waiter, Delivery)
 *   Layer 2 — Operational Management (Inventory, Suppliers, Recipes, Waste)
 *   Layer 3 — Intelligence            (AI insights, Forecasting, Anomalies)
 *   Layer 4 — Growth                  (CRM, Loyalty, Campaigns)
 *   Layer 5 — Corporate Governance    (Franchise, Multi-branch, Compliance)
 *
 * Every layer card pulls live counts from the existing data stores.
 */
export default async function OwnersEyeHubPage() {
  const [menu, branches, characters, contacts, generations] = await Promise.all([
    readMenu(),
    readBranches(),
    readCharacters(),
    readContacts(),
    readGenerations(),
  ]);

  
  const activeBranches = branches.branches.filter((b) => b.status === "active").length;
  const constructionBranches = branches.branches.filter((b) => b.status === "construction").length;
  const totalKiosks = branches.branches.length;

  const availableItems = menu.items.filter((i) => i.available).length;
  const itemsMissingPrice = menu.items.filter((i) => !i.priceEgp).length;
  const itemsMissingPhoto = menu.items.filter((i) => !i.imageUrl).length;
  const visibleCategories = menu.categories.filter((c) => c.visible).length;

  const subscribers = contacts.contacts.length;
  const activeChars = characters.characters.filter((c) => c.active).length;

  const totalGenerations = generations.entries.length;
  const failedGenerations = generations.entries.filter((g) => g.status === "failed").length;

  
  const decisions: DecisionItem[] = [];

  if (constructionBranches > 0) {
    decisions.push({
      id: "branches-construction",
      severity: "warning",
      title: `${constructionBranches} kiosk${constructionBranches > 1 ? "s" : ""} still under construction`,
      detail: "No revenue yet — review buildout schedule.",
      href: "/branches",
      cta: "Review",
    });
  }
  if (activeBranches === 0) {
    decisions.push({
      id: "no-active-branches",
      severity: "critical",
      title: "No active kiosks operating",
      detail: "Frontline operations layer is not yet generating data.",
      href: "/branches",
      cta: "Open",
    });
  }
  if (itemsMissingPhoto > 0) {
    decisions.push({
      id: "menu-photos",
      severity: "warning",
      title: `${itemsMissingPhoto} menu item${itemsMissingPhoto > 1 ? "s" : ""} missing photos`,
      detail: "Customer-facing menu looks incomplete without imagery.",
      href: "/menu",
      cta: "Fix",
    });
  }
  if (itemsMissingPrice > 0) {
    decisions.push({
      id: "menu-prices",
      severity: "critical",
      title: `${itemsMissingPrice} item${itemsMissingPrice > 1 ? "s" : ""} have no price`,
      detail: "Cannot ring up at POS without a price.",
      href: "/menu",
      cta: "Fix",
    });
  }
  if (subscribers === 0) {
    decisions.push({
      id: "no-subscribers",
      severity: "info",
      title: "No coming-soon subscribers yet",
      detail: "Promote the landing page to start building the launch list.",
      href: "/contacts",
      cta: "Open",
    });
  }
  if (failedGenerations > 0) {
    decisions.push({
      id: "failed-generations",
      severity: "info",
      title: `${failedGenerations} failed Studio generation${failedGenerations > 1 ? "s" : ""}`,
      detail: "Review history for recurring errors.",
      href: "/ai",
      cta: "Review",
    });
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-deep">
          Centralized command surface
        </p>
        <h2 className="mt-1 text-3xl font-bold text-brand-ink">
          Everything that runs the chain — in one view.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted leading-relaxed">
          Five operational layers wired to live data. Frontline speed, operational
          efficiency, predictive intelligence, customer growth, and corporate
          governance — without switching apps.
        </p>
      </section>

      {/* 5 Layers */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-brand-ink">
            The 5 Layers
          </h3>
          <p className="text-xs text-muted">
            Inspired by Foodics · evolved AI-native for chain operations
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <LayerCard
            layer="1"
            title="Frontline Operations"
            tagline="POS, Kiosk, KDS, Waiter, Delivery — the customer-facing speed layer."
            href="/owners-eye/frontline"
            icon={Store}
            accent="green"
            status="scaffold"
            metrics={[
              { label: "Active Kiosks", value: activeBranches },
              { label: "In Build", value: constructionBranches },
              { label: "Total Sites", value: totalKiosks },
            ]}
          />

          <LayerCard
            layer="2"
            title="Operational Management"
            tagline="Inventory, suppliers, recipes, waste, procurement — cost control engine."
            href="/owners-eye/operations"
            icon={Boxes}
            accent="yellow"
            status="scaffold"
            metrics={[
              { label: "Menu Items", value: availableItems },
              { label: "Categories", value: visibleCategories },
              { label: "Missing Px", value: itemsMissingPhoto },
            ]}
          />

          <LayerCard
            layer="3"
            title="Intelligence"
            tagline="Predictive forecasts, anomaly detection, profitability AI — autonomous insight."
            href="/owners-eye/intelligence"
            icon={Brain}
            accent="blue"
            status="scaffold"
            metrics={[
              { label: "Generations", value: totalGenerations },
              { label: "Failed", value: failedGenerations },
              { label: "Models", value: 2 },
            ]}
          />

          <LayerCard
            layer="4"
            title="Growth"
            tagline="CRM, loyalty, segmentation, campaigns — turn customers into regulars."
            href="/owners-eye/growth"
            icon={Users}
            accent="red"
            status="scaffold"
            metrics={[
              { label: "Subscribers", value: subscribers },
              { label: "Segments", value: 0 },
              { label: "Campaigns", value: 0 },
            ]}
          />

          <LayerCard
            layer="5"
            title="Corporate Governance"
            tagline="Franchise rules, multi-branch policy, compliance, brand integrity."
            href="/owners-eye/governance"
            icon={ShieldCheck}
            accent="ink"
            status="scaffold"
            metrics={[
              { label: "Branches", value: totalKiosks },
              { label: "Active Chars", value: activeChars },
              { label: "Brand Rules", value: 6 },
            ]}
          />
        </div>
      </section>

      {/* Decision Surface */}
      <section>
        <DecisionSurface
          title="What needs your attention"
          subtitle="Aggregated across all 5 layers — newest signals first."
          items={decisions}
        />
      </section>
    </div>
  );
}
