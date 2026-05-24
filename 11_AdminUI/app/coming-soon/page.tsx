import Link from "next/link";
import type { Metadata } from "next";
import { CountdownClient } from "../_countdown";
import { NotifyForm } from "./_components/notify-form";
import { readSettings } from "@/lib/settings/store";

export const metadata: Metadata = {
  title: "MaMa Zainab - Coming Soon",
  description:
    "Homemade taste. Fast-food style - for the first time. A new kind of Egyptian comfort food, opening soon in Alexandria.",
};

const LAUNCH_ISO = "2026-09-01T12:00:00+02:00";

export default async function ComingSoonPage() {
  const settings = await readSettings();
  const igUrl = settings.socialInstagram || "https://instagram.com/";
  const ttUrl = settings.socialTiktok || "https://tiktok.com/";
  const fbUrl = settings.socialFacebook || "https://facebook.com/";
  return (
    <main className="min-h-screen bg-brand-green text-white relative overflow-hidden flex flex-col">
      {/* Background plaid — full brightness, matching brand apron */}
      <div className="absolute inset-0 plaid pointer-events-none" />

      {}
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
        <div className="flex items-center gap-2">
          <Link
            href="/partner-portal"
            className="px-3 py-1.5 rounded-md bg-brand-yellow/90 text-brand-ink text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-brand-yellow transition"
          >
            Partners
          </Link>
          <Link
            href="/menu/preview?peek=1"
            className="px-3 py-1.5 rounded-md bg-white text-brand-ink text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-white/85 transition"
          >
            Sneak Peek 👀
          </Link>
        </div>
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

        <NotifyForm />

        {/* Social links */}
        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-5 flex-wrap text-[10px] text-white/60">
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-yellow transition uppercase tracking-[0.2em]"
          >
            Instagram
          </a>
          <span className="text-white/30">·</span>
          <a
            href={ttUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-yellow transition uppercase tracking-[0.2em]"
          >
            TikTok
          </a>
          <span className="text-white/30">·</span>
          <a
            href={fbUrl}
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
        {/* Discreet admin toggle — intentionally subtle */}
        <Link
          href="/login"
          className="mt-1 text-white/20 hover:text-white/50 transition text-[9px] tracking-[0.2em] uppercase"
        >
          Admin →
        </Link>
      </footer>
    </main>
  );
}
