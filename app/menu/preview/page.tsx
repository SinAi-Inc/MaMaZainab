import { readMenu } from "@/lib/menu/store";
import { Badge } from "@/components/ui/badge";
import { formatEGP } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Public-style menu preview.
 * Brand-styled rendering of how the menu appears to customers (web/kiosk).
 * No admin chrome.
 */
export default async function MenuPreviewPage() {
  const state = await readMenu();
  const cats = [...state.categories]
    .filter((c) => c.visible)
    .sort((a, b) => a.sort - b.sort);

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Hero */}
      <header className="relative plaid overflow-hidden">
        {/* Dark vignette overlay — fades the plaid so text is readable */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(30,26,20,0.55) 0%, rgba(30,26,20,0.70) 100%)",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-14 text-center text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-wordmark-transparent.png"
            alt="MaMa Zainab"
            className="h-28 w-auto object-contain mx-auto drop-shadow-xl"
          />
          <p className="mt-6 text-xs uppercase tracking-[0.35em] text-brand-yellow drop-shadow-sm">
            Menu
          </p>
          <p className="mt-3 text-sm text-white/85 drop-shadow-sm">
            Homemade taste. Fast-food style — for the first time.
          </p>
          <div className="mt-4 inline-block h-1 w-16 bg-brand-yellow rounded" />
        </div>
      </header>

      {/* Menu */}
      <div className="relative">
        {/* Very faint plaid wash behind menu content */}
        <div className="absolute inset-0 plaid opacity-[0.07] pointer-events-none" />
        {/* Left decorative green strip — matches the solid-green vertical band in the plaid */}
        <div className="absolute left-0 inset-y-0 w-14 bg-brand-green opacity-40 pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 space-y-12 pl-20">
        {cats.map((cat) => {
          const items = state.items
            .filter((i) => i.categoryId === cat.id && i.available)
            .sort((a, b) => a.sort - b.sort);
          if (items.length === 0) return null;
          return (
            <section key={cat.id}>
              <div className={`border-b-2 border-brand-green pb-3 mb-6 ${cat.id === "cat_stuffy" ? "text-center" : ""}`}>
                <h2 className="font-display text-4xl text-brand-ink leading-none">
                  {cat.nameEn}
                </h2>
                {cat.id === "cat_stuffy" && (
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-red">
                    No fingers licking - we eat it ALL!
                  </p>
                )}
                {cat.descriptionEn && (
                  <p className="text-sm text-muted mt-2">{cat.descriptionEn}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                {items.map((item) => (
                  <article key={item.id} className="flex gap-4">
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.nameEn}
                        className="size-20 rounded-lg object-cover shrink-0 border border-border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-semibold text-lg leading-tight">
                          {item.nameEn}
                        </h3>
                        <span className="font-bold text-brand-green-deep tabular-nums shrink-0">
                          {formatEGP(item.priceEgp)}
                        </span>
                      </div>
                      {item.descriptionEn && (
                        <p className="text-sm text-muted mt-1">
                          {item.descriptionEn}
                        </p>
                      )}
                      {item.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.badges.map((b) => (
                            <Badge key={b} kind={b} />
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {cats.length === 0 && (
          <p className="text-center text-muted py-20">No menu items yet.</p>
        )}
      </div>
      </div>

      <footer className="bg-brand-ink text-white text-center py-6 text-xs">
        <div className="font-display text-xl tracking-wide">MaMa Zainab</div>
        <div className="opacity-70 mt-1">Alexandria · EST. 2026</div>
        <div className="mt-3">
          <Link
            href="/menu/print"
            className="inline-block px-4 py-1.5 rounded bg-brand-yellow text-brand-ink font-semibold text-xs hover:bg-yellow-300"
          >
            Print / Save as PDF
          </Link>
        </div>
      </footer>
    </div>
  );
}
