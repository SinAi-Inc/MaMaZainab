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
