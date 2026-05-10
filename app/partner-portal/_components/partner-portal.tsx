"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Lock, MapPin, Utensils, Presentation, ChevronRight, ArrowLeft } from "lucide-react";
import { verifyPartnerPasscode } from "@/lib/partners/actions";
import type { Branch } from "@/lib/branches/schema";
import { STATUS_META } from "@/lib/branches/schema";

interface PartnerPortalProps {
  portalEnabled: boolean;
  showPresentation: boolean;
  showLocations: boolean;
  showBrandOverview: boolean;
  showMenu: boolean;
  locations: Branch[];
}

export function PartnerPortal({
  portalEnabled,
  showPresentation,
  showLocations,
  showBrandOverview,
  showMenu,
  locations,
}: PartnerPortalProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  /* ── Portal disabled ─────────────────────────── */
  if (!portalEnabled) {
    return (
      <main className="min-h-screen bg-brand-green text-white flex flex-col items-center justify-center px-5">
        <div className="absolute inset-0 plaid pointer-events-none opacity-30" />
        <div className="relative z-10 bg-brand-ink/80 backdrop-blur-sm rounded-2xl px-8 py-12 max-w-md w-full text-center shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.png" alt="" className="size-12 mx-auto mb-4" draggable={false} />
          <h1 className="text-xl font-semibold">Partner Portal</h1>
          <p className="mt-3 text-sm text-white/70">
            The partner portal is not yet available. Please check back soon or contact us for
            partnership inquiries.
          </p>
          <Link
            href="/coming-soon"
            className="inline-flex items-center gap-1.5 mt-6 text-xs text-brand-yellow hover:text-yellow-300 transition"
          >
            <ArrowLeft className="size-3" />
            Back to MaMa Zainab
          </Link>
        </div>
      </main>
    );
  }

  /* ── Passcode gate ───────────────────────────── */
  if (!authenticated) {
    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError("");
      startTransition(async () => {
        const ok = await verifyPartnerPasscode(passcode);
        if (ok) {
          setAuthenticated(true);
        } else {
          setError("Invalid passcode. Please contact your MaMa Zainab representative.");
          setPasscode("");
        }
      });
    }

    return (
      <main className="min-h-screen bg-brand-green text-white flex flex-col items-center justify-center px-5">
        <div className="absolute inset-0 plaid pointer-events-none opacity-30" />
        <div className="relative z-10 bg-brand-ink/80 backdrop-blur-sm rounded-2xl px-8 py-12 max-w-md w-full text-center shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.png" alt="" className="size-12 mx-auto mb-4" draggable={false} />
          <h1 className="text-xl font-semibold">Partner Access</h1>
          <p className="mt-2 text-sm text-white/60">
            Enter the passcode provided by your MaMa Zainab representative.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode"
                required
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm outline-none focus:border-brand-yellow focus:bg-white/15 transition"
              />
            </div>
            {error && (
              <p className="text-xs text-brand-red">{error}</p>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-lg bg-brand-yellow text-brand-ink font-semibold text-sm uppercase tracking-wider hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {isPending ? "Verifying…" : "Enter Portal"}
            </button>
          </form>

          <Link
            href="/coming-soon"
            className="inline-flex items-center gap-1.5 mt-6 text-xs text-white/50 hover:text-brand-yellow transition"
          >
            <ArrowLeft className="size-3" />
            Back to MaMa Zainab
          </Link>
        </div>
      </main>
    );
  }

  /* ── Authenticated portal ────────────────────── */
  return (
    <main className="min-h-screen bg-[#FAFAF5] text-brand-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-brand-ink text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.png" alt="" className="size-7" draggable={false} />
          <span className="font-[family-name:var(--font-brand)] text-xs tracking-[0.18em]">
            MaMa Zainab · Partner Portal
          </span>
        </div>
        <Link
          href="/coming-soon"
          className="text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-brand-yellow transition"
        >
          Exit
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-10 space-y-12">
        {/* ── Brand Overview ─────────────────── */}
        {showBrandOverview && (
          <section className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-primary.png"
              alt="MaMa Zainab"
              className="max-w-xs mx-auto"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))" }}
              draggable={false}
            />
            <p className="mt-6 text-lg text-brand-ink/80 font-light max-w-lg mx-auto">
              <span className="font-[family-name:var(--font-brand)] text-brand-green text-xl block mb-1">
                Homemade taste. Fast-food style.
              </span>
              Hand-rolled, slow-cooked Egyptian comfort food — served fast. A branded kiosk
              concept launching in Alexandria, Egypt.
            </p>
            <div className="mt-8 flex items-center justify-center gap-8">
              <Stat label="Launch" value="Late 2026" />
              <Stat label="Format" value="Branded Kiosk" />
              <Stat label="Market" value="Alexandria, Egypt" />
            </div>
          </section>
        )}

        {/* ── Presentation placeholder ───────── */}
        {showPresentation && (
          <section className="bg-white rounded-2xl border border-brand-ink/10 overflow-hidden shadow-sm">
            <div className="bg-brand-green/5 px-6 py-4 border-b border-brand-ink/5 flex items-center gap-2">
              <Presentation className="size-5 text-brand-green" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Brand Presentation
              </h2>
            </div>
            <div className="px-6 py-16 text-center">
              <div className="inline-flex items-center justify-center size-16 rounded-full bg-brand-green/10 mb-4">
                <Presentation className="size-8 text-brand-green" />
              </div>
              <h3 className="text-lg font-semibold">Presentation Coming Soon</h3>
              <p className="mt-2 text-sm text-muted max-w-md mx-auto">
                The full brand presentation deck is being prepared. It will include brand story,
                kiosk design renders, menu overview, and partnership terms.
              </p>
            </div>
          </section>
        )}

        {/* ── Locations ──────────────────────── */}
        {showLocations && locations.length > 0 && (
          <section className="bg-white rounded-2xl border border-brand-ink/10 overflow-hidden shadow-sm">
            <div className="bg-brand-green/5 px-6 py-4 border-b border-brand-ink/5 flex items-center gap-2">
              <MapPin className="size-5 text-brand-green" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Kiosk Locations
              </h2>
            </div>
            <div className="divide-y divide-brand-ink/5">
              {locations.map((loc) => {
                const meta = STATUS_META[loc.status];
                return (
                  <div key={loc.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{loc.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            meta.tone === "success"
                              ? "bg-green-100 text-green-700"
                              : meta.tone === "warning"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {[loc.district, loc.city].filter(Boolean).join(", ")}
                        {loc.address ? ` — ${loc.address}` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted uppercase tracking-wider">
                      Kiosk #{loc.kioskNumber}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Menu preview ───────────────────── */}
        {showMenu && (
          <section className="bg-white rounded-2xl border border-brand-ink/10 overflow-hidden shadow-sm">
            <div className="bg-brand-green/5 px-6 py-4 border-b border-brand-ink/5 flex items-center gap-2">
              <Utensils className="size-5 text-brand-green" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Menu Preview
              </h2>
            </div>
            <div className="px-6 py-8 text-center">
              <Link
                href="/menu/preview?peek=1"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-green text-white text-sm font-medium hover:bg-brand-green-deep transition"
              >
                View Menu
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-brand-ink text-white/50 text-center py-6 text-[10px] uppercase tracking-[0.2em]">
        © 2026 MaMa Zainab · Confidential — For Authorized Partners Only
      </footer>
    </main>
  );
}

/* ── Helpers ──────────────────────────────────────── */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold text-brand-green">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted mt-0.5">{label}</div>
    </div>
  );
}
