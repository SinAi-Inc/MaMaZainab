"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export type SidebarMode = "expanded" | "collapsed";

interface SidebarCtx {
  mode: SidebarMode;
  mobileOpen: boolean;
  toggle: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const Ctx = createContext<SidebarCtx | null>(null);

const LS_KEY = "mz_sidebar_mode";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<SidebarMode>("expanded");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) as SidebarMode | null;
    if (saved === "expanded" || saved === "collapsed") setMode(saved);
  }, []);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next: SidebarMode = prev === "expanded" ? "collapsed" : "expanded";
      localStorage.setItem(LS_KEY, next);
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <Ctx.Provider value={{ mode, mobileOpen, toggle, toggleMobile, closeMobile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSidebar(): SidebarCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
}
