import Link from "next/link";
import {
  UtensilsCrossed,
  Video,
  Users,
  Mail,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
} from "lucide-react";
import { readMenu } from "@/lib/menu/store";
import { readStudio } from "@/lib/videos/store";
import { readCharacters } from "@/lib/characters/store";
import { readContacts } from "@/lib/contacts/store";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  const [menu, studio, chars, contacts] = await Promise.all([
    readMenu(),
    readStudio(),
    readCharacters(),
    readContacts(),
  ]);

  // Menu stats
  const totalItems = menu.items.filter((i) => i.available).length;
  const totalCategories = menu.categories.filter((c) => c.visible).length;
  const noSkuCount = menu.items.filter((i) => i.available && !i.sku).length;

  // Video stats
  const totalProjects = studio.projects.length;
  const totalShots = studio.shots.length;
  const approvedShots = studio.shots.filter((s) => s.status === "approved").length;
  const videoProgress = totalShots
    ? Math.round((approvedShots / totalShots) * 100)
    : 0;

  // Character stats
  const activeChars = chars.characters.filter((c) => c.active).length;
  const totalChars = chars.characters.length;

  // Contact stats
  const totalContacts = contacts.contacts.length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page header */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Overview</p>
        <h1 className="text-2xl font-semibold mt-1">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Live snapshot of the MaMa Zainab brand admin system.
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
          label="Video Projects"
          value={totalProjects}
          sub={`${approvedShots}/${totalShots} shots approved`}
          icon={Video}
          href="/videos"
          accent="blue"
        />
        <StatCard
          label="Characters"
          value={activeChars}
          sub={`${totalChars} total · ${totalChars - activeChars} draft`}
          icon={Users}
          href="/characters"
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
              icon={Video}
              label="Video production progress"
              value={`${videoProgress}%`}
              tone={videoProgress >= 80 ? "green" : videoProgress >= 40 ? "yellow" : "red"}
            />
            <ActivityRow
              icon={CheckCircle2}
              label="Approved shots"
              value={`${approvedShots} / ${totalShots}`}
              tone="green"
            />
            <ActivityRow
              icon={Users}
              label="Active characters"
              value={`${activeChars} / ${totalChars}`}
              tone={activeChars > 0 ? "green" : "yellow"}
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
              <QuickAction href="/videos/new" label="New video project" icon={Video} />
              <QuickAction href="/characters/new" label="New character" icon={Users} />
              <QuickAction href="/menu/print" label="Print / Save PDF menu" icon={UtensilsCrossed} />
              <QuickAction href="/menu/preview" label="Preview public menu" icon={UtensilsCrossed} />
              <QuickAction href="/contacts" label="View subscriber list" icon={Mail} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Content summaries */}
      <div className="grid xl:grid-cols-3 gap-6">
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

        {/* Video projects */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Video projects</h3>
              <Link href="/videos" className="text-xs text-brand-green-deep hover:underline">
                View all →
              </Link>
            </div>
            {studio.projects.length === 0 ? (
              <p className="text-sm text-muted">No projects yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {studio.projects.slice(0, 5).map((p) => {
                  const pShots = studio.shots.filter((s) => s.projectId === p.id);
                  const pApproved = pShots.filter((s) => s.status === "approved").length;
                  const pct = pShots.length
                    ? Math.round((pApproved / pShots.length) * 100)
                    : 0;
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/videos/${p.id}`}
                        className="block hover:text-brand-green-deep transition-colors"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate font-medium">{p.title}</span>
                          <span className="text-xs text-muted ml-2 shrink-0">{pct}%</span>
                        </div>
                        <div className="mt-1 h-1 bg-zinc-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-green rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Characters */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Characters</h3>
              <Link href="/characters" className="text-xs text-brand-green-deep hover:underline">
                View all →
              </Link>
            </div>
            <ul className="space-y-3">
              {chars.characters.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  {c.referenceImages?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.referenceImages[0].url}
                      alt={c.name}
                      className="size-8 rounded-full object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
                      <Users className="size-4 text-brand-green" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[11px] text-muted">{c.subtitle}</p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      c.active
                        ? "bg-brand-green/10 text-brand-green-deep"
                        : "bg-zinc-200 text-zinc-500"
                    )}
                  >
                    {c.active ? "Active" : "Draft"}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
