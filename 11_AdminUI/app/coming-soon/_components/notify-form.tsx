"use client";

import { useState } from "react";

type State = "idle" | "loading" | "success" | "duplicate" | "invalid" | "error";

export function NotifyForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");

    try {
      const fd = new FormData();
      fd.append("email", email);
      const res = await fetch("/api/notify", { method: "POST", body: fd });
      const json = await res.json() as { status: string };

      if (json.status === "ok") setState("success");
      else if (json.status === "limited") setState("error");
      else if (json.status === "invalid") setState("invalid");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="mt-8 w-full max-w-sm mx-auto rounded-xl bg-brand-yellow/15 border border-brand-yellow/40 px-5 py-5 text-center">
        <div className="text-2xl mb-2">💛</div>
        <p className="text-sm font-semibold text-brand-yellow tracking-wide">
          You&apos;re on the list!
        </p>
        <p className="mt-2 text-xs text-white/80 leading-relaxed">
          We&apos;ve registered your interest. When we open, you&apos;ll be the first to
          know - and the first to get a{" "}
          <span className="text-brand-yellow font-semibold">very special price</span>,
          just for loving us early. ❤️
        </p>
        <p className="mt-3 text-[10px] text-white/50">
          Check your email on opening day. Spread the love 🙌
        </p>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mt-8 w-full max-w-sm mx-auto flex flex-col sm:flex-row gap-2"
      >
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2.5 rounded-md bg-white/15 border border-white/20 placeholder-white/50 text-white text-sm outline-none focus:border-brand-yellow focus:bg-white/20 transition"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="px-5 py-2.5 rounded-md bg-brand-yellow text-brand-ink font-semibold uppercase tracking-wider text-xs hover:bg-yellow-300 transition disabled:opacity-60"
        >
          {state === "loading" ? "…" : "Notify me"}
        </button>
      </form>

      {state === "invalid" && (
        <p className="mt-2 text-[11px] text-red-300 text-center">
          Please enter a valid email address.
        </p>
      )}
      {state === "error" && (
        <p className="mt-2 text-[11px] text-red-300 text-center">
          Something went wrong - please try again in a moment.
        </p>
      )}

      <p className="mt-2 text-[10px] text-white/50 text-center">
        We&apos;ll only email you on opening day. No spam, ever.
      </p>
    </>
  );
}
