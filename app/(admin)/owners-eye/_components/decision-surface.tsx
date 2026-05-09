import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DecisionItem = {
  id: string;
  severity: "critical" | "warning" | "info" | "ok";
  title: string;
  detail?: string;
  href?: string;
  cta?: string;
};

const SEVERITY_META = {
  critical: { icon: AlertCircle, cls: "text-red-600 bg-red-50", label: "Critical" },
  warning: { icon: AlertCircle, cls: "text-amber-600 bg-amber-50", label: "Attention" },
  info: { icon: Clock, cls: "text-blue-600 bg-blue-50", label: "Info" },
  ok: { icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-50", label: "OK" },
} as const;

/**
 * DecisionSurface — "What needs my attention right now?"
 *
 * Drop-in widget for each Owner's Eye layer page. Surfaces actionable
 * items rather than passive metrics — the core philosophy from the
 * Foodics-inspired analysis (decision surfaces, not data pages).
 */
export function DecisionSurface({
  title,
  subtitle,
  items,
  emptyMessage = "Nothing needs your attention. ✓",
}: {
  title: string;
  subtitle?: string;
  items: DecisionItem[];
  emptyMessage?: string;
}) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-brand-ink">{title}</h3>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-emerald-50/40 px-4 py-6 text-center">
            <CheckCircle2 className="mx-auto size-6 text-emerald-600" />
            <p className="mt-2 text-sm text-muted">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const meta = SEVERITY_META[item.severity];
              const Icon = meta.icon;
              const inner = (
                <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-white px-3 py-2.5 transition-colors hover:bg-brand-cream/50">
                  <div className={cn("size-8 shrink-0 rounded-lg flex items-center justify-center", meta.cls)}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-ink leading-tight">
                      {item.title}
                    </p>
                    {item.detail && (
                      <p className="mt-0.5 text-xs text-muted leading-snug">{item.detail}</p>
                    )}
                  </div>
                  {item.href && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-green-deep">
                      {item.cta ?? "Open"} <ArrowRight className="size-3" />
                    </span>
                  )}
                </div>
              );
              return item.href ? (
                <Link key={item.id} href={item.href} className="block">
                  {inner}
                </Link>
              ) : (
                <div key={item.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
