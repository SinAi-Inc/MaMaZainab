import Link from "next/link";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-surface text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-8 overflow-x-auto">{children}</main>
        <footer className="px-8 py-4 text-xs text-muted border-t border-border">
          MaMa Zainab Brand Admin · v0.1 · {new Date().getFullYear()} ·{" "}
          <Link href="/menu/preview" className="underline hover:text-brand-green">
            View public preview →
          </Link>
        </footer>
      </div>
    </div>
  );
}
