"use client";

import { useEffect } from "react";

/**
 * Auto-opens browser print dialog when ?print=1 is in the URL.
 * Lets the admin trigger Print/PDF deep-linkable: /menu/print?print=1
 */
export function PrintTrigger() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("print") === "1") {
      // Wait a tick for fonts/images to settle.
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, []);
  return null;
}
