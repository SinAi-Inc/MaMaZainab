import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * LayerCard — Owner's Eye 5-layer hub entry.
 *
 * Each card represents one layer of the Restaurant Operating System
 * (Frontline / Operations / Intelligence / Growth / Governance) with
 * a summary KPI strip and a primary action link.
 */
export function LayerCard({
  layer,
  title,
  tagline,
  href,
  icon: Icon,
  accent,
  metrics,
  status,
}: {
  layer: string;
  title: string;
  tagline: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "green" | "yellow" | "red" | "blue" | "ink";
  metrics: { label: string; value: string | number }[];
  status?: "live" | "scaffold" | "soon";
}) {
  const accentMap: Record<string, string> = {
    green: "bg-brand-green/10 text-brand-green ring-brand-green/20",
    yellow: "bg-brand-yellow/20 text-brand-ink ring-brand-yellow/40",
    red: "bg-red-100 text-red-600 ring-red-200",
    blue: "bg-blue-100 text-blue-600 ring-blue-200",
    ink: "bg-brand-ink/10 text-brand-ink ring-brand-ink/20",
  };
  const statusMeta = {
    live: { label: "Live", cls: "bg-emerald-100 text-emerald-700" },
    scaffold: { label: "Scaffold", cls: "bg-amber-100 text-amber-700" },
    soon: { label: "Soon", cls: "bg-zinc-100 text-zinc-600" },
  } as const;
  const s = statusMeta[status ?? "scaffold"];

  return (
    <Link href={href} className="block group">
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardBody className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className={cn("size-12 rounded-xl flex items-center justify-center ring-1", accentMap[accent])}>
              <Icon className="size-6" />
            </div>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", s.cls)}>
              {s.label}
            </span>
          </div>

          {/* Title */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              Layer {layer}
            </p>
            <h3 className="mt-0.5 text-xl font-bold text-brand-ink leading-tight">
              {title}
            </h3>
            <p className="mt-1 text-sm text-muted leading-relaxed">{tagline}</p>
          </div>

          {/* Metrics strip */}
          <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
            {metrics.slice(0, 3).map((m) => (
              <div key={m.label}>
                <p className="text-[10px] uppercase tracking-wider text-muted truncate">
                  {m.label}
                </p>
                <p className="text-lg font-bold tabular-nums text-brand-ink leading-tight">
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center justify-end gap-1 text-xs font-semibold text-brand-green-deep group-hover:gap-2 transition-all">
            Open layer <ArrowRight className="size-3.5" />
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
