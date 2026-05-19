"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="size-9 rounded-md flex items-center justify-center text-foreground/50 hover:text-brand-red hover:bg-brand-red/10 transition-colors"
      title="Sign out"
      aria-label="Sign out"
    >
      <LogOut className="size-4" />
    </button>
  );
}
