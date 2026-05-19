"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Tablet,
  Monitor,
  RefreshCw,
  ExternalLink,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Viewport = { id: string; label: string; width: number; icon: typeof Smartphone };

const VIEWPORTS: Viewport[] = [
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
  { id: "tablet", label: "Tablet", width: 820, icon: Tablet },
  { id: "desktop", label: "Desktop", width: 1280, icon: Monitor },
];

const PAGES = [
  { href: "/coming-soon", label: "Coming Soon" },
  { href: "/menu/preview", label: "Menu (Preview)" },
  { href: "/menu/print", label: "Menu (Print / PDF)" },
];

export default function WebsitePreviewPage() {
  const [vp, setVp] = useState<Viewport>(VIEWPORTS[2]);
  const [page, setPage] = useState(PAGES[0].href);
  const [nonce, setNonce] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const reload = () => setNonce((n) => n + 1);

  return (
    <div className="space-y-5">
      {/* Header / controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Live Site Preview
          </p>
          <h2 className="text-2xl font-semibold mt-1 flex items-center gap-2">
            <Globe className="size-5 text-brand-green-deep" />
            Website
          </h2>
          <p className="text-sm text-muted mt-1">
            HITL preview of the public-facing site. Pick a page and a viewport
            to see exactly what visitors will see.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={reload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border-strong hover:bg-surface transition"
            title="Reload preview"
          >
            <RefreshCw className="size-3.5" /> Reload
          </button>
          <Link
            href={page}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border-strong hover:bg-surface transition"
          >
            <ExternalLink className="size-3.5" /> Open in new tab
          </Link>
        </div>
      </div>

      {/* Toolbar: page picker + viewport */}
      <div className="rounded-lg border border-border bg-surface px-3 py-2 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted px-2">
            Page
          </span>
          {PAGES.map((p) => (
            <button
              key={p.href}
              onClick={() => setPage(p.href)}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition",
                page === p.href
                  ? "bg-brand-green text-white"
                  : "hover:bg-surface-2 text-fg",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted px-2">
            Viewport
          </span>
          {VIEWPORTS.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setVp(v)}
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition inline-flex items-center gap-1.5",
                  vp.id === v.id
                    ? "bg-brand-ink text-white"
                    : "hover:bg-surface-2 text-fg",
                )}
              >
                <Icon className="size-3.5" />
                {v.label}
                <span className="text-[10px] text-current/60 tabular-nums">
                  {v.width}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto text-[11px] text-muted font-mono px-2">
          {page} · {vp.width}px
        </div>
      </div>

      {/* Device frame */}
      <div className="rounded-lg border border-border bg-[repeating-linear-gradient(45deg,#f4f4f0,#f4f4f0_10px,#eeeeea_10px,#eeeeea_20px)] p-6 overflow-x-auto">
        <div
          className="mx-auto bg-brand-ink rounded-2xl p-2 shadow-2xl transition-all"
          style={{ width: vp.width + 16 }}
        >
          <div className="rounded-lg overflow-hidden bg-white">
            <iframe
              key={nonce}
              ref={iframeRef}
              src={page}
              title="Website preview"
              className="w-full border-0 block"
              style={{ width: vp.width, height: "78vh" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
