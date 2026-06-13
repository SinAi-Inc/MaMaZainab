import { readMenu } from "@/lib/menu/store";
import { formatEGP } from "@/lib/utils";
import { canViewPublicMenu } from "@/lib/menu/access";
import { PublicMenuUnavailable } from "../_components/public-menu-unavailable";
import { PrintTrigger, PrintButton } from "./_print-trigger";

export const dynamic = "force-dynamic";

/**
 * Print-ready menu (A4 portrait).
 *
 * Use the browser's print dialog to "Save as PDF" or send to a real printer.
 * The Print/PDF button auto-opens the print dialog when this page loads.
 */
export default async function MenuPrintPage() {
  if (!(await canViewPublicMenu())) {
    return <PublicMenuUnavailable />;
  }

  const state = await readMenu();
  const cats = [...state.categories]
    .filter((c) => c.visible)
    .sort((a, b) => a.sort - b.sort)
    .map((cat) => ({
      cat,
      items: state.items
        .filter((i) => i.categoryId === cat.id && i.available)
        .sort((a, b) => a.sort - b.sort),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="print-root bg-brand-cream min-h-screen" id="print-root">
      <PrintTrigger />

      {/* On-screen toolbar (hidden when printing) */}
      <div className="no-print sticky top-0 z-50 bg-brand-ink text-white px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.png" alt="" className="size-8 rounded" />
          <div>
            <div className="text-sm font-semibold">MaMa Zainab - Print Menu</div>
            <div className="text-[11px] opacity-70">
              A4 portrait · Use browser&apos;s print dialog → Save as PDF
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <PrintButton />
          <a
            href="/menu"
            className="px-3 py-1.5 text-sm rounded border border-white/20 hover:bg-white/10"
          >
            Back to admin
          </a>
        </div>
      </div>

      {/* Printable sheet */}
      <article className="print-sheet mx-auto bg-white shadow-lg my-6">
        {/* Header */}
        <header className="print-page-header text-center pt-8 pb-5 px-12 border-b-4 border-brand-green relative">
          {/* Thin plaid accent at top of header */}
          <div className="plaid h-3 -mx-12 -mt-8 mb-4" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-primary.png"
            alt="MaMa Zainab"
            className="mx-auto h-32 print-logo w-auto object-contain"
          />
          <p className="mt-3 text-sm tracking-[0.4em] uppercase text-brand-green-deep font-semibold">
            Menu
          </p>
          <p className="mt-1 text-xs text-brand-ink/60 italic">
            Homemade taste. Fast-food style - for the first time.
          </p>
          <div className="absolute left-0 right-0 -bottom-1 mx-auto w-24 h-1.5 bg-brand-yellow" />
        </header>

        {/* Body - two columns on screen, CSS Grid in print */}
        <div className="print-page-body px-12 py-8 columns-2 gap-10 [column-rule:1px_dashed_var(--color-border-default)]">
          {cats.map(({ cat, items }) => (
            <section key={cat.id} className="break-inside-avoid mb-8">
              <h2 className="font-display text-2xl text-brand-ink leading-none mb-1">
                {cat.nameEn}
              </h2>
              {cat.id === "cat_stuffy" && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-red mb-1">
                  No fingers licking - we eat it ALL!
                </p>
              )}
              {cat.descriptionEn && (
                <p className="text-[10px] italic text-brand-ink/55 mb-3">
                  {cat.descriptionEn}
                </p>
              )}
              <div className="h-px bg-brand-green/40 mb-3" />
              <ul className="space-y-2.5">
                {items.map((item) => {
                  const meta = [item.caloriesLabel, item.servingInfo].filter(Boolean);

                  return (
                    <li key={item.id} className="text-sm break-inside-avoid">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-brand-ink">
                          {item.nameEn}
                        </span>
                        <span className="flex-1 border-b border-dotted border-brand-ink/25 translate-y-[-3px]" />
                        <span className="font-bold text-brand-green-deep tabular-nums">
                          {formatEGP(item.priceEgp)}
                        </span>
                      </div>
                      {item.nameAr && (
                        <p dir="rtl" className="mt-0.5 text-[11px] font-semibold text-brand-green-deep/90">
                          {item.nameAr}
                        </p>
                      )}
                      {item.descriptionEn && (
                        <p className="mt-0.5 text-[11px] leading-snug text-brand-ink/60">
                          {item.descriptionEn}
                        </p>
                      )}
                      {item.descriptionAr && (
                        <p dir="rtl" className="mt-0.5 text-[10px] leading-snug text-brand-ink/55">
                          {item.descriptionAr}
                        </p>
                      )}
                      {meta.length > 0 && (
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-green-deep/85">
                          {meta.join(" · ")}
                        </p>
                      )}
                      {item.highlights.length > 0 && (
                        <p className="mt-0.5 text-[10px] text-brand-ink/55">
                          {item.highlights.join(" · ")}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {/* Footer INSIDE the grid so it stays with content as a full-width last row.
              Outside the grid, break-before:avoid is unreliable in Chrome. */}
          <footer className="print-page-footer px-0 py-6 bg-brand-ink text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 plaid h-2 opacity-40" />
            <div className="relative z-10">
              <div className="font-display text-xl tracking-wide">MaMa Zainab</div>
              <div className="text-[10px] opacity-70 mt-1 tracking-[0.2em] uppercase">
                Alexandria · Est. 2026
              </div>
              <div className="mt-3 inline-block h-1 w-12 bg-brand-yellow rounded" />
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
}


