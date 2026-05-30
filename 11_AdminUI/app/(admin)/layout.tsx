import Link from "next/link";
import { cookies } from "next/headers";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";
import { AdminShell } from "./_components/admin-shell";
import { COOKIE_NAME, SESSION_ROLES, readSessionToken } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  const session = token ? await readSessionToken(token, SESSION_ROLES) : null;
  const role = session?.role ?? "admin";
  const isMediaHub = role === "art_director";

  return (
    <AdminShell>
      <div className="min-h-screen flex bg-surface text-foreground">
        <Sidebar role={role} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar role={role} />
          <main className="flex-1 p-4 md:p-8 overflow-x-auto">{children}</main>
          <footer className="px-4 md:px-8 py-4 text-xs text-muted border-t border-border">
            {isMediaHub ? (
              <>MaMa Zainab Media Hub · v0.1 · {new Date().getFullYear()}</>
            ) : (
              <>
                MaMa Zainab Admin OS · v0.1 · {new Date().getFullYear()} ·{" "}
                <Link href="/menu/preview" className="underline hover:text-brand-green">
                  View public preview →
                </Link>
              </>
            )}
          </footer>
        </div>
      </div>
    </AdminShell>
  );
}
