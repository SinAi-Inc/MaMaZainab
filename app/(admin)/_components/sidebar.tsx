"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Globe,
  Video,
  Users,
  Palette,
  Settings,
  Sparkles,
  Mail,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      { href: "/branches", label: "Owner's Eye", icon: Store, status: "active" },
      { href: "/menu", label: "Menu", icon: UtensilsCrossed, status: "active" },
    ],
  },
  {
    section: "Creative",
    items: [
      { href: "/ai", label: "Studio", icon: Sparkles, status: "active" },
      { href: "/videos", label: "Video Projects", icon: Video, status: "active" },
    ],
  },
  {
    section: "Brand",
    items: [
      { href: "/characters", label: "Characters", icon: Users, status: "active" },
      { href: "/brand", label: "Brand Tokens", icon: Palette, status: "active" },
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

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 bg-sidebar-bg text-sidebar-fg flex flex-col sticky top-0 h-screen">
      {/* Logo / brand */}
      <div className="px-6 pt-7 pb-5 border-b border-white/5">
        <div className="flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-wordmark-transparent.png"
            alt="MaMa Zainab"
            className="h-12 w-auto object-contain"
            draggable={false}
          />
        </div>
        <div className="mt-3 font-[family-name:var(--font-brand)] text-[11px] tracking-[0.28em] text-sidebar-muted text-center">
          Brand Admin
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {NAV.map((sec) => (
          <div key={sec.section}>
            <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.16em] text-sidebar-muted">
              {sec.section}
            </div>
            <ul className="space-y-1">
              {sec.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const isSoon = item.status === "soon";
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={isSoon ? "#" : item.href}
                      aria-disabled={isSoon}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        active
                          ? "bg-sidebar-active-bg text-sidebar-active-fg"
                          : "text-sidebar-fg/85 hover:bg-white/5 hover:text-sidebar-fg",
                        isSoon && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={(e) => isSoon && e.preventDefault()}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {isSoon && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-sidebar-muted">
                          soon
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer brand bar */}
      <div className="px-6 py-4 border-t border-white/5">
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
    </aside>
  );
}
