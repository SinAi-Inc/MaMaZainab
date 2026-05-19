"use client";

import { useState, type ReactNode } from "react";

type Tab = { id: string; label: string; icon?: ReactNode };

export function BrandTabs({
  tabs,
  children,
}: {
  tabs: Tab[];
  children: Record<string, ReactNode>;
}) {
  const [active, setActive] = useState(tabs[0].id);

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === t.id
                ? "border-brand-green text-brand-green-deep"
                : "border-transparent text-muted hover:text-brand-ink hover:border-border"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      {children[active]}
    </>
  );
}
