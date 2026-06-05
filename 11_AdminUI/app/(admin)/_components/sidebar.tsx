"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Globe,
  Video,
  Users,
  BookOpen,
  Settings,
  Sparkles,
  Mail,
  Store,
  Handshake,
  Boxes,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionRole } from "@/lib/auth";
import { useSidebar } from "./sidebar-context";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status?: "active" | "soon";
};

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, status: "active" },
    ],
  },
  {
    section: "Operations",
    items: [
      { href: "/owners-eye", label: "Owner's Eye", icon: LayoutDashboard, status: "active" },
      { href: "/branches", label: "Kiosks", icon: Store, status: "active" },
      { href: "/menu", label: "Menu", icon: UtensilsCrossed, status: "active" },
      { href: "/inventory", label: "Inventory", icon: Boxes, status: "active" },
    ],
  },
  {
    section: "Business",
    items: [
      { href: "/partners", label: "Investors & Partners", icon: Handshake, status: "active" },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/website", label: "Website", icon: Globe, status: "active" },
      { href: "/contacts", label: "Contacts", icon: Mail, status: "active" },
      { href: "/settings", label: "Settings", icon: Settings, status: "active" },
    ],
  },
];

const MEDIA_HUB_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Media Hub",
    items: [
      { href: "/ai", label: "Studio", icon: Sparkles, status: "active" },
      { href: "/videos", label: "Video Projects", icon: Video, status: "active" },
    ],
  },
  {
    section: "Brand Assets",
    items: [
      { href: "/characters", label: "Characters", icon: Users, status: "active" },
      { href: "/brand", label: "Brand Bible", icon: BookOpen, status: "active" },
    ],
  },
  {
    section: "Partner Delivery",
    items: [
      { href: "/partners", label: "Partner Delivery", icon: Handshake, status: "active" },
    ],
  },
];

// ── Single nav link (expanded or icon-only) ────────────────────────────────
function NavLink({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const isSoon = item.status === "soon";
  const Icon = item.icon;

  return (
    <li>
      <div className="relative group/tip">
        <Link
          href={isSoon ? "#" : item.href}
          aria-disabled={isSoon}
          onClick={(e) => {
            if (isSoon) e.preventDefault();
            onClick?.();
          }}
          className={cn(
            "flex items-center gap-3 rounded-md text-sm transition-colors",
            collapsed ? "justify-center px-0 py-2.5 w-10 mx-auto" : "px-3 py-2 w-full",
            active
              ? "bg-sidebar-active-bg text-sidebar-active-fg"
              : "text-sidebar-fg/85 hover:bg-white/5 hover:text-sidebar-fg",
            isSoon && "opacity-50 cursor-not-allowed"
          )}
        >
          <Icon className="size-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              {isSoon && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-sidebar-muted">
                  soon
                </span>
              )}
            </>
          )}
        </Link>

        {/* Floating tooltip - shown only in icon-only mode */}
        {collapsed && (
          <div
            className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3
                       px-2.5 py-1.5 rounded-md bg-brand-ink text-white text-xs
                       whitespace-nowrap shadow-lg
                       opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-[60]"
          >
            {item.label}
            {isSoon && <span className="ml-1 opacity-60">(soon)</span>}
          </div>
        )}
      </div>
    </li>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
export function Sidebar({ role }: { role: SessionRole }) {
  const pathname = usePathname();
  const { mode, mobileOpen, toggle, toggleMobile, closeMobile } = useSidebar();
  const nav = role === "art_director" ? MEDIA_HUB_NAV : NAV;
  const productLabel = role === "art_director" ? "Media Hub" : "Admin OS";

  const collapsed = mode === "collapsed";

  // Track viewport size - drives mobile-specific behaviour
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Icon-only when: mobile strip (not expanded) OR desktop collapsed
  const isIconOnly = isMobile ? !mobileOpen : collapsed;

  // Unified toggle: on mobile toggles the overlay, on desktop toggles width
  const handleToggle = isMobile ? toggleMobile : toggle;

  // Close mobile overlay when navigating
  useEffect(() => {
    closeMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile backdrop - shown only when mobile overlay is open */}
      {mobileOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex flex-col bg-sidebar-bg text-sidebar-fg shrink-0",
          "transition-[width] duration-200 ease-in-out overflow-hidden",
          // Positioning: fixed overlay when mobile is expanded, sticky otherwise
          mobileOpen && isMobile
            ? "fixed inset-y-0 left-0 z-50 shadow-2xl"
            : "sticky top-0 h-screen",
          // Width logic:
          //  mobile overlay → w-64
          //  mobile strip   → w-16 (always icon-only)
          //  desktop        → w-16 collapsed / w-64 expanded
          mobileOpen && isMobile
            ? "w-64"
            : isMobile
            ? "w-16"
            : collapsed
            ? "w-16"
            : "w-64"
        )}
      >
        {/* ── Logo + toggle ─────────────────────────────────────────── */}
        {isIconOnly ? (
          /* Icon-only header: mark above, toggle button below */
          <div className="border-b border-white/5 flex flex-col items-center gap-2 py-4 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/mark-transparent.png"
              alt="MaMa Zainab"
              className="size-8 object-contain brightness-0 invert opacity-90"
              draggable={false}
            />
            <button
              onClick={handleToggle}
              className="p-1.5 rounded-md hover:bg-white/10 text-sidebar-muted hover:text-sidebar-fg transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : (
          /* Expanded header: wordmark + collapse toggle pinned top-right */
          <div className="border-b border-white/5 px-5 pt-6 pb-4 shrink-0">
            <div className="flex items-start gap-2">
              <div className="flex-1 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/logo-wordmark-transparent.png"
                  alt="MaMa Zainab"
                  className="h-11 w-auto object-contain"
                  draggable={false}
                />
              </div>
              <button
                onClick={handleToggle}
                className="shrink-0 p-1.5 rounded-md hover:bg-white/10 text-sidebar-muted hover:text-sidebar-fg transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="size-4" />
              </button>
            </div>
            <div className="mt-2 font-[family-name:var(--font-brand)] text-[11px] tracking-[0.28em] text-sidebar-muted text-center">
              {productLabel}
            </div>
          </div>
        )}

        {/* ── Nav ──────────────────────────────────────────────────── */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden py-5 space-y-6",
            isIconOnly ? "px-1" : "px-3"
          )}
        >
          {nav.map((sec) => (
            <div key={sec.section}>
              {/* Section label - hidden in icon-only mode */}
              {!isIconOnly && (
                <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.16em] text-sidebar-muted select-none">
                  {sec.section}
                </div>
              )}
              {isIconOnly && <div className="mx-2 mb-2 border-t border-white/10" />}
              <ul className="space-y-1">
                {sec.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={active}
                      collapsed={isIconOnly}
                      onClick={mobileOpen ? closeMobile : undefined}
                    />
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Footer ───────────────────────────────────────────────── */}
        {!isIconOnly && (
          <div className="border-t border-white/5 px-6 py-4 shrink-0">
            <div className="h-1.5 w-12 rounded bg-brand-yellow mb-2" />
            <div className="text-[10px] text-sidebar-muted leading-tight space-y-0.5">
              <div>MaMa Zainab · Alexandria</div>
              <div className="opacity-60">
                <Link href="/cn" className="hover:text-brand-yellow transition">
                  Sheng Heng Wang
                </Link>
                {" · "}
                <a
                  href="https://sinai-inc.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-yellow transition"
                >
                  SinAI Inc.
                </a>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
