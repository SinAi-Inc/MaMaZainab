"use client";

import { usePathname } from "next/navigation";
import { Eye, Printer, Menu } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { useSidebar } from "./sidebar-context";

const TITLES: Record<string, string> = {
  "/menu": "Menu",
  "/menu/categories/new": "New category",
  "/menu/items/new": "New item",
  "/website": "Website",
  "/videos": "Videos",
  "/videos/new": "New video",
  "/characters": "Characters",
  "/contacts": "Contact List",
  "/brand": "Brand Bible",
  "/ai": "AI Generators",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const { toggleMobile } = useSidebar();
  const title =
    TITLES[pathname] ||
    Object.entries(TITLES)
      .find(([k]) => pathname.startsWith(k))?.[1] ||
    "Admin";

  const onMenu = pathname === "/menu" || pathname.startsWith("/menu/");
  const onWebsite = pathname === "/website" || pathname.startsWith("/website/");
  const onVideos = pathname === "/videos" || pathname.startsWith("/videos/");

  // Context-aware preview URL based on current section
  let previewHref: string | null = null;
  if (onMenu) {
    previewHref = "/menu/preview";
  } else if (onWebsite) {
    previewHref = "/coming-soon";
  } else if (onVideos) {
    // No dedicated preview for videos yet - could be storyboard viewer in future
    previewHref = null;
  }

  return (
    <header className="h-16 px-4 md:px-8 bg-surface-2 border-b border-border flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger — only visible below md */}
        <button
          onClick={toggleMobile}
          className="md:hidden p-2 rounded-md hover:bg-surface transition-colors text-muted"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight truncate">{title}</h1>
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
        {previewHref && (
          <Link
            href={previewHref}
            target="_blank"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-border-strong hover:bg-surface transition-colors"
          >
            <Eye className="size-4" /> Preview
          </Link>
        )}
        <div className="size-9 rounded-full bg-brand-green text-white flex items-center justify-center font-semibold text-sm overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark-avatar.png" alt="MZ" className="size-full object-cover" />
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
