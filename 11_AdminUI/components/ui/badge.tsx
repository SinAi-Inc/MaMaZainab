import { cn } from "@/lib/utils";
import { BADGE_META, type Badge as BadgeKey } from "@/lib/menu/schema";

export function Badge({
  kind,
  className,
}: {
  kind: BadgeKey;
  className?: string;
}) {
  const meta = BADGE_META[kind];
  const colors: Record<BadgeKey, string> = {
    new: "bg-brand-yellow/30 text-brand-ink border-brand-yellow",
    spicy: "bg-red-100 text-red-700 border-red-300",
    vegan: "bg-brand-green/15 text-brand-green-deep border-brand-green/40",
    bestseller: "bg-amber-100 text-amber-800 border-amber-300",
    chefs_pick: "bg-purple-100 text-purple-800 border-purple-300",
    limited: "bg-orange-100 text-orange-800 border-orange-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border",
        colors[kind],
        className
      )}
    >
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

export function StatusPill({ available }: { available: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full",
        available
          ? "bg-brand-green/15 text-brand-green-deep"
          : "bg-zinc-200 text-zinc-600"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          available ? "bg-brand-green" : "bg-zinc-500"
        )}
      />
      {available ? "Available" : "Hidden"}
    </span>
  );
}
