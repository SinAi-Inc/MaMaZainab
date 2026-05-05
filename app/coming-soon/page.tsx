import Link from "next/link";
import type { Metadata } from "next";
import { CountdownClient } from "../_countdown";

export const metadata: Metadata = {
  title: "MaMa Zainab - Coming Soon",
  description:
    "Homemade taste. Fast-food style - for the first time. A new kind of Egyptian comfort food, opening soon in Alexandria.",
};

const LAUNCH_ISO = "2026-09-01T12:00:00+02:00";

/** Food items scattered decoratively around the edges (md+ screens only) */
const FOOD_ITEMS = [
  { src: "/uploads/menu/rql1ELnbW5.jpg",  top: "7%",  left: "-3%",  rotate: "-15deg", delay: "0s",    size: 130 },
  { src: "/uploads/menu/kn1BmhVqPV.jpg",  top: "13%", right: "-2%", rotate: "20deg",  delay: "0.7s",  size: 118 },
  { src: "/uploads/menu/aGmh7eivS_.jpg",  top: "41%", left: "-3%",  rotate: "-22deg", delay: "1.3s",  size: 124 },
  { src: "/uploads/menu/jfPjQtYb6A.jpg",  top: "50%", right: "-2%", rotate: "25deg",  delay: "0.4s",  size: 120 },
  { src: "/uploads/menu/YhzNThyRgl.jpg",  bottom: "16%", left: "2%", rotate: "18deg", delay: "1.8s", size: 114 },
  { src: "/uploads/menu/Gzoj4h3ROk.jpg",  bottom: "30%", right: "1%", rotate: "-18deg", delay: "1.1s", size: 108 },
] as const;

export default function ComingSoonPage() {
  return (
    <main className="min-h-screen bg-brand-ink text-white relative overflow-hidden flex flex-col">
      {/* Background plaid wash */}
      <div className="absolute inset-0 plaid opacity-40 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(44,41,42,0) 0%, rgba(44,41,42,0.55) 55%, rgba(44,41,42,0.95) 100%)",
        }}
      />

      {/* ── Scattered food photos (decorative, md+ only) ───────────────────── */}
      {FOOD_ITEMS.map((item) => (
        <div
          key={item.src}
          className="absolute hidden md:block pointer-events-none select-none z-[5]"
          style={{
            top:    "top"    in item ? item.top    : undefined,
            bottom: "bottom" in item ? item.bottom : undefined,
            left:   "left"   in item ? item.left   : undefined,
            right:  "right"  in item ? item.right  : undefined,
            width:  `${item.size}px`,
            transform: `rotate(${item.rotate})`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.src}
            alt=""
            className="w-full rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] opacity-80"
            style={{ animation: `food-drift 3.4s ease-in-out ${item.delay} infinite` }}
            draggable={false}
          />
        </div>
      ))}

      {/* ── ZuZu — 45° corner pop every ~30 s ─────────────────────────────── */}
      {/*   Positioned so ~65% of his body shows above the corner when visible  */}
      <div
        className="absolute pointer-events-none select-none z-[20]"
        style={{
          bottom: "-70px",
          right:  "-70px",
          width:  "320px",
          animation: "zuzu-pop 33s ease-in-out infinite",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/chars/zuzu-thumb.png"
          alt="ZuZu — MaMa Zainab's head chef"
          className="w-full"
          style={{
            filter: "drop-shadow(0 0 32px rgba(239,210,0,0.5)) drop-shadow(0 10px 30px rgba(0,0,0,0.6))",
          }}
          draggable={false}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/mark-transparent.png"
            alt=""
            className="size-9 rounded-full"
            draggable={false}
          />
          <span className="font-[family-name:var(--font-brand)] text-sm tracking-[0.18em] text-white/80">
            MaMa Zainab
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
        <p className="text-[11px] uppercase tracking-[0.4em] text-brand-yellow mb-6">
          Coming Soon · Alexandria, EGYPT
        </p>

        {/* Wordmark — transparent PNG, isolated over any background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-wordmark-transparent.png"
          alt="MaMa Zainab"
          className="w-full max-w-xl"
          style={{ filter: "drop-shadow(0 0 30px rgba(239,210,0,0.25))" }}
          draggable={false}
        />

        <h1 className="sr-only">MaMa Zainab - Coming Soon</h1>

        <p className="mt-8 text-lg sm:text-xl text-white/85 max-w-xl font-light leading-relaxed">
          <span className="font-[family-name:var(--font-brand)] tracking-wider text-brand-yellow text-2xl block">
            Homemade taste. Fast-food style.
          </span>
          <span className="text-sm text-white/60 italic">- for the first time.</span>
        </p>

        <p className="mt-4 text-sm text-white/55 max-w-md">
          Hand-rolled, slow-cooked Egyptian comfort food - served the way Mama
          would. Opening late 2026.
        </p>

        <CountdownClient target={LAUNCH_ISO} />

        <form
          action="/api/notify"
          method="POST"
          className="mt-10 w-full max-w-md flex flex-col sm:flex-row gap-2"
        >
          <input
            type="email"
            name="email"
            required
            placeholder="your@email.com"
            className="flex-1 px-4 py-3 rounded-md bg-white/10 border border-white/15 placeholder-white/40 text-white outline-none focus:border-brand-yellow focus:bg-white/15 transition"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-md bg-brand-yellow text-brand-ink font-semibold uppercase tracking-wider text-sm hover:bg-yellow-300 transition"
          >
            Notify me
          </button>
        </form>
        <p className="mt-3 text-[11px] text-white/40">
          We&apos;ll only email you on opening day. No spam.
        </p>

        {/* Social links — directly under notify section */}
        <div className="mt-8 flex items-center gap-6 text-[12px] text-white/50">
          <a
            href="https://instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-yellow transition uppercase tracking-[0.2em]"
          >
            Instagram
          </a>
          <span className="text-white/20">·</span>
          <a
            href="https://tiktok.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-yellow transition uppercase tracking-[0.2em]"
          >
            TikTok
          </a>
          <span className="text-white/20">·</span>
          <a
            href="https://facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-yellow transition uppercase tracking-[0.2em]"
          >
            Facebook
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-6 border-t border-white/10 flex flex-col items-center gap-2 text-[11px] text-white/45 text-center">
        <div className="uppercase tracking-[0.24em]">
          © 2026 MaMa Zainab · Alexandria
        </div>
        <div className="tracking-[0.1em] text-white/30">
          Owned &amp; Operated by{" "}
          <Link
            href="/cn"
            className="hover:text-brand-yellow transition underline underline-offset-2"
          >
            Sheng Heng Wang
          </Link>{" "}
          · Technology by{" "}
          <a
            href="https://sinai-inc.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-yellow transition underline underline-offset-2"
          >
            SinAI Inc.
          </a>
        </div>
      </footer>
    </main>
  );
}
