import Link from "next/link";

export function PublicMenuUnavailable() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-green px-5 py-16 text-white">
      <div className="absolute inset-0 plaid opacity-80" />
      <section className="relative z-10 w-full max-w-md rounded-2xl bg-brand-ink/85 px-8 py-12 text-center shadow-2xl backdrop-blur-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-wordmark-cropped.png"
          alt="MaMa Zainab"
          className="mx-auto w-full max-w-[260px]"
          draggable={false}
        />
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-yellow">
          Menu Access
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-brand)] text-3xl tracking-[0.12em]">
          Menu Preview Unavailable
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/70">
          Public menu preview is currently disabled.
        </p>
        <Link
          href="/coming-soon"
          className="mt-7 inline-flex items-center gap-1.5 text-xs text-white/50 transition hover:text-brand-yellow"
        >
          Back to MaMa Zainab
        </Link>
      </section>
    </main>
  );
}
