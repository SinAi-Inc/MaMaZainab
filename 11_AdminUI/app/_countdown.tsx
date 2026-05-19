"use client";

import { useEffect, useState } from "react";

type Parts = { d: number; h: number; m: number; s: number };

function diff(target: number): Parts {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function CountdownClient({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  const [t, setT] = useState<Parts | null>(null);

  useEffect(() => {
    setT(diff(targetMs));
    const id = setInterval(() => setT(diff(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const cells: Array<[string, number | string]> = t
    ? [
        ["Days", t.d],
        ["Hours", t.h],
        ["Min", t.m],
        ["Sec", t.s],
      ]
    : [
        ["Days", "—"],
        ["Hours", "—"],
        ["Min", "—"],
        ["Sec", "—"],
      ];

  return (
    <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-3">
      {cells.map(([label, val]) => (
        <div
          key={label}
          className="min-w-[56px] sm:min-w-[72px] rounded-lg bg-white/5 border border-white/10 px-2 py-2.5 backdrop-blur"
        >
          <div className="font-display text-2xl sm:text-3xl text-white leading-none tabular-nums">
            {typeof val === "number" ? String(val).padStart(2, "0") : val}
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.24em] text-white/55">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
