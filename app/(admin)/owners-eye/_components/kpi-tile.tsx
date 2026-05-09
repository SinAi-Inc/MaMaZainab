import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * KpiTile — compact KPI tile for Owner's Eye sub-pages.
 *
 * Smaller and denser than dashboard StatCard — designed for the
 * 4–6 column grids inside operational layers.
 */
export function KpiTile({
  label,
  value,
  delta,
  trend,
  hint,
  accent = "ink",
}: {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "flat";
  hint?: string;
  accent?: "green" | "yellow" | "red" | "blue" | "ink";
}) {
  const accentMap: Record<string, string> = {
    green: "text-brand-green",
    yellow: "text-amber-600",
    red: "text-red-600",
    blue: "text-blue-600",
    ink: "text-brand-ink",
  };
  const trendMap = {
    up: "text-emerald-600",
    down: "text-red-600",
    flat: "text-muted",
  } as const;

  return (
    <Card>
      <CardBody className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted truncate">
          {label}
        </p>
        <p className={cn("text-2xl font-bold tabular-nums leading-tight", accentMap[accent])}>
          {value}
        </p>
        {(delta || hint) && (
          <p className="text-[11px] text-muted leading-snug">
            {delta && (
              <span className={cn("font-semibold", trend ? trendMap[trend] : "")}>
                {delta}
              </span>
            )}
            {delta && hint && " · "}
            {hint}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
