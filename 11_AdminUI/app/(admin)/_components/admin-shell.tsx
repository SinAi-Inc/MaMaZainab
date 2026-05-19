"use client";

import { SidebarProvider } from "./sidebar-context";

/**
 * AdminShell — thin client wrapper that injects the SidebarProvider
 * context into the layout so both <Sidebar> and <Topbar> can share state.
 *
 * The layout.tsx is a server component; this client boundary is as small
 * as possible — it only provides context, no rendering logic.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
