import { readMenu } from "@/lib/menu/store";
import { Badge } from "@/components/ui/badge";
import { formatEGP } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Public-style menu preview.
 * Brand-styled rendering of how the menu appears to customers (web/kiosk).
 * No admin chrome.
 */
export default async function MenuPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ peek?: string }>;
}) {
  const { peek } = await searchParams;
  const hidePrices = peek === "1";
  const hitlPreview = !hidePrices;
  const logoHref = hitlPreview ? "/menu" : "/coming-soon";
  const state = await readMenu();
  const cats = [...state.categories]
    .filter((c) => c.visible)
    .sort((a, b) => a.sort - b.sort);

  return (
    <div className="min-h-screen bg-brand-cream">
      {hitlPreview && (
        <Link
          href="/menu"
          aria-label="Back to HITL menu"
          title="Back to HITL menu"
          className="no-print fixed left-0 top-1/2 z-30 flex -translate-y-1/2 items-center gap-2 rounded-r-md bg-brand-ink/95 px-2.5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-lg transition-colors hover:bg-brand-green-deep"
        >
          <ArrowLeft className="size-4" />
          <span className="[writing-mode:vertical-rl] rotate-180 leading-none">HITL</span>
        </Link>
      )}

      {/* Print-only compact title — replaces the hero when printing */}
      <div className="print-only" style={{ padding: "10mm 12mm 5mm", borderBottom: "3px solid #1B9B00" }}>
        <div style={{ fontFamily: "var(--font-brand, serif)", fontSize: "26pt", color: "#2C292A", lineHeight: 1 }}>MaMa Zainab</div>
        <div style={{ fontSize: "8pt", letterSpacing: "0.3em", textTransform: "uppercase", color: "#169216", marginTop: "3mm" }}>Menu · Alexandria · Est. 2026</div>
      </div>

      {/* Hero */}
      <header className="menu-preview-hero relative plaid overflow-hidden">
        {/* Dark vignette overlay — fades the plaid so text is readable */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(30,26,20,0.55) 0%, rgba(30,26,20,0.70) 100%)",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-14 text-center text-white">
          <Link href={logoHref} aria-label={hitlPreview ? "Back to HITL menu" : "Back to MaMa Zainab landing page"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-wordmark-transparent.png"
              alt="MaMa Zainab"
              className="h-28 w-auto object-contain mx-auto drop-shadow-xl hover:scale-105 transition-transform"
            />
          </Link>
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
      <div className="menu-preview-body relative">
        {/* Very faint plaid wash behind menu content */}
        <div className="menu-deco absolute inset-0 plaid opacity-[0.07] pointer-events-none" />
        {/* Left decorative green strip — matches the solid-green vertical band in the plaid */}
        <div className="menu-deco absolute left-0 inset-y-0 hidden w-14 bg-brand-green opacity-40 pointer-events-none sm:block" />
        <div className="menu-preview-content relative z-10 max-w-5xl mx-auto px-4 py-10 space-y-12 sm:px-6 sm:py-12 sm:pl-20">
        {cats.map((cat) => {
          const items = state.items
            .filter((i) => i.categoryId === cat.id && i.available)
            .sort((a, b) => a.sort - b.sort);
          if (items.length === 0) return null;
          return (
            <section key={cat.id}>
              {/* Plaid accent strip between sections */}
              <div className="plaid h-2 rounded-full mb-6 opacity-60" />
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

              <div className="menu-preview-items grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <article key={item.id} className="group flex h-full min-h-28 flex-col overflow-hidden rounded-lg border border-border/60 bg-white shadow-sm transition-shadow hover:shadow-md">
                    {item.imageUrl && (
                      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#f8f8f2]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.nameEn}
                          className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-semibold text-base leading-tight text-brand-ink">
                          {item.nameEn}
                        </h3>
                        {!hidePrices && (
                          <span className="font-bold text-brand-green-deep tabular-nums shrink-0 text-sm">
                            {formatEGP(item.priceEgp)}
                          </span>
                        )}
                      </div>
                      {item.descriptionEn && (
                        <p className="text-xs text-muted mt-1.5 line-clamp-2">
                          {item.descriptionEn}
                        </p>
                      )}
                      {item.badges.length > 0 && (
                        <div className="menu-preview-badges mt-auto flex flex-wrap gap-1.5 pt-3">
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

      <footer className="menu-preview-footer relative overflow-hidden bg-brand-ink text-white text-center py-6 text-xs">
        {/* Subtle plaid wash in footer */}
        <div className="absolute inset-0 plaid opacity-[0.12] pointer-events-none" />
        <div className="relative z-10">
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
        </div>
      </footer>
    </div>
  );
}
