import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";

/**
 * Owner's Eye layout - wraps the 5-layer route group with a
 * consistent header strip. Per-page hero/content lives below.
 */
export default function OwnersEyeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Top strip - minimal, brand-aligned */}
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-brand-ink text-white flex items-center justify-center shadow-sm">
            <Eye className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
              Restaurant Operating System
            </p>
            <h1 className="text-lg font-bold text-brand-ink leading-tight">
              <Link href="/owners-eye" className="hover:text-brand-green-deep transition-colors">
                Owner&apos;s Eye
              </Link>
            </h1>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand-ink transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {children}
    </div>
  );
}
