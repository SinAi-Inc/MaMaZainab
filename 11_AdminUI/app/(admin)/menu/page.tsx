import Link from "next/link";
import { Plus, Pencil, GripVertical, Printer, Eye } from "lucide-react";
import { readMenu } from "@/lib/menu/store";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusPill } from "@/components/ui/badge";
import { formatEGP } from "@/lib/utils";
import { ItemActions } from "./_components/item-actions";
import { GenerateSkuButton } from "./_components/generate-sku-button";
import { SyncButton } from "./_components/sync-button";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const state = await readMenu();
  const cats = [...state.categories].sort((a, b) => a.sort - b.sort);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Content</p>
          <h2 className="text-3xl font-semibold mt-1">Menu</h2>
          <p className="text-sm text-muted mt-1">
            Categories &amp; items. Changes here flow to the public preview, kiosk
            boards, and ordering app.
          </p>
          <p className="text-xs text-brand-ink/65 mt-2">
            Items now support Arabic copy, calories, and short fact chips without changing the brand palette.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/menu/preview" target="_blank">
            <Button variant="ghost">
              <Eye className="size-4" /> Preview
            </Button>
          </Link>
          <Link href="/menu/print" target="_blank">
            <Button variant="ghost">
              <Printer className="size-4" /> Print / PDF
            </Button>
          </Link>
          <Link href="/menu/categories/new">
            <Button variant="outline">
              <Plus className="size-4" /> New category
            </Button>
          </Link>
          <Link href="/menu/items/new">
            <Button variant="primary">
              <Plus className="size-4" /> New item
            </Button>
          </Link>
        </div>
      </div>

      {/* Editing tip */}
      <div className="rounded-md bg-brand-yellow/10 border border-brand-yellow/40 px-4 py-2.5 text-sm text-brand-ink/80 flex items-center gap-2">
        <Pencil className="size-4 text-brand-green-deep" />
        Click any item row to edit it. Use the richer metadata fields to add calories, Arabic copy, and short menu facts.
      </div>

      {/* Sync local → Supabase */}
      <SyncButton />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Categories" value={state.categories.length} />
        <StatCard label="Items" value={state.items.length} />
        <StatCard
          label="Available"
          value={state.items.filter((i) => i.available).length}
          accent="green"
        />
      </div>

      {/* Categories + items */}
      {cats.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-muted mb-4">No categories yet.</p>
            <Link href="/menu/categories/new">
              <Button>
                <Plus className="size-4" /> Create your first category
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {cats.map((cat) => {
        const items = state.items
          .filter((i) => i.categoryId === cat.id)
          .sort((a, b) => a.sort - b.sort);
        return (
          <Card key={cat.id}>
            <CardHeader className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <GripVertical className="size-4 text-border-strong shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold truncate">{cat.nameEn}</h3>
                    {!cat.visible && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600">
                        hidden
                      </span>
                    )}
                  </div>
                  {cat.descriptionEn && (
                    <p className="text-xs text-muted mt-0.5">{cat.descriptionEn}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted">{items.length} items</span>
                <Link href={`/menu/categories/${cat.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                </Link>
                <Link href={`/menu/items/new?categoryId=${cat.id}`}>
                  <Button variant="outline" size="sm">
                    <Plus className="size-3.5" /> Add item
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {items.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted">
                  No items yet in this category.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((item) => {
                    const meta = [item.caloriesLabel, item.servingInfo, ...item.highlights]
                      .filter(Boolean)
                      .slice(0, 4);

                    return (
                      <li key={item.id} className="px-4 py-4 sm:px-5">
                        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-white to-brand-cream/35 transition-all hover:border-brand-yellow/60 hover:shadow-sm">
                          <div className="absolute inset-y-0 left-0 w-1.5 bg-brand-green/80" />
                          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                            <Link
                              href={`/menu/items/${item.id}/edit`}
                              className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center"
                            >
                              <div className="flex min-w-0 items-start gap-4">
                                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface text-[10px] text-muted sm:size-20">
                                  {item.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.imageUrl}
                                      alt={item.nameEn}
                                      className="size-full object-cover"
                                    />
                                  ) : (
                                    "no img"
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-base font-semibold text-brand-ink transition-colors group-hover:text-brand-green-deep">
                                      {item.nameEn}
                                    </span>
                                    {item.nameAr && (
                                      <span
                                        dir="rtl"
                                        className="text-sm font-semibold text-brand-green-deep/90"
                                      >
                                        {item.nameAr}
                                      </span>
                                    )}
                                    {item.sku && (
                                      <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                                        {item.sku}
                                      </span>
                                    )}
                                  </div>

                                  {(item.descriptionEn || item.descriptionAr) && (
                                    <div className="mt-1.5 space-y-1">
                                      {item.descriptionEn && (
                                        <p className="text-xs text-muted line-clamp-2">
                                          {item.descriptionEn}
                                        </p>
                                      )}
                                      {item.descriptionAr && (
                                        <p
                                          dir="rtl"
                                          className="text-xs text-brand-ink/65 line-clamp-2"
                                        >
                                          {item.descriptionAr}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {meta.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {meta.map((entry) => (
                                        <span
                                          key={entry}
                                          className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/40 bg-brand-yellow/10 px-2.5 py-1 text-[11px] font-medium text-brand-ink"
                                        >
                                          <span className="size-2 rotate-45 rounded-[2px] bg-brand-yellow" />
                                          {entry}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {item.badges.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                      {item.badges.map((b) => (
                                        <Badge key={b} kind={b} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3 lg:w-40 lg:flex-col lg:items-end lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
                                <div className="font-semibold tabular-nums text-brand-green-deep">
                                  {formatEGP(item.priceEgp)}
                                </div>
                                <StatusPill available={item.available} />
                              </div>
                            </Link>

                            <div className="flex items-center justify-end gap-1 shrink-0 lg:pl-2">
                              {!item.sku && <GenerateSkuButton id={item.id} />}
                              <ItemActions id={item.id} available={item.available} />
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "green" | "yellow";
}) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs uppercase tracking-[0.14em] text-muted">{label}</div>
        <div
          className={`mt-2 text-3xl font-semibold tabular-nums ${
            accent === "green" ? "text-brand-green-deep" : ""
          }`}
        >
          {value}
        </div>
      </CardBody>
    </Card>
  );
}
