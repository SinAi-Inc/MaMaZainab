import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { readBranches } from "@/lib/branches/store";
import { STATUS_META } from "@/lib/branches/schema";
import { BranchDetailTabs } from "./_components/branch-detail-tabs";

export const dynamic = "force-dynamic";

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await readBranches();
  const branch = state.branches.find((b) => b.id === id);

  if (!branch) notFound();

  const meta = STATUS_META[branch.status];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/branches"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="size-3" />
          Back to Branches
        </Link>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <MapPin className="size-5 text-brand-green" />
          </div>
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {branch.name}
              <span className="text-xs font-normal text-muted">
                Kiosk #{branch.kioskNumber}
              </span>
            </h2>
            <p className="text-xs text-muted">
              {branch.district ? `${branch.district}, ` : ""}
              {branch.city} · {branch.openHours}
            </p>
          </div>
          <span
            className={`ml-auto px-2.5 py-1 text-[11px] font-medium rounded-full ${
              meta.tone === "success"
                ? "bg-brand-green/15 text-brand-green-deep"
                : meta.tone === "warning"
                ? "bg-brand-yellow/30 text-brand-ink"
                : meta.tone === "error"
                ? "bg-red-100 text-red-700"
                : "bg-zinc-200 text-zinc-700"
            }`}
          >
            {meta.label}
          </span>
        </div>
      </div>

      <BranchDetailTabs branch={branch} />
    </div>
  );
}
