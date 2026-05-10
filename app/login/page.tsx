"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("admin@mamazainab.com");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          router.push(next);
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Login failed");
        }
      } catch {
        setError("Network error — please try again");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[11px] uppercase tracking-[0.18em] text-white/60 mb-1.5">
          Email
        </label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3.5 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-sm placeholder-white/30 outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/40 transition"
        />
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-[0.18em] text-white/60 mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-white/10 border border-white/15 text-white text-sm placeholder-white/30 outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/40 transition"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
            tabIndex={-1}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-brand-red text-xs font-medium px-1">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-yellow text-brand-ink font-semibold text-sm uppercase tracking-[0.18em] hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {isPending ? (
          <span className="size-4 border-2 border-brand-ink/30 border-t-brand-ink rounded-full animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-brand-green relative overflow-hidden flex items-center justify-center">
      {/* Brand plaid background */}
      <div className="absolute inset-0 plaid opacity-60 pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-brand-ink/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-wordmark-transparent.png"
              alt="MaMa Zainab"
              className="w-48"
              draggable={false}
            />
            <div className="mt-3 font-[family-name:var(--font-brand)] text-[10px] tracking-[0.3em] text-brand-yellow/80 uppercase">
              Admin Access
            </div>
          </div>

          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>

          {/* Footer */}
          <div className="mt-6 text-center text-[10px] text-white/30 tracking-wider">
            MaMa Zainab · Brand Admin · 2026
          </div>
        </div>
      </div>
    </main>
  );
}
