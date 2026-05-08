import Link from "next/link";
import type { Metadata } from "next";
import { CountdownClient } from "../_countdown";

export const metadata: Metadata = {
  title: "MaMa Zainab - Coming Soon",
  description:
    "Homemade taste. Fast-food style - for the first time. A new kind of Egyptian comfort food, opening soon in Alexandria.",
};

const LAUNCH_ISO = "2026-09-01T12:00:00+02:00";

export default function ComingSoonPage() {
  return (
    <main className="min-h-screen bg-brand-green text-white relative overflow-hidden flex flex-col">
      {/* Background plaid — full brightness, matching brand apron */}
      <div className="absolute inset-0 plaid pointer-events-none" />

      {/* ── ZuZu — 45° corner pop every ~30 s ─────────────────────────────── */}
      {/*   Wrapper slides up; img holds the static left lean — independent transforms */}
      <div
        className="absolute bottom-0 right-4 pointer-events-none select-none z-[20] hidden md:block"
        style={{ width: "240px", animation: "zuzu-pop 33s ease-in-out infinite" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/chars/zuzu-thumb.png"
          alt="ZuZu — MaMa Zainab's head chef"
          className="w-full"
          style={{
            transform: "rotate(-15deg)",
            transformOrigin: "bottom center",
            filter: "drop-shadow(0 0 32px rgba(239,210,0,0.5)) drop-shadow(0 10px 30px rgba(0,0,0,0.6))",
          }}
          draggable={false}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 px-6 py-3 flex items-center justify-between bg-brand-ink/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/mark.png"
            alt=""
            className="size-7"
            draggable={false}
          />
          <span className="font-[family-name:var(--font-brand)] text-xs tracking-[0.18em] text-white">
            MaMa Zainab
          </span>
        </div>
        <Link
          href="/menu/preview?peek=1"
          className="px-3 py-1.5 rounded-md bg-white text-brand-ink text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-white/85 transition"
        >
          Sneak Peek 👀
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-5 py-8">
        <div className="bg-brand-ink/75 backdrop-blur-sm rounded-2xl px-6 py-8 max-w-md w-full shadow-2xl">
        <p className="text-[9px] uppercase tracking-[0.4em] text-brand-yellow mb-4">
          Coming Soon · Alexandria, EGYPT
        </p>

        {/* Wordmark — transparent PNG, isolated over any background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-wordmark-transparent.png"
          alt="MaMa Zainab"
          className="w-full max-w-sm mx-auto"
          style={{ filter: "drop-shadow(0 0 24px rgba(239,210,0,0.25))" }}
          draggable={false}
        />

        <h1 className="sr-only">MaMa Zainab - Coming Soon</h1>

        <p className="mt-6 text-base sm:text-lg text-white max-w-md font-light leading-relaxed">
          <span className="font-[family-name:var(--font-brand)] tracking-wider text-brand-yellow text-xl block">
            Homemade taste. Fast-food style.
          </span>
          <span className="text-xs text-white/70 italic">- for the first time.</span>
        </p>

        <p className="mt-3 text-xs text-white/70 max-w-sm mx-auto">
          Hand-rolled, slow-cooked Egyptian comfort food - served the way Mama
          would. Opening late 2026.
        </p>

        <CountdownClient target={LAUNCH_ISO} />

        <form
          action="/api/notify"
          method="POST"
          className="mt-8 w-full max-w-sm mx-auto flex flex-col sm:flex-row gap-2"
        >
          <input
            type="email"
            name="email"
            required
            placeholder="your@email.com"
            className="flex-1 px-3 py-2.5 rounded-md bg-white/15 border border-white/20 placeholder-white/50 text-white text-sm outline-none focus:border-brand-yellow focus:bg-white/20 transition"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-md bg-brand-yellow text-brand-ink font-semibold uppercase tracking-wider text-xs hover:bg-yellow-300 transition"
          >
            Notify me
          </button>
        </form>
        <p className="mt-2 text-[10px] text-white/50">
          We&apos;ll only email you on opening day. No spam.
        </p>

        {/* Social links */}
        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-5 flex-wrap text-[10px] text-white/60">
          <a
            href="https://instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-yellow transition uppercase tracking-[0.2em]"
          >
            Instagram
          </a>
          <span className="text-white/30">·</span>
          <a
            href="https://tiktok.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-yellow transition uppercase tracking-[0.2em]"
          >
            TikTok
          </a>
          <span className="text-white/30">·</span>
          <a
            href="https://facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-yellow transition uppercase tracking-[0.2em]"
          >
            Facebook
          </a>
        </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 bg-brand-ink/80 backdrop-blur-sm flex flex-col items-center gap-1.5 text-[10px] text-white/70 text-center">
        <div className="uppercase tracking-[0.24em]">
          © 2026 MaMa Zainab · Alexandria
        </div>
        <div className="tracking-[0.1em] text-white/50">
          Owned &amp; Operated by{" "}
          <Link
            href="/cn"
            className="font-[family-name:var(--font-brand)] text-brand-red hover:text-red-400 transition underline underline-offset-2 tracking-[0.12em]"
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
