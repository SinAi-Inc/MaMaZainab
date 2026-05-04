"use client";

import { usePathname } from "next/navigation";
import { Eye, Printer } from "lucide-react";
import Link from "next/link";

const TITLES: Record<string, string> = {
  "/menu": "Menu",
  "/menu/categories/new": "New category",
  "/menu/items/new": "New item",
  "/website": "Website",
  "/videos": "Videos",
  "/videos/new": "New video",
  "/characters": "Characters",
  "/brand": "Brand Tokens",
  "/ai": "AI Generators",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const title =
    TITLES[pathname] ||
    Object.entries(TITLES)
      .find(([k]) => pathname.startsWith(k))?.[1] ||
    "Admin";

  const onMenu = pathname === "/menu" || pathname.startsWith("/menu/");

  return (
    <header className="h-16 px-8 bg-surface-2 border-b border-border flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {onMenu && (
          <Link
            href="/menu/print"
            target="_blank"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-border-strong hover:bg-surface transition-colors"
            title="Open print-ready menu (use browser Save as PDF)"
          >
            <Printer className="size-4" /> Print / PDF
          </Link>
        )}
        <Link
          href="/menu/preview"
          target="_blank"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-border-strong hover:bg-surface transition-colors"
        >
          <Eye className="size-4" /> Preview
        </Link>
        <div className="size-9 rounded-full bg-brand-green text-white flex items-center justify-center font-semibold text-sm overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.png" alt="MZ" className="size-full object-cover" />
        </div>
      </div>
    </header>
  );
}
