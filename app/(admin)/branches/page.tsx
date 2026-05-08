import { MapPin, Store } from "lucide-react";
import { readBranches } from "@/lib/branches/store";
import { BranchTabs } from "./_components/branch-tabs";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const state = await readBranches();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Operations</p>
        <h2 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          <Store className="size-5 text-brand-green-deep" />
          Branches &amp; Kiosks
        </h2>
        <p className="text-sm text-muted mt-1">
          Manage locations, track app orders, and monitor cash flow across all kiosks.
        </p>
      </div>

      <BranchTabs branches={state.branches} />
    </div>
  );
}
