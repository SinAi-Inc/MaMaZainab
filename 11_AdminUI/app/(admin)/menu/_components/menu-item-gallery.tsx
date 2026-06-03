"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Image as ImageIcon, Pencil } from "lucide-react";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEGP, cn } from "@/lib/utils";
import type { MenuItem } from "@/lib/menu/schema";
import { GenerateSkuButton } from "./generate-sku-button";
import { ItemActions } from "./item-actions";

export function MenuItemGallery({ items }: { items: MenuItem[] }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <ul className="grid gap-3 p-3 sm:p-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const expanded = expandedIds.has(item.id);
        const meta = [item.caloriesLabel, item.servingInfo, ...item.highlights]
          .filter(Boolean)
          .slice(0, 4);

        return (
          <li key={item.id} className="min-w-0">
            <div
              className={cn(
                "overflow-hidden rounded-lg border bg-white transition-colors",
                expanded
                  ? "border-brand-green/45 shadow-sm"
                  : "border-border/80 hover:border-brand-yellow/70"
              )}
            >
              <div className="flex items-start gap-2 p-3">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-expanded={expanded}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface text-[10px] text-muted">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.nameEn} className="size-full object-cover" />
                    ) : (
                      <ImageIcon className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-ink">
                          {item.nameEn}
                        </p>
                        {item.nameAr && (
                          <p dir="rtl" className="truncate text-xs font-semibold text-brand-green-deep/90">
                            {item.nameAr}
                          </p>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          "mt-0.5 size-4 shrink-0 text-muted transition-transform",
                          expanded && "rotate-180"
                        )}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums text-brand-green-deep">
                        {formatEGP(item.priceEgp)}
                      </span>
                      <StatusPill available={item.available} />
                    </div>
                    {item.descriptionEn && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                        {item.descriptionEn}
                      </p>
                    )}
                  </div>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-1 border-t border-border/70 px-3 py-2">
                {!item.sku && <GenerateSkuButton id={item.id} />}
                <ItemActions id={item.id} available={item.available} />
              </div>

              {expanded && (
                <div className="border-t border-border/70 bg-brand-cream/25 p-3">
                  <div className="overflow-hidden rounded-md border border-border bg-surface">
                    <div className="aspect-[4/3] w-full">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.nameEn} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs text-muted">
                          No photo saved
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {(item.descriptionEn || item.descriptionAr) && (
                      <div className="space-y-1.5">
                        {item.descriptionEn && (
                          <p className="text-sm leading-relaxed text-brand-ink/80">
                            {item.descriptionEn}
                          </p>
                        )}
                        {item.descriptionAr && (
                          <p dir="rtl" className="text-sm leading-relaxed text-brand-ink/70">
                            {item.descriptionAr}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Info label="SKU" value={item.sku || "Not assigned"} mono={Boolean(item.sku)} />
                      <Info label="Sort" value={String(item.sort)} />
                    </div>

                    {meta.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {meta.map((entry) => (
                          <span
                            key={entry}
                            className="inline-flex items-center rounded-full border border-brand-yellow/40 bg-brand-yellow/10 px-2.5 py-1 text-[11px] font-medium text-brand-ink"
                          >
                            {entry}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.badges.map((b) => (
                          <Badge key={b} kind={b} />
                        ))}
                      </div>
                    )}

                    <Link href={`/menu/items/${item.id}/edit`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Pencil className="size-3.5" /> Edit item details
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/80 bg-white px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className={cn("mt-0.5 truncate text-xs font-medium text-brand-ink", mono && "font-mono")}>
        {value}
      </p>
    </div>
  );
}
