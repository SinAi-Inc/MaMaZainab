import Link from "next/link";
import { Plus, Pencil, GripVertical, Printer, Eye } from "lucide-react";
import { readMenu } from "@/lib/menu/store";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SyncButton } from "./_components/sync-button";
import { MenuItemGallery } from "./_components/menu-item-gallery";

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
        Tap an item card to expand photos and details. Use Edit to update copy, calories, Arabic text, and short menu facts.
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
                <MenuItemGallery items={items} />
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
